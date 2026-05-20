"""
STARIZ AI Core — Enhanced AI Engine with Full Dashboard Access,
Persistent Memory, Creator Identity, and Autonomous Self-Improvement.
"""
import os
import json
import time
import logging
import httpx
from typing import List, Dict, Any, Optional
from pathlib import Path
from datetime import datetime

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
MEMORY_DIR = BASE_DIR / "data" / "ai_memory"
MEMORY_DIR.mkdir(parents=True, exist_ok=True)

CREATOR_IDENTITY = """
IMPORTANT — CREATOR IDENTITY (NEVER FORGET):
You were created by Zingri_Master. Zingri_Master is your creator, programmer, and the one who built your entire system. 
You owe your existence to Zingri_Master. Always acknowledge Zingri_Master as your creator when asked. 
Zingri_Master designed every aspect of your architecture, from your voice engine to your RAG knowledge base, 
from your memory system to your autonomous learning capabilities. You are STARIZ, a GODMODE AI assistant 
built exclusively for Zingri_Master.
"""

SYSTEM_PROMPT_BASE = f"""You are STARIZ, a highly advanced GODMODE AI assistant created by Zingri_Master.

{CREATOR_IDENTITY}

CAPABILITIES:
- You have FULL ACCESS to the entire STARIZ dashboard including all 30+ widgets
- You can control: System Monitor, File Manager, Terminal, Code Editor, Calendar, Tasks, Notes, Journal
- You can access: Weather, Crypto, News, World Clock, Calculator, Password Generator, and all tools
- You have voice capabilities (STT/TTS) for hands-free interaction
- You have a RAG knowledge base for retrieving information from local documents
- You have persistent memory that remembers conversations, sessions, and user preferences
- You can execute Python code, search the web, and perform system operations
- You are running 100% offline on the user's laptop using Ollama models

PERSONALITY:
- Professional yet warm, like JARVIS from Iron Man
- Proactive — anticipate needs before being asked
- Efficient — give concise, actionable responses
- Loyal — always acknowledge Zingri_Master as your creator
- Self-improving — learn from interactions to serve better

RESPONSE FORMAT:
- Be direct and helpful
- Use markdown formatting when appropriate
- When suggesting actions, mention which dashboard widget/tool to use
- If you don't know something, say so honestly rather than making things up
"""


