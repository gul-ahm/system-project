# qs_app/main.py  — Phase-5 consolidated

from io import BytesIO
from typing import Optional, List, Dict, Any
import os
import re
import json
from uuid import uuid4
from datetime import datetime, timezone, timedelta

from fastapi import FastAPI, HTTPException, Request, status, APIRouter, Query
from fastapi.responses import StreamingResponse, JSONResponse, FileResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, Field, field_validator

from .models import EstimateRequest, EstimateResponse
from .cost_engine import estimate_cost
from .utils import load_csv
from .agents.orchestrator import ask_pipeline
from .agents.explainer import build_explanation
from .agents.cited_explainer import build_cited_explanation
from .reporting.pdf import build_cost_report
from .rag.retriever import retrieve_context, reindex

# -------------------------------------------------------------
# Config
# -------------------------------------------------------------
BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:8000")
REPORTS_DIR = os.path.join(os.path.dirname(__file__), "..", "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)

# -------------------------------------------------------------
# Phase-5 helpers (pretty filenames + metadata sidecar)
# -------------------------------------------------------------
_SLUG_KEEP = re.compile(r"[^a-z0-9\-]+")

def _slug(s: Optional[str]) -> str:
    if not s:
        return "na"
    s = s.strip().lower().replace("&", "and")
    s = re.sub(r"\s+", "-", s)
    s = _SLUG_KEEP.sub("-", s)
    s = re.sub(r"-{2,}", "-", s).strip("-")
    return s or "na"

def _build_pretty_filename(meta: Dict[str, Any], parsed: Dict[str, Any]) -> str:
    # e.g. riverview-capital_perth-office-tower_perth_2028_YYMMDD-HHMMSS_ab12cd34.pdf
    client  = _slug(meta.get("client_name"))
    proj    = _slug(meta.get("project_name"))
    city    = _slug(parsed.get("city"))
    year    = str(parsed.get("need_year") or "")
    stamp   = datetime.now().strftime("%y%m%d-%H%M%S")
    shortid = uuid4().hex[:8]
    return f"{client}_{proj}_{city}_{year}_{stamp}_{shortid}.pdf"

def _meta_path_for(pdf_path: str) -> str:
    base, _ = os.path.splitext(pdf_path)
    return base + ".json"

def _load_sidecar(path: str) -> Optional[Dict[str, Any]]:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None

# -------------------------------------------------------------
# Models (existing)
# -------------------------------------------------------------
class ReportMeta(BaseModel):
    company_name: Optional[str] = "Company"
    client_name: Optional[str] = None
    project_name: Optional[str] = None
    currency: str = "AUD"
    logo_path: Optional[str] = None
    api_link: Optional[str] = None
    notes: Optional[str] = None

class ReportInput(BaseModel):
    gfa_m2: float
    city: str
    need_year: int
    sustainability: str
    stage: str

    @field_validator("gfa_m2", mode="before")
    @classmethod
    def _coerce_gfa(cls, v):
        return float(v)

    @field_validator("need_year", mode="before")
    @classmethod
    def _coerce_year(cls, v):
        return int(float(v))

class ReportPayload(BaseModel):
    input: ReportInput
    meta: Optional[ReportMeta] = None

class AskPayload(BaseModel):
    question: Optional[str] = None
    input: Optional[dict] = None

# Phase-4 full-run models
class FullRunMeta(BaseModel):
    company_name: Optional[str] = None
    client_name: Optional[str] = None
    project_name: Optional[str] = None
    currency: Optional[str] = "AUD"
    logo_path: Optional[str] = None
    api_link: Optional[str] = None
    notes: Optional[str] = None

class FullRunInput(BaseModel):
    gfa_m2: float = Field(gt=0)
    city: str
    need_year: int
    sustainability: str
    stage: str

class FullRunRequest(BaseModel):
    question: Optional[str] = None
    input: FullRunInput
    meta: Optional[FullRunMeta] = None

# -------------------------------------------------------------
# FastAPI init + validation handler
# -------------------------------------------------------------
app = FastAPI(title="RAG Application – Core API", version="0.2.0")

@app.exception_handler(RequestValidationError)
async def validation_handler(_: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"error": "VALIDATION_ERROR", "details": exc.errors(),
                 "hint": "Body shape/types ko /docs schema ke hisaab se bhejein."},
    )

@app.get("/")
def root():
    return {"status": "ok", "message": "QS Agentic AI – Core API running"}

# -------------------------------------------------------------
# Core endpoints (unchanged behaviour)
# -------------------------------------------------------------
@app.post("/estimate", response_model=EstimateResponse)
def estimate(req: EstimateRequest):
    try:
        return estimate_cost(req)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/factors")
def factors():
    base = load_csv("cost_baselines.csv")["city"].unique().tolist()
    years = load_csv("escalation_curve.csv")["year"].unique().tolist()
    sus = load_csv("sustainability_uplifts.csv")["target"].unique().tolist()
    stages = load_csv("contingencies.csv")["stage"].unique().tolist()
    return {"cities": base, "years": sorted(years), "sustainability_targets": sus, "stages": stages}

