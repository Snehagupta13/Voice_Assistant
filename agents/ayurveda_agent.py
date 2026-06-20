import asyncio
import json
import os
import re
import sys

# Add Ayurveda-ai to path so we can import directly without a running server
_AYURVEDA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Ayurveda-ai"))
if _AYURVEDA_PATH not in sys.path:
    sys.path.insert(0, _AYURVEDA_PATH)

from inference import get_ayurvedic_assessment  # type: ignore[import]


def _extract_json(note: str) -> dict:
    # Greedy .*  so we capture the full JSON object, not just up to the first }
    match = re.search(r"JSON OUTPUT[^{]*(\{.*\})", note, re.DOTALL)
    if not match:
        return {}
    try:
        return json.loads(match.group(1))
    except json.JSONDecodeError:
        return {}


def _extract_from_text(note: str) -> dict:
    """Fallback: pull key fields directly from the plain-text CLINICAL NOTE section."""
    data = {}

    cc = re.search(r"Chief Complaint:\s*(.+)", note)
    if cc:
        data["chief_complaint"] = cc.group(1).strip()

    symptoms_block = re.search(r"Symptoms:\s*((?:- .+\n?)+)", note)
    if symptoms_block:
        data["symptoms"] = [
            s.lstrip("- ").strip()
            for s in symptoms_block.group(1).splitlines()
            if s.strip()
        ]

    pmh = re.search(r"Past Medical History:\s*(.+)", note)
    if pmh:
        data["past_medical_history"] = pmh.group(1).strip()

    meds_block = re.search(r"Current Medications:\s*((?:- .+\n?)+)", note)
    if meds_block:
        data["medications"] = [
            m.lstrip("- ").strip()
            for m in meds_block.group(1).splitlines()
            if m.strip()
        ]

    return data


def _clean(value, fallback="None"):
    if not value or value == "Not Mentioned":
        return fallback
    return value


class AyurvedaAgent:

    async def run(self, medical_note: str) -> str:
        data = _extract_json(medical_note) or _extract_from_text(medical_note)

        disease = _clean(data.get("chief_complaint"), "General Consultation")

        symptoms_raw = data.get("symptoms", [])
        if isinstance(symptoms_raw, list):
            symptoms = ", ".join(s for s in symptoms_raw if s and s != "Not Mentioned")
        else:
            symptoms = str(symptoms_raw)
        if not symptoms:
            symptoms = _clean(data.get("history_present_illness"), "Not specified")

        medical_history = _clean(data.get("past_medical_history"))

        meds_raw = data.get("medications", [])
        if isinstance(meds_raw, list):
            current_medications = ", ".join(m for m in meds_raw if m and m != "Not Mentioned") or "None"
        else:
            current_medications = _clean(str(meds_raw))

        # Run sync Ayurveda pipeline in a thread so we don't block the async event loop
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: get_ayurvedic_assessment(
                disease=disease,
                symptoms=symptoms,
                medical_history=medical_history,
                current_medications=current_medications,
            ),
        )
        return result
