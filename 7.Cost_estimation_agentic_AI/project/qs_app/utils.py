import pandas as pd
import os

# simple in-memory cache for loaded CSVs
_df_cache = {}


def load_csv(name: str) -> pd.DataFrame:
    """Load CSV from data/ folder with caching."""
    global _df_cache

    if name in _df_cache:
        return _df_cache[name]

    path = os.path.join("data", name)
    df = pd.read_csv(path)
    _df_cache[name] = df
    return df


def get_base_rate(city: str) -> float:
    df = load_csv("cost_baselines.csv")
    row = df[df["city"].str.lower() == city.lower()]
    if not row.empty:
        return float(row["base_rate_per_m2"].iloc[0])
    return float(df["base_rate_per_m2"].mean())


def get_location_factor(city: str) -> float:
    df = load_csv("location_factors.csv")
    row = df[df["city"].str.lower() == city.lower()]
    if not row.empty:
        return float(row["factor"].iloc[0])
    return 1.0


def get_escalation_factor(year: int) -> float:
    df = load_csv("escalation_curve.csv")
    row = df[df["year"] == year]
    if not row.empty:
        return float(row["factor"].iloc[0])
    # linear extrapolation if year not in table
    min_year, max_year = df["year"].min(), df["year"].max()
    if year < min_year:
        return float(df[df["year"] == min_year]["factor"].iloc[0])
    if year > max_year:
        return float(df[df["year"] == max_year]["factor"].iloc[0])
    return 1.0


def get_sustainability_uplift(target: str) -> float:
    df = load_csv("sustainability_uplifts.csv")
    row = df[df["target"].str.lower() == target.lower()]
    if not row.empty:
        return float(row["uplift_pct"].iloc[0])
    return 0.0


def get_contingency(stage: str) -> float:
    df = load_csv("contingencies.csv")
    row = df[df["stage"].str.lower() == stage.lower()]
    if not row.empty:
        return float(row["pct"].iloc[0])   # ✅ correct
    return 0.0

# --- add to qs_app/utils.py ---

def _resolve_col(df, wanted: str) -> str:
    """Return the actual column name matching wanted (case-insensitive, trimmed)."""
    wl = wanted.strip().lower()
    for c in df.columns:
        if str(c).strip().lower() == wl:
            return c
    raise KeyError(wanted)

def col(df, name: str) -> str:
    """Public wrapper for readability."""
    return _resolve_col(df, name)

