# STARIZ AI Assistant - Multi-stage Docker Build
# Stage 1: Build the frontend
FROM node:20-alpine as frontend-builder

WORKDIR /app/frontend

# Copy package files
COPY package*.json ./
COPY package-lock.json* ./

# Install dependencies
RUN npm ci || npm install

# Copy frontend source
COPY . .

# Build the frontend
RUN npm run build

# Stage 2: Build the Python backend
FROM python:3.12-slim as backend-builder

WORKDIR /app/backend

# Install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./

# Stage 3: Production setup
FROM python:3.12-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend from builder
COPY --from=backend-builder /app/backend ./backend
COPY --from=backend-builder /usr/local/lib/python3.12/site-packages ./venv/lib/python3.12/site-packages

# Copy frontend build from builder
COPY --from=frontend-builder /app/dist ./frontend

# Copy package files for any additional setup
COPY package*.json ./

# Set environment variables
ENV PYTHONPATH=/app/backend
ENV PYTHONUNBUFFERED=1

# Expose ports
EXPOSE 8000
EXPOSE 3000

# Create startup script
RUN echo '#!/bin/sh\n\
cd /app/backend\n\
python main.py &\n\
cd /app/frontend\n\
npx serve -s . -l 3000 &\n\
wait' > /app/start.sh && chmod +x /app/start.sh

# Default command
CMD ["/app/start.sh"]
