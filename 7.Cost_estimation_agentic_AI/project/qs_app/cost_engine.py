# qs_app/cost_engine.py
from __future__ import annotations

from .utils import load_csv, col  # col = case-insensitive column resolver
from .models import (
    EstimateRequest,
    FactorSnapshot,
    EstimateBreakdown,
    EstimateResponse,
)


# -------------------- CSV lookups (robust to header case) --------------------

def get_base_rate(city: str) -> float:
    """Return base_rate_per_m2 for a city; 0.0 if not found."""
    df = load_csv("cost_baselines.csv")
    c_city = col(df, "City")
    c_rate = col(df, "base_rate_per_m2")
    row = df[df[c_city].str.strip().str.lower() == str(city).strip().lower()]
    if not row.empty:
        return float(row[c_rate].iloc[0])
    return 0.0


def get_location_factor(city: str) -> float:
    """Return location factor for a city; 1.0 if not found."""
    df = load_csv("location_factors.csv")
    c_city = col(df, "City")
    c_factor = col(df, "factor")
    row = df[df[c_city].str.strip().str.lower() == str(city).strip().lower()]
    if not row.empty:
        return float(row[c_factor].iloc[0])
    return 1.0


def get_escalation_factor(year: int) -> float:
    """Return escalation factor for a year; 1.0 if not found."""
    df = load_csv("escalation_curve.csv")
    c_year = col(df, "year")
    c_factor = col(df, "factor")
    # ensure int compare even if CSV has floats/strings
    row = df[df[c_year].astype(float).round(0).astype(int) == int(year)]
    if not row.empty:
        return float(row[c_factor].iloc[0])
    return 1.0


def get_sustainability_uplift(label: str) -> float:
    """Return uplift_pct for a sustainability target; 0.0 if unknown."""
    df = load_csv("sustainability_uplifts.csv")
    c_target = col(df, "target")
    c_uplift = col(df, "uplift_pct")
    row = df[df[c_target].str.strip().str.lower() == str(label).strip().lower()]
    if not row.empty:
        return float(row[c_uplift].iloc[0])
    return 0.0


def get_contingency(stage: str) -> float:
    """Return contingency pct for a stage; 0.0 if unknown."""
    df = load_csv("contingencies.csv")
    c_stage = col(df, "stage")
    c_pct = col(df, "pct")
    row = df[df[c_stage].str.strip().str.lower() == str(stage).strip().lower()]
    if not row.empty:
        return float(row[c_pct].iloc[0])
    return 0.0


# -------------------- main estimator --------------------

def estimate_cost(req: EstimateRequest) -> EstimateResponse:
    """
    final = (gfa * base_rate * location * escalation * (1 + sustainability)) * (1 + contingency)
    All CSV lookups are case-insensitive and safe.
    """
    # 1) Base cost
    base_rate = get_base_rate(req.city)
    base_cost = base_rate * float(req.gfa_m2)

    # 2) Location factor
    loc_factor = get_location_factor(req.city)
    after_location = base_cost * loc_factor

    # 3) Escalation
    esc_factor = get_escalation_factor(req.need_year)
    after_escalation = after_location * esc_factor

    # 4) Sustainability uplift
    sus_uplift = get_sustainability_uplift(req.sustainability)  # fraction (e.g., 0.06)
    after_sustainability = after_escalation * (1.0 + sus_uplift)

    # 5) Contingency
    cont_pct = get_contingency(req.stage)  # fraction (e.g., 0.10)
    final = after_sustainability * (1.0 + cont_pct)

    factors = FactorSnapshot(
        location_factor=loc_factor,
        escalation_factor=esc_factor,
        sustainability_uplift_pct=sus_uplift,
        contingency_pct=cont_pct,
        base_rate_per_m2=base_rate,
    )

    breakdown = EstimateBreakdown(
        base_cost=round(base_cost, 2),
        after_location=round(after_location, 2),
        after_escalation=round(after_escalation, 2),
        after_sustainability=round(after_sustainability, 2),
        final_with_contingency=round(final, 2),
    )

    assumptions = {
        "formula": "final = (gfa * base_rate * location * escalation * (1 + sustainability)) * (1 + contingency)",
        "notes": [
            "Base rates are simplified per-m² placeholders. Replace with per-trade rates later.",
            "Escalation is applied multiplicatively; years outside table are matched exactly (no interpolate here).",
            "Unknown sustainability/contingency labels default to 0.",
        ],
        "data_currency": "AUD (example)",
        "as_of": "See CSV as_of_date columns",
    }

    return EstimateResponse(
        input=req,
        factors=factors,
        breakdown=breakdown,
        assumptions=assumptions,
    )
