import json
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import LoraConfig, get_peft_model, TaskType
from datasets import Dataset
from torch.utils.data import DataLoader
from torch.optim import AdamW
import os

MODEL_ID   = "google/medgemma-4b-it"
DATA_PATH  = "dataset/ayurveda_finetune.json"
OUTPUT_DIR = "models/medgemma-ayurveda-lora"

print("=" * 50)
print("MedGemma Ayurveda Fine-Tuning (Custom Loop)")
print("=" * 50)

# STEP 1: Load Data
print("\n[1/5] Loading training data...")
with open(DATA_PATH) as f:
    raw_data = json.load(f)

texts = [
    f"<start_of_turn>user\n{d['instruction']}<end_of_turn>\n<start_of_turn>model\n{d['response']}<end_of_turn>"
    for d in raw_data
]
print(f"Total examples: {len(texts)}")

# STEP 2: Tokenizer
print("\n[2/5] Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, token=True)
tokenizer.pad_token    = tokenizer.eos_token
tokenizer.padding_side = "right"
print("Tokenizer loaded!")

# STEP 3: Tokenize with token_type_ids
print("\n[3/5] Tokenizing dataset...")
def tokenize_batch(texts, max_length=512):
    encodings = tokenizer(
        texts,
        truncation=True,
        max_length=max_length,
        padding="max_length",
        return_tensors="pt"
    )
    # Add token_type_ids as zeros (required by Gemma3)
    encodings["token_type_ids"] = torch.zeros_like(encodings["input_ids"])
    encodings["labels"] = encodings["input_ids"].clone()
    # Mask padding tokens in labels
    encodings["labels"][encodings["attention_mask"] == 0] = -100
    return encodings

# Split 90/10
split_idx   = int(len(texts) * 0.9)
train_texts = texts[:split_idx]
eval_texts  = texts[split_idx:]
print(f"Train: {len(train_texts)} | Eval: {len(eval_texts)}")

train_enc = tokenize_batch(train_texts)
eval_enc  = tokenize_batch(eval_texts)

class AyurvedaDataset(torch.utils.data.Dataset):
    def __init__(self, encodings):
        self.encodings = encodings
    def __len__(self):
        return self.encodings["input_ids"].shape[0]
    def __getitem__(self, idx):
        return {k: v[idx] for k, v in self.encodings.items()}

train_dataset = AyurvedaDataset(train_enc)
eval_dataset  = AyurvedaDataset(eval_enc)

# STEP 4: Load Model + LoRA
print("\n[4/5] Loading MedGemma 4B + LoRA...")
model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    token=True,
    dtype=torch.bfloat16,
    device_map="auto"
)

lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    target_modules=["q_proj", "v_proj", "k_proj", "o_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type=TaskType.CAUSAL_LM
)
model = get_peft_model(model, lora_config)
model.print_trainable_parameters()

# STEP 5: Training Loop
print("\n[5/5] Starting fine-tuning...")
os.makedirs(OUTPUT_DIR, exist_ok=True)

EPOCHS     = 3
BATCH_SIZE = 4
LR         = 2e-4
device     = next(model.parameters()).device

train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
optimizer    = AdamW(model.parameters(), lr=LR)

model.train()
for epoch in range(EPOCHS):
    total_loss = 0
    for step, batch in enumerate(train_loader):
        batch = {k: v.to(device) for k, v in batch.items()}
        outputs = model(**batch)
        loss    = outputs.loss
        loss.backward()
        optimizer.step()
        optimizer.zero_grad()
        total_loss += loss.item()
        if step % 10 == 0:
            print(f"Epoch {epoch+1} | Step {step}/{len(train_loader)} | Loss: {loss.item():.4f}")

    avg_loss = total_loss / len(train_loader)
    print(f"Epoch {epoch+1} complete | Avg Loss: {avg_loss:.4f}")

    # Eval
    model.eval()
    eval_loss = 0
    with torch.no_grad():
        eval_loader = DataLoader(eval_dataset, batch_size=BATCH_SIZE)
        for batch in eval_loader:
            batch    = {k: v.to(device) for k, v in batch.items()}
            outputs  = model(**batch)
            eval_loss += outputs.loss.item()
    print(f"Epoch {epoch+1} | Eval Loss: {eval_loss/len(eval_loader):.4f}")
    model.train()

# Save
model.save_pretrained(f"{OUTPUT_DIR}/final")
tokenizer.save_pretrained(f"{OUTPUT_DIR}/final")

print("\n" + "=" * 50)
print("FINE-TUNING COMPLETE!")
print(f"Saved to: {OUTPUT_DIR}/final")
print("=" * 50)
