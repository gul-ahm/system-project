# qs_app/agents/cited_explainer.py
from __future__ import annotations
from typing import Dict, Any, List

def _fmtn(v) -> str:
    try:
        return f"{float(v):,.0f}"
    except Exception:
        return "—"

def _pct(v) -> str:
    try:
        return f"{float(v)*100:.1f}%"
    except Exception:
        return "—"

def build_cited_explanation(normalized: Dict[str, Any], hits: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    normalized:
      { 'parsed': {...}, 'estimate': {'factors': {...}, 'breakdown': {...}}, 'assumptions': {...}, 'question'? }
    hits: output from retriever.retrieve_context
    Returns:
      { 'markdown': str, 'citations': [{'source','row','snippet'}...] }
    """
    parsed = normalized.get("parsed", {})
    est = normalized.get("estimate", {}) or {}
    f = est.get("factors", {}) or {}
    b = est.get("breakdown", {}) or {}

    lines = []
    lines.append("## Answer (with sources)")
    lines.append(
        f"Estimated total cost is **~ {_fmtn(b.get('final_with_contingency'))}** "
        f"for **{_fmtn(parsed.get('gfa_m2'))} m²** in **{parsed.get('city','—')}** "
        f"({parsed.get('stage','—')} stage, {parsed.get('sustainability','—')}, {parsed.get('need_year','—')})."
    )
    lines.append("\n**Key drivers:**")
    lines.append(f"- Base rate × GFA → **{_fmtn(b.get('base_cost'))}**")
    lines.append(f"- Location factor `{f.get('location_factor','—')}` → **{_fmtn(b.get('after_location'))}**")
    lines.append(f"- Escalation factor `{f.get('escalation_factor','—')}` → **{_fmtn(b.get('after_escalation'))}**")
    lines.append(f"- Sustainability uplift `{_pct(f.get('sustainability_uplift_pct'))}` → **{_fmtn(b.get('after_sustainability'))}**")
    lines.append(f"- Contingency `{_pct(f.get('contingency_pct'))}` → **{_fmtn(b.get('final_with_contingency'))}**")

    # citations
    lines.append("\n### Sources")
    citations = []
    for h in hits:
        tag = f"[{h['source']} R{h['row']}]"
        lines.append(f"- {tag}: {h['snippet']}")
        citations.append({"source": h["source"], "row": h["row"], "snippet": h["snippet"]})

    return {"markdown": "\n".join(lines), "citations": citations}
