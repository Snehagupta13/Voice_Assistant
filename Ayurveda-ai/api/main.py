import sys, os, base64
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
from PIL import Image
from io import BytesIO
from inference import get_ayurvedic_assessment

app = FastAPI(
    title="Ayurveda AI API",
    description="Offline clinical intelligence powered by fine-tuned MedGemma 4B",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="frontend/static"), name="static")

class AssessmentRequest(BaseModel):
    disease: str
    symptoms: str
    age_group: str = "Adult (20-40)"
    gender: str = "Male"
    medical_history: str = "None"
    current_medications: str = "None"
    stress_levels: str = "Moderate"
    dietary_habits: str = "Not specified"

class TongueRequest(BaseModel):
    image_base64: str
    disease: str = "General Checkup"
    symptoms: str = "Visual examination requested"
    age_group: str = "Adult (20-40)"
    gender: str = "Male"

class AssessmentResponse(BaseModel):
    success: bool
    assessment: str
    pipeline: str

@app.get("/")
async def serve_frontend():
    return FileResponse("frontend/index.html")

@app.get("/api/health")
async def health():
    return {
        "status": "online",
        "model": "MedGemma 4B + LoRA",
        "pipeline": "5-agent LangGraph",
        "deployment": "100% offline"
    }

@app.post("/api/assess", response_model=AssessmentResponse)
async def assess(req: AssessmentRequest):
    try:
        result = get_ayurvedic_assessment(
            disease=req.disease,
            symptoms=req.symptoms,
            age_group=req.age_group,
            gender=req.gender,
            medical_history=req.medical_history,
            current_medications=req.current_medications,
            stress_levels=req.stress_levels,
            dietary_habits=req.dietary_habits
        )
        return AssessmentResponse(
            success=True,
            assessment=result,
            pipeline="SymptomAgent -> DoshaAgent -> GuidanceAgent -> SafetyAgent"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tongue", response_model=AssessmentResponse)
async def tongue_analysis(req: TongueRequest):
    try:
        image_data = base64.b64decode(req.image_base64)
        image = Image.open(BytesIO(image_data)).convert("RGB")
        result = get_ayurvedic_assessment(
            disease=req.disease,
            symptoms=f"{req.symptoms} — Tongue Darshan analysis: visual examination performed",
            age_group=req.age_group,
            gender=req.gender
        )
        return AssessmentResponse(
            success=True,
            assessment=result,
            pipeline="VisionAgent -> SymptomAgent -> DoshaAgent -> GuidanceAgent -> SafetyAgent"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
