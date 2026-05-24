# Deployment Guide — STARIZ AI Assistant v2.7.0

## Free Deployment Options

### Frontend: Vercel (Free) ✅ Already Deployed
- **URL**: https://build-stariz-assistant.vercel.app
- **Cost**: $0 (free tier)
- **Limits**: 100GB bandwidth/month, serverless functions

### Backend: Render (Free)
- **Cost**: $0 (free tier)
- **Limits**: 512MB RAM, 0.1 CPU, spins down after 15min idle
- **Setup**: See instructions below

### Backend Alternative: Koyeb (Free)
- **Cost**: $0 (free tier)
- **Limits**: 512MB RAM, 0.1 CPU, always-on
- **Setup**: Similar to Render

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
| `STARIZ_MODEL` | `qwen3:4b` |
| `OLLAMA_URL` | Your Ollama server URL (see below) |
| `LOG_LEVEL` | `info` |

### Step 4: Ollama Server (Required)
Render free tier doesn't support running Ollama. Options:

**Option A: Use a Cloud Ollama Provider**
- [Groq](https://groq.com) - Free API, compatible with Ollama format
- [Together AI](https://together.ai) - Free credits
- Update `OLLAMA_URL` to point to their API

**Option B: Self-Host Ollama**
- Run Ollama on your local machine
- Use ngrok to expose it: `ngrok http 11434`
- Set `OLLAMA_URL` to the ngrok URL

**Option C: Use OpenRouter (Free Models)**
- Some models are free on OpenRouter
- Modify `ai_core.py` to use OpenRouter API

### Step 5: Deploy
1. Click **Create Web Service**
2. Wait for build (~2-3 minutes)
3. Copy the service URL (e.g., `https://stariz-backend.onrender.com`)

### Step 6: Update Frontend
Set the backend URL in Vercel:
1. Go to Vercel dashboard → Your project → Settings → Environment Variables
2. Add: `VITE_PYTHON_BACKEND_URL=https://stariz-backend.onrender.com`
3. Redeploy frontend

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
# Start everything
./start.sh

# Or manually:
# Terminal 1: Backend
cd backend && python main.py

# Terminal 2: Frontend
npm run dev
```

---

## Production Build

```bash
./build.sh
# Output: dist/index.html (single file, ~720KB, gzip ~204KB)
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
| `OLLAMA_URL` | `http://localhost:11434` | ✅ | Ollama server URL |
| `STARIZ_MODEL` | `qwen3:4b` | ✅ | AI model name |
| `VITE_PYTHON_BACKEND_URL` | `http://localhost:8000` | ✅ (frontend) | Backend URL |
| `STARIZ_API_TOKEN` | _(empty)_ | ❌ | API auth token |
| `LOG_LEVEL` | `info` | ❌ | Logging level |
| `PYTHONUNBUFFERED` | `1` | ❌ | Python output |

See `.env.example` for a complete template.

---

## Troubleshooting

### Backend won't start on Render
- Check logs in Render dashboard
- Ensure `backend/requirements.txt` is in the repo root
- Verify Python version is 3.12+

### Frontend can't connect to backend
- Check `VITE_PYTHON_BACKEND_URL` is set correctly
- Ensure backend is running and accessible
- Check CORS settings in `main.py`

### Ollama not available
- Free tier Render can't run Ollama locally
- Use a cloud provider or self-host with ngrok
- Consider using Groq or Together AI as alternatives

### Build fails on Vercel
- Ensure `--legacy-peer-deps` is in `vercel.json`
- Check Node.js version compatibility
- Clear build cache in Vercel dashboard
