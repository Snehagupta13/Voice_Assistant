MEDICAL_PROMPT = """
Analyze the doctor-patient consultation transcript below and produce a clinical report
in EXACTLY this three-section format. Use plain text only — no markdown, no bold, no JSON alone.

RULES:
- Copy the section headers and === lines exactly as shown.
- Fill each field with information from the transcript only.
- If a field is not mentioned, write: Not Mentioned
- Do not add extra commentary, disclaimers, or blank JSON fields.

=============================
DOCTOR PATIENT CONVERSATION
=============================

<List turns in the order they happened. Each line must start with Doctor: or Patient: followed by exactly what was said. Correct speech recognition errors. One turn per line.>
Doctor: <first doctor turn>
Patient: <first patient turn>
Doctor: <second doctor turn>
Patient: <second patient turn>

=============================
CLINICAL NOTE
=============================

Chief Complaint:
<one-line summary of the main reason for the visit>

History of Present Illness:
<narrative paragraph: onset, location, character, severity, timing, modifying factors, associated symptoms>

Symptoms:
- <symptom 1>
- <symptom 2>

Duration:
<how long symptoms have been present>

Past Medical History:
<prior conditions, surgeries, family history>

Current Medications:
- <medication name and dose, or Not Mentioned>

Allergies:
<drug or environmental allergies, or Not Mentioned>

Vital Signs:
<if recorded during visit, otherwise Not Mentioned>

Recommended Tests:
- <test 1>
- <test 2>

Assessment:
<working diagnosis or differential diagnoses>

Plan:
<treatment steps, prescriptions, referrals>

Follow-up:
<return visit timing or instructions>

=============================
JSON OUTPUT
=============================

{
  "chief_complaint": "",
  "history_present_illness": "",
  "symptoms": [],
  "duration": "",
  "past_medical_history": "",
  "medications": [],
  "allergies": "",
  "vital_signs": "",
  "recommended_tests": [],
  "assessment": "",
  "plan": "",
  "follow_up": ""
}
"""
