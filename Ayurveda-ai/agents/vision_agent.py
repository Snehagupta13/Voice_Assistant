"""
VisionAgent: Ayurvedic tongue analysis using MedGemma 4B vision.
In Ayurveda, Darshan (visual examination) of the tongue reveals dosha imbalances:
  White/thick coating → Kapha | Yellow/red → Pitta | Dry/cracked → Vata
"""
import torch
from PIL import Image
from transformers import AutoProcessor, AutoModelForImageTextToText

VISION_MODEL = "google/medgemma-4b-it"
_model = None
_processor = None

def _load():
    global _model, _processor
    if _model is None:
        print("[VisionAgent] Loading MedGemma vision capability...")
        _processor = AutoProcessor.from_pretrained(VISION_MODEL, token=True)
        _model = AutoModelForImageTextToText.from_pretrained(
            VISION_MODEL, token=True,
            dtype=torch.bfloat16, device_map="auto"
        )
        _model.eval()
        print("[VisionAgent] Ready!")
    return _model, _processor

def analyze_tongue(image: Image.Image) -> dict:
    model, processor = _load()
    prompt = """You are an Ayurvedic physician performing Darshan (visual examination).
Analyze this tongue image and provide a structured report:

COATING: Describe color, thickness, distribution
TEXTURE: Dry/moist/cracked/smooth
COLOR: Tongue body color (pale/red/purple/pink)
DOSHA INDICATORS:
  - Vata: dry, cracked, dark coating, trembling
  - Pitta: red tip, yellow coating, pointed, inflamed
  - Kapha: white thick coating, swollen, wet, scalloped edges
PRIMARY DOSHA IMBALANCE: State which dosha is most imbalanced
AYURVEDIC RECOMMENDATIONS: 2-3 specific dietary/lifestyle suggestions

Keep the analysis concise and clinically structured."""

    messages = [{
        "role": "user",
        "content": [
            {"type": "image", "image": image},
            {"type": "text",  "text": prompt}
        ]
    }]

    inputs = processor.apply_chat_template(
        messages, add_generation_prompt=True,
        tokenize=True, return_dict=True, return_tensors="pt"
    ).to(model.device, dtype=torch.bfloat16)

    input_len = inputs["input_ids"].shape[-1]

    with torch.inference_mode():
        out = model.generate(**inputs, max_new_tokens=400, do_sample=False)

    response = processor.decode(out[0][input_len:], skip_special_tokens=True)

    # Detect primary dosha from response
    rl = response.lower()
    kapha_count = rl.count("kapha")
    pitta_count = rl.count("pitta")
    vata_count  = rl.count("vata")
    scores = {"Kapha": kapha_count, "Pitta": pitta_count, "Vata": vata_count}
    primary = max(scores, key=scores.get)

    return {
        "tongue_analysis":        response,
        "visual_dosha_indicator": primary,
        "dosha_scores_vision":    scores,
    }

class VisionAgent:
    def run(self, state: dict) -> dict:
        image = state.get("tongue_image", None)
        if image is None:
            return {**state, "tongue_analysis": None, "visual_dosha_indicator": None}
        result = analyze_tongue(image)
        return {
            **state,
            "tongue_analysis":        result["tongue_analysis"],
            "visual_dosha_indicator": result["visual_dosha_indicator"],
            "dosha_scores_vision":    result["dosha_scores_vision"],
        }
