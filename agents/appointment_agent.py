from typing import Any, Dict, Optional
import json

from langchain_core.messages import HumanMessage

from models.llm2 import llm


APPOINTMENT_PROMPT = """
You are an Appointment Scheduling Assistant.

Given a transcript of a conversation (which may include a patient requesting an appointment,
or a staff member confirming details), extract the appointment information and return
it as a strict JSON object. If any field is not present in the transcript, set its value
to the string "Not Mentioned" or an empty list where appropriate.

Required JSON fields:
{
  "patient_name": "",
  "reason": "",
  "preferred_dates": [],  // list of candidate date strings
  "preferred_times": [],  // list of candidate time strings
  "duration_minutes": "", // e.g. 30
  "contact_phone": "",
  "contact_email": "",
  "timezone": "",
  "follow_up_instructions": "",
  "confirmation_needed": "yes"|"no"
}

Return ONLY the JSON object and nothing else. Use ISO-like date formats when possible.
"""


def schedule_appointment(transcript: str) -> Dict[str, Any]:
	"""Extract appointment details from `transcript` using the project's LLM.

	Returns a dict parsed from the model's JSON output. If parsing fails,
	returns a fallback dict with the raw `content` under the `raw` key.
	"""

	prompt = f"""
	{APPOINTMENT_PROMPT}

	Conversation Transcript:

	{transcript}
	"""

	response = llm.invoke([HumanMessage(content=prompt)])

	content = response.content if hasattr(response, "content") else str(response)

	try:
		parsed = json.loads(content)
		return parsed
	except Exception:
		# Attempt to find a JSON substring in the content
		try:
			start = content.index("{")
			end = content.rindex("}") + 1
			substring = content[start:end]
			parsed = json.loads(substring)
			return parsed
		except Exception:
			return {"raw": content}


def format_appointment_summary(appointment: Dict[str, Any]) -> str:
	"""Return a human readable one-paragraph summary for TTS or display."""

	name = appointment.get("patient_name", "Not Mentioned")
	reason = appointment.get("reason", "Not Mentioned")
	dates = appointment.get("preferred_dates", [])
	times = appointment.get("preferred_times", [])

	date_part = ", ".join(dates) if dates else "no preferred date mentioned"
	time_part = ", ".join(times) if times else "no preferred time mentioned"

	return (
		f"Appointment for {name}. Reason: {reason}. "
		f"Preferred dates: {date_part}. Preferred times: {time_part}."
	)


__all__ = ["schedule_appointment", "format_appointment_summary"]

