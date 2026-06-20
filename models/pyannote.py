from pipecat.processors.frame_processor import FrameProcessor
import whisperx
import os
from dotenv import load_dotenv
from whisperx.diarize import DiarizationPipeline

load_dotenv()


class PyannoteProcessor(FrameProcessor):

    def __init__(self):
        super().__init__()
        self.device = "cuda"
        self.diarize_model = DiarizationPipeline(
            token=os.getenv("HF_TOKEN"),
            device=self.device
        )

    async def process_frame(self, frame, direction):
        await super().process_frame(frame, direction)

        if not hasattr(frame, "transcript_result"):
            await self.push_frame(frame, direction)
            return

        diarize_segments = self.diarize_model(frame.audio)
        result = whisperx.assign_word_speakers(diarize_segments, frame.transcript_result)

        lines = []
        for seg in result["segments"]:
            speaker = seg.get("speaker", "Unknown")
            text = seg.get("text", "").strip()
            if text:
                lines.append(f"{speaker}: {text}")

        frame.conversation = "\n".join(lines)

        await self.push_frame(frame, direction)
