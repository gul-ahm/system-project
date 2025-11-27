# qs_app/rag/retriever.py
from __future__ import annotations
from typing import Dict, List, Any
import os
import re
import pandas as pd

from ..utils import load_csv, col  # robust column resolver

# Optional reference to data dir (not required here)
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "data")

_cache: Dict[str, pd.DataFrame] = {}


def _lazy_csv(name: str) -> pd.DataFrame:
    """Lazy-load CSV with a stable 1-based row number for citations."""
    if name not in _cache:
        df = load_csv(name).copy()
        df["__row__"] = df.index + 1  # human-friendly row id
        _cache[name] = df
    return _cache[name]


def reindex() -> Dict[str, int]:
    """Clear cache and reload all known CSVs; return row counts per file."""
    _cache.clear()
    sizes: Dict[str, int] = {}
    for f in [
        "cost_baselines.csv",
        "location_factors.csv",
        "escalation_curve.csv",
        "sustainability_uplifts.csv",
        "contingencies.csv",
    ]:
        df = _lazy_csv(f)
        sizes[f] = len(df)
    return sizes


def _kw(question: str) -> List[str]:
    """Very light keywordizer."""
    toks = re.findall(r"[a-z0-9\*]+", str(question).lower())
    return [t for t in toks if len(t) >= 3]


def _norm(s: Any) -> str:
    return str(s or "").strip().lower()


def retrieve_context(
    question: str = "",
    parsed: Dict[str, Any] | None = None,
    k: int = 8,
) -> List[Dict[str, Any]]:
    """
    Return top-k context hits with citations from all CSVs.
    Each hit: {"source","row","score","snippet"}
    Strategy:
      1) Apply parsed filters (city/year/target/stage) where possible
      2) Score with keyword overlaps and exact matches
      3) Guarantee at least ONE hit from each source
      4) Fill remaining slots by global score
    """
    hits: List[Dict[str, Any]] = []
    kws = _kw(question) if question else []

    # ---------------- cost_baselines.csv ----------------
    cb = _lazy_csv("cost_baselines.csv")
    c_city = col(cb, "City")
    c_rate = col(cb, "base_rate_per_m2")
    df = cb
    if parsed and parsed.get("city"):
        df = df[df[c_city].str.strip().str.lower() == _norm(parsed["city"])]

    for _, r in df.iterrows():
        text = f"{c_city}={r.get(c_city)}, {c_rate}={r.get(c_rate)}"
        score = 0.0
        if parsed and parsed.get("city") and _norm(r.get(c_city, "")) == _norm(parsed["city"]):
            score += 2.0
        for w in kws:
            if w and w in str(r.get(c_city, "")).lower():
                score += 1.0
        hits.append({
            "source": "cost_baselines.csv",
            "row": int(r["__row__"]),
            "score": score,
            "snippet": text,
        })

    # ---------------- location_factors.csv ----------------
    lf = _lazy_csv("location_factors.csv")
    lc_city = col(lf, "City")
    lc_factor = col(lf, "factor")
    df = lf
    if parsed and parsed.get("city"):
        df = df[df[lc_city].str.strip().str.lower() == _norm(parsed["city"])]

    for _, r in df.iterrows():
        text = f"{lc_city}={r.get(lc_city)}, factor={r.get(lc_factor)}"
        score = 0.0
        if parsed and parsed.get("city") and _norm(r.get(lc_city, "")) == _norm(parsed["city"]):
            score += 2.0
        hits.append({
            "source": "location_factors.csv",
            "row": int(r["__row__"]),
            "score": score,
            "snippet": text,
        })

    # ---------------- escalation_curve.csv ----------------
    ec = _lazy_csv("escalation_curve.csv")
    y_col = col(ec, "year")
    f_col = col(ec, "factor")
    df = ec
    # filter by year if available (cast-safe)
    target_year = None
    if parsed and parsed.get("need_year") is not None:
        try:
            target_year = int(float(parsed["need_year"]))
            df = df[df[y_col].astype(float).round(0).astype(int) == target_year]
        except Exception:
            target_year = None

    for _, r in df.iterrows():
        text = f"{y_col}={r.get(y_col)}, factor={r.get(f_col)}"
        score = 0.0
        try:
            if target_year is not None and int(float(r.get(y_col, 0))) == target_year:
                score += 2.0
        except Exception:
            pass
        hits.append({
            "source": "escalation_curve.csv",
            "row": int(r["__row__"]),
            "score": score,
            "snippet": text,
        })

    # ---------------- sustainability_uplifts.csv ----------------
    su = _lazy_csv("sustainability_uplifts.csv")
    t_col = col(su, "target")
    u_col = col(su, "uplift_pct")
    df = su
    if parsed and parsed.get("sustainability"):
        df = df[df[t_col].str.strip().str.lower() == _norm(parsed["sustainability"])]

    for _, r in df.iterrows():
        text = f"{t_col}={r.get(t_col)}, uplift_pct={r.get(u_col)}"
        score = 0.0
        if parsed and parsed.get("sustainability") and _norm(r.get(t_col, "")) == _norm(parsed["sustainability"]):
            score += 2.0
        hits.append({
            "source": "sustainability_uplifts.csv",
            "row": int(r["__row__"]),
            "score": score,
            "snippet": text,
        })

    # ---------------- contingencies.csv ----------------
    cg = _lazy_csv("contingencies.csv")
    s_col = col(cg, "stage")
    p_col = col(cg, "pct")
    df = cg
    if parsed and parsed.get("stage"):
        df = df[df[s_col].str.strip().str.lower() == _norm(parsed["stage"])]

    for _, r in df.iterrows():
        text = f"{s_col}={r.get(s_col)}, pct={r.get(p_col)}"
        score = 0.0
        if parsed and parsed.get("stage") and _norm(r.get(s_col, "")) == _norm(parsed["stage"]):
            score += 2.0
        hits.append({
            "source": "contingencies.csv",
            "row": int(r["__row__"]),
            "score": score,
            "snippet": text,
        })

    # ---------------- guarantee per-source + final rerank ----------------
    # Bucket by source
    per_source: Dict[str, List[Dict[str, Any]]] = {}
    for h in hits:
        per_source.setdefault(h["source"], []).append(h)

    # Sort each bucket by score (desc)
    for lst in per_source.values():
        lst.sort(key=lambda x: x["score"], reverse=True)

    # 1) Pick top-1 from each source (guarantee coverage)
    bucketed: List[Dict[str, Any]] = [lst[0] for lst in per_source.values() if lst]

    # 2) Collect the remaining candidates and sort by score
    remaining: List[Dict[str, Any]] = []
    for lst in per_source.values():
        remaining.extend(lst[1:])
    remaining.sort(key=lambda x: x["score"], reverse=True)

    # 3) Fill leftover slots up to k
    need = max(0, k - len(bucketed))
    if need > 0:
        bucketed.extend(remaining[:need])

    # 4) Final cap (and a light re-rank if you want)
    bucketed = bucketed[:k]
    # Optional: bucketed.sort(key=lambda x: x["score"], reverse=True)

    return bucketed
