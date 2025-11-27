from typing import Dict, Any
from .parser import parse_question
from .verifier import verify_inputs
from ..cost_engine import estimate_cost

def ask_pipeline(question: str) -> Dict[str, Any]:
    # 1) Parse NL → structured
    req = parse_question(question)

    # 2) Verify inputs
    issues = verify_inputs(req.city, req.need_year, req.sustainability, req.stage)

    # 3) Compute deterministic estimate
    res = estimate_cost(req)

    # 4) Build trace/answer
    return {
        "question": question,
        "parsed": res.input.model_dump(),
        "estimate": {
            "factors": res.factors.model_dump(),
            "breakdown": res.breakdown.model_dump(),
        },
        "assumptions": res.assumptions,
        "issues": issues,
    }