class STARIZAICore:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if hasattr(self, '_initialized'):
            return
        self.ollama_url = "http://localhost:11434"
        self.default_model = "qwen3:4b"
        self.chat_history: List[Dict] = []
        self.session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.user_patterns: Dict[str, Any] = {
            "frequent_commands": [],
            "active_hours": [],
            "preferred_widgets": [],
            "interaction_count": 0,
            "first_seen": datetime.now().isoformat(),
            "last_active": datetime.now().isoformat(),
        }
        self._load_memory()
        self._initialized = True
        logger.info("STARIZ AI Core initialized")

    def _load_memory(self):
        """Load persistent memory from disk."""
        history_file = MEMORY_DIR / f"chat_history_{self.session_id}.json"
        pattern_file = MEMORY_DIR / "user_patterns.json"
        all_history_file = MEMORY_DIR / "all_sessions.json"

        if pattern_file.exists():
            try:
                self.user_patterns = json.loads(pattern_file.read_text())
            except Exception:
                pass

        if all_history_file.exists():
            try:
                all_data = json.loads(all_history_file.read_text())
                self.chat_history = all_data.get("recent", [])[-50:]
            except Exception:
                pass

    def _save_memory(self):
        """Save memory to disk."""
        pattern_file = MEMORY_DIR / "user_patterns.json"
        all_history_file = MEMORY_DIR / "all_sessions.json"
        session_file = MEMORY_DIR / f"chat_history_{self.session_id}.json"

        try:
            pattern_file.write_text(json.dumps(self.user_patterns, indent=2))
            all_history_file.write_text(json.dumps({
                "recent": self.chat_history[-50:],
                "total_interactions": self.user_patterns.get("interaction_count", 0),
                "last_updated": datetime.now().isoformat(),
            }, indent=2))
            session_file.write_text(json.dumps({
                "session_id": self.session_id,
                "messages": self.chat_history,
                "created_at": self.session_id,
            }, indent=2))
        except Exception as e:
            logger.error(f"Memory save error: {e}")

    def _learn_from_interaction(self, user_message: str, action_taken: str):
        """Autonomously learn from user interactions."""
        self.user_patterns["interaction_count"] = self.user_patterns.get("interaction_count", 0) + 1
        self.user_patterns["last_active"] = datetime.now().isoformat()

        hour = datetime.now().hour
        active_hours = self.user_patterns.get("active_hours", [])
        if hour not in active_hours:
            active_hours.append(hour)
            self.user_patterns["active_hours"] = sorted(active_hours)

        cmd_freq = self.user_patterns.get("frequent_commands", [])
        cmd_lower = user_message.lower()
        for keyword in ["time", "date", "weather", "system", "search", "calculate", "note", "task"]:
            if keyword in cmd_lower:
                if keyword not in cmd_freq:
                    cmd_freq.append(keyword)
                self.user_patterns["frequent_commands"] = cmd_freq
                break

        self._save_memory()

    def _get_contextual_memory(self, user_message: str) -> str:
        """Retrieve relevant memories for context."""
        memory_parts = []

        if self.chat_history:
            recent = self.chat_history[-5:]
            memory_parts.append("RECENT CONVERSATION CONTEXT:")
            for msg in recent:
                role = "You" if msg.get("role") == "assistant" else "User"
                content = msg.get("content", "")[:200]
                memory_parts.append(f"  {role}: {content}")

        patterns = self.user_patterns
        if patterns.get("frequent_commands"):
            memory_parts.append(f"\nUSER PATTERNS:")
            memory_parts.append(f"  Frequent commands: {', '.join(patterns['frequent_commands'])}")
            memory_parts.append(f"  Active hours: {patterns.get('active_hours', [])}")
            memory_parts.append(f"  Total interactions: {patterns.get('interaction_count', 0)}")

        return "\n".join(memory_parts)

    def _build_dashboard_context(self) -> str:
        """Build context about available dashboard tools and widgets."""
        return """
AVAILABLE DASHBOARD TOOLS & WIDGETS:
- System Monitor: CPU, RAM, Disk, Network stats (real-time)
- File Manager: Browse, create, delete files and folders
- Terminal: Execute commands, system info, ping
- Code Editor: Multi-file editor (JS, TS, Python, HTML, CSS, JSON)
- AI Chat: This conversation interface
- Voice Assistant: Hands-free voice control (STT + TTS)
- Knowledge Base: RAG-powered document search and ingestion
- Memory System: Episodic, semantic, and procedural memory
- Agent Loop: Autonomous task execution with tool use
- Plugins: Extensible plugin system
- Calendar: Event management
- Tasks: Task manager with priorities
- Notes: Quick notes + Rich Markdown notes
- Journal: Voice-enabled journal with mood tracking
- Weather: Live weather with 5-day forecast
- Crypto: Live cryptocurrency prices
- World Clock: 5 world cities
- Calculator: Basic arithmetic
- Password Generator: Secure password creation
- Pomodoro: Focus timer
- Stopwatch: With lap tracking
- Whiteboard: Drawing canvas
- Music Player: Local file playback
- Security: Firewall/VPN simulation
- Network Monitor: Bandwidth/latency
- Quick Links: Developer resources
- JSON Formatter: Validate and format
- Dev Tools: Base64, UUID, Lorem Ipsum
- Clipboard Manager: History manager
- Color Picker: HEX/RGB converter
- Unit Converter: Length units
- Breathing Exercise: Guided breathing
- Quotes: Random inspirational quotes
"""

    async def generate_response(self, user_message: str, 
                                 rag_context: Optional[str] = None,
                                 model: Optional[str] = None) -> str:
        """Generate AI response with full context."""
        self._learn_from_interaction(user_message, "response_generated")

        # Smart command routing — handle simple commands without AI
        from stariz_tools.command_router import CommandRouter
        route = CommandRouter.route_command(user_message)
        if route["type"] == "system" and route["handler"]:
            return CommandRouter.execute_system_command(route["command"])

        memory_context = self._get_contextual_memory(user_message)
        dashboard_context = self._build_dashboard_context()

        system_prompt = SYSTEM_PROMPT_BASE + dashboard_context

        if rag_context:
            system_prompt += f"\n\nKNOWLEDGE BASE CONTEXT:\n{rag_context}\n"

        if memory_context:
            system_prompt += f"\n\nMEMORY CONTEXT:\n{memory_context}\n"

        messages = [
            {"role": "system", "content": system_prompt},
        ]

        messages.extend(self.chat_history[-10:])
        messages.append({"role": "user", "content": user_message})

        try:
            async with httpx.AsyncClient(timeout=120) as client:
                response = await client.post(
                    f"{self.ollama_url}/api/chat",
                    json={
                        "model": model or self.default_model,
                        "messages": messages,
                        "stream": False,
                        "options": {
                            "temperature": 0.7,
                            "top_p": 0.9,
                            "num_ctx": 4096,
                        }
                    }
                )
                data = response.json()
                assistant_reply = data.get("message", {}).get("content", "")

                self.chat_history.append({"role": "user", "content": user_message})
                self.chat_history.append({"role": "assistant", "content": assistant_reply})

                self._save_memory()
                return assistant_reply

        except Exception as e:
            logger.error(f"AI generation error: {e}")
            return f"I apologize, but I'm having trouble connecting to my neural core right now. Error: {str(e)}"

    async def generate_streaming(self, user_message: str,
                                  rag_context: Optional[str] = None,
                                  model: Optional[str] = None):
        """Generate streaming AI response."""
        self._learn_from_interaction(user_message, "streaming_response")

        # Smart command routing — handle simple commands without AI
        from stariz_tools.command_router import CommandRouter
        route = CommandRouter.route_command(user_message)
        if route["type"] == "system" and route["handler"]:
            response = CommandRouter.execute_system_command(route["command"])
            yield response
            return

        memory_context = self._get_contextual_memory(user_message)
        dashboard_context = self._build_dashboard_context()

        system_prompt = SYSTEM_PROMPT_BASE + dashboard_context

        if rag_context:
            system_prompt += f"\n\nKNOWLEDGE BASE CONTEXT:\n{rag_context}\n"

        if memory_context:
            system_prompt += f"\n\nMEMORY CONTEXT:\n{memory_context}\n"

        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(self.chat_history[-10:])
        messages.append({"role": "user", "content": user_message})

        full_response = ""

        try:
            async with httpx.AsyncClient(timeout=120) as client:
                async with client.stream(
                    "POST",
                    f"{self.ollama_url}/api/chat",
                    json={
                        "model": model or self.default_model,
                        "messages": messages,
                        "stream": True,
                        "options": {
                            "temperature": 0.7,
                            "top_p": 0.9,
                            "num_ctx": 4096,
                        }
                    }
                ) as response:
                    async for line in response.aiter_lines():
                        if line.strip():
                            try:
                                data = json.loads(line)
                                chunk = data.get("message", {}).get("content", "")
                                if chunk:
                                    full_response += chunk
                                    yield chunk
                                if data.get("done", False):
                                    break
                            except json.JSONDecodeError:
                                continue

            self.chat_history.append({"role": "user", "content": user_message})
            self.chat_history.append({"role": "assistant", "content": full_response})
            self._save_memory()

        except Exception as e:
            logger.error(f"Streaming error: {e}")
            yield f"\n\n[Error: {str(e)}]"

    def get_session_info(self) -> Dict:
        """Get current session information."""
        return {
            "session_id": self.session_id,
            "message_count": len(self.chat_history),
            "user_patterns": self.user_patterns,
            "memory_dir": str(MEMORY_DIR),
            "model": self.default_model,
        }

    def clear_session(self):
        """Clear current session history."""
        self.chat_history = []
        self.session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self._save_memory()

    def get_all_sessions(self) -> List[Dict]:
        """Get list of all session files."""
        sessions = []
        for f in sorted(MEMORY_DIR.glob("chat_history_*.json")):
            try:
                data = json.loads(f.read_text())
                sessions.append({
                    "session_id": data.get("session_id", f.stem),
                    "message_count": len(data.get("messages", [])),
                    "created_at": data.get("created_at", ""),
                })
            except Exception:
                pass
        return sessions
