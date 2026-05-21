# STARIZ AI Assistant — GODMODE v2.6.0

> **Created by Zingri_Master** — A fully offline, JARVIS-like personal AI assistant with voice control, RAG knowledge base, persistent memory, autonomous agent capabilities, tool execution, and self-improvement.

---

## 🚀 Live Demo

- **Frontend**: https://build-stariz-assistant.vercel.app (Vercel — Free)
- **Backend**: Deploy to Render (Free) — see [DEPLOYMENT.md](DEPLOYMENT.md)

---

## What's New in v2.6.0

- **AI Tool Execution**: AI parses `[TOOL:tool_name]{params}` from responses and executes tools iteratively
- **BM25 Hybrid Search**: 60% vector + 40% keyword search for better RAG results
- **Rate Limiting**: 60 requests/minute per IP to prevent abuse
- **Optional API Authentication**: Set `STARIZ_API_TOKEN` for Bearer token auth
- **Dark/Light Mode Toggle**: Theme switcher in header with CSS variables
- **Real Backend Stats**: Header shows actual CPU/RAM from backend (no more random values)
- **Voice WS Auto-Reconnect**: Exponential backoff reconnection on disconnect
- **Accessibility**: ARIA labels, focus traps, keyboard navigation in modals
- **Fixed HTTP Methods**: System tool endpoints now correctly use GET
- **Fixed Agent Endpoint**: Migrated from legacy `/api/generate` to `/api/chat`
- **Fixed Frontend Serving**: Production static files served from correct path
- **Fixed VoiceVisualizer**: Memory leak fixed with proper cleanup
- **Testing Infrastructure**: Vitest + Testing Library configured with test scripts
- **Docker Ollama Service**: Full stack deployment with `docker compose up`
- **Environment Template**: `.env.example` with all configuration options

---

## Quick Start

```bash
# Start everything
./start.sh

# Or manually:
# Terminal 1: Backend
cd backend && ../.venv/bin/python main.py

# Terminal 2: Frontend
npm run dev
```

Open http://localhost:5173

---

## What STARIZ Can Do

| Feature | Technology | Offline? |
|---------|-----------|----------|
| **AI Chat** | Ollama (qwen3:4b) | ✅ 100% |
| **Voice STT** | Vosk (50MB model) | ✅ 100% |
| **Voice TTS** | Piper (60MB voice) | ✅ 100% |
| **Knowledge Base** | ChromaDB + BM25 Hybrid | ✅ 100% |
| **Memory System** | Episodic + Semantic + Procedural | ✅ 100% |
| **Agent Loop** | ReAct pattern with tools | ✅ 100% |
| **Self-Improvement** | Autonomous behavior learning | ✅ 100% |
| **Tool Execution** | System, File, Image, Data tools | ✅ 100% |
| **30+ Widgets** | Dashboard tools | ✅ 100% |

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│              STARIZ GODMODE v2.6.0               │
│                                                  │
│  Frontend (React 19 + TypeScript)                │
│  ┌─────────┬──────────┬────────┬──────────────┐  │
│  │Dashboard│ AI Chat  │ Voice  │ 30+ Widgets  │  │
│  │         │ GODMODE  │Ambient │ + Markdown   │  │
│  └─────────┴──────────┴────────┴──────────────┘  │
│                      ↕ HTTP + WebSocket           │
│  Backend (Python 3.12 + FastAPI)                  │
│  ┌────────┬───────┬───────┬──────────────────┐   │
│  │AI Core │ Voice │  RAG  │ Agent + Memory   │   │
│  │+Tools  │Vosk+  │Chroma │ + Learning       │   │
│  │        │Piper  │+BM25  │ Command Router   │   │
│  └────────┴───────┴───────┴──────────────────┘   │
│  ┌──────────────────────────────────────────┐    │
│  │ Middleware: Rate Limit + Auth + CORS     │    │
│  └──────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

---

## AI Tool Execution

