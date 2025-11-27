from pydantic import BaseModel, Field
from typing import Dict, Any


# -------------- INPUT MODEL -----------------
class EstimateRequest(BaseModel):
    gfa_m2: float = Field(gt=0, description="Gross Floor Area in square meters")
    city: str
    need_year: int
    sustainability: str = "None"
    stage: str = "Concept"


# -------------- FACTORS SNAPSHOT -----------------
class FactorSnapshot(BaseModel):
    location_factor: float
    escalation_factor: float
    sustainability_uplift_pct: float
    contingency_pct: float
    base_rate_per_m2: float


# -------------- COST BREAKDOWN -----------------
class EstimateBreakdown(BaseModel):
    base_cost: float
    after_location: float
    after_escalation: float
    after_sustainability: float
    final_with_contingency: float


# -------------- RESPONSE MODEL -----------------
class EstimateResponse(BaseModel):
    input: EstimateRequest
    factors: FactorSnapshot
    breakdown: EstimateBreakdown
    assumptions: Dict[str, Any]
