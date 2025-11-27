import streamlit as st
import json
import pandas as pd
import os

st.set_page_config(layout="wide", page_title="QAgenie Dashboard")

st.title("🤖 QAgenie: AI-Powered QA Dashboard")
st.markdown("Automated test case generation, execution, and reporting for Recruter.ai")

TEST_PLAN_FILE = "playwright_test_plan.json"
REPORT_PATH = "playwright-report/index.html"

# --- Sidebar for actions ---
st.sidebar.header("Agent Controls")
if st.sidebar.button("1. Transcribe Video"):
    with st.spinner("Downloading and transcribing video..."):
        os.system("python transcribe.py")
    st.sidebar.success("Transcription complete!")

if st.sidebar.button("2. Generate Test Cases (LLM)"):
    with st.spinner("Asking QAgenie to generate test cases..."):
        os.system("python generate_tests.py")
    st.sidebar.success("Test plan created!")

if st.sidebar.button("3. Create Playwright Scripts"):
    with st.spinner("Converting JSON to Playwright .spec.js files..."):
        os.system("python create_scripts.py")
    st.sidebar.success("Playwright scripts are ready!")

st.sidebar.header("Execution")
if st.sidebar.button("Run Playwright Tests"):
    with st.spinner("Running all tests... View progress in the terminal."):
        os.system("npx playwright test")
    st.sidebar.success("Test execution finished!")


# --- Main Dashboard Area ---
st.header("Generated Test Plan")

if os.path.exists(TEST_PLAN_FILE):
    with open(TEST_PLAN_FILE, "r", encoding="utf-8") as f:
        test_data = json.load(f)

    # Display test cases in an appealing way
    for i, test_case in enumerate(test_data):
        with st.expander(f"**{test_case.get('test_case_id', 'TC'+str(i))}**: {test_case.get('description')}"):
            st.markdown("**Steps:**")
            for step in test_case.get("steps", []):
                st.write(f"- {step}")
else:
    st.info("Test plan not found. Use the controls in the sidebar to generate it.")

st.header("Test Execution Results")
if os.path.exists(REPORT_PATH):
    st.success("A Playwright report is available!")
    st.markdown(f'<a href="{REPORT_PATH}" target="_blank" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px;">View Full HTML Report</a>', unsafe_allow_html=True)
else:
    st.warning("Playwright report not found. Run the tests to generate it.")