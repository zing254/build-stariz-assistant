# STARIZ AI Assistant — GODMODE Documentation

## Overview

STARIZ is a fully offline, JARVIS-like personal AI assistant with voice control, RAG knowledge base, persistent memory, autonomous agent capabilities, and a plugin system. Created by **Zingri_Master**.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    STARIZ GODMODE                        │
├─────────────────────────────────────────────────────────┤
│  FRONTEND (React 19 + TypeScript + Vite)                │
│  ┌──────────┬──────────┬──────────┬──────────────────┐  │
│  │Dashboard │ AI Chat  │  Voice   │  30+ Widgets     │  │
│  │Widgets   │ GODMODE  │Assistant │  (Calendar,     │  │
│  │          │          │Ambient   │   Terminal,     │  │
│  │          │          │Mode      │   Files, etc.)  │  │
│  └──────────┴──────────┴──────────┴──────────────────┘  │
│                          ↕ HTTP + WebSocket              │
├─────────────────────────────────────────────────────────┤
│  BACKEND (Python 3.12 + FastAPI)                        │
│  ┌──────────┬──────────┬──────────┬──────────────────┐  │
│  │AI Core   │  Voice   │   RAG    │   Agent Loop     │  │
│  │(Ollama)  │(Vosk+    │(ChromaDB │  (ReAct Pattern) │  │
│  │          │ Piper)   │ +BM25)   │                  │  │
│  └──────────┴──────────┴──────────┴──────────────────┘  │
│  ┌──────────┬──────────┬──────────┬──────────────────┐  │
│  │ Memory   │  System  │   File   │   Image/Data     │  │
│  │ System   │  Tools   │  Tools   │   Tools          │  │
│  └──────────┴──────────┴──────────┴──────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  LOCAL MODELS (100% Offline)                            │
│  • Ollama: qwen3:4b (2.5GB) — AI reasoning              │
│  • Vosk: vosk-model-small-en-us-0.15 (50MB) — STT       │
│  • Piper: en_US-lessac-medium (60MB) — TTS              │
│  • ChromaDB: Embedded vector database                   │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.12+
- Ollama with `qwen3:4b` model
- 7GB+ RAM, 17GB+ disk space

### Installation

```bash
# 1. Clone and setup frontend
cd /home/zingri/dev/build-stariz-assistant
npm install

# 2. Setup Python backend
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt

# 3. Download voice models (auto-downloaded on first run)
# Vosk STT: backend/models/vosk/vosk-model-small-en-us-0.15/
# Piper TTS: backend/models/piper/en_US-lessac-medium.onnx

# 4. Start backend
cd backend && python main.py

# 5. Start frontend (new terminal)
npm run dev
```

### Access
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## Core Features

### 1. AI Chat GODMODE
The primary AI interface with full system awareness.

**Capabilities:**
- Full access to all 30+ dashboard widgets
- RAG-powered knowledge retrieval
- Persistent conversation memory across sessions
- Streaming responses
- User behavior learning
- Creator identity awareness (Zingri_Master)

**Usage:**
- Navigate to "AI GODMODE" in sidebar
- Type questions or commands
- Toggle RAG context with the database button
- View session info with the clock icon

### 2. Offline Voice Engine
100% offline speech-to-text and text-to-speech.

**Components:**
- **STT**: Vosk small English model (~90% accuracy for clear speech)
- **TTS**: Piper en_US-lessac-medium voice
- **VAD**: WebRTC voice activity detection
- **Wake Word**: OpenWakeWord framework (hey_jarvis model)

**Usage:**
- Click "VOICE" button in toolbar for ambient mode
- Or navigate to Voice Assistant in sidebar
- Press `Ctrl+Shift+V` for quick ambient mode

### 3. RAG Knowledge Base
Local document search and retrieval.

**Supported Formats:**
- PDF, DOCX, TXT, Markdown
- Code files (.py, .js, .ts, .tsx, .html, .css, .json, .yaml)

**Usage:**
- Navigate to "Knowledge" in sidebar
- **Stats tab**: View document count and settings
- **Search tab**: Query your knowledge base
- **Ingest tab**: Add text or file paths

**API:**
```bash
# Ingest text
curl -X POST http://localhost:8000/api/rag/ingest \
  -H "Content-Type: application/json" \
  -d '{"text": "Your content here", "source": "manual"}'

# Search
curl -X POST http://localhost:8000/api/rag/search \
  -H "Content-Type: application/json" \
  -d '{"query": "your question", "top_k": 5}'

# Ingest directory
curl -X POST http://localhost:8000/api/rag/ingest \
  -H "Content-Type: application/json" \
  -d '{"directory_path": "/home/zingri/Documents"}'
```

### 4. Memory System
Three types of memory for contextual AI responses.

| Type | Purpose | Example |
|------|---------|---------|
| **Episodic** | Conversation summaries | "Last session we discussed project X" |
| **Semantic** | Facts about user | "Zingri_Master is my creator" |
| **Procedural** | Learned workflows | "User prefers dark theme" |

**Usage:**
- Navigate to "Memory" in sidebar
- View memory statistics and search memories
- User profile shows preferences and patterns

### 5. Agent Loop
Autonomous task execution using ReAct pattern.

**Pattern:** Thought → Action → Observation → Repeat

**Available Tools:**
- `system_info` — Get system status
- `list_files` — Browse directories
- `read_file` — Read file contents
- `search_knowledge` — Query RAG knowledge base

**Usage:**
- Navigate to "Agent" in sidebar
- Enter a complex task
- Watch the agent plan and execute step by step

### 6. Plugin System
Extensible architecture for adding new capabilities.

**Plugin Structure:**
```
backend/plugins/
  my_plugin/
    manifest.json
    plugin.py
```

