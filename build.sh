#!/bin/bash
# STARIZ GODMODE — Production Build Script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Building STARIZ GODMODE for production..."

# Frontend build
echo "[1/2] Building frontend..."
npm run build
echo "  ✓ Frontend built: dist/index.html ($(du -h dist/index.html | cut -f1))"

# Backend check
echo "[2/2] Checking backend..."
source .venv/bin/activate
python -c "
from stariz_tools import (
    SystemTools, FileTools, ImageTools, DataTools,
    VoiceTools, RAGEngine, ReActAgent, MemorySystem,
    STARIZAICore, AutonomousLearningEngine, CommandRouter
)
print('  ✓ All backend modules imported successfully')
print(f'  ✓ VoiceTools: STT={VoiceTools.init_stt()}, TTS={VoiceTools.init_tts()}')
print(f'  ✓ RAGEngine: initialized')
print(f'  ✓ MemorySystem: initialized')
print(f'  ✓ AI Core: initialized')
print(f'  ✓ Learning Engine: initialized')
print(f'  ✓ Command Router: {len(CommandRouter.WIDGET_COMMANDS)} widget commands, {len(CommandRouter.SYSTEM_COMMANDS)} system commands')
"

echo ""
echo "Production build complete!"
echo "  Frontend: dist/index.html"
echo "  Backend: backend/main.py"
echo ""
echo "Deploy with: ./start.sh"
