import os
import imageio_ffmpeg

# Make the bundled ffmpeg binary available to whisperx
_ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
_ffmpeg_dir = os.path.dirname(_ffmpeg_exe)
_ffmpeg_link = os.path.join(_ffmpeg_dir, "ffmpeg")
if not os.path.exists(_ffmpeg_link):
    os.symlink(_ffmpeg_exe, _ffmpeg_link)
os.environ["PATH"] = _ffmpeg_dir + os.pathsep + os.environ["PATH"]

import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from api.routes import router as http_router
from api.websocket import router as ws_router

app = FastAPI(title="Voice Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(http_router)
app.include_router(ws_router)

_recordings_dir = os.path.join(os.path.dirname(__file__), "recordings")
os.makedirs(_recordings_dir, exist_ok=True)
app.mount("/recordings", StaticFiles(directory=_recordings_dir), name="recordings")

_frontend_dist = os.path.join(os.path.dirname(__file__), "frontend", "dist")
if os.path.isdir(_frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(_frontend_dist, "assets")), name="assets")

    @app.get("/", include_in_schema=False)
    async def serve_spa():
        return FileResponse(os.path.join(_frontend_dist, "index.html"))


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8009, reload=False)
