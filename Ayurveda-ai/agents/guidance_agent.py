import os as _os
BASE_MODEL = "google/medgemma-4b-it"
LORA_PATH  = _os.path.join(_os.path.dirname(__file__), "..", "models", "medgemma-ayurveda-lora", "final")

_model     = None
_tokenizer = None

def _load_model():
    global _model, _tokenizer
    if _model is None:
        import torch
        from transformers import AutoTokenizer, AutoModelForCausalLM
        from peft import PeftModel
        print("[GuidanceAgent] Loading fine-tuned MedGemma...")
        _tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, token=True)
        _tokenizer.pad_token = _tokenizer.eos_token
        base = AutoModelForCausalLM.from_pretrained(
            BASE_MODEL, token=True, dtype=torch.float16, device_map="auto"
        )
        _model = PeftModel.from_pretrained(base, LORA_PATH)
        _model.eval()
        print("[GuidanceAgent] Model ready!")
    return _model, _tokenizer


class GuidanceAgent:
    """Calls the fine-tuned MedGemma model to generate clinical guidance."""

    def run(self, state: dict) -> dict:
        model, tokenizer = _load_model()
        treatment = state.get("dosha_treatment", {})

        instruction = f"""You are an Ayurvedic clinical assistant. A patient presents with the following:

Disease: {state.get("disease", "Unknown")}
Symptoms: {state.get("symptoms", "Not specified")}
Age Group: {state.get("age_group", "Adult")}
Gender: {state.get("gender", "Not specified")}
Medical History: {state.get("medical_history", "None")}
Current Medications: {state.get("current_medications", "None")}
Stress Levels: {state.get("stress_levels", "Moderate")}
Dietary Habits: {state.get("dietary_habits", "Not specified")}
Primary Dosha Imbalance: {state.get("primary_dosha", "Vata")}
Treatment Principle: {treatment.get("principle", "")}

Provide a structured Ayurvedic assessment and treatment plan."""

        prompt = (f"<start_of_turn>user\n{instruction}<end_of_turn>\n"
                  f"<start_of_turn>model\n")

        inputs = tokenizer(prompt, return_tensors="pt",
                           return_token_type_ids=False).to(model.device)

        import torch
        with torch.inference_mode():
            outputs = model.generate(
                **inputs, max_new_tokens=512,
                do_sample=False, pad_token_id=tokenizer.eos_token_id
            )

        raw = tokenizer.decode(
            outputs[0][inputs["input_ids"].shape[-1]:],
            skip_special_tokens=True
        )

        return {**state, "model_output": raw}
