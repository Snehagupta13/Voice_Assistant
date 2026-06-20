from pipecat.processors.frame_processor import FrameProcessor
import whisperx

from frames import AudioFileFrame


class WhisperProcessor(FrameProcessor):

    def __init__(self):
        super().__init__()
        self.device = "cuda"
        self.model = whisperx.load_model("large-v3", device=self.device)

    async def process_frame(self, frame, direction):
        await super().process_frame(frame, direction)

        if not isinstance(frame, AudioFileFrame):
            await self.push_frame(frame, direction)
            return

        audio = whisperx.load_audio(frame.audio_path)
        result = self.model.transcribe(audio, batch_size=16)

        frame.audio = audio
        frame.transcript_result = result
        frame.language = result["language"]

        await self.push_frame(frame, direction)
