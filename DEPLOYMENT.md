# Deployment Guide — STARIZ AI Assistant v3.0.0

## Free Deployment Options

### Frontend: Vercel (Free) ✅ Auto-Deployed
- **URL**: https://build-stariz-assistant.vercel.app
- **Auto-deploy**: Push to `main` branch triggers automatic deployment
- **Cost**: $0 (free tier)
- **Limits**: 100GB bandwidth/month, serverless functions

### Backend: Render or Koyeb (Free)
Two backend AI options:

**Option A: OpenRouter API (Recommended for free deployment)**
- Set `STARIZ_USE_OPENROUTER=true` and `OPENROUTER_API_KEY` — no Ollama needed
- Works on any hosting platform (Render, Koyeb, Railway, Fly.io)

**Option B: Ollama (Requires GPU/server with Ollama)**
- Needs a server running Ollama (see Ollama section below)

---

## Deploy Backend to Render (Free)

### Step 1: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub
3. Connect your repository

### Step 2: Create Web Service
1. Click **New +** → **Web Service**
2. Connect your GitHub repo `build-stariz-assistant`
3. Configure:
   - **Name**: `stariz-backend`
   - **Region**: Oregon (closest to you)
   - **Branch**: `main`
   - **Root Directory**: Leave blank
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && python main.py`
   - **Plan**: **Free**

### Step 3: Set Environment Variables
In Render dashboard → Environment tab:

| Variable | Value |
|----------|-------|
| `STARIZ_USE_OPENROUTER` | `true` |
| `OPENROUTER_API_KEY` | `sk-or-v1-...` (your key) |
| `OPENROUTER_MODEL` | `openrouter/auto` (or specific model) |
| `LOG_LEVEL` | `info` |
| `CORS_ORIGINS` | `https://build-stariz-assistant.vercel.app` |

### Step 4: Deploy
1. Click **Create Web Service**
2. Wait for build (~2-3 minutes)
3. Copy the service URL (e.g., `https://stariz-backend.onrender.com`)

### Step 5: Link Frontend
1. Go to Vercel dashboard → Your project → Settings → Environment Variables
2. Add: `VITE_PYTHON_BACKEND_URL=https://stariz-backend.onrender.com`
3. Redeploy frontend (or push to main for auto-deploy)

---

## Deploy Backend to Koyeb (Free)

### Step 1: Create Koyeb Account
1. Go to https://koyeb.com
2. Sign up with GitHub

### Step 2: Create App
1. Click **Create App**
2. Select your GitHub repo
3. Configure:
   - **Name**: `stariz-backend`
   - **Region**: Washington D.C.
   - **Instance Type**: **Free**
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Run Command**: `cd backend && python main.py`
   - **Port**: `8000`

### Step 3: Set Environment Variables
Same as Render (Step 3 above)

### Step 4: Deploy
1. Click **Deploy**
2. Wait for build (~2-3 minutes)
3. Copy the app URL

---

## Local Development

```bash
# Start everything (requires Ollama)
./start.sh

# Or manually:
# Terminal 1: Backend (Ollama or OpenRouter)
cd backend && python main.py

# Terminal 2: Frontend
npm run dev
```

## Production Build

```bash
./build.sh
# Output: dist/index.html (single file, ~728KB, gzip ~204KB)
```

---

## Docker Deployment

```bash
docker compose up -d
```

Includes: Backend (FastAPI on port 8000) + Ollama (LLM on port 11434) + Redis (caching on port 6379)
Requires: [Docker](https://docs.docker.com/engine/install/) and [Docker Compose](https://docs.docker.com/compose/install/)

---

## Environment Variables Reference

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `OLLAMA_URL` | `http://localhost:11434` | ❌* | Ollama server URL |
| `STARIZ_MODEL` | `Tinyllama:latest` | ❌* | Ollama AI model name |
| `STARIZ_USE_OPENROUTER` | `false` | ❌ | Set `true` to use OpenRouter instead of Ollama |
| `OPENROUTER_API_KEY` | _(empty)_ | ❌* | OpenRouter API key |
| `OPENROUTER_MODEL` | `openrouter/auto` | ❌ | OpenRouter model to use |
| `VITE_PYTHON_BACKEND_URL` | `http://localhost:8000` | ✅ (frontend) | Backend URL |
| `STARIZ_API_TOKEN` | _(empty)_ | ❌ | API auth token |
| `LOG_LEVEL` | `info` | ❌ | Logging level |
| `PYTHONUNBUFFERED` | `1` | ❌ | Python output |
| `CORS_ORIGINS` | `*` | ❌ | Comma-separated allowed origins |
| `CSP_ENABLED` | `false` | ❌ | Enable Content Security Policy |

\* Either Ollama OR OpenRouter config is required.

See `.env.example` for a complete template.

---

## Troubleshooting

### Backend won't start on Render
- Check logs in Render dashboard
- Ensure `backend/requirements.txt` is in the repo root
- Verify Python version is 3.12+
- If using OpenRouter, verify `OPENROUTER_API_KEY` is set

### Frontend can't connect to backend
- Check `VITE_PYTHON_BACKEND_URL` is set correctly
- Ensure backend is running and accessible
- Check CORS settings — set `CORS_ORIGINS` to your frontend URL

### Ollama not available
- Free tier Render can't run Ollama locally
- Use OpenRouter instead: set `STARIZ_USE_OPENROUTER=true`

### Build fails on Vercel
- Ensure `--legacy-peer-deps` is in `vercel.json`
- Check Node.js version compatibility
- Clear build cache in Vercel dashboard
