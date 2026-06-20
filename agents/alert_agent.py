from langchain_core.messages import HumanMessage

from prompts.alert_prompt import ALERT_PROMPT
from models.llm2 import llm


class AlertAgent:

    async def run(self, transcript: str):

        prompt = f"""
        {ALERT_PROMPT}

        Consultation Transcript:

        {transcript}
        """

        response = await llm.ainvoke(
            [HumanMessage(content=prompt)]
        )

        return response.content
