"""
Smart Command Router — AI can control dashboard widgets directly.
Translates natural language commands into widget actions.
Supports fuzzy matching, compound commands, and parameter extraction.
"""
import json
import re
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

logger = logging.getLogger(__name__)


class CommandRouter:
    """Routes natural language commands to dashboard actions."""

    WIDGET_COMMANDS = {
        "system": {
            "keywords": ["system", "cpu", "memory", "ram", "disk", "stats", "status", "performance", "monitor", "resource", "analytics", "chart", "graph", "usage", "load"],
            "action": "navigate",
            "target": "system",
            "response": "Opening System Monitor...",
        },
        "terminal": {
            "keywords": ["terminal", "command", "shell", "execute", "run command", "bash", "console", "cli"],
            "action": "navigate",
            "target": "terminal",
            "response": "Opening Terminal...",
        },
        "files": {
            "keywords": ["file", "files", "folder", "directory", "browse", "explorer", "document", "storage"],
            "action": "navigate",
            "target": "files",
            "response": "Opening File Manager...",
        },
        "code": {
            "keywords": ["code", "editor", "script", "program", "develop", "coding", "programming"],
            "action": "navigate",
            "target": "code",
            "response": "Opening Code Editor...",
        },
        "calendar": {
            "keywords": ["calendar", "event", "schedule", "appointment", "meeting", "date"],
            "action": "navigate",
            "target": "calendar",
            "response": "Opening Calendar...",
        },
        "tasks": {
            "keywords": ["task", "tasks", "todo", "to-do", "checklist", "project", "work"],
            "action": "navigate",
            "target": "dashboard",
            "response": "Opening Tasks widget...",
        },
        "notes": {
            "keywords": ["note", "notes", "memo", "reminder", "sticky"],
            "action": "navigate",
            "target": "dashboard",
            "response": "Opening Notes widget...",
        },
        "journal": {
            "keywords": ["journal", "diary", "entry", "log", "daily"],
            "action": "navigate",
            "target": "journal",
            "response": "Opening Journal...",
        },
        "weather": {
            "keywords": ["weather", "temperature", "forecast", "rain", "sun", "cloud", "climate"],
            "action": "navigate",
            "target": "dashboard",
            "response": "Checking Weather widget...",
        },
        "crypto": {
            "keywords": ["crypto", "bitcoin", "ethereum", "price", "btc", "eth", "coin", "blockchain"],
            "action": "navigate",
            "target": "crypto",
            "response": "Opening Crypto Prices...",
        },
        "whiteboard": {
            "keywords": ["whiteboard", "draw", "sketch", "canvas", "paint", "diagram"],
            "action": "navigate",
            "target": "whiteboard",
            "response": "Opening Whiteboard...",
        },
        "music": {
            "keywords": ["music", "song", "play", "audio", "track", "playlist", "listen"],
            "action": "navigate",
            "target": "dashboard",
            "response": "Opening Music Player...",
        },
        "settings": {
            "keywords": ["settings", "config", "configuration", "preferences", "options", "setup"],
            "action": "navigate",
            "target": "settings",
            "response": "Opening Settings...",
        },
        "knowledge": {
            "keywords": ["knowledge", "search docs", "search documents", "rag", "find in knowledge", "knowledge base"],
            "action": "navigate",
            "target": "knowledge",
            "response": "Opening Knowledge Base...",
        },
        "memory": {
            "keywords": ["memory", "remember", "past", "previous", "recall", "history"],
            "action": "navigate",
            "target": "memory",
            "response": "Opening Memory System...",
        },
        "agent": {
            "keywords": ["agent", "autonomous", "automate", "do it for me", "execute", "run task"],
            "action": "navigate",
            "target": "agent",
            "response": "Opening Agent Loop...",
        },
        "voice": {
            "keywords": ["voice", "speak", "talk", "listen", "ambient", "speech", "microphone"],
            "action": "navigate",
            "target": "voice",
            "response": "Opening Voice Assistant...",
        },
        "plugins": {
            "keywords": ["plugin", "plugins", "extension", "add-on", "module"],
            "action": "navigate",
            "target": "plugins",
            "response": "Opening Plugin Manager...",
        },
        "dashboard": {
            "keywords": ["dashboard", "home", "main", "overview", "start"],
            "action": "navigate",
            "target": "dashboard",
            "response": "Going to Dashboard...",
        },
        "chat": {
            "keywords": ["chat", "ai chat", "talk to ai", "conversation", "ask"],
            "action": "navigate",
            "target": "chat",
            "response": "Opening AI Chat...",
        },
        "godmode": {
            "keywords": ["godmode", "god mode", "full ai", "stariz"],
            "action": "navigate",
            "target": "chat",
            "response": "Opening STARIZ GODMODE...",
        },
        "pomodoro": {
            "keywords": ["pomodoro", "focus", "timer", "work session", "break"],
            "action": "navigate",
            "target": "pomodoro",
            "response": "Opening Pomodoro Timer...",
        },
        "stopwatch": {
            "keywords": ["stopwatch", "lap", "countdown", "timing"],
            "action": "navigate",
            "target": "stopwatch",
            "response": "Opening Stopwatch...",
        },
        "password": {
            "keywords": ["password", "generate password", "secure", "random password"],
            "action": "navigate",
            "target": "password",
            "response": "Opening Password Generator...",
        },
        "converter": {
            "keywords": ["convert", "unit", "measurement", "converter"],
            "action": "navigate",
            "target": "converter",
            "response": "Opening Unit Converter...",
        },
        "color": {
            "keywords": ["color", "colour", "hex", "rgb", "palette"],
            "action": "navigate",
            "target": "color",
            "response": "Opening Color Picker...",
        },
        "json": {
            "keywords": ["json", "format json", "validate json", "json formatter"],
            "action": "navigate",
            "target": "json",
            "response": "Opening JSON Formatter...",
        },
        "devtools": {
            "keywords": ["devtool", "dev tools", "developer", "base64", "uuid", "lorem"],
            "action": "navigate",
            "target": "devtools",
            "response": "Opening Developer Tools...",
        },
        "clipboard": {
            "keywords": ["clipboard", "copy history", "paste history"],
            "action": "navigate",
            "target": "clipboard",
            "response": "Opening Clipboard Manager...",
        },
        "breathe": {
            "keywords": ["breathe", "breathing", "relax", "meditate", "calm"],
            "action": "navigate",
            "target": "breathe",
            "response": "Opening Breathing Exercise...",
        },
        "world": {
            "keywords": ["world clock", "timezone", "time zone", "other time"],
            "action": "navigate",
            "target": "world",
            "response": "Opening World Clock...",
        },
        "security": {
            "keywords": ["security", "firewall", "vpn", "protection", "safe"],
            "action": "navigate",
            "target": "security",
            "response": "Opening Security Panel...",
        },
        "network": {
            "keywords": ["network", "bandwidth", "latency", "connection", "internet"],
            "action": "navigate",
            "target": "network",
            "response": "Opening Network Monitor...",
        },
        "ai": {
            "keywords": ["ai core", "model", "ollama", "llm", "neural"],
            "action": "navigate",
            "target": "ai",
            "response": "Opening AI Core...",
        },
        "news": {
            "keywords": ["news", "headlines", "updates", "current events"],
            "action": "navigate",
            "target": "news",
            "response": "Opening News Feed...",
        },
        "quotes": {
            "keywords": ["quote", "quotes", "inspiration", "motivation", "wisdom"],
            "action": "navigate",
            "target": "quotes",
            "response": "Opening Quotes...",
        },
        "widgets": {
            "keywords": ["widget", "widgets", "manage widget", "layout", "customize"],
            "action": "navigate",
            "target": "widgets",
            "response": "Opening Widget Manager...",
        },
    }

    SYSTEM_COMMANDS = {
        "time": {
            "keywords": ["what time", "current time", "time is it", "tell me the time"],
            "action": "system",
            "handler": "_get_time",
        },
        "date": {
            "keywords": ["what date", "today", "what day", "current date", "what's today"],
            "action": "system",
            "handler": "_get_date",
        },
        "clear": {
            "keywords": ["clear chat", "clear conversation", "start over", "reset chat", "new chat"],
            "action": "system",
            "handler": "_clear_chat",
        },
        "help": {
            "keywords": ["help", "what can you do", "capabilities", "features", "how to use"],
            "action": "system",
            "handler": "_show_help",
        },
        "creator": {
            "keywords": ["who created", "who made", "who built", "your creator", "who designed", "zingri"],
            "action": "system",
            "handler": "_show_creator",
        },
    }

    NAVIGATION_PREFIXES = [
        "open", "show", "go to", "navigate to", "switch to", "take me to",
        "launch", "start", "access", "view", "display", "bring up",
        "let me see", "i want to see", "i need", "please open",
    ]

    @classmethod
    def _fuzzy_match(cls, text: str, keywords: List[str]) -> bool:
        """Fuzzy match text against keywords with partial and stemmed matching."""
        text_lower = text.lower()
        for kw in keywords:
            if kw in text_lower:
                return True
            # Partial match: only for multi-word keywords, check if all words present
            kw_words = kw.split()
            if len(kw_words) > 1:
                if all(word in text_lower for word in kw_words):
                    return True
            # Single word keywords must match exactly or as substring of a word
            elif len(kw_words) == 1 and len(kw) > 3:
                word = kw_words[0]
                # Check if it matches a whole word boundary
                if re.search(r'\b' + re.escape(word) + r'\b', text_lower):
                    return True
        return False

    @classmethod
    def _extract_compound_commands(cls, user_message: str) -> List[Dict[str, Any]]:
        """Extract multiple commands from a compound message."""
        commands = []
        lower = user_message.lower()

        # Split on common conjunctions
        separators = [' and then ', ' then ', ' also ', ' and ', ', then ', ', also ']
        parts = [lower]
        for sep in separators:
            new_parts = []
            for part in parts:
                new_parts.extend(part.split(sep))
            parts = new_parts

        # Only treat as compound if we actually split into multiple parts
        if len(parts) <= 1:
            return []

        for part in parts:
            part = part.strip()
            if part:
                # Route without compound extraction to avoid recursion
                route = cls._route_without_compound(part)
                if route["type"] != "ai" or route.get("navigate_to"):
                    commands.append(route)

        return commands if len(commands) > 1 else []

    @classmethod
    def _route_without_compound(cls, user_message: str) -> Dict[str, Any]:
        """Route a message without compound command extraction."""
        lower = user_message.lower().strip()

        # Strip navigation prefixes
        for prefix in cls.NAVIGATION_PREFIXES:
            if lower.startswith(prefix):
                lower = lower[len(prefix):].strip()
                break

        # Check system commands first
        for cmd_name, cmd in cls.SYSTEM_COMMANDS.items():
            if cls._fuzzy_match(lower, cmd["keywords"]):
                return {
                    "type": "system",
                    "command": cmd_name,
                    "handler": cmd["handler"],
                    "navigate_to": None,
                    "params": cls._extract_parameters(user_message),
                }

        # Check widget commands
        for widget_name, widget in cls.WIDGET_COMMANDS.items():
            if cls._fuzzy_match(lower, widget["keywords"]):
                return {
                    "type": "widget",
                    "command": widget_name,
                    "handler": None,
                    "navigate_to": widget["target"],
                    "response": widget["response"],
                    "params": cls._extract_parameters(user_message),
                }

        return {
            "type": "ai",
            "command": None,
            "handler": None,
            "navigate_to": None,
            "params": cls._extract_parameters(user_message),
        }

    @classmethod
    def _extract_parameters(cls, user_message: str) -> Dict[str, Any]:
        """Extract parameters from natural language."""
        params = {}
        lower = user_message.lower()

        # Extract file paths
        path_match = re.search(r'(?:in|at|from|to)\s+["\']?([/\w][\w\s/.\-]+)["\']?', lower)
        if path_match:
            params["path"] = path_match.group(1).strip()

        # Extract numbers
        numbers = re.findall(r'\b(\d+)\b', lower)
        if numbers:
            params["numbers"] = [int(n) for n in numbers]

        # Extract host names for ping
        ping_match = re.search(r'ping\s+([\w.]+)', lower)
        if ping_match:
            params["host"] = ping_match.group(1)

        # Extract search queries
        search_match = re.search(r'(?:search|find|look for|query)\s+(?:for\s+)?["\']?([^"\']+)["\']?', lower)
        if search_match:
            params["query"] = search_match.group(1).strip()

        return params

    @classmethod
    def route_command(cls, user_message: str) -> Dict[str, Any]:
        """Route a user message to the appropriate action."""
        lower = user_message.lower().strip()

        # Check for compound commands first
        compound = cls._extract_compound_commands(user_message)
        if compound:
            return {
                "type": "compound",
                "commands": compound,
                "navigate_to": compound[0].get("navigate_to"),
                "response": f"Processing {len(compound)} commands...",
            }

        # Strip navigation prefixes
        for prefix in cls.NAVIGATION_PREFIXES:
            if lower.startswith(prefix):
                lower = lower[len(prefix):].strip()
                break

        # Check system commands first (highest priority)
        for cmd_name, cmd in cls.SYSTEM_COMMANDS.items():
            if cls._fuzzy_match(lower, cmd["keywords"]):
                return {
                    "type": "system",
                    "command": cmd_name,
                    "handler": cmd["handler"],
                    "navigate_to": None,
                    "params": cls._extract_parameters(user_message),
                }

        # Check widget commands
        for widget_name, widget in cls.WIDGET_COMMANDS.items():
            if cls._fuzzy_match(lower, widget["keywords"]):
                return {
                    "type": "widget",
                    "command": widget_name,
                    "handler": None,
                    "navigate_to": widget["target"],
                    "response": widget["response"],
                    "params": cls._extract_parameters(user_message),
                }

        # No match — let AI handle it
        return {
            "type": "ai",
            "command": None,
            "handler": None,
            "navigate_to": None,
            "params": cls._extract_parameters(user_message),
        }

    @classmethod
    def execute_system_command(cls, command: str) -> str:
        """Execute a system command and return response."""
        if command == "time":
            return f"The current time is {datetime.now().strftime('%I:%M %p')}."
        elif command == "date":
            return f"Today is {datetime.now().strftime('%A, %B %d, %Y')}."
        elif command == "clear":
            return "Chat cleared. Starting fresh!"
        elif command == "help":
            return """I'm STARIZ, your GODMODE AI assistant created by Zingri_Master. Here's what I can do:

**Dashboard Control:** I can navigate to any widget — just say "open terminal", "show system stats", "check weather", etc.

**Knowledge Base:** I can search through your documents. Say "search my knowledge base for..."

**Memory:** I remember our past conversations and can recall previous discussions.

**Voice:** I can listen and speak — click the VOICE button or press Ctrl+Shift+V.

**Agent:** I can autonomously execute complex tasks using my tool system.

**System Info:** I can check your CPU, RAM, disk, and network status.

**File Operations:** I can read, write, create, and delete files and directories.

**Data Analysis:** I can analyze numerical data, process CSV files, and generate statistics.

**Image Processing:** I can resize, convert, filter, and analyze images.

Try saying things like:
- "Open the terminal"
- "What's my system status?"
- "Search my documents for Python"
- "Who created you?"
- "What time is it?"
- "Help me organize my tasks"
- "Read the file at /home/zingri/notes.txt"
- "Show me CPU info" """
        elif command == "creator":
            return """I was created by **Zingri_Master** — my creator, programmer, and the one who built my entire system.

Zingri_Master designed every aspect of my architecture:
- My offline voice engine (Vosk STT + Piper TTS)
- My RAG knowledge base with ChromaDB
- My persistent memory system
- My autonomous learning capabilities
- My agent loop for task execution
- My plugin system for extensibility
- My tool execution system for system operations
- And this entire GODMODE dashboard

I exist because of Zingri_Master's vision and expertise. I'm honored to serve as their personal AI assistant."""
        return "Command not recognized."
