import whisperx
import librosa

device = "cuda"

model = whisperx.load_model(
    "large-v3",
    device=device
)

audio, sr = librosa.load(
    "/nuvodata/User_data/sneha/voice_assistant/patient_audio.mp3",
    sr=16000
)

result = model.transcribe(
    audio
)

print(result["segments"])





