"""
Memory System — Episodic, Semantic, Procedural
Stores and retrieves memories for contextual AI responses.
Enhanced with cross-session memory, importance scoring, and memory decay.
"""
import os
import json
import logging
import time
from typing import List, Dict, Optional
from pathlib import Path
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
MEMORY_DB_PATH = BASE_DIR / "data" / "memory_db"
USER_PROFILE_PATH = BASE_DIR / "data" / "user_profile.json"
LEARNED_FACTS_PATH = BASE_DIR / "data" / "ai_memory" / "learned_facts.json"


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
            LEARNED_FACTS_PATH.parent.mkdir(parents=True, exist_ok=True)
            import chromadb
            self.client = chromadb.PersistentClient(path=str(MEMORY_DB_PATH))
            self.episodic = self.client.get_or_create_collection("episodic_memory")
            self.semantic = self.client.get_or_create_collection("semantic_memory")
            self.procedural = self.client.get_or_create_collection("procedural_memory")
            self._initialized = True
            self._apply_memory_decay()
            logger.info("Memory System initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Memory System: {e}")
            raise

    def _apply_memory_decay(self):
        """Archive old memories that haven't been accessed recently."""
        try:
            cutoff = (datetime.now() - timedelta(days=90)).isoformat()
            profile = self.get_user_profile()
            archived = profile.get("archived_memories", [])
            profile["last_decay_check"] = datetime.now().isoformat()
            self.update_user_profile(profile)
        except Exception as e:
            logger.error(f"Memory decay error: {e}")

    def _calculate_importance(self, content: str, context: Optional[Dict] = None) -> float:
        """Calculate memory importance score (0.0 - 1.0)."""
        score = 0.5  # Base score

        # Longer content is generally more important
        content_len = len(content)
        if content_len > 100:
            score += 0.1
        if content_len > 500:
            score += 0.1

        # Context boosts importance
        if context:
            if context.get("topic"):
                score += 0.1
            if context.get("emotion"):
                score += 0.05
            if context.get("action_taken"):
                score += 0.1

        # Creator identity is maximum importance
        if "zingri_master" in content.lower() or "creator" in content.lower():
            score = 1.0

        return min(score, 1.0)

    def add_episodic(self, conversation: str, context: Optional[Dict] = None):
        """Store a conversation summary in episodic memory."""
        summary = conversation[:500] if len(conversation) > 500 else conversation
        timestamp = datetime.now().isoformat()
        importance = self._calculate_importance(summary, context)
        try:
            self.episodic.add(
                ids=[f"ep_{timestamp}"],
                documents=[summary],
                metadatas=[{
                    "timestamp": timestamp,
                    "type": "conversation",
                    "importance": importance,
                    "access_count": 0,
                    "last_accessed": timestamp,
                    **(context or {})
                }]
            )
        except Exception as e:
            logger.error(f"Episodic memory error: {e}")

    def add_semantic(self, fact: str, category: str = "general"):
        """Store a fact in semantic memory."""
        fact_id = f"sem_{hash(fact) & 0xFFFFFFFF:08x}"
        timestamp = datetime.now().isoformat()
        importance = self._calculate_importance(fact, {"category": category})
        try:
            self.semantic.add(
                ids=[fact_id],
                documents=[fact],
                metadatas=[{
                    "category": category,
                    "timestamp": timestamp,
                    "type": "fact",
                    "importance": importance,
                    "access_count": 0,
                    "last_accessed": timestamp,
                }]
            )
            # Also persist to learned facts file for cross-session access
            self._persist_learned_fact(fact, category)
        except Exception as e:
            logger.error(f"Semantic memory error: {e}")

    def add_procedural(self, workflow: str, steps: List[str]):
        """Store a learned workflow in procedural memory."""
        content = f"Workflow: {workflow}\nSteps: {' | '.join(steps)}"
        proc_id = f"proc_{hash(workflow) & 0xFFFFFFFF:08x}"
        timestamp = datetime.now().isoformat()
        importance = self._calculate_importance(content, {"workflow": workflow})
        try:
            self.procedural.add(
                ids=[proc_id],
                documents=[content],
                metadatas=[{
                    "workflow": workflow,
                    "timestamp": timestamp,
                    "type": "procedure",
                    "importance": importance,
                    "access_count": 0,
                    "last_accessed": timestamp,
                }]
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
                    n_results=top_k * 2,
                    include=["documents", "metadatas", "distances"]
                )
                for doc, meta, dist in zip(
                    query_results.get("documents", [[]])[0],
                    query_results.get("metadatas", [[]])[0],
                    query_results.get("distances", [[]])[0]
                ):
                    # Update access count and last accessed time
                    meta["access_count"] = meta.get("access_count", 0) + 1
                    meta["last_accessed"] = datetime.now().isoformat()

                    # Recency boost
                    recency_score = 1.0 / (1.0 + dist)
                    importance = meta.get("importance", 0.5)
                    access_boost = min(meta.get("access_count", 0) * 0.05, 0.3)
                    combined_score = recency_score * 0.5 + importance * 0.3 + access_boost * 0.2

                    results.append({
                        "type": mem_type,
                        "content": doc,
                        "metadata": meta,
                        "score": round(combined_score, 4),
                    })
            except Exception as e:
                logger.error(f"Memory retrieval error ({mem_type}): {e}")

        # Sort by combined score and return top_k
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]

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
            "user_profile": str(USER_PROFILE_PATH),
            "learned_facts_path": str(LEARNED_FACTS_PATH),
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

    def _persist_learned_fact(self, fact: str, category: str):
        """Persist a learned fact to disk for cross-session access."""
        facts = []
        if LEARNED_FACTS_PATH.exists():
            try:
                facts = json.loads(LEARNED_FACTS_PATH.read_text())
            except Exception:
                pass

        # Avoid duplicates
        if fact not in [f.get("content", "") for f in facts]:
            facts.append({
                "content": fact,
                "category": category,
                "learned_at": datetime.now().isoformat(),
                "access_count": 0,
            })
            # Keep only last 100 facts
            facts = facts[-100:]
            LEARNED_FACTS_PATH.parent.mkdir(parents=True, exist_ok=True)
            LEARNED_FACTS_PATH.write_text(json.dumps(facts, indent=2))

    def learn_fact(self, fact: str, category: str = "general"):
        """Public method to learn a new fact."""
        self.add_semantic(fact, category)

    def get_learned_facts(self, category: Optional[str] = None) -> List[Dict]:
        """Get all learned facts, optionally filtered by category."""
        facts = []
        if LEARNED_FACTS_PATH.exists():
            try:
                facts = json.loads(LEARNED_FACTS_PATH.read_text())
            except Exception:
                pass
        if category:
            facts = [f for f in facts if f.get("category") == category]
        return facts

    def forget_fact(self, fact_content: str) -> bool:
        """Remove a learned fact."""
        facts = self.get_learned_facts()
        original_len = len(facts)
        facts = [f for f in facts if f.get("content") != fact_content]
        if len(facts) < original_len:
            LEARNED_FACTS_PATH.write_text(json.dumps(facts, indent=2))
            return True
        return False

    def get_conversation_history(self, limit: int = 20) -> List[Dict]:
        """Get recent conversation history from episodic memory."""
        try:
            results = self.episodic.get(
                include=["documents", "metadatas"],
                limit=limit
            )
            conversations = []
            for doc, meta in zip(
                results.get("documents", []),
                results.get("metadatas", [])
            ):
                conversations.append({
                    "content": doc,
                    "metadata": meta,
                })
            conversations.sort(key=lambda x: x.get("metadata", {}).get("timestamp", ""), reverse=True)
            return conversations[:limit]
        except Exception as e:
            logger.error(f"Conversation history error: {e}")
            return []

    def get_workflows(self) -> List[Dict]:
        """Get all stored procedural workflows."""
        try:
            results = self.procedural.get(
                include=["documents", "metadatas"]
            )
            workflows = []
            for doc, meta in zip(
                results.get("documents", []),
                results.get("metadatas", [])
            ):
                workflows.append({
                    "content": doc,
                    "metadata": meta,
                })
            return workflows
        except Exception as e:
            logger.error(f"Workflow retrieval error: {e}")
            return []
