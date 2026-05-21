# STARIZ AI Assistant - Production Docker Build
# Stage 1: Build the frontend
FROM node:20-alpine as frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY package-lock.json* ./

# Install dependencies
RUN npm ci || npm install

# Copy frontend source
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./
COPY vite.config.ts ./
COPY tsconfig*.json ./

# Build the frontend
RUN npm run build

# Stage 2: Python backend with dependencies
FROM python:3.12-slim as backend-builder

WORKDIR /app

# Install system dependencies needed for Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ make cmake \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Stage 3: Production runtime
FROM python:3.12-slim

LABEL maintainer="Zingri_Master"
LABEL description="STARIZ AI Assistant - Production"

WORKDIR /app

# Install runtime system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder
COPY --from=backend-builder /install /usr/local

# Copy backend source
COPY backend/ ./backend/

# Copy frontend build from builder
COPY --from=frontend-builder /app/dist ./dist/

# Set environment variables
ENV PYTHONPATH=/app/backend
ENV PYTHONUNBUFFERED=1
ENV STARIZ_MODEL=qwen3:4b
ENV NODE_ENV=production

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start the application
CMD ["python", "backend/main.py"]
