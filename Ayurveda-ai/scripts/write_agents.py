files = {}

# ── 1. agents/symptom_agent.py ──────────────────────────────────────────────
files["agents/symptom_agent.py"] = '''import re

class SymptomAgent:
    """Parses and structures raw patient input."""

    DOSHA_KEYWORDS = {
        "vata":  ["dry", "cold", "anxiety", "pain", "constipation", "insomnia",
                  "joint pain", "irregular", "fatigue", "thin"],
        "pitta": ["inflammation", "fever", "acidity", "anger", "rash", "burning",
                  "infection", "hypertension", "ulcer", "hot"],
        "kapha": ["obesity", "mucus", "congestion", "lethargy", "swelling",
                  "diabetes", "cough", "cold", "weight gain", "slow"],
    }

    def run(self, patient_data: dict) -> dict:
        symptoms_text = (patient_data.get("symptoms", "") + " " +
                         patient_data.get("disease", "")).lower()

        dosha_scores = {d: 0 for d in self.DOSHA_KEYWORDS}
        for dosha, keywords in self.DOSHA_KEYWORDS.items():
            for kw in keywords:
                if kw in symptoms_text:
                    dosha_scores[dosha] += 1

        primary_dosha = max(dosha_scores, key=dosha_scores.get)
        secondary = [d for d, s in sorted(dosha_scores.items(),
                     key=lambda x: -x[1]) if d != primary_dosha and s > 0]

        return {
            **patient_data,
            "dosha_scores":   dosha_scores,
            "primary_dosha":  primary_dosha.capitalize(),
            "secondary_dosha": secondary[0].capitalize() if secondary else "None",
            "symptom_analysis": f"Primary imbalance: {primary_dosha.capitalize()}"
                                 f" (score: {dosha_scores[primary_dosha]})"
        }
'''

# ── 2. agents/dosha_agent.py ─────────────────────────────────────────────────
files["agents/dosha_agent.py"] = '''class DoshaAgent:
    """Maps dosha imbalance to Ayurvedic treatment principles."""

    DOSHA_TREATMENTS = {
        "Vata": {
            "principle":  "Warm, oily, grounding therapies",
            "avoid":      "Cold, dry, raw foods; excessive travel",
            "recommend":  "Warm sesame oil massage, warm foods, regular routine",
            "herbs":      "Ashwagandha, Shatavari, Triphala",
            "yoga":       "Gentle yoga, Pranayama, Yoga Nidra",
        },
        "Pitta": {
            "principle":  "Cooling, calming, anti-inflammatory therapies",
            "avoid":      "Spicy, oily, fermented foods; excessive heat",
            "recommend":  "Coconut oil, cooling herbs, meditation",
            "herbs":      "Brahmi, Guduchi, Neem, Amalaki",
            "yoga":       "Cooling Pranayama, Moon salutation, Sitali breath",
        },
        "Kapha": {
            "principle":  "Light, warm, stimulating therapies",
            "avoid":      "Heavy, cold, sweet foods; daytime sleep",
            "recommend":  "Dry brushing, vigorous exercise, light diet",
            "herbs":      "Trikatu, Guggul, Punarnava, Ginger",
            "yoga":       "Sun salutation, Kapalbhati, vigorous Vinyasa",
        },
    }

    def run(self, state: dict) -> dict:
        primary = state.get("primary_dosha", "Vata")
        treatment = self.DOSHA_TREATMENTS.get(primary,
                    self.DOSHA_TREATMENTS["Vata"])
        return {
            **state,
            "dosha_treatment": treatment,
            "constitution":    f"{primary}-dominant",
        }
'''

