"""
STARIZ AI Assistant - Python Backend
FastAPI application with WebSocket support for real-time communication.
"""

import os
import sys
import json
import asyncio
import logging
import time
from typing import Dict, Any, Optional, List
from pathlib import Path
from datetime import datetime
from collections import defaultdict

import psutil
from fastapi import (
    FastAPI,
    WebSocket,
    WebSocketDisconnect,
    HTTPException,
    Depends,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
import uvicorn
from pydantic import BaseModel

# Add the backend directory to the path so we can import stariz_tools
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from stariz_tools import SystemTools, FileTools, ImageTools, DataTools

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="STARIZ AI Backend",
    description="Python backend for STARIZ AI Assistant",
    version="2.4.1",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting
rate_limit_store: Dict[str, list] = defaultdict(list)
RATE_LIMIT_MAX = 60
RATE_LIMIT_WINDOW = 60

@app.middleware("http")
async def rate_limit_middleware(request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW

    rate_limit_store[client_ip] = [t for t in rate_limit_store[client_ip] if t > window_start]

    if len(rate_limit_store[client_ip]) >= RATE_LIMIT_MAX:
        return JSONResponse(status_code=429, content={"error": "Rate limit exceeded"})

    rate_limit_store[client_ip].append(now)
    response = await call_next(request)
    return response

# Basic authentication (optional, disabled by default)
API_TOKEN = os.environ.get("STARIZ_API_TOKEN", "")

@app.middleware("http")
async def auth_middleware(request, call_next):
    if not API_TOKEN:
        return await call_next(request)

    if request.url.path in ["/", "/health", "/docs", "/openapi.json"]:
        return await call_next(request)

    auth_header = request.headers.get("Authorization", "")
    if auth_header != f"Bearer {API_TOKEN}":
        return JSONResponse(status_code=401, content={"error": "Unauthorized"})

    return await call_next(request)

# System stats cache
system_stats_cache = {
    "cpu_percent": 0,
    "memory": {"total": 0, "available": 0, "percent": 0},
    "disk": {"total": 0, "used": 0, "free": 0, "percent": 0},
    "network": {"bytes_sent": 0, "bytes_recv": 0, "packets_sent": 0, "packets_recv": 0},
    "boot_time": 0,
    "processes": 0,
}
last_stats_update = 0


async def update_system_stats():
    """Update system statistics periodically."""
    global system_stats_cache, last_stats_update
    import time

    current_time = time.time()

    # Update every 2 seconds
    if current_time - last_stats_update < 2:
        return system_stats_cache

    try:
        # CPU
        cpu_percent = psutil.cpu_percent(interval=0.1)

        # Memory
        memory = psutil.virtual_memory()
        memory_data = {
            "total": memory.total,
            "available": memory.available,
            "used": memory.used,
            "percent": memory.percent,
        }

        # Disk
        disk = psutil.disk_usage("/")
        disk_data = {
            "total": disk.total,
            "used": disk.used,
            "free": disk.free,
            "percent": disk.percent,
        }

        # Network
        net = psutil.net_io_counters()
        network_data = {
            "bytes_sent": net.bytes_sent,
            "bytes_recv": net.bytes_recv,
            "packets_sent": net.packets_sent,
            "packets_recv": net.packets_recv,
            "errin": net.errin,
            "errout": net.errout,
        }

        # Process count
        process_count = len(psutil.pids())

        # Boot time
        boot_time = psutil.boot_time()

        system_stats_cache = {
            "cpu_percent": cpu_percent,
            "cpu_count": psutil.cpu_count(logical=True),
            "cpu_freq": psutil.cpu_freq()._asdict() if psutil.cpu_freq() else None,
            "memory": memory_data,
            "disk": disk_data,
            "network": network_data,
            "boot_time": boot_time,
            "uptime": current_time - boot_time,
            "processes": process_count,
            "timestamp": current_time,
        }
        last_stats_update = current_time

    except Exception as e:
        logger.error(f"Error updating system stats: {e}")

    return system_stats_cache


# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(
            f"Client {client_id} connected. Total connections: {len(self.active_connections)}"
        )

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            logger.info(
                f"Client {client_id} disconnected. Total connections: {len(self.active_connections)}"
            )

    async def send_personal_message(self, message: str, client_id: str):
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_text(message)
            except Exception as e:
                logger.error(f"Error sending message to {client_id}: {e}")
                self.disconnect(client_id)

    async def broadcast(self, message: str):
        disconnected = []
        for client_id, connection in self.active_connections.items():
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting to {client_id}: {e}")
                disconnected.append(client_id)

        for client_id in disconnected:
            self.disconnect(client_id)


manager = ConnectionManager()


# API Routes
@app.get("/")
async def root():
    return {
        "service": "STARIZ AI Backend",
        "version": "2.4.1",
        "status": "operational",
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/api/system/stats")
async def get_system_stats():
    """Get real-time system statistics."""
    return await update_system_stats()


@app.get("/api/system/processes")
async def get_processes(limit: int = 20):
    """Get running processes."""
    try:
        processes = []
        for proc in psutil.process_iter(
            ["pid", "name", "cpu_percent", "memory_percent"]
        ):
            try:
                pinfo = proc.info
                processes.append(
                    {
                        "pid": pinfo["pid"],
                        "name": pinfo["name"],
                        "cpu_percent": pinfo["cpu_percent"],
                        "memory_percent": pinfo["memory_percent"],
                    }
                )
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass

        # Sort by CPU usage
        processes.sort(key=lambda x: x["cpu_percent"] or 0, reverse=True)
        return {"processes": processes[:limit]}
    except Exception as e:
        logger.error(f"Error getting processes: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/system/disk/partitions")
async def get_disk_partitions():
    """Get disk partition information."""
    try:
        partitions = []
        for part in psutil.disk_partitions():
            try:
                usage = psutil.disk_usage(part.mountpoint)
                partitions.append(
                    {
                        "device": part.device,
                        "mountpoint": part.mountpoint,
                        "fstype": part.fstype,
                        "total": usage.total,
                        "used": usage.used,
                        "free": usage.free,
                        "percent": usage.percent,
                    }
                )
            except PermissionError:
                continue
        return {"partitions": partitions}
    except Exception as e:
        logger.error(f"Error getting disk partitions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== PYTHON TOOLS API ENDPOINTS ====================


# System Tools
@app.get("/api/tools/system/info")
async def get_system_info():
    """Get comprehensive system information."""
    return SystemTools.get_system_info()


@app.get("/api/tools/system/cpu")
async def get_cpu_info():
    """Get CPU information and usage."""
    return SystemTools.get_cpu_info()


@app.get("/api/tools/system/memory")
async def get_memory_info():
    """Get memory information."""
    return SystemTools.get_memory_info()


@app.get("/api/tools/system/disk")
async def get_disk_info():
    """Get disk information for all partitions."""
    return SystemTools.get_disk_info()


@app.get("/api/tools/system/network")
async def get_network_info():
    """Get network information."""
    return SystemTools.get_network_info()


@app.get("/api/tools/system/processes")
async def get_processes(limit: int = 20, sort_by: str = "cpu"):
    """Get list of running processes."""
    return SystemTools.get_process_list(limit=limit, sort_by=sort_by)


@app.get("/api/tools/system/ping/{host}")
async def ping_host(host: str, count: int = 4):
    """Ping a host and return statistics."""
    return SystemTools.ping_host(host, count)


# File Tools
class FileOperationRequest(BaseModel):
    path: str
    operation: str  # list, read, write, delete, exists, mkdir, info
    content: Optional[str] = None
    encoding: Optional[str] = "utf-8"


@app.post("/api/tools/file/operation")
async def file_operation(request: FileOperationRequest):
    """Perform file system operations."""
    try:
        if request.operation == "list":
            return FileTools.list_directory(request.path)
        elif request.operation == "read":
            return FileTools.read_file(
                request.path, encoding=request.encoding or "utf-8"
            )
        elif request.operation == "write":
            if request.content is None:
                raise HTTPException(status_code=400, detail="No content provided")
            return FileTools.write_file(
                request.path, request.content, encoding=request.encoding or "utf-8"
            )
        elif request.operation == "delete":
            return FileTools.delete_path(request.path)
        elif request.operation == "mkdir":
            return FileTools.create_directory(request.path)
        elif request.operation == "info":
            return FileTools.get_file_info(request.path)
        else:
            raise HTTPException(status_code=400, detail="Invalid operation")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File operation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/tools/file/read-json")
async def read_json_file(path: str):
    """Read and parse a JSON file."""
    return FileTools.read_json(path)


@app.post("/api/tools/file/write-json")
async def write_json_file(path: str, data: Any, indent: int = 2):
    """Write data to a JSON file."""
    return FileTools.write_json(path, data, indent)


@app.post("/api/tools/file/read-csv")
async def read_csv_file(path: str):
    """Read a CSV file."""
    return FileTools.read_csv(path)


# Image Tools
class ImageOperationRequest(BaseModel):
    input_path: str
    output_path: str
    operation: str  # info, resize, convert, thumbnail, filter
    width: Optional[int] = None
    height: Optional[int] = None
    maintain_aspect: Optional[bool] = True
    output_format: Optional[str] = "PNG"
    filter_type: Optional[str] = "grayscale"


@app.post("/api/tools/image/operation")
async def image_operation(request: ImageOperationRequest):
    """Perform image processing operations."""
    try:
        if request.operation == "info":
            return ImageTools.get_image_info(request.input_path)
        elif request.operation == "resize":
            if request.width is None or request.height is None:
                raise HTTPException(
                    status_code=400, detail="Width and height required for resize"
                )
            return ImageTools.resize_image(
                request.input_path,
                request.output_path,
                request.width,
                request.height,
                request.maintain_aspect or True,
            )
        elif request.operation == "convert":
            return ImageTools.convert_image_format(
                request.input_path, request.output_path, request.output_format or "PNG"
            )
        elif request.operation == "thumbnail":
            size = (request.width or 128, request.height or 128)
            return ImageTools.create_thumbnail(
                request.input_path, request.output_path, size
            )
        elif request.operation == "filter":
            return ImageTools.apply_filter(
                request.input_path,
                request.output_path,
                request.filter_type or "grayscale",
            )
        else:
            raise HTTPException(status_code=400, detail="Invalid operation")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image operation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/tools/image/to-base64")
async def image_to_base64(path: str):
    """Convert an image to base64 encoding."""
    return ImageTools.image_to_base64(path)


# Data Tools
class DataOperationRequest(BaseModel):
    data: Optional[List[Any]] = None
    csv_content: Optional[str] = None
    operation: str  # analyze, process_csv, chart, statistics
    chart_type: Optional[str] = "line"
    labels: Optional[List[str]] = None


@app.post("/api/tools/data/operation")
async def data_operation(request: DataOperationRequest):
    """Perform data analysis operations."""
    try:
        if request.operation == "analyze":
            if request.data is None:
                raise HTTPException(status_code=400, detail="Data required for analyze")
            return DataTools.analyze_data(request.data, "summary")
        elif request.operation == "process_csv":
            if request.csv_content is None:
                raise HTTPException(status_code=400, detail="CSV content required")
            return DataTools.process_csv_data(request.csv_content, "head")
        elif request.operation == "chart":
            if request.data is None:
                raise HTTPException(status_code=400, detail="Data required for chart")
            return DataTools.generate_chart_data(
                request.data, request.chart_type or "line", request.labels
            )
        elif request.operation == "statistics":
            if request.data is None:
                raise HTTPException(
                    status_code=400, detail="Data required for statistics"
                )
            return DataTools.calculate_statistics(request.data)
        else:
            raise HTTPException(status_code=400, detail="Invalid operation")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Data operation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== GODMODE: VOICE, RAG, AGENT, MEMORY ====================

# Initialize GODMODE components
rag_engine = None
memory_system = None

def get_rag_engine():
    global rag_engine
    if rag_engine is None:
        try:
            from stariz_tools.rag_engine import RAGEngine
            rag_engine = RAGEngine()
        except Exception as e:
            logger.error(f"Failed to init RAG: {e}")
    return rag_engine

def get_memory_system():
    global memory_system
    if memory_system is None:
        try:
            from stariz_tools.memory_system import MemorySystem
            memory_system = MemorySystem()
        except Exception as e:
            logger.error(f"Failed to init Memory: {e}")
    return memory_system

# --- Voice API ---
class VoiceTranscribeRequest(BaseModel):
    audio_data: str  # base64 encoded audio
    sample_rate: int = 16000

class VoiceSynthesizeRequest(BaseModel):
    text: str
    voice: Optional[str] = None
    speed: float = 1.0

@app.post("/api/voice/transcribe")
async def voice_transcribe(request: VoiceTranscribeRequest):
    """Transcribe audio to text using offline Vosk STT."""
    import base64
    from stariz_tools.voice_tools import VoiceTools
    try:
        audio_bytes = base64.b64decode(request.audio_data)
        text = VoiceTools.transcribe_audio(audio_bytes, request.sample_rate)
        return {"text": text, "status": "success"}
    except Exception as e:
        logger.error(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/voice/synthesize")
async def voice_synthesize(request: VoiceSynthesizeRequest):
    """Synthesize speech from text using offline Piper TTS."""
    import base64
    from stariz_tools.voice_tools import VoiceTools
    try:
        audio_bytes = VoiceTools.synthesize_speech(request.text)
        audio_b64 = base64.b64encode(audio_bytes).decode()
        return {"audio": audio_b64, "format": "wav", "status": "success"}
    except Exception as e:
        logger.error(f"TTS error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/voice/voices")
async def voice_list():
    """List available TTS voices."""
    from stariz_tools.voice_tools import VoiceTools
    return {"voices": VoiceTools.get_available_voices()}

@app.get("/api/voice/status")
async def voice_status():
    """Check voice engine status."""
    from stariz_tools.voice_tools import VoiceTools, VOSK_MODEL_PATH, PIPER_MODEL_PATH
    stt_ready = VoiceTools._vosk_model is not None
    if not stt_ready:
        try:
            stt_ready = VoiceTools.init_stt()
        except Exception:
            stt_ready = False
    tts_ready = VoiceTools._piper_voice is not None
    if not tts_ready:
        try:
            tts_ready = VoiceTools.init_tts()
        except Exception:
            tts_ready = False
    return {
        "stt": "ready" if stt_ready else "not initialized",
        "tts": "ready" if tts_ready else "not initialized",
        "vosk_model_path": str(VOSK_MODEL_PATH),
        "piper_model_path": str(PIPER_MODEL_PATH)
    }

# --- RAG API ---
class RAGIngestRequest(BaseModel):
    text: Optional[str] = None
    file_path: Optional[str] = None
    directory_path: Optional[str] = None
    source: Optional[str] = None

class RAGSearchRequest(BaseModel):
    query: str
    top_k: int = 5
    filter_source: Optional[str] = None

@app.post("/api/rag/ingest")
async def rag_ingest(request: RAGIngestRequest):
    """Ingest text/files into knowledge base."""
    engine = get_rag_engine()
    if not engine:
        raise HTTPException(status_code=503, detail="RAG engine not available")
    try:
        if request.text:
            count = engine.ingest_text(request.text, source=request.source or "manual")
            return {"status": "success", "chunks_ingested": count}
        elif request.file_path:
            count = engine.ingest_file(request.file_path)
            return {"status": "success", "chunks_ingested": count}
        elif request.directory_path:
            count = engine.ingest_directory(request.directory_path)
            return {"status": "success", "chunks_ingested": count}
        else:
            raise HTTPException(status_code=400, detail="No text, file_path, or directory_path provided")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/rag/search")
async def rag_search(request: RAGSearchRequest):
    """Search knowledge base."""
    engine = get_rag_engine()
    if not engine:
        raise HTTPException(status_code=503, detail="RAG engine not available")
    results = engine.search(request.query, top_k=request.top_k, filter_source=request.filter_source)
    return {"results": results, "count": len(results)}

@app.get("/api/rag/stats")
async def rag_stats():
    """Get knowledge base statistics."""
    engine = get_rag_engine()
    if not engine:
        raise HTTPException(status_code=503, detail="RAG engine not available")
    return engine.get_stats()

@app.post("/api/rag/reset")
async def rag_reset():
    """Reset knowledge base."""
    engine = get_rag_engine()
    if not engine:
        raise HTTPException(status_code=503, detail="RAG engine not available")
    return engine.delete_collection()

# --- STARIZ AI Core API ---
ai_core = None

def get_ai_core():
    global ai_core
    if ai_core is None:
        try:
            from stariz_tools.ai_core import STARIZAICore
            ai_core = STARIZAICore()
        except Exception as e:
            logger.error(f"Failed to init AI Core: {e}")
    return ai_core

class AIChatRequest(BaseModel):
    message: str
    use_rag: bool = True
    model: Optional[str] = None

@app.post("/api/ai/chat")
async def ai_chat(request: AIChatRequest):
    """Chat with STARIZ AI Core (streaming)."""
    from fastapi.responses import StreamingResponse
    core = get_ai_core()
    if not core:
        raise HTTPException(status_code=503, detail="AI Core not available")

    rag_context = None
    if request.use_rag:
        engine = get_rag_engine()
        if engine:
            results = engine.search(request.message, top_k=3)
            if results:
                rag_context = "\n\n".join(r["content"] for r in results)

    async def generate():
        async for chunk in core.generate_streaming(request.message, rag_context, request.model):
            yield f"data: {json.dumps({'chunk': chunk})}\n"
        yield f"data: {json.dumps({'done': True})}\n"

    return StreamingResponse(generate(), media_type="text/event-stream")

@app.post("/api/ai/chat/nonstream")
async def ai_chat_nonstream(request: AIChatRequest):
    """Chat with STARIZ AI Core (non-streaming)."""
    core = get_ai_core()
    if not core:
        raise HTTPException(status_code=503, detail="AI Core not available")

    rag_context = None
    if request.use_rag:
        engine = get_rag_engine()
        if engine:
            results = engine.search(request.message, top_k=3)
            if results:
                rag_context = "\n\n".join(r["content"] for r in results)

    response = await core.generate_response(request.message, rag_context, request.model)
    return {"response": response}

@app.post("/api/ai/clear")
async def ai_clear():
    """Clear current AI session."""
    core = get_ai_core()
    if not core:
        raise HTTPException(status_code=503, detail="AI Core not available")
    core.clear_session()
    return {"status": "cleared"}

@app.get("/api/ai/session")
async def ai_session():
    """Get AI session info."""
    core = get_ai_core()
    if not core:
        raise HTTPException(status_code=503, detail="AI Core not available")
    return core.get_session_info()

@app.get("/api/ai/sessions")
async def ai_sessions():
    """Get all AI sessions."""
    core = get_ai_core()
    if not core:
        raise HTTPException(status_code=503, detail="AI Core not available")
    return {"sessions": core.get_all_sessions()}

# --- Agent API ---
class AgentExecuteRequest(BaseModel):
    task: str
    max_iterations: int = 5

@app.post("/api/agent/execute")
async def agent_execute(request: AgentExecuteRequest):
    """Execute a task using the ReAct agent loop."""
    from stariz_tools.agent import ReActAgent
    from stariz_tools import SystemTools, FileTools

    tool_registry = {
        "system_info": lambda _: SystemTools.get_system_info(),
        "list_files": lambda path: FileTools.list_directory(path),
        "read_file": lambda path: FileTools.read_file(path),
    }

    engine = get_rag_engine()
    if engine:
        tool_registry["search_knowledge"] = lambda q: engine.search(q, top_k=3)

    agent = ReActAgent(tool_registry=tool_registry, max_iterations=request.max_iterations)

    def llm_call(prompt: str) -> str:
        try:
            import httpx as _httpx
            with _httpx.Client(timeout=120) as _client:
                resp = _client.post(
                    "http://localhost:11434/api/chat",
                    json={"model": "qwen3:4b", "messages": [{"role": "user", "content": prompt}], "stream": False},
                )
                return resp.json().get("message", {}).get("content", "")
        except Exception as e:
            return f"LLM error: {e}"

    result = await asyncio.to_thread(agent.execute, request.task, llm_call)
    return result

# --- Memory API ---
class MemoryAddRequest(BaseModel):
    content: str
    memory_type: str = "episodic"
    category: Optional[str] = None
    context: Optional[Dict] = None

class MemorySearchRequest(BaseModel):
    query: str
    memory_type: str = "all"
    top_k: int = 3

class UserProfileUpdate(BaseModel):
    updates: Dict[str, Any]

@app.post("/api/memory/add")
async def memory_add(request: MemoryAddRequest):
    """Add a memory."""
    mem = get_memory_system()
    if not mem:
        raise HTTPException(status_code=503, detail="Memory system not available")
    if request.memory_type == "episodic":
        mem.add_episodic(request.content, request.context)
    elif request.memory_type == "semantic":
        mem.add_semantic(request.content, request.category or "general")
    elif request.memory_type == "procedural":
        mem.add_procedural(request.content, [])
    return {"status": "added", "type": request.memory_type}

@app.post("/api/memory/search")
async def memory_search(request: MemorySearchRequest):
    """Search memories."""
    mem = get_memory_system()
    if not mem:
        raise HTTPException(status_code=503, detail="Memory system not available")
    results = mem.retrieve_relevant(request.query, request.memory_type, request.top_k)
    return {"results": results, "count": len(results)}

@app.get("/api/memory/stats")
async def memory_stats():
    """Get memory statistics."""
    mem = get_memory_system()
    if not mem:
        raise HTTPException(status_code=503, detail="Memory system not available")
    return mem.get_memory_stats()

@app.get("/api/memory/profile")
async def get_profile():
    """Get user profile."""
    mem = get_memory_system()
    if not mem:
        raise HTTPException(status_code=503, detail="Memory system not available")
    return mem.get_user_profile()

@app.post("/api/memory/profile")
async def update_profile(request: UserProfileUpdate):
    """Update user profile."""
    mem = get_memory_system()
    if not mem:
        raise HTTPException(status_code=503, detail="Memory system not available")
    return mem.update_user_profile(request.updates)

# --- Autonomous Learning API ---
class LearningLogRequest(BaseModel):
    message: str
    response_type: str
    widget_used: Optional[str] = None
    time_taken: Optional[float] = None
    was_helpful: Optional[bool] = None

@app.post("/api/learning/log")
async def learning_log(request: LearningLogRequest):
    """Log a user interaction for autonomous learning."""
    from stariz_tools.autonomous_learning import AutonomousLearningEngine
    engine = AutonomousLearningEngine()
    engine.log_interaction(
        request.message, request.response_type,
        request.widget_used, request.time_taken, request.was_helpful
    )
    return {"status": "logged"}

@app.get("/api/learning/summary")
async def learning_summary():
    """Get learning engine summary."""
    from stariz_tools.autonomous_learning import AutonomousLearningEngine
    engine = AutonomousLearningEngine()
    return engine.get_learning_summary()

@app.post("/api/learning/detect")
async def learning_detect():
    """Trigger routine detection."""
    from stariz_tools.autonomous_learning import AutonomousLearningEngine
    engine = AutonomousLearningEngine()
    return engine.detect_routines()

@app.post("/api/learning/optimize")
async def learning_optimize():
    """Trigger optimization generation."""
    from stariz_tools.autonomous_learning import AutonomousLearningEngine
    engine = AutonomousLearningEngine()
    return engine.generate_optimizations()

@app.post("/api/learning/apply/{optimization_key}")
async def learning_apply(optimization_key: str):
    """Apply a specific optimization."""
    from stariz_tools.autonomous_learning import AutonomousLearningEngine
    engine = AutonomousLearningEngine()
    return engine.apply_optimization(optimization_key)

# --- Command Router API ---
class CommandRouteRequest(BaseModel):
    message: str

@app.post("/api/command/route")
async def command_route(request: CommandRouteRequest):
    """Route a command to the appropriate action."""
    from stariz_tools.command_router import CommandRouter
    route = CommandRouter.route_command(request.message)
    return route

@app.post("/api/command/execute")
async def command_execute(request: CommandRouteRequest):
    """Execute a system command."""
    from stariz_tools.command_router import CommandRouter
    route = CommandRouter.route_command(request.message)
    if route["type"] == "system" and route["handler"]:
        response = CommandRouter.execute_system_command(route["command"])
        return {"type": "system", "response": response, "navigate_to": None}
    elif route["type"] == "widget":
        return {"type": "widget", "response": route.get("response", ""), "navigate_to": route["navigate_to"]}
    return {"type": "ai", "response": None, "navigate_to": None}

# --- Voice WebSocket endpoint ---
@app.websocket("/ws/voice/{client_id}")
async def voice_websocket(websocket: WebSocket, client_id: str):
    await websocket.accept()
    from stariz_tools.voice_tools import VoiceTools
    VoiceTools.reset_recognizer()

    try:
        while True:
            data = await websocket.receive_bytes()
            result = VoiceTools.transcribe_chunk(data)
            await websocket.send_text(json.dumps({
                "type": "transcription",
                **result
            }))
    except WebSocketDisconnect:
        logger.info(f"Voice client {client_id} disconnected")
    except Exception as e:
        logger.error(f"Voice WebSocket error: {e}")

# WebSocket endpoint for real-time communication
@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)

    try:
        # Send initial system stats
        stats = await update_system_stats()
        await manager.send_personal_message(
            json.dumps({"type": "system_stats", "data": stats}), client_id
        )

        while True:
            # Receive message from client
            data = await websocket.receive_text()

            try:
                message = json.loads(data)
                msg_type = message.get("type", "unknown")

                if msg_type == "ping":
                    await manager.send_personal_message(
                        json.dumps(
                            {"type": "pong", "timestamp": datetime.now().isoformat()}
                        ),
                        client_id,
                    )

                elif msg_type == "request_stats":
                    stats = await update_system_stats()
                    await manager.send_personal_message(
                        json.dumps({"type": "system_stats", "data": stats}), client_id
                    )

                elif msg_type == "terminal_input":
                    # Terminal input handling (would integrate with PTY)
                    output = message.get("data", "")
                    # For now, just echo back
                    await manager.send_personal_message(
                        json.dumps(
                            {"type": "terminal_output", "data": f"Echo: {output}"}
                        ),
                        client_id,
                    )

                else:
                    logger.warning(f"Unknown message type: {msg_type}")

            except json.JSONDecodeError:
                logger.warning(f"Invalid JSON from {client_id}")
            except Exception as e:
                logger.error(f"Error processing message from {client_id}: {e}")

    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"WebSocket error for {client_id}: {e}")
        manager.disconnect(client_id)


# Background task for periodic stats broadcast
@app.on_event("startup")
async def startup_event():
    logger.info("STARIZ AI Backend starting up...")

    # Initialize GODMODE components
    async def init_godmode():
        # Voice engines
        try:
            from stariz_tools.voice_tools import VoiceTools
            VoiceTools.init_stt()
            VoiceTools.init_tts()
            logger.info("Voice engines initialized")
        except Exception as e:
            logger.warning(f"Voice init failed: {e}")

        # RAG engine
        try:
            engine = get_rag_engine()
            if engine:
                stats = engine.get_stats()
                logger.info(f"RAG engine ready. Documents: {stats['total_documents']}")
        except Exception as e:
            logger.warning(f"RAG init failed: {e}")

        # Memory system
        try:
            mem = get_memory_system()
            if mem:
                stats = mem.get_memory_stats()
                logger.info(f"Memory system ready: {stats}")
        except Exception as e:
            logger.warning(f"Memory init failed: {e}")

        # Autonomous Learning Engine
        try:
            from stariz_tools.autonomous_learning import AutonomousLearningEngine
            from stariz_tools.autonomous_learning import background_learning_task
            learning_engine = AutonomousLearningEngine()
            asyncio.create_task(background_learning_task())
            logger.info("Autonomous Learning Engine started")
        except Exception as e:
            logger.warning(f"Learning engine init failed: {e}")

        # Auto-index user files on first run
        try:
            engine = get_rag_engine()
            if engine and engine.collection.count() == 0:
                import os
                home = os.path.expanduser("~")
                dirs_to_index = [
                    os.path.join(home, "Documents"),
                    os.path.join(home, "Downloads"),
                ]
                for d in dirs_to_index:
                    if os.path.exists(d):
                        count = engine.ingest_directory(d, max_files=20)
                        if count > 0:
                            logger.info(f"Auto-indexed {count} chunks from {d}")
        except Exception as e:
            logger.warning(f"Auto-index failed: {e}")

    asyncio.create_task(init_godmode())

    # Start background task for system stats
    async def periodic_stats():
        while True:
            try:
                stats = await update_system_stats()
                await manager.broadcast(
                    json.dumps({"type": "system_stats", "data": stats})
                )
            except Exception as e:
                logger.error(f"Error in periodic stats broadcast: {e}")
            await asyncio.sleep(2)

    asyncio.create_task(periodic_stats())


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("STARIZ AI Backend shutting down...")


# Serve frontend static files in production
frontend_dist = Path(__file__).parent.parent / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info",
    )
