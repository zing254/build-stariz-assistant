#!/bin/bash
# STARIZ GODMODE — Startup Script
# Starts both backend and frontend with proper health checks

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║           STARIZ AI Assistant — GODMODE                ║"
echo "║              Created by Zingri_Master                   ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Check Ollama
echo "[1/5] Checking Ollama..."
if command -v ollama &> /dev/null; then
    if ollama list 2>/dev/null | grep -q "qwen3:4b"; then
        echo "  ✓ Ollama running with qwen3:4b"
    else
        echo "  ⚠ qwen3:4b not found. Run: ollama pull qwen3:4b"
    fi
else
    echo "  ✗ Ollama not installed. Install at https://ollama.ai"
    exit 1
fi

# Check Python venv
echo "[2/5] Checking Python environment..."
if [ ! -d ".venv" ]; then
    echo "  Creating Python virtual environment..."
    python3 -m venv .venv
fi
source .venv/bin/activate

# Install dependencies if needed
if ! .venv/bin/python -c "import vosk" 2>/dev/null; then
    echo "  Installing Python dependencies..."
    pip install -r backend/requirements.txt -q
fi
echo "  ✓ Python environment ready"

# Check voice models
echo "[3/5] Checking voice models..."
if [ -d "backend/models/vosk/vosk-model-small-en-us-0.15" ]; then
    echo "  ✓ Vosk STT model found"
else
    echo "  ⚠ Vosk model not found — will download on first run"
fi
if [ -f "backend/models/piper/en_US-lessac-medium.onnx" ]; then
    echo "  ✓ Piper TTS model found"
else
    echo "  ⚠ Piper model not found — will download on first run"
fi

# Start backend
echo "[4/5] Starting backend..."
cd backend
nohup .venv/../bin/python main.py > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

echo "  Waiting for backend to start..."
for i in $(seq 1 30); do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "  ✓ Backend ready (PID: $BACKEND_PID)"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "  ✗ Backend failed to start. Check backend.log"
        exit 1
    fi
    sleep 1
done

# Start frontend
echo "[5/5] Starting frontend..."
nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

echo "  Waiting for frontend to start..."
for i in $(seq 1 30); do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo "  ✓ Frontend ready (PID: $FRONTEND_PID)"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "  ✗ Frontend failed to start. Check frontend.log"
        exit 1
    fi
    sleep 1
done

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  STARIZ GODMODE is running!                             ║"
echo "║                                                         ║"
echo "║  Frontend: http://localhost:5173                        ║"
echo "║  Backend:  http://localhost:8000                        ║"
echo "║  API Docs: http://localhost:8000/docs                   ║"
echo "║                                                         ║"
echo "║  Press Ctrl+C to stop                                   ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "To stop: kill $BACKEND_PID $FRONTEND_PID"
echo ""

# Wait for interrupt
trap "echo 'Stopping STARIZ...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
