import re

from langchain_core.messages import HumanMessage, SystemMessage

from prompts.medical_prompt import MEDICAL_PROMPT
from models.llm2 import llm

SYSTEM_PROMPT = """/no_think

You are a medical scribe. Output ONLY the final clinical report — nothing else.

STRICT RULES:
- Do NOT output <think> blocks or any reasoning.
- Do NOT use markdown (no **, no #, no backticks).
- Do NOT output JSON alone — follow the exact three-section format given in the prompt.
- Use plain text with the section labels and === separators exactly as shown.
- If a field is not mentioned in the transcript, write: Not Mentioned"""


def _clean(text: str) -> str:
    # Strip <think>...</think> — also handles unclosed tags (strip to end of string)
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)
    text = re.sub(r"<think>.*$", "", text, flags=re.DOTALL)
    # Strip leftover ``` fences
    text = re.sub(r"```[a-z]*\n?", "", text)
    text = re.sub(r"```", "", text)
    return text.strip()


class MedicalScribeAgent:

    async def run(self, transcript: str) -> str:
        prompt = f"""{MEDICAL_PROMPT}

Conversation Transcript:

{transcript}"""

        response = await llm.ainvoke(
            [SystemMessage(content=SYSTEM_PROMPT), HumanMessage(content=prompt)]
        )

        return _clean(response.content)
