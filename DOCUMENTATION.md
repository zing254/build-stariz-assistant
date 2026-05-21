# STARIZ AI Assistant — GODMODE v2.6.0 Documentation

## Overview

STARIZ is a fully offline, JARVIS-like personal AI assistant with voice control, RAG knowledge base, persistent memory, autonomous agent capabilities, tool execution system, and self-improvement. Created by **Zingri_Master**.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    STARIZ GODMODE v2.6.0                  │
├─────────────────────────────────────────────────────────┤
│  FRONTEND (React 19 + TypeScript + Vite)                │
│  ┌──────────┬──────────┬──────────┬──────────────────┐  │
│  │Dashboard │ AI Chat  │  Voice   │  30+ Widgets     │  │
│  │Widgets   │ GODMODE  │Assistant │  + Markdown      │  │
│  │          │          │Ambient   │  + Message Search│  │
│  └──────────┴──────────┴──────────┴──────────────────┘  │
│                          ↕ HTTP + WebSocket              │
├─────────────────────────────────────────────────────────┤
│  BACKEND (Python 3.12 + FastAPI)                        │
│  ┌──────────┬──────────┬──────────┬──────────────────┐  │
│  │AI Core   │  Voice   │   RAG    │   Agent Loop     │  │
│  │+Tools    │(Vosk+    │(ChromaDB │  (ReAct Pattern) │  │
│  │          │ Piper)   │ +BM25)   │                  │  │
│  └──────────┴──────────┴──────────┴──────────────────┘  │
│  ┌──────────┬──────────┬──────────┬──────────────────┐  │
│  │ Memory   │  System  │   File   │   Image/Data     │  │
│  │ +Decay   │  Tools   │  Tools   │   Tools          │  │
│  └──────────┴──────────┴──────────┴──────────────────┘  │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Command Router: Fuzzy + Compound + Parameters   │    │
│  │  Learning Engine: Patterns + Quality + Predict   │    │
│  └──────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Middleware: Rate Limit (60/min) + Auth + CORS   │    │
│  └──────────────────────────────────────────────────┘    │
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
- Ollama with `qwen3:4b` model (or set `STARIZ_MODEL` env var)
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

# 3. Start backend
cd backend && python main.py

# 4. Start frontend (new terminal)
npm run dev
```

### Access
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## Core Features

### 1. AI Chat GODMODE with Tool Execution

The primary AI interface with full system awareness and tool execution capabilities.

**Capabilities:**
- Full access to all 30+ dashboard widgets
- Direct tool execution via `[TOOL:tool_name]{params}` pattern
- Iterative tool chain execution (up to 3 iterations)
- RAG-powered knowledge retrieval
- Persistent conversation memory across sessions
- Streaming responses with markdown rendering
- User behavior learning
- Creator identity awareness (Zingri_Master)
- Configurable model via `STARIZ_MODEL` env var
- 8192 token context window

**Tool Usage Examples:**
```
User: "Show me my CPU usage"
→ AI executes system_info tool and returns results

User: "List files in /home/zingri/Documents"
→ AI executes list_directory tool

User: "Read the file at /home/zingri/notes.txt"
→ AI executes read_file tool

