import os
import io
import json
import requests
import streamlit as st

st.set_page_config(page_title="RAG Application", page_icon="🧠", layout="wide")
st.title("🧠 RAG Application Dashboard")

# ---------- Config ----------
API_BASE = os.getenv("API_BASE", "http://127.0.0.1:8000")

st.set_page_config(page_title="QS Agentic AI – Dashboard", layout="wide")
st.title("🏗️ QS Agentic AI – Dashboard")
st.caption(f"Backend: {API_BASE}")

# ---------- Helpers ----------
def _post(path: str, payload: dict):
    url = f"{API_BASE}{path}"
    r = requests.post(url, json=payload, timeout=60)
    if r.status_code >= 400:
        try:
            st.error(r.json())
        except Exception:
            st.error(r.text)
        st.stop()
    return r

def _get(path: str, stream=False):
    url = f"{API_BASE}{path}"
    r = requests.get(url, timeout=60, stream=stream)
    if r.status_code >= 400:
        try:
            st.error(r.json())
        except Exception:
            st.error(r.text)
        st.stop()
    return r

# ---------- Sidebar: API + Meta ----------
with st.sidebar:
    st.header("Settings")
    api_base = st.text_input("API Base URL", API_BASE)
    if api_base.strip():
        API_BASE = api_base.strip()

    st.divider()
    st.subheader("Report Meta (optional)")
    company_name = st.text_input("Company", "Acme QS Pvt Ltd")
    client_name  = st.text_input("Client", "Riverview Capital")
    project_name = st.text_input("Project", "Perth Office Tower")
    currency     = st.selectbox("Currency", ["AUD", "INR", "USD", "EUR", "GBP"], index=0)
    api_link     = st.text_input("API Link (for QR)", f"{API_BASE}/docs")
    notes        = st.text_input("Notes", "")

    meta = {
        "company_name": company_name or None,
        "client_name": client_name or None,
        "project_name": project_name or None,
        "currency": currency or "AUD",
        "api_link": api_link or None,
        "notes": notes or None,
        # logo_path is optional; if you want one, put path here:
        # "logo_path": r"D:\QS\project\assets\company_logo.png"
    }

tabs = st.tabs(["Estimate", "Ask + RAG", "Generate Report", "Reports"])

# ---------- Tab 1: Estimate ----------
with tabs[0]:
    st.subheader("Cost Estimate")
    col1, col2, col3 = st.columns(3)
    with col1:
        gfa_m2 = st.number_input("GFA (m²)", min_value=1.0, value=20000.0, step=100.0)
        city = st.text_input("City", "Perth")
    with col2:
        need_year = st.number_input("Need Year", min_value=2024, value=2028, step=1)
        sustainability = st.text_input("Sustainability", "Green Star 6*")
    with col3:
        stage = st.text_input("Stage", "Concept")

    if st.button("Estimate"):
        payload = {
            "gfa_m2": gfa_m2,
            "city": city,
            "need_year": int(need_year),
            "sustainability": sustainability,
            "stage": stage,
        }
        r = _post("/estimate", payload)
        data = r.json()
        st.success("Estimated!")
        st.json(data)

# ---------- Tab 2: Ask + RAG ----------
with tabs[1]:
    st.subheader("Ask a Question (with citations)")
    q = st.text_input("Your question", "What will be the estimated cost for 20,000 m² in Perth in 2028 at Concept stage with Green Star 6*?")
    if st.button("Ask with Citations"):
        payload = {"question": q}
        r = _post("/ask_with_citations", payload)
        data = r.json()
        st.markdown(data.get("answer_markdown", ""))
        if data.get("citations"):
            st.caption("Citations:")
            st.json(data["citations"])

# ---------- Tab 3: Generate Report (PDF) ----------
with tabs[2]:
    st.subheader("Generate & Download PDF Report")
    col1, col2, col3 = st.columns(3)
    with col1:
        gfa_m2 = st.number_input("GFA (m²)", min_value=1.0, value=20000.0, step=100.0, key="r_gfa")
        city = st.text_input("City", "Perth", key="r_city")
    with col2:
        need_year = st.number_input("Need Year", min_value=2024, value=2028, step=1, key="r_year")
        sustainability = st.text_input("Sustainability", "Green Star 6*", key="r_sus")
    with col3:
        stage = st.text_input("Stage", "Concept", key="r_stage")
        question = st.text_input("Optional Question (for RAG & explanation)", "", key="r_q")

    if st.button("Run & Save PDF"):
        payload = {
            "question": question or None,
            "input": {
                "gfa_m2": gfa_m2,
                "city": city,
                "need_year": int(need_year),
                "sustainability": sustainability,
                "stage": stage,
            },
            "meta": meta,
        }
        r = _post("/ask_full", payload)
        data = r.json()
        st.success("Run complete!")
        st.markdown("### Explanation")
        st.markdown(data.get("answer_markdown", ""))

        st.markdown("### Links")
        st.write("Relative:", data.get("pdf_url"))
        st.write("Absolute:", data.get("pdf_url_absolute"))

        # Try to download the file and offer it directly
        if data.get("pdf_url"):
            dl = _get(data["pdf_url"], stream=True)
            fname = data["pdf_url"].split("/")[-1]
            st.download_button("Download PDF", data=dl.content, file_name=fname, mime="application/pdf")

# ---------- Tab 4: Reports list ----------
with tabs[3]:
    st.subheader("Saved Reports")
    if st.button("Refresh list"):
        pass
    r = _get("/reports")
    items = r.json().get("items", [])
    if not items:
        st.info("No reports yet.")
    else:
        for it in items:
            with st.expander(it["filename"], expanded=False):
                st.write(f"Modified (UTC): {it['modified_utc']}")
                st.write(f"Size (bytes): {it['size_bytes']}")
                st.write("Download:", it["download_absolute"])
                # Quick inline download
                dl = _get(it["download"], stream=True)
                st.download_button("Download", data=dl.content, file_name=it["filename"], mime="application/pdf")
