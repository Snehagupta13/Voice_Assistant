from langchain_core.messages import HumanMessage
from pipecat.processors.frame_processor import FrameProcessor

from agents.medical_scribe import MedicalScribeAgent
from agents.summary_agent import SummaryAgent
from agents.alert_agent import AlertAgent
from agents.ayurveda_agent import AyurvedaAgent
from models.llm2 import llm

ROUTER_PROMPT = """You are a medical conversation classifier.

Read the transcript below and decide which processing path is needed.

Reply with ONLY one of these three words — nothing else:
- alert        → patient has symptoms that may need urgent or emergency attention
- summary      → someone is explicitly asking for a summary or overview of the consultation
- medical_scribe → a regular medical consultation that needs to be documented

Transcript:
{transcript}"""


async def _classify(transcript: str) -> str:
    response = await llm.ainvoke([
        HumanMessage(content=ROUTER_PROMPT.format(transcript=transcript))
    ])
    route = response.content.strip().lower()
    if route in ("alert", "summary", "medical_scribe"):
        return route
    return "medical_scribe"


class AgentProcessor(FrameProcessor):

    def __init__(self):
        super().__init__()
        self.medical_agent = MedicalScribeAgent()
        self.summary_agent = SummaryAgent()
        self.alert_agent = AlertAgent()
        self.ayurveda_agent = AyurvedaAgent()

    async def process_frame(self, frame, direction):
        await super().process_frame(frame, direction)

        if not hasattr(frame, "conversation"):
            await self.push_frame(frame, direction)
            return

        route = await _classify(frame.conversation)

        # Run all agents on every consultation
        frame.agent_response = await self.medical_agent.run(frame.conversation)
        frame.agent_type = route
        frame.alert_data = await self.alert_agent.run(frame.conversation)
        frame.summary_data = await self.summary_agent.run(frame.conversation)
        frame.ayurveda_data = await self.ayurveda_agent.run(frame.agent_response)

        await self.push_frame(frame, direction)