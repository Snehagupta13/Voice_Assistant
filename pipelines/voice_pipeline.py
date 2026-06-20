from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.task import PipelineTask
from pipecat.pipeline.runner import PipelineRunner
from pipecat.processors.frame_processor import FrameProcessor
from pipecat.frames.frames import EndFrame

from models.whisper_stt import WhisperProcessor
from models.pyannote import PyannoteProcessor
from pipelines.agent_pipeline import AgentProcessor
from models.llm import GroqProcessor
from frames import AudioFileFrame


class ResultCollector(FrameProcessor):

    def __init__(self):
        super().__init__()
        self.result = None
        self.conversation = None
        self.agent_type = "medical_scribe"
        self.alert_data = None
        self.summary_data = None
        self.ayurveda_data = None

    async def process_frame(self, frame, direction):
        await super().process_frame(frame, direction)
        if hasattr(frame, "final_response"):
            self.result = frame.final_response
        if hasattr(frame, "conversation"):
            self.conversation = frame.conversation
        if hasattr(frame, "agent_type"):
            self.agent_type = frame.agent_type
        if hasattr(frame, "alert_data"):
            self.alert_data = frame.alert_data
        if hasattr(frame, "summary_data"):
            self.summary_data = frame.summary_data
        if hasattr(frame, "ayurveda_data"):
            self.ayurveda_data = frame.ayurveda_data
        await self.push_frame(frame, direction)


class VoicePipeline:

    def __init__(self):
        self.whisper = WhisperProcessor()
        self.pyannote = PyannoteProcessor()
        self.agent = AgentProcessor()
        self.llm = GroqProcessor()
        self.collector = ResultCollector()

        self.pipeline = Pipeline([
            self.whisper,
            self.pyannote,
            self.agent,
            self.llm,
            self.collector,
        ])

        self.task = PipelineTask(self.pipeline)

    async def run(self, audio_path: str):
        print(f"Processing: {audio_path}")

        runner = PipelineRunner()

        await self.task.queue_frame(AudioFileFrame(audio_path=audio_path))
        await self.task.queue_frame(EndFrame())

        await runner.run(self.task)

        return self.collector.result
