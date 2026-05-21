# Changelog

All notable changes to STARIZ AI Assistant will be documented in this file.

## [2.6.0] - 2026-05-21

### Added
- AI tool response parsing with `[TOOL:tool_name]{params}` pattern
- Iterative tool execution chain in `ai_core.py`
- BM25 hybrid search (60% vector + 40% keyword) in RAG engine
- Rate limiting middleware (60 req/min per IP)
- Optional API authentication via `STARIZ_API_TOKEN` env var
- Dark/light mode toggle with CSS custom properties
- Voice WebSocket auto-reconnection with exponential backoff
- ARIA labels and focus trap in CommandPalette modal
- Real backend stats in Header (CPU/RAM from WebSocket)
- `.env.example` configuration template
- `vitest.config.ts` with jsdom environment
- `npm test` and `npm run test:watch` scripts
- Ollama service in `docker-compose.yml` with GPU support

### Fixed
- `callTool` HTTP method mismatch (POST → GET for system endpoints)
- VoiceVisualizer memory leak (missing cleanup in useEffect)
- Frontend static serving path (`frontend/dist` → `dist/`)
- Agent endpoint using legacy `/api/generate` → `/api/chat`
- Jest/vitest syntax mixing in test files
- CSS @import ordering warning in index.css
- Removed unused Python dependencies (aioredis, langchain*)

### Changed
- README.md updated to v2.6.0 with security, testing, env vars sections
- `docker-compose.yml` now includes Ollama service
- `requirements.txt` cleaned of unused packages
- Header now uses `usePythonBackend()` for real stats

## [2.5.0] - Previous Release

### Added
- Tool execution to AI core (system, file, image, data tools)
- Enhanced command router with fuzzy matching and compound commands
- Cross-session memory with importance scoring and decay
- Autonomous learning with pattern recognition and prediction
- Markdown rendering for AI responses
- Message search in AI chat
- Configurable model via `STARIZ_MODEL` env var
- Extended context window (8192 tokens, 300s timeout)

### Fixed
- Ollama API migration (`/api/generate` → `/api/chat`)
- Hardcoded model references (`llama2:7b` → `qwen3:4b`)
- Voice status endpoint initialization
- Agent execute async/sync conflict
- Path traversal security in file tools
- Raw PCM detection in voice transcription
- Infinite recursion in compound command extraction
- Streaming state update performance in AIChatGODMODE
- TypeScript strict linting errors

[2.6.0]: https://github.com/zingri/build-stariz-assistant/releases/tag/v2.6.0