The AI can directly execute tools when you ask it to. It parses `[TOOL:tool_name]{params}` patterns and executes them iteratively:

```
"Show me my CPU usage"          → system_info tool
"List files in /home/zingri"    → list_directory tool
"Read the file at notes.txt"    → read_file tool
"Analyze this data: [1,2,3...]" → analyze_data tool
"Resize image.png to 800x600"   → resize_image tool
```

Available tools:
- **System**: system_info, cpu_info, memory_info, disk_info, network_info, process_list, ping_host
- **Files**: list_directory, read_file, write_file, get_file_info, create_directory, delete_path, read_json, write_json, read_csv
- **Images**: get_image_info, resize_image, convert_image, create_thumbnail, apply_image_filter
- **Data**: analyze_data, process_csv, generate_chart, calculate_statistics

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+V` | Ambient Voice Mode |
| `Ctrl+Shift+P` | Command Palette |
| `Ctrl+D` | Dashboard |
| `Ctrl+A` | AI Chat |
| `Ctrl+T` | Terminal |
| `Ctrl+E` | Export Data |
| `F11` | Fullscreen |
| `?` | Keyboard Help |

---

## API Endpoints

### AI Core
- `POST /api/ai/chat` — Streaming chat (SSE)
- `POST /api/ai/chat/nonstream` — Non-streaming chat
- `POST /api/ai/clear` — Clear session
- `GET /api/ai/session` — Session info
- `GET /api/ai/sessions` — All sessions

### Tools
- `GET /api/tools/system/info` — System information
- `GET /api/tools/system/cpu` — CPU info
- `GET /api/tools/system/memory` — Memory info
- `GET /api/tools/system/disk` — Disk info
- `GET /api/tools/system/network` — Network info
- `GET /api/tools/system/processes` — Running processes
- `GET /api/tools/system/ping/{host}` — Ping host
- `POST /api/tools/file/operation` — File operations
- `POST /api/tools/image/operation` — Image processing
- `POST /api/tools/data/operation` — Data analysis

### Voice
- `POST /api/voice/transcribe` — STT
- `POST /api/voice/synthesize` — TTS
- `GET /api/voice/status` — Engine status
- `WS /ws/voice/{id}` — Real-time audio

### RAG
- `POST /api/rag/ingest` — Add documents
- `POST /api/rag/search` — Search knowledge (hybrid vector+BM25)
- `GET /api/rag/stats` — Database stats
- `POST /api/rag/reset` — Reset database

### Memory
- `POST /api/memory/add` — Add memory
- `POST /api/memory/search` — Search memories
- `GET /api/memory/stats` — Memory stats
- `GET /api/memory/profile` — User profile

### Agent
- `POST /api/agent/execute` — Run agent task

### Learning
- `POST /api/learning/log` — Log interaction
- `GET /api/learning/summary` — Learning summary
- `POST /api/learning/detect` — Detect routines
- `POST /api/learning/optimize` — Generate optimizations

### Commands
- `POST /api/command/route` — Route command
- `POST /api/command/execute` — Execute command

---

## Security

### Rate Limiting
- 60 requests per minute per IP address
- Returns `429 Too Many Requests` when exceeded
- Configurable via `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW` in `main.py`

### API Authentication (Optional)
Set `STARIZ_API_TOKEN` environment variable to enable Bearer token authentication:
```bash
export STARIZ_API_TOKEN=your-secret-token
```
Then include in requests:
```bash
curl -H "Authorization: Bearer your-secret-token" http://localhost:8000/api/ai/session
```

### CORS
- Development: `allow_origins=["*"]`
- Production: Update to specific origins in `main.py`

### File Security
- Path traversal protection on all file operations
- Only allowed directories accessible (home, /tmp)

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_URL` | `http://localhost:11434` | Ollama server URL |
| `STARIZ_MODEL` | `qwen3:4b` | Default AI model |
| `VITE_PYTHON_BACKEND_URL` | `http://localhost:8000` | Backend URL |
| `STARIZ_API_TOKEN` | _(empty)_ | API authentication token (optional) |
| `LOG_LEVEL` | `info` | Backend logging level |
| `PYTHONUNBUFFERED` | `1` | Python output buffering |

