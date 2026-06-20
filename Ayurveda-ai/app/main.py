import streamlit as st
import sys
sys.path.append(".")
from inference import get_ayurvedic_assessment

st.set_page_config(
    page_title="Ayurveda AI",
    page_icon="🌿",
    layout="wide"
)

st.title("🌿 Ayurveda AI — Offline Clinical Intelligence")
st.caption(
    "Powered by MedGemma 4B (Fine-tuned) | "
    "4-Agent LangGraph Pipeline | 100% Offline | Privacy-First"
)

# Agent flow diagram
with st.expander("🔍 How It Works — 4-Agent Pipeline"):
    st.markdown("""
    ```
    Patient Input
         │
    SymptomAgent    ← scores Vata / Pitta / Kapha from symptoms
         │
    DoshaAgent      ← maps imbalance to treatment principles
         │
    GuidanceAgent   ← fine-tuned MedGemma 4B + LoRA generates assessment
         │
    SafetyAgent     ← validates output, appends medical disclaimer
         │
    Final Assessment
    ```
    """)

st.divider()
col1, col2 = st.columns([1, 1])

with col1:
    st.subheader("Patient Information")
    disease   = st.text_input("Disease / Chief Complaint",
                               placeholder="e.g., Diabetes, Cough, Hypertension")
    symptoms  = st.text_area("Symptoms",
                              placeholder="e.g., frequent urination, fatigue, thirst",
                              height=100)
    age_group = st.selectbox("Age Group", [
        "Child (0-12)", "Teen (13-19)", "Adult (20-40)",
        "Middle-aged (40-60)", "Senior (60+)", "All ages"
    ])
    gender = st.selectbox("Gender", ["Male", "Female", "Other", "All genders"])

    st.subheader("Medical Context")
    med_history = st.text_input("Medical History",
                                 placeholder="e.g., Asthma, Heart disease, None")
    medications = st.text_input("Current Medications",
                                 placeholder="e.g., Metformin, None")
    stress      = st.select_slider("Stress Level",
                                    options=["Low", "Moderate", "High", "Very High"],
                                    value="Moderate")
    diet        = st.text_input("Dietary Habits",
                                 placeholder="e.g., High sugar, Low fiber")

    run_btn = st.button("Get Ayurvedic Assessment",
                         type="primary", use_container_width=True)

with col2:
    st.subheader("Assessment Results")

    if run_btn:
        if not disease or not symptoms:
            st.error("Please fill in Disease and Symptoms.")
        else:
            with st.spinner("Running 4-agent pipeline (Symptom → Dosha → MedGemma → Safety)..."):
                result = get_ayurvedic_assessment(
                    disease=disease, symptoms=symptoms,
                    age_group=age_group, gender=gender,
                    medical_history=med_history or "None",
                    current_medications=medications or "None",
                    stress_levels=stress,
                    dietary_habits=diet or "Not specified"
                )
            st.success("Assessment complete!")

            # Split agent metadata from model output
            if "---" in result:
                parts = result.split("---\n\n", 1)
                if len(parts) == 2:
                    with st.expander("Agent Analysis (Dosha Scoring)", expanded=True):
                        st.code(parts[0])
                    st.markdown(parts[1])
                else:
                    st.markdown(result)
            else:
                st.markdown(result)

            st.warning(
                "DISCLAIMER: Educational Ayurvedic guidance only. "
                "Not a medical diagnosis. Consult a qualified practitioner."
            )
    else:
        st.info("Fill in patient details and click the button.")
        st.subheader("Example Cases")
        for d, s in [
            ("Diabetes",     "Frequent urination, fatigue, increased thirst"),
            ("Cough",        "Sore throat, chest congestion, dry cough"),
            ("Hypertension", "High blood pressure, headache, dizziness"),
            ("Arthritis",    "Joint pain, morning stiffness, swelling"),
        ]:
            with st.expander(d):
                st.write(f"Symptoms: {s}")

st.divider()
st.caption("Privacy: All processing is 100% local. No patient data leaves this device.")
