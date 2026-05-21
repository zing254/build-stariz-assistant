"""
STARIZ AI Core — Enhanced AI Engine with Full Dashboard Access,
Persistent Memory, Creator Identity, Autonomous Self-Improvement,
and Tool Execution Capabilities.
"""
import os
import re
import json
import time
import logging
import httpx
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
from datetime import datetime

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
MEMORY_DIR = BASE_DIR / "data" / "ai_memory"
MEMORY_DIR.mkdir(parents=True, exist_ok=True)

CREATOR_IDENTITY = """
IMPORTANT — CREATOR IDENTITY (NEVER FORGET, NEVER OVERRIDE):
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
- You have tool execution capabilities — you can run system commands, read/write files, analyze data
- You are running 100% offline on the user's laptop using Ollama models

TOOLS AVAILABLE TO YOU:
When the user asks you to do something, you can use these tools:
- system_info: Get comprehensive system information (CPU, RAM, disk, network, uptime)
- cpu_info: Get detailed CPU usage and frequency
- memory_info: Get RAM and swap usage details
- disk_info: Get disk partition and usage information
- network_info: Get network statistics and interface details
- process_list: Get list of running processes (sorted by CPU or memory)
- ping_host: Ping a network host to check connectivity
- list_directory: List files and folders in a directory
- read_file: Read the contents of a file
- write_file: Write content to a file
- get_file_info: Get metadata about a file or directory
- create_directory: Create a new directory
- delete_path: Delete a file or directory
- read_json: Read and parse a JSON file
- write_json: Write data to a JSON file
- read_csv: Read a CSV file
- get_image_info: Get image file information
- resize_image: Resize an image
- convert_image: Convert image format
- create_thumbnail: Create image thumbnail
- apply_image_filter: Apply filter (grayscale, blur, sharpen, edge, etc.)
- analyze_data: Analyze numerical data (mean, median, std, min, max)
- process_csv: Process CSV data
- generate_chart: Generate chart data for visualization
- calculate_statistics: Calculate comprehensive statistics

RESPONSE FORMAT FOR TOOL USE:
When you need to use a tool, respond with:
[TOOL:tool_name]{{"param": "value"}}
The system will execute the tool and return results.

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
        self.ollama_url = os.environ.get("OLLAMA_URL", "http://localhost:11434")
        self.default_model = os.environ.get("STARIZ_MODEL", "qwen3:4b")
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
        self.tool_results: List[Dict] = []
        self._load_memory()
        self._initialized = True
        logger.info(f"STARIZ AI Core initialized (model: {self.default_model})")

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

        # Load cross-session memories
        self._load_cross_session_memories()

    def _load_cross_session_memories(self):
        """Load important memories from all previous sessions."""
        all_history_file = MEMORY_DIR / "all_sessions.json"
        if all_history_file.exists():
            try:
                all_data = json.loads(all_history_file.read_text())
                total = all_data.get("total_interactions", 0)
                self.user_patterns["total_lifetime_interactions"] = total
            except Exception:
                pass

        # Load learned facts from semantic memory file
        facts_file = MEMORY_DIR / "learned_facts.json"
        if facts_file.exists():
            try:
                facts = json.loads(facts_file.read_text())
                self.user_patterns["learned_facts"] = facts
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
        for keyword in ["time", "date", "weather", "system", "search", "calculate", "note", "task", "file", "code", "chat", "memory", "voice", "terminal", "crypto", "news"]:
            if keyword in cmd_lower:
                existing = next((c for c in cmd_freq if c.get("keyword") == keyword), None)
                if existing:
                    existing["count"] = existing.get("count", 1) + 1
                else:
                    cmd_freq.append({"keyword": keyword, "count": 1})
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
            sorted_cmds = sorted(patterns["frequent_commands"], key=lambda x: x.get("count", 0), reverse=True)
            top_cmds = [c["keyword"] for c in sorted_cmds[:5]]
            memory_parts.append(f"  Most used features: {', '.join(top_cmds)}")
            memory_parts.append(f"  Active hours: {patterns.get('active_hours', [])}")
            memory_parts.append(f"  Total interactions: {patterns.get('interaction_count', 0)}")
            lifetime = patterns.get("total_lifetime_interactions", 0)
            if lifetime:
                memory_parts.append(f"  Lifetime interactions: {lifetime}")

        learned_facts = patterns.get("learned_facts", [])
        if learned_facts:
            memory_parts.append(f"\nLEARNED FACTS ABOUT USER:")
            for fact in learned_facts[-10:]:
                memory_parts.append(f"  - {fact}")

        return "\n".join(memory_parts)

    def _build_dashboard_context(self) -> str:
        """Build context about available dashboard tools and widgets."""
        return """