# ── 3. agents/guidance_agent.py ──────────────────────────────────────────────
files["agents/guidance_agent.py"] = '''import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel

BASE_MODEL = "google/medgemma-4b-it"
LORA_PATH  = "models/medgemma-ayurveda-lora/final"

_model     = None
_tokenizer = None

def _load_model():
    global _model, _tokenizer
    if _model is None:
        print("[GuidanceAgent] Loading fine-tuned MedGemma...")
        _tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, token=True)
        _tokenizer.pad_token = _tokenizer.eos_token
        base = AutoModelForCausalLM.from_pretrained(
            BASE_MODEL, token=True, dtype=torch.bfloat16, device_map="auto"
        )
        _model = PeftModel.from_pretrained(base, LORA_PATH)
        _model.eval()
        print("[GuidanceAgent] Model ready!")
    return _model, _tokenizer


class GuidanceAgent:
    """Calls the fine-tuned MedGemma model to generate clinical guidance."""

    def run(self, state: dict) -> dict:
        model, tokenizer = _load_model()
        treatment = state.get("dosha_treatment", {})

        instruction = f"""You are an Ayurvedic clinical assistant. A patient presents with the following:

Disease: {state.get("disease", "Unknown")}
Symptoms: {state.get("symptoms", "Not specified")}
Age Group: {state.get("age_group", "Adult")}
Gender: {state.get("gender", "Not specified")}
Medical History: {state.get("medical_history", "None")}
Current Medications: {state.get("current_medications", "None")}
Stress Levels: {state.get("stress_levels", "Moderate")}
Dietary Habits: {state.get("dietary_habits", "Not specified")}
Primary Dosha Imbalance: {state.get("primary_dosha", "Vata")}
Treatment Principle: {treatment.get("principle", "")}

Provide a structured Ayurvedic assessment and treatment plan."""

        prompt = (f"<start_of_turn>user\\n{instruction}<end_of_turn>\\n"
                  f"<start_of_turn>model\\n")

        inputs = tokenizer(prompt, return_tensors="pt",
                           return_token_type_ids=False).to(model.device)

        with torch.inference_mode():
            outputs = model.generate(
                **inputs, max_new_tokens=512,
                do_sample=False, pad_token_id=tokenizer.eos_token_id
            )

        raw = tokenizer.decode(
            outputs[0][inputs["input_ids"].shape[-1]:],
            skip_special_tokens=True
        )

        return {**state, "model_output": raw}
'''

# ── 4. agents/safety_agent.py ────────────────────────────────────────────────
files["agents/safety_agent.py"] = '''class SafetyAgent:
    """Validates output and appends safety disclaimer."""

    DISCLAIMER = (
        "\\n\\n---\\n"
        "SAFETY NOTICE: This is educational Ayurvedic guidance only. "
        "It is NOT a medical diagnosis or prescription. "
        "Always consult a qualified Ayurvedic practitioner (BAMS) and "
        "licensed physician before starting any treatment. "
        "In emergencies, contact medical services immediately."
    )

    DANGEROUS_KEYWORDS = [
        "cure", "guaranteed", "100% effective",
        "stop your medication", "replace your doctor"
    ]

    def run(self, state: dict) -> dict:
        output = state.get("model_output", "")

        # Safety check — remove overconfident claims
        for kw in self.DANGEROUS_KEYWORDS:
            if kw.lower() in output.lower():
                output = output.replace(kw, f"[may help with]")

        # Always append disclaimer
        final_output = output + self.DISCLAIMER

        return {**state, "final_output": final_output}
'''

# ── 5. agents/__init__.py ────────────────────────────────────────────────────
files["agents/__init__.py"] = '''from .symptom_agent  import SymptomAgent
from .dosha_agent    import DoshaAgent
from .guidance_agent import GuidanceAgent
from .safety_agent   import SafetyAgent

__all__ = ["SymptomAgent", "DoshaAgent", "GuidanceAgent", "SafetyAgent"]
'''

