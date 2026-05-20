"""
Memory System — Episodic, Semantic, Procedural
Stores and retrieves memories for contextual AI responses.
"""
import os
import json
import logging
from typing import List, Dict, Optional
from pathlib import Path
from datetime import datetime

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
MEMORY_DB_PATH = BASE_DIR / "data" / "memory_db"
USER_PROFILE_PATH = BASE_DIR / "data" / "user_profile.json"


class MemorySystem:
    _instance = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        try:
            MEMORY_DB_PATH.mkdir(parents=True, exist_ok=True)
            import chromadb
            self.client = chromadb.PersistentClient(path=str(MEMORY_DB_PATH))
            self.episodic = self.client.get_or_create_collection("episodic_memory")
            self.semantic = self.client.get_or_create_collection("semantic_memory")
            self.procedural = self.client.get_or_create_collection("procedural_memory")
            self._initialized = True
            logger.info("Memory System initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Memory System: {e}")
            raise

    def add_episodic(self, conversation: str, context: Optional[Dict] = None):
        """Store a conversation summary in episodic memory."""
        summary = conversation[:500] if len(conversation) > 500 else conversation
        timestamp = datetime.now().isoformat()
        try:
            self.episodic.add(
                ids=[f"ep_{timestamp}"],
                documents=[summary],
                metadatas=[{"timestamp": timestamp, "type": "conversation", **(context or {})}]
            )
        except Exception as e:
            logger.error(f"Episodic memory error: {e}")

    def add_semantic(self, fact: str, category: str = "general"):
        """Store a fact in semantic memory."""
        fact_id = f"sem_{hash(fact) & 0xFFFFFFFF:08x}"
        timestamp = datetime.now().isoformat()
        try:
            self.semantic.add(
                ids=[fact_id],
                documents=[fact],
                metadatas=[{"category": category, "timestamp": timestamp, "type": "fact"}]
            )
        except Exception as e:
            logger.error(f"Semantic memory error: {e}")

    def add_procedural(self, workflow: str, steps: List[str]):
        """Store a learned workflow in procedural memory."""
        content = f"Workflow: {workflow}\nSteps: {' | '.join(steps)}"
        proc_id = f"proc_{hash(workflow) & 0xFFFFFFFF:08x}"
        timestamp = datetime.now().isoformat()
        try:
            self.procedural.add(
                ids=[proc_id],
                documents=[content],
                metadatas=[{"workflow": workflow, "timestamp": timestamp, "type": "procedure"}]
            )
        except Exception as e:
            logger.error(f"Procedural memory error: {e}")

    def retrieve_relevant(self, query: str, memory_type: str = "all",
                          top_k: int = 3) -> List[Dict]:
        """Retrieve relevant memories across specified memory types."""
        results = []
        collections = []
        if memory_type in ["episodic", "all"]:
            collections.append(("episodic", self.episodic))
        if memory_type in ["semantic", "all"]:
            collections.append(("semantic", self.semantic))
        if memory_type in ["procedural", "all"]:
            collections.append(("procedural", self.procedural))

        for mem_type, collection in collections:
            try:
                query_results = collection.query(
                    query_texts=[query],
                    n_results=top_k,
                    include=["documents", "metadatas"]
                )
                for doc, meta in zip(
                    query_results.get("documents", [[]])[0],
                    query_results.get("metadatas", [[]])[0]
                ):
                    results.append({
                        "type": mem_type,
                        "content": doc,
                        "metadata": meta
                    })
            except Exception as e:
                logger.error(f"Memory retrieval error ({mem_type}): {e}")

        return results

    def get_user_profile(self) -> Dict:
        """Get stored user preferences."""
        if USER_PROFILE_PATH.exists():
            try:
                return json.loads(USER_PROFILE_PATH.read_text())
            except Exception:
                pass
        return self._create_default_profile()

    def update_user_profile(self, updates: Dict) -> Dict:
        """Update user preferences."""
        profile = self.get_user_profile()
        profile.update(updates)
        USER_PROFILE_PATH.parent.mkdir(parents=True, exist_ok=True)
        USER_PROFILE_PATH.write_text(json.dumps(profile, indent=2))
        return profile

    def get_memory_stats(self) -> Dict:
        """Get memory system statistics."""
        return {
            "episodic_count": self.episodic.count(),
            "semantic_count": self.semantic.count(),
            "procedural_count": self.procedural.count(),
            "user_profile": str(USER_PROFILE_PATH)
        }

    def _create_default_profile(self) -> Dict:
        """Create default user profile."""
        profile = {
            "name": "User",
            "timezone": "UTC",
            "preferred_tone": "professional",
            "preferred_model": "qwen3:4b",
            "work_hours": {"start": "09:00", "end": "18:00"},
            "frequent_commands": [],
            "projects": [],
            "contacts": [],
            "created_at": datetime.now().isoformat()
        }
        USER_PROFILE_PATH.parent.mkdir(parents=True, exist_ok=True)
        USER_PROFILE_PATH.write_text(json.dumps(profile, indent=2))
        return profile