User: "Analyze this data: [10, 20, 30, 40, 50]"
→ AI executes analyze_data tool
```

**Usage:**
- Navigate to "AI GODMODE" in sidebar
- Type questions or commands
- Toggle RAG context with the database button
- View session info with the info icon
- Search messages with the search icon

### 2. Offline Voice Engine

100% offline speech-to-text and text-to-speech.

**Components:**
- **STT**: Vosk small English model (~90% accuracy for clear speech)
- **TTS**: Piper en_US-lessac-medium voice
- **VAD**: WebRTC voice activity detection
- **Raw PCM Detection**: Automatically detects WAV vs raw PCM input
- **Auto-Reconnect**: WebSocket reconnects with exponential backoff

**Usage:**
- Click "VOICE" button in toolbar for ambient mode
- Or navigate to Voice Assistant in sidebar
- Press `Ctrl+Shift+V` for quick ambient mode

### 3. RAG Knowledge Base

Local document search with hybrid vector + BM25 keyword search.

**Supported Formats:**
- PDF, DOCX, TXT, Markdown
- Code files (.py, .js, .ts, .tsx, .html, .css, .json, .yaml)

**Search Algorithm:**
- 60% weight: ChromaDB vector similarity (semantic search)
- 40% weight: BM25 keyword matching (lexical search)
- Combined score provides best of both approaches

**Usage:**
- Navigate to "Knowledge" in sidebar
- **Stats tab**: View document count and settings
- **Search tab**: Query your knowledge base
- **Ingest tab**: Add text or file paths

### 4. Enhanced Memory System

Three types of memory with cross-session persistence and intelligent retrieval.

| Type | Purpose | Example |
|------|---------|---------|
| **Episodic** | Conversation summaries | "Last session we discussed project X" |
| **Semantic** | Facts about user | "Zingri_Master is my creator" |
| **Procedural** | Learned workflows | "User prefers dark theme" |

**Enhanced Features:**
- **Importance Scoring**: Each memory gets a 0.0-1.0 importance score
- **Access Tracking**: Memories track how often they're accessed
- **Memory Decay**: 90-day archive for unused memories
- **Cross-Session Facts**: Learned facts persist across all sessions
- **Combined Retrieval**: Recency + importance + access count = relevance score

**Memory API:**
```bash
# Add episodic memory
curl -X POST http://localhost:8000/api/memory/add \
  -H "Content-Type: application/json" \
  -d '{"content": "We discussed project X", "memory_type": "episodic"}'

# Search memories
curl -X POST http://localhost:8000/api/memory/search \
  -H "Content-Type: application/json" \
  -d '{"query": "project X", "memory_type": "all", "top_k": 3}'

# Get memory stats
curl http://localhost:8000/api/memory/stats

# Get user profile
curl http://localhost:8000/api/memory/profile
```

### 5. Agent Loop

Autonomous task execution using ReAct pattern.

**Pattern:** Thought → Action → Observation → Repeat

**Available Tools:**
- `system_info` — Get system status
- `list_files` — Browse directories
- `read_file` — Read file contents
- `search_knowledge` — Query RAG knowledge base

### 6. Enhanced Command Router

Smart command routing with fuzzy matching and compound commands.

**Features:**
- **Fuzzy Matching**: Partial word matching, stemmed keywords
- **Compound Commands**: "Open terminal and then show system stats"
- **Parameter Extraction**: Automatically extracts paths, hosts, queries
- **Navigation Prefixes**: Recognizes "open", "show", "go to", "navigate to", etc.
- **40+ Widget Commands**: Maps natural language to widget navigation
- **No Recursion Bug**: Fixed infinite recursion in compound extraction

**Examples:**
```
"open terminal"           → Navigate to terminal
"show me system stats"    → Navigate to system monitor
"go to the calendar"      → Navigate to calendar
"take me to crypto"       → Navigate to crypto prices
"open terminal and show system stats" → Compound command
```

### 7. Autonomous Self-Improvement

STARIZ learns from interactions and optimizes over time.

**Learning Capabilities:**
- **Pattern Recognition**: Detects frequent commands, active hours, preferred widgets
- **Response Quality Tracking**: Tracks helpfulness by message type
- **Command Sequence Detection**: Identifies common action sequences
- **Predictive Suggestions**: Anticipates next actions based on time patterns
- **User Model Building**: Builds comprehensive user behavior model
- **Self-Optimization**: Generates optimization suggestions automatically

**Background Task:**
- Runs every 5 minutes: routine detection
- Runs every 15 minutes: optimization generation
- Runs every 10 minutes: next-action prediction

---

## Security

### Rate Limiting
- 60 requests per minute per IP
- Returns `429 Too Many Requests` when exceeded
- Configurable in `backend/main.py`

### API Authentication (Optional)
```bash
export STARIZ_API_TOKEN=your-secret-token
```
Include in requests:
```bash
curl -H "Authorization: Bearer your-secret-token" http://localhost:8000/api/ai/session
```

### File Security
- Path traversal protection on all file operations
- Only allowed directories accessible

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

### Tools
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tools/system/info` | GET | System information |
| `/api/tools/system/cpu` | GET | CPU info |
| `/api/tools/system/memory` | GET | Memory info |
| `/api/tools/system/disk` | GET | Disk info |
| `/api/tools/system/network` | GET | Network info |
| `/api/tools/system/processes` | GET | Running processes |
| `/api/tools/system/ping/{host}` | GET | Ping host |
| `/api/tools/file/operation` | POST | File operations |
| `/api/tools/image/operation` | POST | Image processing |
| `/api/tools/data/operation` | POST | Data analysis |

