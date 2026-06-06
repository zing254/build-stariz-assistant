import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "service" in data
    assert "status" in data


def test_system_stats():
    response = client.get("/api/system/stats")
    assert response.status_code == 200
    data = response.json()
    assert "cpu_percent" in data or "error" in data


def test_ai_session():
    response = client.get("/api/ai/session")
    assert response.status_code in (200, 503)
    if response.status_code == 200:
        data = response.json()
        assert "session_id" in data


def test_system_info():
    response = client.get("/api/tools/system/info")
    assert response.status_code == 200


def test_memory_stats():
    response = client.get("/api/memory/stats")
    assert response.status_code in (200, 503)


def test_rag_stats():
    response = client.get("/api/rag/stats")
    assert response.status_code in (200, 503)


def test_log_sources():
    response = client.get("/api/logs/sources")
    assert response.status_code == 200
