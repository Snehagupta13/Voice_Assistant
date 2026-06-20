from dataclasses import dataclass, field
from pipecat.frames.frames import DataFrame


@dataclass
class AudioFileFrame(DataFrame):
    audio_path: str = field(default="")