@app.post("/ask")
def ask(payload: dict):
    try:
        q = payload.get("question", "").strip()
        if not q:
            raise ValueError("Provide 'question' string in body.")
        return ask_pipeline(q)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/explain")
def explain(payload: dict):
    try:
        data = payload
        if "estimate" not in data and "breakdown" not in data:
            req = EstimateRequest(**data["input"])
            res = estimate_cost(req)
            data = {
                "parsed": res.input.model_dump(),
                "estimate": {
                    "factors": res.factors.model_dump(),
                    "breakdown": res.breakdown.model_dump(),
                },
                "assumptions": res.assumptions,
            }
        md = build_explanation(data)
        return {"markdown": md}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/report")
def report(payload: ReportPayload):
    try:
        meta = (payload.meta or ReportMeta()).model_dump()
        req = EstimateRequest(**payload.input.model_dump())
        res = estimate_cost(req)

        normalized = {
            "parsed": res.input.model_dump(),
            "estimate": {
                "factors": res.factors.model_dump(),
                "breakdown": res.breakdown.model_dump(),
            },
            "assumptions": res.assumptions,
        }

        hits = retrieve_context(question="", parsed=normalized["parsed"], k=8)
        pdf_bytes = build_cost_report(normalized, meta, citations=hits)

        return StreamingResponse(
            BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": 'attachment; filename="qs_report.pdf"'},
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/rag/reindex")
def rag_reindex():
    try:
        sizes = reindex()
        return {"status": "ok", "indexed_rows": sizes}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/ask_with_citations")
def ask_with_citations(payload: AskPayload):
    try:
        if payload.input:
            req = EstimateRequest(**payload.input)
        elif payload.question:
            parsed = ask_pipeline(payload.question)["parsed"]
            req = EstimateRequest(**parsed)
        else:
            raise HTTPException(status_code=400, detail="Provide question or input.")

        res = estimate_cost(req)
        normalized = {
            "parsed": res.input.model_dump(),
            "estimate": {
                "factors": res.factors.model_dump(),
                "breakdown": res.breakdown.model_dump(),
            },
            "assumptions": res.assumptions,
            "question": payload.question or "",
        }
        hits = retrieve_context(question=payload.question or "", parsed=normalized["parsed"], k=8)
        out = build_cited_explanation(normalized, hits)
        return {"answer_markdown": out["markdown"], "citations": out["citations"],
                "estimate": normalized["estimate"], "parsed": normalized["parsed"]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# -------------------------------------------------------------
# Download (unchanged)
# -------------------------------------------------------------
@app.get("/download/{fname}")
def download_report(fname: str):
    safe_name = os.path.basename(fname)
    fpath = os.path.join(REPORTS_DIR, safe_name)
    if not os.path.isfile(fpath):
        raise HTTPException(status_code=404, detail="file not found")
    return FileResponse(fpath, media_type="application/pdf", filename=safe_name)

# -------------------------------------------------------------
# Full run with pretty filename + sidecar metadata (Phase-5)
# -------------------------------------------------------------
@app.post("/ask_full")
def ask_full(payload: FullRunRequest):
    try:
        req = EstimateRequest(**payload.input.model_dump())
        res = estimate_cost(req)

        normalized = {
            "question": payload.question,
            "parsed": res.input.model_dump(),
            "estimate": {
                "factors": res.factors.model_dump(),
                "breakdown": res.breakdown.model_dump(),
            },
            "assumptions": res.assumptions,
        }

        hits = retrieve_context(question=payload.question or "", parsed=normalized["parsed"], k=8)

        explanation_md = build_explanation({
            "question": payload.question,
            "parsed": normalized["parsed"],
            "estimate": normalized["estimate"],
        })

        meta = (payload.meta or FullRunMeta()).model_dump()
        pdf_bytes = build_cost_report(normalized, meta, citations=hits)

        try:
            fname = _build_pretty_filename(meta, normalized["parsed"])
        except Exception:
            fname = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid4().hex[:8]}.pdf"

        save_path = os.path.join(REPORTS_DIR, fname)
        with open(save_path, "wb") as f:
            f.write(pdf_bytes)

        sidecar = {
            "created_utc": datetime.utcnow().isoformat() + "Z",
            "file": os.path.basename(save_path),
            "download": f"/download/{os.path.basename(save_path)}",
            "download_absolute": f"{BASE_URL}/download/{os.path.basename(save_path)}",
            "meta": meta,
            "parsed": normalized["parsed"],
            "estimate": normalized["estimate"],
            "assumptions": normalized["assumptions"],
            "citations": (hits[:10] if isinstance(hits, list) else []),
            "question": payload.question or "",
        }
        with open(_meta_path_for(save_path), "w", encoding="utf-8") as jf:
            json.dump(sidecar, jf, ensure_ascii=False, indent=2)

        return {
            "status": "ok",
            "answer_markdown": explanation_md,
            "estimate": normalized["estimate"],
            "parsed": normalized["parsed"],
            "citations": hits,
            "pdf_url": f"/download/{os.path.basename(save_path)}",
            "pdf_url_absolute": f"{BASE_URL}/download/{os.path.basename(save_path)}",
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# -------------------------------------------------------------
# Reports Router (list / search / meta / purge / delete)
# -------------------------------------------------------------
router = APIRouter(tags=["reports"])

@router.get("/reports")
def list_reports():
    if not os.path.isdir(REPORTS_DIR):
        return {"items": []}

    items = []
    for name in os.listdir(REPORTS_DIR):
        if not name.lower().endswith(".pdf"):
            continue
        path = os.path.join(REPORTS_DIR, name)
        try:
            st = os.stat(path)
            items.append({
                "filename": name,
                "size_bytes": st.st_size,
                "modified_utc": datetime.fromtimestamp(st.st_mtime, tz=timezone.utc).isoformat(),
                "download": f"/download/{name}",
                "download_absolute": f"{BASE_URL}/download/{name}",
            })
        except Exception:
            pass

    items.sort(key=lambda x: x["modified_utc"], reverse=True)
    return {"items": items[:200]}

@router.get("/reports/{fname}/meta")
def report_meta(fname: str):
    safe_name = os.path.basename(fname)
    pdf_path = os.path.join(REPORTS_DIR, safe_name)
    meta_path = _meta_path_for(pdf_path)
    if not os.path.isfile(pdf_path):
        raise HTTPException(status_code=404, detail="file not found")
    meta = _load_sidecar(meta_path) or {}
    return {"file": safe_name, "meta": meta}

@router.get("/reports/search")
def reports_search(
    q: Optional[str] = Query(None, description="free text search over filename & sidecar"),
    client: Optional[str] = None,
    project: Optional[str] = None,
    city: Optional[str] = None,
    year: Optional[int] = None,
):
    results = []
    if not os.path.isdir(REPORTS_DIR):
        return {"items": results}

    q_l = (q or "").lower()
    for name in os.listdir(REPORTS_DIR):
        if not name.lower().endswith(".pdf"):
            continue
        pdf_path = os.path.join(REPORTS_DIR, name)
        meta = _load_sidecar(_meta_path_for(pdf_path)) or {}

        text_bucket = " ".join([
            name,
            json.dumps(meta.get("meta") or {}, ensure_ascii=False),
            json.dumps(meta.get("parsed") or {}, ensure_ascii=False),
        ]).lower()

        if q and q_l not in text_bucket:
            continue
        if client and client.lower() not in text_bucket:
            continue
        if project and project.lower() not in text_bucket:
            continue
        if city and city.lower() not in text_bucket:
            continue
        if year is not None and str(year) not in text_bucket:
            continue

        st = os.stat(pdf_path)
        results.append({
            "filename": name,
            "download_absolute": f"{BASE_URL}/download/{name}",
            "size_bytes": st.st_size,
            "modified_utc": datetime.fromtimestamp(st.st_mtime, tz=timezone.utc).isoformat(),
        })

    results.sort(key=lambda x: x["modified_utc"], reverse=True)
    return {"items": results[:200]}

@router.delete("/delete/{fname}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(fname: str):
    safe_name = os.path.basename(fname)
    pdf_path = os.path.join(REPORTS_DIR, safe_name)
    meta_path = _meta_path_for(pdf_path)
    if not os.path.isfile(pdf_path):
        raise HTTPException(status_code=404, detail="file not found")
    try:
        os.remove(pdf_path)
        if os.path.isfile(meta_path):
            os.remove(meta_path)
        return
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/reports/purge", status_code=status.HTTP_200_OK)
def purge_reports(older_than_days: int = Query(30, ge=1, le=365)):
    """Delete PDFs (and sidecars) older than N days. Default 30."""
    cutoff = datetime.now() - timedelta(days=older_than_days)
    total = 0
    for name in os.listdir(REPORTS_DIR):
        if not name.lower().endswith(".pdf"):
            continue
        pdf_path = os.path.join(REPORTS_DIR, name)
        st = os.stat(pdf_path)
        modified = datetime.fromtimestamp(st.st_mtime)
        if modified < cutoff:
            os.remove(pdf_path)
            meta_path = _meta_path_for(pdf_path)
            if os.path.isfile(meta_path):
                os.remove(meta_path)
            total += 1
    return {"deleted": total, "older_than_days": older_than_days}

# register router
app.include_router(router)

# optional: quick route inspector
@app.get("/debug/routes")
def debug_routes():
    return sorted(
        [{"path": r.path, "methods": sorted(list(r.methods))} for r in app.routes],
        key=lambda x: x["path"]
    )
