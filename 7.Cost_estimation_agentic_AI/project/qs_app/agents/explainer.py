from typing import Dict, Any

def _fmt_text(v, default="N/A"):
    return str(v) if v is not None else default

def _fmt_num(v, default="N/A", decimals=0):
    try:
        f = float(v)
        if decimals == 0:
            return f"{f:,.0f}"
        return f"{f:,.{decimals}f}"
    except Exception:
        return default

def _fmt_pct(v, default="N/A", decimals=1):
    try:
        f = float(v) * 100.0
        return f"{f:.{decimals}f}%"
    except Exception:
        return default


def build_explanation(payload: Dict[str, Any]) -> str:
    """
    Accepts any of:
      - /ask output: {"question", "parsed", "estimate": {"factors","breakdown"}, "assumptions"}
      - /estimate output: {"input", "factors", "breakdown", "assumptions"}
      - {"input": {...}}  (then caller should have computed estimate before, but we still try to normalize)

    Returns: markdown string (null-safe).
    """
    # ---- normalize common shapes ----
    q = payload.get("question", "")

    # Prefer 'parsed' (from /ask); else 'input' (from /estimate or caller)
    parsed = payload.get("parsed") or payload.get("input") or {}

    # Prefer nested 'estimate' if present; else fall back to flat keys
    est = payload.get("estimate") or {}
    factors = est.get("factors") or payload.get("factors") or {}
    breakdown = est.get("breakdown") or payload.get("breakdown") or {}

    # ---- read parsed fields (may be None; we format safely) ----
    gfa = parsed.get("gfa_m2")
    city = parsed.get("city")
    year = parsed.get("need_year")
    sustain = parsed.get("sustainability")
    stage = parsed.get("stage")

    # ---- numbers (may be None) ----
    base = breakdown.get("base_cost")
    after_loc = breakdown.get("after_location")
    after_esc = breakdown.get("after_escalation")
    after_sus = breakdown.get("after_sustainability")
    final = breakdown.get("final_with_contingency")

    loc_f = factors.get("location_factor")
    esc_f = factors.get("escalation_factor")
    sus_u = factors.get("sustainability_uplift_pct")
    cont_p = factors.get("contingency_pct")
    base_rate = factors.get("base_rate_per_m2")

    lines = []
    if q:
        lines.append(f"**Question:** {q}\n")

    # ---- Summary ----
    lines.append("## Summary")
    lines.append(
        f"For a **{_fmt_num(gfa)} m²** project in **{_fmt_text(city)}** targeted for **{_fmt_text(year)}** "
        f"at **{_fmt_text(stage)}** stage with **{_fmt_text(sustain)}**, the estimated total cost is "
        f"**~ {_fmt_num(final)}** (currency per your dataset)."
    )

    # ---- Step-by-step breakdown ----
    lines.append("\n## Step-by-step breakdown")
    lines.append(f"- Base rate: `{_fmt_num(base_rate, decimals=2)}` × GFA `{_fmt_num(gfa)}` → **{_fmt_num(base)}**")
    lines.append(f"- Location factor `{_fmt_text(loc_f)}` → **{_fmt_num(after_loc)}**")
    lines.append(f"- Escalation factor `{_fmt_text(esc_f)}` → **{_fmt_num(after_esc)}**")
    lines.append(f"- Sustainability uplift `{_fmt_pct(sus_u)}` → **{_fmt_num(after_sus)}**")
    lines.append(f"- Contingency `{_fmt_pct(cont_p)}` → **{_fmt_num(final)}**")

    # ---- Assumptions ----
    lines.append("\n## Assumptions & Notes")
    lines.append("- Base rates are simplified per-m² placeholders (demo).")
    lines.append("- Escalation is multiplicative; interpolation/extrapolation may apply.")
    lines.append("- Unknown labels default to 0% uplift/contingency.")
    lines.append("- Currency is as per your CSV (example: AUD).")

    # ---- CSV citations ----
    lines.append("\n## Data Sources (CSV citations)")
    lines.append("- `data/cost_baselines.csv` (city base_rate_per_m2)")
    lines.append("- `data/location_factors.csv` (city factor)")
    lines.append("- `data/escalation_curve.csv` (year factor)")
    lines.append("- `data/sustainability_uplifts.csv` (target uplift_pct)")
    lines.append("- `data/contingencies.csv` (stage pct)")

    return "\n".join(lines)
