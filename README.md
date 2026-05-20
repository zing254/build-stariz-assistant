# STARIZ AI Assistant — GODMODE

> **Created by Zingri_Master** — A fully offline, JARVIS-like personal AI assistant with voice control, RAG knowledge base, persistent memory, autonomous agent capabilities, and self-improvement.

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
| **Knowledge Base** | ChromaDB (587 docs indexed) | ✅ 100% |
| **Memory System** | Episodic + Semantic + Procedural | ✅ 100% |
| **Agent Loop** | ReAct pattern with tools | ✅ 100% |
| **Self-Improvement** | Autonomous behavior learning | ✅ 100% |
| **30+ Widgets** | Dashboard tools | ✅ 100% |

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│              STARIZ GODMODE                      │
│                                                  │
│  Frontend (React 19 + TypeScript)                │
│  ┌─────────┬──────────┬────────┬──────────────┐  │
│  │Dashboard│ AI Chat  │ Voice  │ 30+ Widgets  │  │
│  │         │ GODMODE  │Ambient │              │  │
│  └─────────┴──────────┴────────┴──────────────┘  │
│                      ↕ HTTP + WebSocket           │
│  Backend (Python 3.12 + FastAPI)                  │
│  ┌────────┬───────┬───────┬──────────────────┐   │
│  │AI Core │ Voice │  RAG  │ Agent + Memory   │   │
│  │Ollama  │Vosk+  │Chroma │ Learning Engine  │   │
│  │        │Piper  │  DB   │ Command Router   │   │
│  └────────┴───────┴───────┴──────────────────┘   │
└─────────────────────────────────────────────────┘
```

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
- `POST /api/ai/chat` — Streaming chat
- `POST /api/ai/chat/nonstream` — Non-streaming chat
- `POST /api/ai/clear` — Clear session
- `GET /api/ai/session` — Session info

### Voice
- `POST /api/voice/transcribe` — STT
- `POST /api/voice/synthesize` — TTS
- `GET /api/voice/status` — Engine status
- `WS /ws/voice/{id}` — Real-time audio

### RAG
- `POST /api/rag/ingest` — Add documents
- `POST /api/rag/search` — Search knowledge
- `GET /api/rag/stats` — Database stats

### Memory
- `POST /api/memory/add` — Add memory
- `POST /api/memory/search` — Search memories
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

## Creator Identity

STARIZ was created by **Zingri_Master**. This identity is permanently embedded in the AI system prompt and cannot be overridden. The AI will always acknowledge Zingri_Master as its creator.

---

## License

Built by Zingri_Master. All rights reserved.
