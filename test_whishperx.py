import whisperx

device = "cuda"

model = whisperx.load_model(
    "large-v3",
    device=device
)

print("WhisperX Model Loaded Successfully")