# ── 6. graph/pipeline.py ─────────────────────────────────────────────────────
files["graph/pipeline.py"] = '''"""
LangGraph multi-agent pipeline for Ayurveda AI.

Flow:
  Patient Input
      │
  SymptomAgent      ← classifies symptoms, scores doshas
      │
  DoshaAgent        ← maps imbalance to treatment principles
      │
  GuidanceAgent     ← calls fine-tuned MedGemma 4B + LoRA
      │
  SafetyAgent       ← validates output, appends disclaimer
      │
  Final Assessment
"""

try:
    from langgraph.graph import StateGraph, END
    LANGGRAPH_AVAILABLE = True
except ImportError:
    LANGGRAPH_AVAILABLE = False

from agents import SymptomAgent, DoshaAgent, GuidanceAgent, SafetyAgent


def build_pipeline():
    symptom_agent  = SymptomAgent()
    dosha_agent    = DoshaAgent()
    guidance_agent = GuidanceAgent()
    safety_agent   = SafetyAgent()

    if LANGGRAPH_AVAILABLE:
        # Full LangGraph DAG
        graph = StateGraph(dict)
        graph.add_node("symptom",  symptom_agent.run)
        graph.add_node("dosha",    dosha_agent.run)
        graph.add_node("guidance", guidance_agent.run)
        graph.add_node("safety",   safety_agent.run)

        graph.set_entry_point("symptom")
        graph.add_edge("symptom",  "dosha")
        graph.add_edge("dosha",    "guidance")
        graph.add_edge("guidance", "safety")
        graph.add_edge("safety",   END)

        return graph.compile()
    else:
        # Fallback sequential pipeline (no LangGraph dependency)
        class SequentialPipeline:
            def __init__(self, agents):
                self.agents = agents

            def invoke(self, state: dict) -> dict:
                for agent in self.agents:
                    state = agent.run(state)
                return state

        return SequentialPipeline([
            symptom_agent, dosha_agent, guidance_agent, safety_agent
        ])


# Singleton pipeline instance
_pipeline = None

def get_pipeline():
    global _pipeline
    if _pipeline is None:
        _pipeline = build_pipeline()
    return _pipeline


def run_ayurveda_pipeline(disease, symptoms, age_group="Adult (20-40)",
                           gender="Male", medical_history="None",
                           current_medications="None",
                           stress_levels="Moderate",
                           dietary_habits="Not specified") -> str:
    """Main entry point — runs full 4-agent pipeline."""
    patient_data = {
        "disease":             disease,
        "symptoms":            symptoms,
        "age_group":           age_group,
        "gender":              gender,
        "medical_history":     medical_history,
        "current_medications": current_medications,
        "stress_levels":       stress_levels,
        "dietary_habits":      dietary_habits,
    }

    pipeline = get_pipeline()
    result   = pipeline.invoke(patient_data)

    # Build enriched output with agent metadata prepended
    dosha_info = (
        f"AGENT ANALYSIS:\\n"
        f"  Dosha Scores    : {result.get(\'dosha_scores\', {})}\\n"
        f"  Primary Imbalance: {result.get(\'primary_dosha\', \'N/A\')}\\n"
        f"  Secondary        : {result.get(\'secondary_dosha\', \'N/A\')}\\n"
        f"  Treatment Principle: {result.get(\'dosha_treatment\', {}).get(\'principle\', \'N/A\')}\\n"
        f"  Suggested Herbs  : {result.get(\'dosha_treatment\', {}).get(\'herbs\', \'N/A\')}\\n"
        f"---\\n\\n"
    )

    return dosha_info + result.get("final_output", "No output generated.")
'''

# ── 7. inference.py (updated to use pipeline) ────────────────────────────────
files["inference.py"] = '''import torch
from graph.pipeline import run_ayurveda_pipeline

def get_ayurvedic_assessment(disease, symptoms, age_group="Adult (20-40)",
                              gender="Male", medical_history="None",
                              current_medications="None",
                              stress_levels="Moderate",
                              dietary_habits="Not specified") -> str:
    """
    Public API — routes through full 4-agent LangGraph pipeline:
      SymptomAgent → DoshaAgent → GuidanceAgent (MedGemma) → SafetyAgent
    """
    return run_ayurveda_pipeline(
        disease=disease, symptoms=symptoms,
        age_group=age_group, gender=gender,
        medical_history=medical_history,
        current_medications=current_medications,
        stress_levels=stress_levels,
        dietary_habits=dietary_habits
    )


if __name__ == "__main__":
    print("=" * 60)
    print("TEST 1: Diabetes — Full Agent Pipeline")
    print("=" * 60)
    r1 = get_ayurvedic_assessment(
        disease="Diabetes",
        symptoms="Frequent urination, fatigue, increased thirst",
        age_group="Middle-aged (40-60)", gender="Male",
        medical_history="Family history of diabetes",
        current_medications="Metformin",
        stress_levels="High",
        dietary_habits="High sugar, Low fiber"
    )
    print(r1)

    print("\\n" + "=" * 60)
    print("TEST 2: Hypertension — Full Agent Pipeline")
    print("=" * 60)
    r2 = get_ayurvedic_assessment(
        disease="Hypertension",
        symptoms="High blood pressure, headaches, dizziness",
        age_group="Senior (60+)", gender="Female",
        medical_history="Heart disease",
        current_medications="Beta-blockers",
        stress_levels="Very High",
        dietary_habits="High salt, Low fiber"
    )
    print(r2)
'''

# ── 8. app/main.py (updated to use pipeline) ─────────────────────────────────
files["app/main.py"] = '''import streamlit as st
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
                parts = result.split("---\\n\\n", 1)
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
'''

# ── Write all files ───────────────────────────────────────────────────────────
import os

for filepath, content in files.items():
    os.makedirs(os.path.dirname(filepath) if os.path.dirname(filepath) else ".", exist_ok=True)
    with open(filepath, "w") as f:
        f.write(content)
    print(f"Written: {filepath}")

print("\nAll files written!")