"""
ReAct Agent Loop — Reason, Act, Observe, Repeat
Enables autonomous task execution with tool use.
"""
import json
import logging
from typing import List, Dict, Any, Optional, Callable

logger = logging.getLogger(__name__)


class ReActAgent:
    def __init__(self, tool_registry: Optional[Dict[str, Callable]] = None,
                 max_iterations: int = 5):
        self.tool_registry = tool_registry or {}
        self.max_iterations = max_iterations

    def execute(self, task: str, llm_call_fn: Callable[[str], str]) -> Dict[str, Any]:
        """
        Execute task using ReAct loop.
        llm_call_fn(prompt) -> response_text
        """
        thought_history = []
        action_history = []
        observation_history = []

        for i in range(self.max_iterations):
            prompt = self._build_prompt(task, thought_history, action_history, observation_history)
            try:
                response = llm_call_fn(prompt)
            except Exception as e:
                return {
                    "answer": f"LLM error: {str(e)}",
                    "iterations": i + 1,
                    "thoughts": thought_history,
                    "actions": action_history,
                    "observations": observation_history,
                    "error": True
                }

            thought, action, action_input = self._parse_response(response)
            thought_history.append(thought)

            if action == "Final Answer":
                return {
                    "answer": action_input,
                    "iterations": i + 1,
                    "thoughts": thought_history,
                    "actions": action_history,
                    "observations": observation_history,
                    "error": False
                }

            if action and action in self.tool_registry:
                try:
                    result = self.tool_registry[action](action_input)
                    observation = json.dumps(result) if isinstance(result, dict) else str(result)
                except Exception as e:
                    observation = f"Error executing {action}: {str(e)}"
            else:
                observation = f"Tool '{action}' not found. Available: {', '.join(self.tool_registry.keys())}"

            action_history.append({"tool": action, "input": action_input})
            observation_history.append(observation)

        return {
            "answer": "Could not complete task within max iterations. Here's what I tried:\n" +
                      "\n".join(f"- {a['tool']}: {a['input']}" for a in action_history),
            "iterations": self.max_iterations,
            "thoughts": thought_history,
            "actions": action_history,
            "observations": observation_history,
            "error": False
        }

    def _build_prompt(self, task: str, thoughts: List[str],
                      actions: List[Dict], observations: List[str]) -> str:
        tools_desc = "\n".join(
            f"- {name}: Execute this tool with the given input"
            for name in self.tool_registry.keys()
        )

        prompt = f"""You are STARIZ, an intelligent AI assistant. You can use tools to gather information and perform actions.

Available Tools:
{tools_desc}

Use the following format exactly:
Thought: think about what to do next
Action: tool name (must be one of the available tools)
Action Input: the input to the tool
Observation: result from the tool
... (repeat Thought/Action/Observation as needed)
Thought: I now know the final answer
Final Answer: the final answer to the user's question

Task: {task}
"""
        for t, a, o in zip(thoughts, actions, observations):
            prompt += f"Thought: {t}\n"
            if a:
                prompt += f"Action: {a.get('tool', '')}\n"
                prompt += f"Action Input: {a.get('input', '')}\n"
            prompt += f"Observation: {o}\n"

        prompt += "\nThought:"
        return prompt

    def _parse_response(self, response: str) -> tuple:
        lines = response.strip().split('\n')
        thought = ""
        action = ""
        action_input = ""

        for line in lines:
            stripped = line.strip()
            if stripped.startswith("Thought:"):
                thought = stripped.replace("Thought:", "").strip()
            elif stripped.startswith("Action:"):
                action = stripped.replace("Action:", "").strip()
            elif stripped.startswith("Action Input:"):
                action_input = stripped.replace("Action Input:", "").strip()
            elif stripped.startswith("Final Answer:"):
                answer = stripped.replace("Final Answer:", "").strip()
                return "I have the answer", "Final Answer", answer

        return thought, action, action_input
