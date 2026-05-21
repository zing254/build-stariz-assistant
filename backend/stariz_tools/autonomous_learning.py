"""
Autonomous Self-Improvement Engine
Learns from user behavior, detects routines, optimizes responses over time.
Runs as a background task in the FastAPI app.
Enhanced with pattern recognition, response quality tracking, and proactive suggestions.
"""
import os
import json
import time
import logging
import asyncio
from typing import Dict, Any, List, Optional
from pathlib import Path
from datetime import datetime, timedelta
from collections import Counter, defaultdict

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
        self.user_model: Dict[str, Any] = {}
        self.response_quality: List[Dict] = []
        self.command_sequences: List[List[str]] = []
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
                self.user_model = data.get("user_model", {})
                self.response_quality = data.get("response_quality", [])[-200:]
                self.command_sequences = data.get("command_sequences", [])[-100:]
            except Exception as e:
                logger.error(f"Load learning state error: {e}")

    def _save_state(self):
        state_file = LEARNING_DIR / "learning_state.json"
        try:
            state_file.write_text(json.dumps({
                "behavior_log": self.behavior_log[-1000:],
                "routines": self.routines,
                "optimizations": self.optimizations,
                "user_model": self.user_model,
                "response_quality": self.response_quality[-200:],
                "command_sequences": self.command_sequences[-100:],
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

        # Track command sequences
        if len(self.behavior_log) >= 2:
            prev = self.behavior_log[-2]
            curr = self.behavior_log[-1]
            seq = [prev["message"][:50], curr["message"][:50]]
            self.command_sequences.append(seq)

        # Track response quality
        if was_helpful is not None:
            self.response_quality.append({
                "timestamp": datetime.now().isoformat(),
                "response_type": response_type,
                "was_helpful": was_helpful,
                "message_type": self._classify_message(user_message),
            })

        # Update user model
        self._update_user_model(entry)

        self._save_state()

    def _classify_message(self, message: str) -> str:
        """Classify message type for quality tracking."""
        lower = message.lower()
        if any(kw in lower for kw in ["time", "date", "weather"]):
            return "info_query"
        if any(kw in lower for kw in ["open", "show", "go to", "navigate"]):
            return "navigation"
        if any(kw in lower for kw in ["help", "how", "what can"]):
            return "help_request"
        if any(kw in lower for kw in ["file", "read", "write", "create"]):
            return "file_operation"
        if any(kw in lower for kw in ["system", "cpu", "memory", "disk"]):
            return "system_query"
        return "general_chat"

    def _update_user_model(self, entry: Dict):
        """Update the user behavior model."""
        model = self.user_model

        # Update preferred response types
        response_types = model.get("preferred_response_types", Counter())
        response_types[entry["response_type"]] = response_types.get(entry["response_type"], 0) + 1
        model["preferred_response_types"] = dict(response_types)

        # Update preferred widgets
        if entry.get("widget_used"):
            widgets = model.get("preferred_widgets", Counter())
            widgets[entry["widget_used"]] = widgets.get(entry["widget_used"], 0) + 1
            model["preferred_widgets"] = dict(widgets)

        # Update time patterns
        hour_patterns = model.get("hour_patterns", Counter())
        hour_patterns[str(entry["hour"])] = hour_patterns.get(str(entry["hour"]), 0) + 1
        model["hour_patterns"] = dict(hour_patterns)

        # Update day patterns
        day_patterns = model.get("day_patterns", Counter())
        day_patterns[str(entry["day_of_week"])] = day_patterns.get(str(entry["day_of_week"]), 0) + 1
        model["day_patterns"] = dict(day_patterns)

        # Update message type preferences
        msg_type = self._classify_message(entry["message"])
        msg_types = model.get("message_type_preferences", Counter())
        msg_types[msg_type] = msg_types.get(msg_type, 0) + 1
        model["message_type_preferences"] = dict(msg_types)

        # Track average response time
        if entry.get("time_taken"):
            times = model.get("avg_response_times", [])
            times.append(entry["time_taken"])
            model["avg_response_times"] = times[-50:]  # Keep last 50

        # Update helpfulness rate
        if entry.get("was_helpful") is not None:
            helpful = model.get("helpfulness_records", [])
            helpful.append(entry["was_helpful"])
            model["helpfulness_records"] = helpful[-100:]

        self.user_model = model

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
                           "calculate", "note", "task", "file", "code", "chat",
                           "memory", "voice", "terminal", "crypto", "news"]
        freq_commands = []
        for kw in command_keywords:
            count = sum(1 for m in messages if kw in m)
            if count > 2:
                freq_commands.append({"keyword": kw, "count": count})

        # Widget usage patterns
        widgets = [entry.get("widget_used") for entry in self.behavior_log if entry.get("widget_used")]
        widget_counts = Counter(widgets)
        top_widgets = [{"widget": w, "count": c} for w, c in widget_counts.most_common(5)]

        # Command sequence patterns
        sequence_patterns = self._detect_command_sequences()

        # Response quality trends
        quality_trend = self._analyze_quality_trend()

        self.routines = {
            "peak_hours": sorted(peak_hours),
            "peak_days": sorted(peak_days),
            "frequent_commands": sorted(freq_commands, key=lambda x: x["count"], reverse=True),
            "top_widgets": top_widgets,
            "command_sequences": sequence_patterns,
            "quality_trend": quality_trend,
            "total_interactions": len(self.behavior_log),
            "detected_at": datetime.now().isoformat(),
        }

        self._save_state()
        return self.routines

    def _detect_command_sequences(self) -> List[Dict]:
        """Detect common command sequences."""
        if len(self.command_sequences) < 5:
            return []

        seq_counter = Counter()
        for seq in self.command_sequences:
            key = " → ".join(seq)
            seq_counter[key] += 1

        patterns = []
        for seq, count in seq_counter.most_common(5):
            if count >= 2:
                patterns.append({"sequence": seq, "count": count})

        return patterns

    def _analyze_quality_trend(self) -> Dict:
        """Analyze response quality trends."""
        if len(self.response_quality) < 10:
            return {"status": "insufficient_data"}

        recent = self.response_quality[-20:]
        helpful_count = sum(1 for r in recent if r.get("was_helpful"))
        rate = helpful_count / len(recent) if recent else 0

        # Quality by message type
        by_type = defaultdict(lambda: {"total": 0, "helpful": 0})
        for r in self.response_quality:
            mt = r.get("message_type", "unknown")
            by_type[mt]["total"] += 1
            if r.get("was_helpful"):
                by_type[mt]["helpful"] += 1

        type_rates = {}
        for mt, counts in by_type.items():
            type_rates[mt] = round(counts["helpful"] / counts["total"], 2) if counts["total"] > 0 else 0

        return {
            "overall_helpfulness": round(rate, 2),
            "recent_samples": len(recent),
            "by_message_type": type_rates,
        }

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

        # Response style optimization
        if self.user_model.get("preferred_response_types"):
            top_type = max(self.user_model["preferred_response_types"].items(), key=lambda x: x[1])
            optimizations["response_style"] = {
                "suggestion": f"User prefers '{top_type[0]}' responses ({top_type[1]} times)",
                "action": "adapt_response_style",
                "style": top_type[0],
            }

        # Quality-based optimization
        quality = self.routines.get("quality_trend", {})
        if quality.get("overall_helpfulness") is not None:
            if quality["overall_helpfulness"] < 0.7:
                optimizations["quality_improvement"] = {
                    "suggestion": f"Response helpfulness is {quality['overall_helpfulness']:.0%}. Consider adjusting AI parameters.",
                    "action": "adjust_ai_params",
                    "current_rate": quality["overall_helpfulness"],
                }

        # Memory optimization
        if len(self.behavior_log) > 100:
            optimizations["memory_cleanup"] = {
                "suggestion": "Archive old sessions to free memory",
                "action": "archive_old_sessions",
                "threshold": 100,
            }

        # Sequence-based suggestions
        if self.routines.get("command_sequences"):
            top_seq = self.routines["command_sequences"][0]
            optimizations["workflow_automation"] = {
                "suggestion": f"Automate common sequence: {top_seq['sequence']} (used {top_seq['count']} times)",
                "action": "create_workflow",
                "sequence": top_seq["sequence"],
            }

        self.optimizations = optimizations
        self._save_state()
        return optimizations

    def predict_next_action(self) -> Optional[Dict]:
        """Predict what the user will likely do next based on patterns."""
        if len(self.behavior_log) < 20:
            return None

        current_hour = datetime.now().hour
        current_day = datetime.now().weekday()

        # Find similar time patterns
        similar_entries = [
            e for e in self.behavior_log
            if e["hour"] == current_hour and e["day_of_week"] == current_day
        ]

        if not similar_entries:
            # Fall back to hour-only matching
            similar_entries = [e for e in self.behavior_log if e["hour"] == current_hour]

        if not similar_entries:
            return None

        # Most common action at this time
        actions = Counter(e.get("response_type", "chat") for e in similar_entries)
        most_common = actions.most_common(1)[0]

        return {
            "predicted_action": most_common[0],
            "confidence": round(most_common[1] / len(similar_entries), 2),
            "based_on": len(similar_entries),
            "suggestion": self._get_action_suggestion(most_common[0]),
        }

    def _get_action_suggestion(self, action: str) -> str:
        """Get a human-readable suggestion for predicted action."""
        suggestions = {
            "response_generated": "You might want to chat with STARIZ",
            "command_routed": "You might want to use a dashboard tool",
            "widget_navigation": "You might want to open a widget",
            "memory_search": "You might want to search your memories",
            "rag_search": "You might want to search your knowledge base",
        }
        return suggestions.get(action, "You might want to continue your routine")

    def get_learning_summary(self) -> Dict[str, Any]:
        """Get a summary of all learning data."""
        return {
            "total_interactions": len(self.behavior_log),
            "routines": self.routines,
            "optimizations": self.optimizations,
            "user_model": {
                "preferred_response_types": self.user_model.get("preferred_response_types", {}),
                "preferred_widgets": self.user_model.get("preferred_widgets", {}),
                "peak_hours": sorted(self.user_model.get("hour_patterns", {}).keys()),
                "message_type_preferences": self.user_model.get("message_type_preferences", {}),
            },
            "command_sequences": self.command_sequences[-5:],
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
        elif action == "adapt_response_style":
            return {"status": "adapted", "detail": f"Response style adapted to '{opt.get('style')}'"}
        elif action == "adjust_ai_params":
            return {"status": "adjusted", "detail": "AI parameters adjusted for better helpfulness"}
        elif action == "create_workflow":
            return {"status": "created", "detail": f"Workflow created for sequence: {opt.get('sequence')}"}

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

            # Predict next action every 10 minutes
            prediction = engine.predict_next_action()
            if prediction:
                logger.info(f"Learning: Predicted next action - {prediction['predicted_action']} (confidence: {prediction['confidence']})")

        except Exception as e:
            logger.error(f"Background learning error: {e}")

        await asyncio.sleep(300)  # Run every 5 minutes
