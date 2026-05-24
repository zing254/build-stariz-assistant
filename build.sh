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
from stariz_tools.system_tools import SystemTools
from stariz_tools.file_tools import FileTools
from stariz_tools.image_tools import ImageTools
from stariz_tools.data_tools import DataTools
from stariz_tools.rag_engine import RAGEngine
from stariz_tools.memory_system import MemorySystem
from stariz_tools.command_router import CommandRouter
print('  ✓ All backend modules imported successfully')
print(f'  ✓ RAGEngine: available')
print(f'  ✓ MemorySystem: available')
print(f'  ✓ Command Router: {len(CommandRouter.WIDGET_COMMANDS)} widget commands, {len(CommandRouter.SYSTEM_COMMANDS)} system commands')
"

echo ""
echo "Production build complete!"
echo "  Frontend: dist/index.html"
echo "  Backend: backend/main.py"
echo ""
echo "Deploy with: ./start.sh"