See `.env.example` for a complete template.

---

## Creator Identity

STARIZ was created by **Zingri_Master**. This identity is permanently embedded in the AI system prompt and cannot be overridden. The AI will always acknowledge Zingri_Master as its creator.

---

## Memory System

Three types of memory with cross-session persistence:

| Type | Purpose | Example |
|------|---------|---------|
| **Episodic** | Conversation summaries | "Last session we discussed project X" |
| **Semantic** | Facts about user | "Zingri_Master is my creator" |
| **Procedural** | Learned workflows | "User prefers dark theme" |

Features:
- Importance scoring (0.0 - 1.0)
- Access count tracking
- Memory decay (90-day archive)
- Cross-session fact persistence
- Recency + importance combined retrieval

---

## Autonomous Learning

STARIZ learns from your behavior:
- **Pattern Recognition**: Detects frequent commands, active hours, preferred widgets
- **Response Quality**: Tracks helpfulness by message type
- **Command Sequences**: Identifies common action sequences
- **Predictive Suggestions**: Anticipates next actions based on time patterns
- **Self-Optimization**: Generates optimization suggestions automatically

---

## Testing

```bash
# Frontend tests
npm test
npm run test:watch

# Backend tests
cd backend && python3 -m pytest test_stariz_tools.py -v
```

---

## Deployment

### Free Options

| Service | Tier | Cost | Use |
|---------|------|------|-----|
| **Vercel** | Hobby | $0 | Frontend (deployed) |
| **Render** | Free | $0 | Backend (512MB RAM) |
| **Koyeb** | Free | $0 | Backend alternative |
| **Fly.io** | Free | $0 | Backend (requires CC) |

See [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step instructions.

### Docker (Full Stack)
```bash
docker compose up -d
```
Includes: Backend + Ollama + Redis services

### Production Build
```bash
./build.sh
# Output: dist/index.html (single file, 750KB)
```

### System Requirements
- **RAM**: 7GB+ (4GB for models + 3GB for OS/browser)
- **Disk**: 17GB+ free
- **CPU**: 4+ cores (no GPU required)
- **OS**: Linux (Ubuntu 22.04+ recommended)

---

## Troubleshooting

### Voice not working
1. Check microphone permissions in browser
2. Verify models exist: `ls backend/models/vosk/ backend/models/piper/`
3. Check backend logs for initialization messages

### AI not responding
1. Ensure Ollama is running: `ollama list`
2. Check model is loaded: `ollama ps`
3. Verify backend can reach Ollama: `curl http://localhost:11434/api/tags`

### RAG not finding results
1. Check documents are ingested: `curl http://localhost:8000/api/rag/stats`
2. Ingest more content via Knowledge Base UI
3. BM25 hybrid search is enabled by default

### Memory not persisting
1. Check `backend/data/ai_memory/` directory exists
2. Verify write permissions

### Rate limited (429)
1. Reduce request frequency
2. Adjust `RATE_LIMIT_MAX` in `main.py`

### Unauthorized (401)
1. Set `STARIZ_API_TOKEN` in both backend and frontend
2. Include `Authorization: Bearer <token>` header in requests

---

## Documentation

| File | Description |
|------|-------------|
| [README.md](README.md) | Project overview and quick start |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Free deployment guide (Vercel + Render) |
| [DOCUMENTATION.md](DOCUMENTATION.md) | Full technical documentation |
| [CHANGELOG.md](CHANGELOG.md) | Version history |
| [SECURITY.md](SECURITY.md) | Security policy and best practices |
| [.env.example](.env.example) | Environment variable template |

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for full version history.

---

## License

Built by Zingri_Master. All rights reserved.
