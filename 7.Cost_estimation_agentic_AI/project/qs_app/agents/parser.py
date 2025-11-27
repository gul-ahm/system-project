import re
from ..models import EstimateRequest
from ..utils import load_csv

CITY_CACHE = None

def _known_cities():
    global CITY_CACHE
    if CITY_CACHE is None:
        CITY_CACHE = set(load_csv("cost_baselines.csv")["city"].str.lower().unique())
    return CITY_CACHE

def parse_question(q: str) -> EstimateRequest:
    text = q.strip().lower()

    # 1) GFA (e.g., "20,000 m2", "20000 sqm", "20000m2")
    gfa = None
    m = re.search(r"(\d{1,3}(?:[, ]\d{3})+|\d+)[ ]*(m2|sqm|sq\s*m|square\s*met(er|re)s?)", text)
    if m:
        num = m.group(1).replace(",", "").replace(" ", "")
        gfa = float(num)
    else:
        m2 = re.search(r"(\d{4,})", text)
        if m2:
            gfa = float(m2.group(1))

    # 2) City (match any from your CSVs)
    city = "Sydney"
    for c in _known_cities():
        if re.search(rf"\b{re.escape(c)}\b", text):
            city = c.title()
            break

    # 3) Year (absolute like 2028 or relative "in 3 years")
    year = None
    m = re.search(r"\b(20\d{2}|19\d{2})\b", text)
    if m:
        year = int(m.group(1))
    else:
        m = re.search(r"in\s+(\d{1,2})\s+years?", text)
        if m:
            from datetime import datetime
            year = datetime.now().year + int(m.group(1))
    if year is None:
        year = 2028

    # 4) Sustainability
    sustainability = "None"
    if "green star 6" in text:
        sustainability = "Green Star 6★"
    elif "nabers 5" in text:
        sustainability = "NABERS 5★"
    elif "nabers 6" in text:
        sustainability = "NABERS 6★"

    # 5) Stage
    stage = "Concept"
    if "detailed" in text:
        stage = "Detailed"
    elif "tender" in text:
        stage = "Tender"

    if gfa is None:
        raise ValueError("Couldn't find GFA/area in the question. Try like: '20,000 m2' or '20000 sqm'.")

    return EstimateRequest(
        gfa_m2=gfa,
        city=city,
        need_year=year,
        sustainability=sustainability,
        stage=stage,
    )