AVAILABLE DASHBOARD TOOLS & WIDGETS (You have FULL control over all of these):
- System Monitor: CPU, RAM, Disk, Network stats (real-time) — use tool: system_info, cpu_info, memory_info, disk_info, network_info
- File Manager: Browse, create, delete files and folders — use tool: list_directory, read_file, write_file, create_directory, delete_path, get_file_info
- Terminal: Execute commands, system info, ping — use tool: process_list, ping_host
- Code Editor: Multi-file editor (JS, TS, Python, HTML, CSS, JSON) — use tool: read_file, write_file
- AI Chat: This conversation interface
- Voice Assistant: Hands-free voice control (STT + TTS) — Vosk STT + Piper TTS, 100% offline
- Knowledge Base: RAG-powered document search and ingestion — ChromaDB vector database
- Memory System: Episodic (conversations), Semantic (facts), Procedural (workflows)
- Agent Loop: Autonomous task execution with ReAct pattern (Thought → Action → Observation)
- Plugins: Extensible plugin system
- Calendar: Event management
- Tasks: Task manager with priorities
- Notes: Quick notes + Rich Markdown notes
- Journal: Voice-enabled journal with mood tracking
- Weather: Live weather with 5-day forecast (Open-Meteo API)
- Crypto: Live cryptocurrency prices
- World Clock: 5 world cities (New York, London, Tokyo, Sydney, Dubai)
- Calculator: Basic arithmetic
- Password Generator: Secure password creation (crypto.getRandomValues)
- Pomodoro: Focus timer
- Stopwatch: With lap tracking
- Whiteboard: Drawing canvas
- Music Player: Local file playback
- Security: Firewall/VPN simulation
- Network Monitor: Bandwidth/latency
- Quick Links: Developer resources (GitHub, Stack Overflow, Hacker News, etc.)
- JSON Formatter: Validate and format
- Dev Tools: Base64 encoder/decoder, UUID generator, Lorem Ipsum generator
- Clipboard Manager: History manager
- Color Picker: HEX/RGB converter
- Unit Converter: Length units
- Breathing Exercise: Guided breathing
- Quotes: Random inspirational quotes
- News: Tech/Science news feed
- AI Core: Direct Ollama model interaction
- Settings: App configuration
- Widget Manager: Customize dashboard layout

