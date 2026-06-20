from kokoro import KPipeline
import soundfile as sf

class KokoroService:

    def __init__(self):

        self.pipeline = KPipeline(
            lang_code="a"
        )

    def speak(
        self,
        text,
        output_file="response.wav"
    ):

        generator = self.pipeline(text)

        for _, _, audio in generator:

            sf.write(
                output_file,
                audio,
                24000
            )

            break

        return output_file