### Voice
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/voice/transcribe` | POST | Transcribe audio |
| `/api/voice/synthesize` | POST | Generate speech |
| `/api/voice/voices` | GET | List voices |
| `/api/voice/status` | GET | Engine status |
| `/ws/voice/{id}` | WS | Real-time audio |

### RAG
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/rag/ingest` | POST | Add documents |
| `/api/rag/search` | POST | Search knowledge (hybrid) |
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

### Learning
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/learning/log` | POST | Log interaction |
| `/api/learning/summary` | GET | Learning summary |
| `/api/learning/detect` | POST | Detect routines |
| `/api/learning/optimize` | POST | Generate optimizations |
| `/api/learning/apply/{key}` | POST | Apply optimization |

### Commands
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/command/route` | POST | Route command |
| `/api/command/execute` | POST | Execute command |

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

Identity is enforced at multiple levels:
1. **System Prompt**: Embedded in every AI generation
2. **Command Router**: Dedicated "creator" command handler
3. **Memory System**: Stored as semantic fact with maximum importance
4. **Memory Context**: Included in every response context
5. **Welcome Screen**: Displayed on first launch

---

## Autonomous Self-Improvement

STARIZ learns from interactions:
- **Frequent commands** — Tracks most-used features with counts
- **Active hours** — Learns when you use the assistant
- **Interaction patterns** — Adapts response style over time
- **Memory accumulation** — Builds context across sessions
- **Response quality** — Tracks helpfulness by message type
- **Command sequences** — Detects common action patterns
- **Predictive suggestions** — Anticipates next actions

All learning data is stored in `backend/data/ai_learning/`.

---

## File Structure

