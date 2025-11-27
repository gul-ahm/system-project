from typing import List
from ..utils import load_csv

def verify_inputs(city: str, year: int, sustainability: str, stage: str) -> List[str]:
    issues: List[str] = []

    cities = set(load_csv("cost_baselines.csv")["city"].str.lower().unique())
    if city.lower() not in cities:
        issues.append(f"Unknown city '{city}'. Using first known city for computation.")

    years = set(load_csv("escalation_curve.csv")["year"].unique())
    if year not in years:
        issues.append("Escalation factor for year not explicit; linear interpolation/extrapolation will be used.")

    sus = set(load_csv("sustainability_uplifts.csv")["target"].str.lower().unique())
    if sustainability.lower() not in sus:
        issues.append("Unrecognized sustainability target; uplift assumed 0%.")

    stages = set(load_csv("contingencies.csv")["stage"].str.lower().unique())
    if stage.lower() not in stages:
        issues.append("Unrecognized stage; contingency assumed 0%.")

    return issues
