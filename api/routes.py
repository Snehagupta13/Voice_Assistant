import os
import uuid
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

from pipelines.voice_pipeline import VoicePipeline

router = APIRouter()

RECORDINGS_DIR = Path(__file__).parent.parent / "recordings"
RECORDINGS_DIR.mkdir(exist_ok=True)


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.post("/process")
async def process_audio(file: UploadFile = File(...)):
    if not file.filename.endswith((".mp3", ".wav", ".m4a", ".flac", ".ogg", ".webm")):
        raise HTTPException(status_code=400, detail="Unsupported audio format")

    suffix = os.path.splitext(file.filename)[1]
    file_id = str(uuid.uuid4())
    saved_path = RECORDINGS_DIR / f"{file_id}{suffix}"

    contents = await file.read()
    with open(saved_path, "wb") as f:
        f.write(contents)

    try:
        pipeline = VoicePipeline()
        result = await pipeline.run(str(saved_path))

        if result is None:
            raise HTTPException(status_code=500, detail="Pipeline returned no result")

        return JSONResponse(content={
            "result": result,
            "conversation": pipeline.collector.conversation,
            "audio_url": f"/recordings/{file_id}{suffix}",
            "agent_type": pipeline.collector.agent_type,
            "alert_data": pipeline.collector.alert_data,
            "summary_data": pipeline.collector.summary_data,
            "ayurveda_data": pipeline.collector.ayurveda_data,
        })

    except HTTPException:
        saved_path.unlink(missing_ok=True)
        raise
