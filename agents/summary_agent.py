from langchain_core.messages import HumanMessage

from prompts.summary_prompt import SUMMARY_PROMPT
from models.llm2 import llm


class SummaryAgent:

    async def run(self, transcript: str):

        prompt = f"""
        {SUMMARY_PROMPT}

        Consultation Transcript:

        {transcript}
        """

        response = await llm.ainvoke(
            [HumanMessage(content=prompt)]
        )

        return response.content