```
build-stariz-assistant/
├── src/                          # Frontend
│   ├── components/               # React components (26 files)
│   │   ├── AIChatGODMODE.tsx     # Main AI interface (enhanced)
│   │   ├── KnowledgeBaseManager.tsx
│   │   ├── MemoryViewer.tsx
│   │   ├── AgentStatus.tsx
│   │   ├── PluginManager.tsx
│   │   ├── AmbientMode.tsx
│   │   ├── VoiceVisualizer.tsx   # Fixed: memory leak
│   │   ├── CommandPalette.tsx    # Fixed: focus trap, ARIA
│   │   ├── Header.tsx            # Fixed: real backend stats
│   │   └── widgets/              # 27+ widget components
│   ├── hooks/                    # Custom React hooks (6 files)
│   │   ├── useOfflineVoice.ts    # Fixed: auto-reconnect
│   │   ├── useLocalStorage.ts
│   │   ├── usePythonBackend.ts   # Fixed: HTTP methods
│   │   └── useWidgetLayout.ts
│   ├── utils/                    # Utilities (6 files)
│   │   ├── aiService.ts          # Fixed: qwen3:4b model
│   │   ├── ollama.ts             # Fixed: /api/chat endpoint
│   │   ├── markdown.tsx          # NEW: Markdown renderer
│   │   ├── sounds.ts
│   │   └── helpers.ts
│   └── test/                     # Test files (4 files)
│       ├── setup.ts
│       ├── utils.test.ts         # Fixed: vitest syntax
│       ├── Toast.test.tsx
│       └── useLocalStorage.test.ts
├── backend/                      # Python backend
│   ├── main.py                   # FastAPI app (enhanced)
│   ├── stariz_tools/             # Tool modules (11 files)
│   │   ├── ai_core.py            # AI engine (tool parsing)
│   │   ├── voice_tools.py        # STT/TTS (fixed PCM)
│   │   ├── rag_engine.py         # RAG (BM25 hybrid)
│   │   ├── agent.py              # ReAct agent
│   │   ├── memory_system.py      # Memory (decay)
│   │   ├── system_tools.py       # System info
│   │   ├── file_tools.py         # File ops (security)
│   │   ├── image_tools.py        # Image processing
│   │   ├── data_tools.py         # Data analysis
│   │   ├── command_router.py     # Commands (no recursion)
│   │   └── autonomous_learning.py# Learning engine
│   ├── models/                   # AI models
│   │   ├── vosk/                 # STT model
│   │   └── piper/                # TTS model
│   ├── data/                     # Runtime data
│   │   ├── chroma_db/            # Vector database
│   │   ├── memory_db/            # Memory database
│   │   ├── ai_memory/            # AI session data
│   │   ├── ai_learning/          # Learning state
│   │   └── user_profile.json     # User preferences
│   └── test_stariz_tools.py      # Backend tests (31 tests)
├── .env.example                  # NEW: Environment template
├── CHANGELOG.md                  # NEW: Version history
├── SECURITY.md                   # NEW: Security policy
├── vitest.config.ts              # NEW: Vitest configuration
├── start.sh                      # Startup script
├── build.sh                      # Build script
├── Dockerfile                    # Docker config (fixed)
├── docker-compose.yml            # Docker compose (Ollama added)
├── .dockerignore                 # Docker build context filter
├── package.json                  # Frontend deps (vitest added)
├── tsconfig.json                 # TypeScript config
└── vite.config.ts                # Vite config
```

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

## Testing

### Frontend Tests
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
```

Test coverage:
- Markdown parser (8 tests)
- Simple markdown formatter (4 tests)
- Helper functions (7 tests)
- useLocalStorage hook
- Toast component

### Backend Tests
```bash
cd backend && python3 -m pytest test_stariz_tools.py -v
```

Test coverage:
- Command routing (8 tests)
- System tools
- File tools
- Memory system
- RAG engine

---

## Deployment

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
4. Check model matches `STARIZ_MODEL` env var

### RAG not finding results
1. Check documents are ingested: `curl http://localhost:8000/api/rag/stats`
2. Ingest more content via Knowledge Base UI
3. BM25 hybrid search is enabled by default

### Memory not persisting
1. Check `backend/data/ai_memory/` directory exists
2. Verify write permissions
3. Check backend logs for save errors

### Tool execution failing
1. Ensure file paths are within allowed directories (home, /tmp)
2. Check file permissions
3. Verify backend has access to the target path

### Rate limited (429)
1. Reduce request frequency
2. Adjust `RATE_LIMIT_MAX` in `main.py`

### Unauthorized (401)
1. Set `STARIZ_API_TOKEN` environment variable
2. Include `Authorization: Bearer <token>` header in requests

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for full version history.

### v2.6.0 Highlights
- AI tool execution with iterative chain
- BM25 hybrid search
- Rate limiting + optional auth
- Dark/light mode toggle
- Voice WS auto-reconnect
- Accessibility improvements
- Real backend stats in Header
- Testing infrastructure
- Docker Ollama service

### v2.5.0 Highlights
- Tool execution to AI core
- Enhanced command router
- Cross-session memory
- Autonomous learning
- Markdown rendering
- Message search
- Ollama API migration

---

## License

Built by Zingri_Master. All rights reserved.
