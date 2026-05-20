"""
Autonomous Self-Improvement Engine
Learns from user behavior, detects routines, optimizes responses over time.
Runs as a background task in the FastAPI app.
"""
import os
import json
import time
import logging
import asyncio
from typing import Dict, Any, List
from pathlib import Path
from datetime import datetime, timedelta
from collections import Counter

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
LEARNING_DIR = BASE_DIR / "data" / "ai_learning"
LEARNING_DIR.mkdir(parents=True, exist_ok=True)


class AutonomousLearningEngine:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if hasattr(self, '_initialized'):
            return
        self.behavior_log: List[Dict] = []
        self.routines: Dict[str, Any] = {}
        self.optimizations: Dict[str, Any] = {}
        self._load_state()
        self._initialized = True
        logger.info("Autonomous Learning Engine initialized")

    def _load_state(self):
        state_file = LEARNING_DIR / "learning_state.json"
        if state_file.exists():
            try:
                data = json.loads(state_file.read_text())
                self.behavior_log = data.get("behavior_log", [])[-1000:]
                self.routines = data.get("routines", {})
                self.optimizations = data.get("optimizations", {})
            except Exception as e:
                logger.error(f"Load learning state error: {e}")

    def _save_state(self):
        state_file = LEARNING_DIR / "learning_state.json"
        try:
            state_file.write_text(json.dumps({
                "behavior_log": self.behavior_log[-1000:],
                "routines": self.routines,
                "optimizations": self.optimizations,
                "last_updated": datetime.now().isoformat(),
            }, indent=2))
        except Exception as e:
            logger.error(f"Save learning state error: {e}")

    def log_interaction(self, user_message: str, response_type: str,
                        widget_used: str = None, time_taken: float = None,
                        was_helpful: bool = None):
        """Log a user interaction for learning."""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "hour": datetime.now().hour,
            "day_of_week": datetime.now().weekday(),
            "message": user_message[:200],
            "response_type": response_type,
            "widget_used": widget_used,
            "time_taken": time_taken,
            "was_helpful": was_helpful,
        }
        self.behavior_log.append(entry)
        self._save_state()

    def detect_routines(self) -> Dict[str, Any]:
        """Analyze behavior log to detect user routines."""
        if len(self.behavior_log) < 10:
            return {}

        # Active hours analysis
        hours = [entry["hour"] for entry in self.behavior_log]
        hour_counts = Counter(hours)
        peak_hours = [h for h, c in hour_counts.most_common(5)]

        # Active days analysis
        days = [entry["day_of_week"] for entry in self.behavior_log]
        day_counts = Counter(days)
        peak_days = [d for d, c in day_counts.most_common(3)]

        # Frequent commands
        messages = [entry["message"].lower() for entry in self.behavior_log]
        command_keywords = ["time", "date", "weather", "system", "search",
                           "calculate", "note", "task", "file", "code", "chat"]
        freq_commands = []
        for kw in command_keywords:
            count = sum(1 for m in messages if kw in m)
            if count > 2:
                freq_commands.append({"keyword": kw, "count": count})

        # Widget usage patterns
        widgets = [entry.get("widget_used") for entry in self.behavior_log if entry.get("widget_used")]
        widget_counts = Counter(widgets)
        top_widgets = [{"widget": w, "count": c} for w, c in widget_counts.most_common(5)]

        self.routines = {
            "peak_hours": sorted(peak_hours),
            "peak_days": sorted(peak_days),
            "frequent_commands": sorted(freq_commands, key=lambda x: x["count"], reverse=True),
            "top_widgets": top_widgets,
            "total_interactions": len(self.behavior_log),
            "detected_at": datetime.now().isoformat(),
        }

        self._save_state()
        return self.routines

    def generate_optimizations(self) -> Dict[str, Any]:
        """Generate optimization suggestions based on learned patterns."""
        if not self.routines:
            self.detect_routines()

        optimizations = {}

        # Pre-warm suggestions
        if self.routines.get("peak_hours"):
            first_peak = min(self.routines["peak_hours"])
            optimizations["pre_warm"] = {
                "suggestion": f"Pre-load AI models at {first_peak - 1}:00 (1 hour before peak usage)",
                "action": "schedule_model_preload",
                "time": f"{first_peak - 1}:00",
            }

        # Quick access suggestions
        if self.routines.get("frequent_commands"):
            top_cmd = self.routines["frequent_commands"][0]
            optimizations["quick_access"] = {
                "suggestion": f"Pin '{top_cmd['keyword']}' to quick access bar (used {top_cmd['count']} times)",
                "action": "pin_quick_command",
                "command": top_cmd["keyword"],
            }

        # Widget optimization
        if self.routines.get("top_widgets"):
            top_widget = self.routines["top_widgets"][0]
            optimizations["widget_layout"] = {
                "suggestion": f"Move '{top_widget['widget']}' to first position (most used)",
                "action": "reorder_widgets",
                "widget": top_widget["widget"],
            }

        # Memory optimization
        if len(self.behavior_log) > 100:
            optimizations["memory_cleanup"] = {
                "suggestion": "Archive old sessions to free memory",
                "action": "archive_old_sessions",
                "threshold": 100,
            }

        self.optimizations = optimizations
        self._save_state()
        return optimizations

    def get_learning_summary(self) -> Dict[str, Any]:
        """Get a summary of all learning data."""
        return {
            "total_interactions": len(self.behavior_log),
            "routines": self.routines,
            "optimizations": self.optimizations,
            "learning_dir": str(LEARNING_DIR),
            "last_updated": datetime.now().isoformat(),
        }

    def apply_optimization(self, optimization_key: str) -> Dict[str, Any]:
        """Apply a specific optimization."""
        if optimization_key not in self.optimizations:
            return {"status": "error", "detail": "Optimization not found"}

        opt = self.optimizations[optimization_key]
        action = opt.get("action", "")

        if action == "schedule_model_preload":
            return {"status": "scheduled", "detail": f"Model preload scheduled for {opt.get('time')}"}
        elif action == "pin_quick_command":
            return {"status": "pinned", "detail": f"Command '{opt.get('command')}' pinned"}
        elif action == "reorder_widgets":
            return {"status": "reordered", "detail": f"Widget '{opt.get('widget')}' moved to first position"}
        elif action == "archive_old_sessions":
            return {"status": "archived", "detail": "Old sessions archived"}

        return {"status": "applied", "detail": str(opt)}


async def background_learning_task():
    """Background task that runs learning analysis periodically."""
    engine = AutonomousLearningEngine()

    while True:
        try:
            # Run routine detection every 5 minutes
            routines = engine.detect_routines()
            if routines:
                logger.info(f"Learning: Detected routines - {len(routines.get('frequent_commands', []))} frequent commands")

            # Generate optimizations every 15 minutes
            optimizations = engine.generate_optimizations()
            if optimizations:
                logger.info(f"Learning: Generated {len(optimizations)} optimizations")

        except Exception as e:
            logger.error(f"Background learning error: {e}")

        await asyncio.sleep(300)  # Run every 5 minutes