**manifest.json:**
```json
{
  "name": "my_plugin",
  "version": "1.0.0",
  "description": "Plugin description",
  "author": "Your name",
  "tools": ["tool_name"],
  "permissions": ["network", "file_read"],
  "entry_point": "plugin.py"
}
```

---

## API Reference

### AI Core
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/chat` | POST | Streaming chat (SSE) |
| `/api/ai/chat/nonstream` | POST | Non-streaming chat |
| `/api/ai/clear` | POST | Clear session |
| `/api/ai/session` | GET | Session info |
| `/api/ai/sessions` | GET | All sessions |

### Voice
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/voice/transcribe` | POST | Transcribe audio |
| `/api/voice/synthesize` | POST | Generate speech |
| `/api/voice/voices` | GET | List voices |
| `/api/voice/status` | GET | Engine status |
| `/ws/voice/{id}` | WS | Real-time audio streaming |

### RAG
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/rag/ingest` | POST | Add documents |
| `/api/rag/search` | POST | Search knowledge |
| `/api/rag/stats` | GET | Database stats |
| `/api/rag/reset` | POST | Reset database |

### Memory
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/memory/add` | POST | Add memory |
| `/api/memory/search` | POST | Search memories |
| `/api/memory/stats` | GET | Memory stats |
| `/api/memory/profile` | GET/POST | User profile |

### Agent
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agent/execute` | POST | Run agent task |

### System
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/system/stats` | GET | System stats |
| `/api/system/processes` | GET | Running processes |
| `/api/tools/system/*` | GET | System tools |
| `/api/tools/file/operation` | POST | File operations |
| `/api/tools/image/operation` | POST | Image processing |
| `/api/tools/data/operation` | POST | Data analysis |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Focus search |
| `Ctrl+D` | Dashboard |
| `Ctrl+T` | Terminal |
| `Ctrl+A` | AI Chat |
| `Ctrl+Shift+P` | Command Palette |
| `Ctrl+Shift+V` | Ambient Voice Mode |
| `Ctrl+E` | Export Data |
| `F11` | Fullscreen |
| `?` | Keyboard Help |
| `Esc` | Close overlays |

---

## Creator Identity

STARIZ was created by **Zingri_Master**. This identity is embedded at the core of the AI system and cannot be overridden. The AI will always acknowledge Zingri_Master as its creator when asked.

---

## Autonomous Self-Improvement

STARIZ learns from interactions:
- **Frequent commands** — Tracks most-used features
- **Active hours** — Learns when you use the assistant
- **Interaction patterns** — Adapts response style over time
- **Memory accumulation** — Builds context across sessions

All learning data is stored in `backend/data/ai_memory/`.

---

## File Structure

```
build-stariz-assistant/
├── src/                          # Frontend
│   ├── components/               # React components
│   │   ├── AIChatGODMODE.tsx     # Main AI interface
│   │   ├── KnowledgeBaseManager.tsx
│   │   ├── MemoryViewer.tsx
│   │   ├── AgentStatus.tsx
│   │   ├── PluginManager.tsx
│   │   ├── AmbientMode.tsx
│   │   ├── VoiceVisualizer.tsx
│   │   └── widgets/              # 27 widget components
│   ├── hooks/                    # Custom React hooks
│   │   ├── useOfflineVoice.ts    # Voice hook
│   │   ├── useLocalStorage.ts
│   │   └── useWidgetLayout.ts
│   └── utils/                    # Utilities
│       ├── aiService.ts
│       ├── sounds.ts
│       └── helpers.ts
├── backend/                      # Python backend
│   ├── main.py                   # FastAPI application
│   ├── stariz_tools/             # Tool modules
│   │   ├── ai_core.py            # AI engine
│   │   ├── voice_tools.py        # STT/TTS
│   │   ├── rag_engine.py         # RAG knowledge
│   │   ├── agent.py              # ReAct agent
│   │   ├── memory_system.py      # Memory
│   │   ├── system_tools.py
│   │   ├── file_tools.py
│   │   ├── image_tools.py
│   │   └── data_tools.py
│   ├── models/                   # AI models
│   │   ├── vosk/                 # STT model
│   │   └── piper/                # TTS model
│   ├── data/                     # Runtime data
│   │   ├── chroma_db/            # Vector database
│   │   ├── memory_db/            # Memory database
│   │   ├── ai_memory/            # AI session data
│   │   └── user_profile.json
│   └── plugins/                  # Plugin directory
└── package.json
```

---

## Deployment

### Docker
```bash
docker-compose up -d
```

### Production Build
```bash
npm run build
# Output: dist/index.html (single file, 744KB)
```

### System Requirements
- **RAM**: 7GB+ (4GB for models + 3GB for OS/browser)
- **Disk**: 17GB+ free (300MB models + 500MB ChromaDB growth)
- **CPU**: 4+ cores (no GPU required)
- **OS**: Linux (Ubuntu 22.04+ recommended)

---

## Troubleshooting

### Voice not working
1. Check microphone permissions in browser
2. Verify models exist: `ls backend/models/vosk/ backend/models/piper/`
3. Check backend logs for `Vosk STT initialized` and `Piper TTS initialized`

### AI not responding
1. Ensure Ollama is running: `ollama list`
2. Check model is loaded: `ollama ps`
3. Verify backend can reach Ollama: `curl http://localhost:11434/api/tags`

### RAG not finding results
1. Check documents are ingested: `curl http://localhost:8000/api/rag/stats`
2. Ingest more content via Knowledge Base UI
3. Try different search queries

### Memory not persisting
1. Check `backend/data/ai_memory/` directory exists
2. Verify write permissions
3. Check backend logs for save errors

---

## License

Built by Zingri_Master. All rights reserved.