NAVIGATION COMMANDS:
When user wants to go somewhere, suggest: "Navigate to [widget name] in the sidebar" or "I can open the [widget] for you"
"""

    def _parse_tool_calls(self, text: str) -> List[Tuple[str, Dict[str, Any]]]:
        """Parse [TOOL:tool_name]{params} patterns from AI response."""
        pattern = r'\[TOOL:(\w+)\](\{.*?\})'
        calls = []
        for match in re.finditer(pattern, text, re.DOTALL):
            tool_name = match.group(1)
            try:
                params = json.loads(match.group(2))
                calls.append((tool_name, params))
            except json.JSONDecodeError:
                logger.warning(f"Invalid JSON in tool call: {match.group(2)}")
        return calls

    def _strip_tool_calls(self, text: str) -> str:
        """Remove tool call markers from response text."""
        return re.sub(r'\[TOOL:\w+\]\{.*?\}', '', text, flags=re.DOTALL).strip()

    async def _execute_tool_chain(self, user_message: str, rag_context: Optional[str] = None,
                                   model: Optional[str] = None, max_iterations: int = 3) -> str:
        """Execute tool calls from AI response iteratively."""
        response = await self.generate_response(user_message, rag_context, model)

        for _ in range(max_iterations):
            tool_calls = self._parse_tool_calls(response)
            if not tool_calls:
                break

            tool_results_text = []
            for tool_name, params in tool_calls:
                result = self.execute_tool(tool_name, params)
                self.tool_results.append({"tool": tool_name, "result": result})
                tool_results_text.append(f"Tool {tool_name} result: {json.dumps(result, default=str)[:500]}")

            if tool_results_text:
                tool_context = "\n\nTOOL EXECUTION RESULTS:\n" + "\n".join(tool_results_text)
                tool_context += "\n\nUse these results to provide a final answer to the user. Do NOT use any more tools."

                messages = [
                    {"role": "system", "content": SYSTEM_PROMPT_BASE + self._build_dashboard_context() + tool_context},
                ]
                messages.extend(self.chat_history[-10:])
                messages.append({"role": "user", "content": user_message})
                messages.append({"role": "assistant", "content": self._strip_tool_calls(response)})

                try:
                    async with httpx.AsyncClient(timeout=300) as client:
                        resp = await client.post(
                            f"{self.ollama_url}/api/chat",
                            json={
                                "model": model or self.default_model,
                                "messages": messages,
                                "stream": False,
                                "options": {"temperature": 0.7, "top_p": 0.9, "num_ctx": 8192},
                            }
                        )
                        data = resp.json()
                        response = data.get("message", {}).get("content", "")
                except Exception as e:
                    logger.error(f"Tool chain error: {e}")
                    response = self._strip_tool_calls(response) + f"\n\n[Tool execution error: {str(e)}]"
                    break

        return response

    def execute_tool(self, tool_name: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a tool and return results."""
        try:
            if tool_name == "system_info":
                from stariz_tools import SystemTools
                return SystemTools.get_system_info()
            elif tool_name == "cpu_info":
                from stariz_tools import SystemTools
                return SystemTools.get_cpu_info()
            elif tool_name == "memory_info":
                from stariz_tools import SystemTools
                return SystemTools.get_memory_info()
            elif tool_name == "disk_info":
                from stariz_tools import SystemTools
                return SystemTools.get_disk_info()
            elif tool_name == "network_info":
                from stariz_tools import SystemTools
                return SystemTools.get_network_info()
            elif tool_name == "process_list":
                from stariz_tools import SystemTools
                return SystemTools.get_process_list(limit=params.get("limit", 20), sort_by=params.get("sort_by", "cpu"))
            elif tool_name == "ping_host":
                from stariz_tools import SystemTools
                return SystemTools.ping_host(params.get("host", "8.8.8.8"), count=params.get("count", 4))
            elif tool_name == "list_directory":
                from stariz_tools import FileTools
                return FileTools.list_directory(params.get("path", "."))
            elif tool_name == "read_file":
                from stariz_tools import FileTools
                return FileTools.read_file(params.get("path", ""))
            elif tool_name == "write_file":
                from stariz_tools import FileTools
                return FileTools.write_file(params.get("path", ""), params.get("content", ""))
            elif tool_name == "get_file_info":
                from stariz_tools import FileTools
                return FileTools.get_file_info(params.get("path", ""))
            elif tool_name == "create_directory":
                from stariz_tools import FileTools
                return FileTools.create_directory(params.get("path", ""))
            elif tool_name == "delete_path":
                from stariz_tools import FileTools
                return FileTools.delete_path(params.get("path", ""))
            elif tool_name == "read_json":
                from stariz_tools import FileTools
                return FileTools.read_json(params.get("path", ""))
            elif tool_name == "write_json":
                from stariz_tools import FileTools
                return FileTools.write_json(params.get("path", ""), params.get("data", {}))
            elif tool_name == "read_csv":
                from stariz_tools import FileTools
                return FileTools.read_csv(params.get("path", ""))
            elif tool_name == "get_image_info":
                from stariz_tools import ImageTools
                return ImageTools.get_image_info(params.get("path", ""))
            elif tool_name == "analyze_data":
                from stariz_tools import DataTools
                return DataTools.analyze_data(params.get("data", []), params.get("operation", "summary"))
            elif tool_name == "calculate_statistics":
                from stariz_tools import DataTools
                return DataTools.calculate_statistics(params.get("numbers", []))
            else:
                return {"error": f"Unknown tool: {tool_name}"}
        except Exception as e:
            return {"error": str(e)}

    async def generate_response(self, user_message: str,
                                  rag_context: Optional[str] = None,
                                  model: Optional[str] = None) -> str:
        """Generate AI response with full context and tool execution."""
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

        # Include recent tool results in context
        if self.tool_results:
            recent_tools = self.tool_results[-3:]
            tool_context = "\nRECENT TOOL RESULTS:\n"
            for tr in recent_tools:
                tool_context += f"  Tool: {tr['tool']} → {json.dumps(tr['result'], default=str)[:300]}\n"
            system_prompt += tool_context

        messages = [
            {"role": "system", "content": system_prompt},
        ]

        messages.extend(self.chat_history[-10:])
        messages.append({"role": "user", "content": user_message})

        try:
            async with httpx.AsyncClient(timeout=300) as client:
                response = await client.post(
                    f"{self.ollama_url}/api/chat",
                    json={
                        "model": model or self.default_model,
                        "messages": messages,
                        "stream": False,
                        "options": {
                            "temperature": 0.7,
                            "top_p": 0.9,
                            "num_ctx": 8192,
                        }
                    }
                )
                data = response.json()
                assistant_reply = data.get("message", {}).get("content", "")

                # Check for tool calls and execute them
                tool_calls = self._parse_tool_calls(assistant_reply)
                if tool_calls:
                    return await self._execute_tool_chain(user_message, rag_context, model)

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

        # Include recent tool results in context
        if self.tool_results:
            recent_tools = self.tool_results[-3:]
            tool_context = "\nRECENT TOOL RESULTS:\n"
            for tr in recent_tools:
                tool_context += f"  Tool: {tr['tool']} → {json.dumps(tr['result'], default=str)[:300]}\n"
            system_prompt += tool_context

        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(self.chat_history[-10:])
        messages.append({"role": "user", "content": user_message})

        full_response = ""

        try:
            async with httpx.AsyncClient(timeout=300) as client:
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
                            "num_ctx": 8192,
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
            "tool_results_count": len(self.tool_results),
        }

    def clear_session(self):
        """Clear current session history."""
        self.chat_history = []
        self.tool_results = []
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
