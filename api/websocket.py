import os
import uuid
import tempfile

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from pipelines.voice_pipeline import VoicePipeline

router = APIRouter()


@router.websocket("/ws/audio")
async def audio_websocket(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_json({"status": "connected", "message": "Send audio bytes. Send 'END' to process."})

    chunks = []

    try:
        while True:
            data = await websocket.receive_bytes()

            # Client sends the string "END" as bytes to signal end of audio
            if data == b"END":
                if not chunks:
                    await websocket.send_json({"status": "error", "message": "No audio received"})
                    continue

                # Write assembled audio to a temp file
                tmp_path = os.path.join(tempfile.gettempdir(), f"{uuid.uuid4()}.webm")
                try:
                    with open(tmp_path, "wb") as f:
                        for chunk in chunks:
                            f.write(chunk)

                    await websocket.send_json({"status": "processing", "message": "Running pipeline..."})

                    pipeline = VoicePipeline()
                    result = await pipeline.run(tmp_path)

                    if result:
                        await websocket.send_json({"status": "done", "result": result})
                    else:
                        await websocket.send_json({"status": "error", "message": "Pipeline returned no result"})

                finally:
                    if os.path.exists(tmp_path):
                        os.remove(tmp_path)

                chunks = []

            else:
                chunks.append(data)
                await websocket.send_json({"status": "receiving", "bytes_received": sum(len(c) for c in chunks)})

    except WebSocketDisconnect:
        pass
