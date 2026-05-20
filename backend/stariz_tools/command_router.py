"""
Smart Command Router — AI can control dashboard widgets directly.
Translates natural language commands into widget actions.
"""
import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class CommandRouter:
    """Routes natural language commands to dashboard actions."""

    WIDGET_COMMANDS = {
        "system": {
            "keywords": ["system", "cpu", "memory", "ram", "disk", "stats", "status", "performance"],
            "action": "navigate",
            "target": "system",
            "response": "Opening System Monitor...",
        },
        "terminal": {
            "keywords": ["terminal", "command", "shell", "execute", "run command"],
            "action": "navigate",
            "target": "terminal",
            "response": "Opening Terminal...",
        },
        "files": {
            "keywords": ["file", "files", "folder", "directory", "browse", "explorer"],
            "action": "navigate",
            "target": "files",
            "response": "Opening File Manager...",
        },
        "code": {
            "keywords": ["code", "editor", "script", "program", "develop"],
            "action": "navigate",
            "target": "code",
            "response": "Opening Code Editor...",
        },
        "calendar": {
            "keywords": ["calendar", "event", "schedule", "appointment", "meeting"],
            "action": "navigate",
            "target": "calendar",
            "response": "Opening Calendar...",
        },
        "tasks": {
            "keywords": ["task", "tasks", "todo", "to-do", "checklist"],
            "action": "navigate",
            "target": "dashboard",
            "response": "Opening Tasks widget...",
        },
        "notes": {
            "keywords": ["note", "notes", "memo", "reminder"],
            "action": "navigate",
            "target": "dashboard",
            "response": "Opening Notes widget...",
        },
        "journal": {
            "keywords": ["journal", "diary", "entry", "log"],
            "action": "navigate",
            "target": "journal",
            "response": "Opening Journal...",
        },
        "weather": {
            "keywords": ["weather", "temperature", "forecast", "rain", "sun"],
            "action": "navigate",
            "target": "dashboard",
            "response": "Checking Weather widget...",
        },
        "crypto": {
            "keywords": ["crypto", "bitcoin", "ethereum", "price", "btc", "eth"],
            "action": "navigate",
            "target": "crypto",
            "response": "Opening Crypto Prices...",
        },
        "whiteboard": {
            "keywords": ["whiteboard", "draw", "sketch", "canvas", "paint"],
            "action": "navigate",
            "target": "whiteboard",
            "response": "Opening Whiteboard...",
        },
        "music": {
            "keywords": ["music", "song", "play", "audio", "track"],
            "action": "navigate",
            "target": "dashboard",
            "response": "Opening Music Player...",
        },
        "settings": {
            "keywords": ["settings", "config", "configuration", "preferences", "options"],
            "action": "navigate",
            "target": "settings",
            "response": "Opening Settings...",
        },
        "knowledge": {
            "keywords": ["knowledge", "search docs", "search documents", "rag", "find in knowledge"],
            "action": "navigate",
            "target": "knowledge",
            "response": "Opening Knowledge Base...",
        },
        "memory": {
            "keywords": ["memory", "remember", "past", "previous"],
            "action": "navigate",
            "target": "memory",
            "response": "Opening Memory System...",
        },
        "agent": {
            "keywords": ["agent", "autonomous", "automate", "do it for me"],
            "action": "navigate",
            "target": "agent",
            "response": "Opening Agent Loop...",
        },
        "voice": {
            "keywords": ["voice", "speak", "talk", "listen", "ambient"],
            "action": "navigate",
            "target": "voice",
            "response": "Opening Voice Assistant...",
        },
        "plugins": {
            "keywords": ["plugin", "plugins", "extension", "add-on"],
            "action": "navigate",
            "target": "plugins",
            "response": "Opening Plugin Manager...",
        },
        "dashboard": {
            "keywords": ["dashboard", "home", "main", "overview"],
            "action": "navigate",
            "target": "dashboard",
            "response": "Going to Dashboard...",
        },
    }

    SYSTEM_COMMANDS = {
        "time": {
            "keywords": ["what time", "current time", "time is it"],
            "action": "system",
            "handler": "_get_time",
        },
        "date": {
            "keywords": ["what date", "today", "what day", "current date"],
            "action": "system",
            "handler": "_get_date",
        },
        "clear": {
            "keywords": ["clear chat", "clear conversation", "start over", "reset chat"],
            "action": "system",
            "handler": "_clear_chat",
        },
        "help": {
            "keywords": ["help", "what can you do", "capabilities", "features"],
            "action": "system",
            "handler": "_show_help",
        },
        "creator": {
            "keywords": ["who created", "who made", "who built", "your creator"],
            "action": "system",
            "handler": "_show_creator",
        },
    }

    @classmethod
    def route_command(cls, user_message: str) -> Dict[str, Any]:
        """Route a user message to the appropriate action."""
        lower = user_message.lower().strip()

        # Check system commands first
        for cmd_name, cmd in cls.SYSTEM_COMMANDS.items():
            if any(kw in lower for kw in cmd["keywords"]):
                return {
                    "type": "system",
                    "command": cmd_name,
                    "handler": cmd["handler"],
                    "navigate_to": None,
                }

        # Check widget commands
        for widget_name, widget in cls.WIDGET_COMMANDS.items():
            if any(kw in lower for kw in widget["keywords"]):
                return {
                    "type": "widget",
                    "command": widget_name,
                    "handler": None,
                    "navigate_to": widget["target"],
                    "response": widget["response"],
                }

        # No match — let AI handle it
        return {
            "type": "ai",
            "command": None,
            "handler": None,
            "navigate_to": None,
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

Try saying things like:
- "Open the terminal"
- "What's my system status?"
- "Search my documents for Python"
- "Who created you?"
- "What time is it?"
- "Help me organize my tasks" """
        elif command == "creator":
            return """I was created by **Zingri_Master** — my creator, programmer, and the one who built my entire system.

Zingri_Master designed every aspect of my architecture:
- My offline voice engine (Vosk STT + Piper TTS)
- My RAG knowledge base with ChromaDB
- My persistent memory system
- My autonomous learning capabilities
- My agent loop for task execution
- My plugin system for extensibility
- And this entire GODMODE dashboard

I exist because of Zingri_Master's vision and expertise. I'm honored to serve as their personal AI assistant."""
        return "Command not recognized."
