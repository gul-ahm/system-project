import math
from qs_app.models import EstimateRequest
from qs_app.cost_engine import estimate_cost




def test_basic_perth_2028_greenstar():
req = EstimateRequest(
gfa_m2=20000,
city="Perth",
need_year=2028,
sustainability="Green Star 6★",
stage="Concept",
)
res = estimate_cost(req)
assert res.breakdown.base_cost > 0
# Rough expected order of magnitude check
assert res.breakdown.final_with_contingency > res.breakdown.after_sustainability




def test_interpolation_year():
req = EstimateRequest(
gfa_m2=1000,
city="Sydney",
need_year=2027, # exists, but also tests path
sustainability="None",
stage="None",
)
res = estimate_cost(req)
assert math.isclose(
res.factors.escalation_factor, 1.09, rel_tol=1e-6
)