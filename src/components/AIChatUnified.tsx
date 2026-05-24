import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Loader, Bot, User, Trash2, Copy, Check, Sparkles, Brain, Database, Clock, Search, Info,
  Cpu, Wifi, Lightbulb, AlertCircle, StopCircle, ChevronDown, Terminal,
} from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { getStoredApiConfig, type ApiConfig } from './ApiKeyManager';
import { usePythonBackend } from '../hooks/usePythonBackend';
import { renderMarkdown } from '../utils/markdown';
import { copyToClipboard } from '../utils/helpers';
import { toast } from './Toast';

type ChatMode = 'godmode' | 'enhanced' | 'classic';

interface ApiMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string;
  tokens?: { prompt: number; completion: number };
  toolCalls?: Array<{
    tool: string;
    params: any;
    result?: any;
  }>;
}

interface GodmodeMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  ragContext?: boolean;
}

interface SessionInfo {
  session_id: string;
  message_count: number;
  model?: string;
  user_patterns: {
    frequent_commands: Array<{ keyword: string; count: number }>;
    active_hours: number[];
    interaction_count: number;
  };
}

const BACKEND_URL = import.meta.env.VITE_PYTHON_BACKEND_URL || 'http://localhost:8000';

const ENHANCED_SYSTEM_PROMPT = `You are STARIZ, an advanced cyberpunk AI assistant integrated into a personal dashboard. You have access to various tools and widgets including: clock, weather, tasks, notes, calendar, music player, calculator, terminal, crypto prices, password generator, unit converter, color tools, JSON formatter, dev tools, clipboard manager, world clock, pomodoro timer, stopwatch, security scanner, network monitor, AI core metrics, whiteboard, journal, and more.

You also have access to Python backend tools for:
- System monitoring (CPU, RAM, Disk, Network)
- File operations (list, read, write, delete files)
- Image processing (resize, convert, apply filters)
- Data analysis (statistics, visualization)

You should be helpful, concise, and speak with a slightly futuristic but professional tone. When users ask about their data (tasks, notes, events), acknowledge you can see the dashboard context. You can help with coding, calculations, advice, creative writing, analysis, and general assistance.

When users ask you to perform actions with Python tools, respond with a special format:
TOOL: tool_name
PARAMS: {JSON params}
EXPLANATION: brief explanation

Keep responses concise unless asked for detail. Use markdown formatting for code blocks and lists.`;

const CLASSIC_SYSTEM_PROMPT = `You are STARIZ, an advanced cyberpunk AI assistant integrated into a personal dashboard. You have access to various tools and widgets including: clock, weather, tasks, notes, calendar, music player, calculator, terminal, crypto prices, password generator, unit converter, color tools, JSON formatter, dev tools, clipboard manager, world clock, pomodoro timer, stopwatch, security scanner, network monitor, AI core metrics, and a drawing whiteboard.

You should be helpful, concise, and speak with a slightly futuristic but professional tone. When users ask about their data (tasks, notes, events), acknowledge you can see the dashboard context. You can help with coding, calculations, advice, creative writing, analysis, and general assistance.

Keep responses concise unless asked for detail. Use markdown formatting for code blocks and lists.`;

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
}

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    const ok = await copyToClipboard(code);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };
  return (
    <div className="my-2 rounded-lg border border-[#1a1a3a] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0a0a1a] border-b border-[#1a1a3a]">
        <span className="text-[10px] font-mono text-white/30">{lang || 'code'}</span>
        <button onClick={handleCopy} className="text-white/30 hover:text-[#00f0ff] transition-colors">
          {copied ? <Check className="w-3 h-3 text-[#00ff88]" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto bg-[#050510]">
        <code className="text-[11px] font-mono text-[#00ff88]">{code}</code>
      </pre>
    </div>
  );
}

function ApiMessageContent({ content }: { content: string }) {
  const parts: React.ReactNode[] = [];
  const codeRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={lastIndex} className="whitespace-pre-wrap">{content.slice(lastIndex, match.index)}</span>);
    }
    parts.push(<CodeBlock key={match.index} code={match[2]} lang={match[1]} />);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(<span key={lastIndex} className="whitespace-pre-wrap">{content.slice(lastIndex)}</span>);
  }

  return <>{parts}</>;
}

const MODE_SUGGESTIONS: Record<ChatMode, string[]> = {
  godmode: [
    "What can you do?",
    "Tell me about my usage patterns",
    "Search my knowledge base for recent projects",
    "What's my system status?",
    "Help me organize my tasks",
    "Show me my CPU and memory usage",
  ],
  enhanced: [
    'What can you help me with?',
    'Run system diagnostics',
    'List files in /tmp',
    'Write a Python script to fetch API data',
    'Calculate statistics for [1, 2, 3, 4, 5]',
  ],
  classic: [
    'What can you help me with?',
    'Write a Python script to fetch API data',
    'Explain quantum computing simply',
    'Generate a secure password for my server',
    'Help me debug this error: TypeError...',
  ],
};

export default function AIChatUnified() {
  const [mode, setMode] = useState<ChatMode>('godmode');

  const [apiMessages, setApiMessages] = useLocalStorage<ApiMessage[]>('stariz-chat-history-v2', [
    { id: generateId(), role: 'assistant', content: mode === 'enhanced'
      ? 'Greetings, Commander. I am STARIZ, your integrated AI assistant with Python backend capabilities. I can now execute system commands, analyze data, process images, and more. How may I assist you today?'
      : 'Greetings, Commander. I am STARIZ, your integrated AI assistant. I have full awareness of your dashboard systems. How may I assist you today?',
      timestamp: Date.now(), model: 'STARIZ-AI' },
  ]);

  const [godMessages, setGodMessages] = useState<GodmodeMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [apiStatus, setApiStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [apiConfig, setApiConfig] = useState<ApiConfig | null>(null);
  const [showModelInfo, setShowModelInfo] = useState(false);
  const [pythonTools, setPythonTools] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [ragEnabled, setRagEnabled] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { connected: pythonConnected, callTool: callPythonTool } = usePythonBackend();

  useEffect(() => {
    const config = getStoredApiConfig();
    setApiConfig(config);
    setApiStatus(config ? 'connected' : 'disconnected');
  }, []);

  useEffect(() => {
    if (mode === 'godmode') {
      fetchSessionInfo();
    }
  }, [mode]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [apiMessages, godMessages, streaming, isGenerating]);

  const fetchSessionInfo = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/ai/session`);
      if (res.ok) setSessionInfo(await res.json());
    } catch {}
  };

  const executeToolCall = useCallback(async (toolCall: { tool: string; params: any }) => {
    try {
      const toolMap: Record<string, string> = {
        'system_info': 'system/info',
        'system_cpu': 'system/cpu',
        'system_memory': 'system/memory',
        'system_disk': 'system/disk',
        'system_network': 'system/network',
        'list_files': 'file/operation',
        'read_file': 'file/operation',
        'write_file': 'file/operation',
        'image_info': 'image/operation',
        'calculate': 'data/operation',
        'analyze_data': 'data/operation',
      };
      const endpoint = toolMap[toolCall.tool] || toolCall.tool;
      return await callPythonTool(endpoint, toolCall.params);
    } catch (error: any) {
      return { error: error.message };
    }
  }, [callPythonTool]);

  const handleModeSwitch = useCallback((newMode: ChatMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    setApiMessages((prev) => {
      const base = prev.length > 0 ? prev[0] : null;
      if (!base) return prev;
      const greeting = newMode === 'enhanced'
        ? 'Greetings, Commander. I am STARIZ, your integrated AI assistant with Python backend capabilities.'
        : 'Greetings, Commander. I am STARIZ, your integrated AI assistant.';
      return [{ ...base, content: `Switched to ${newMode} mode. ${greeting}` }];
    });
    toast.info(`Switched to ${newMode} mode`);
  }, [mode, setApiMessages]);

  const parseSlashCommand = useCallback((text: string): boolean => {
    const lower = text.trim().toLowerCase();
    if (lower === '/godmode') { handleModeSwitch('godmode'); return true; }
    if (lower === '/enhanced') { handleModeSwitch('enhanced'); return true; }
    if (lower === '/classic') { handleModeSwitch('classic'); return true; }
    if (lower === '/clear') {
      if (mode === 'godmode') {
        fetch(`${BACKEND_URL}/api/ai/clear`, { method: 'POST' }).catch(() => {});
        setGodMessages([]);
        fetchSessionInfo();
      } else {
        const greeting = mode === 'enhanced'
          ? 'Greetings, Commander. I am STARIZ, your integrated AI assistant with Python backend capabilities.'
          : 'Greetings, Commander. I am STARIZ, your integrated AI assistant.';
        setApiMessages([{ id: generateId(), role: 'assistant', content: greeting, timestamp: Date.now(), model: 'STARIZ-AI' }]);
      }
      toast.info('Chat cleared');
      return true;
    }
    if (lower === '/help') {
      const helpText = '**Available slash commands:**\n- `/godmode` — Switch to GODMODE (Ollama + RAG + Memory)\n- `/enhanced` — Switch to Enhanced (API + Python tools)\n- `/classic` — Switch to Classic (API only)\n- `/clear` — Clear chat history\n- `/help` — Show this help';
      if (mode === 'godmode') {
        setGodMessages(prev => [...prev, { role: 'assistant', content: helpText, timestamp: new Date().toISOString() }]);
      } else {
        setApiMessages(prev => [...prev, { id: generateId(), role: 'assistant', content: helpText, timestamp: Date.now() }]);
      }
      return true;
    }
    return false;
  }, [mode, handleModeSwitch, setApiMessages]);

  const sendGodmode = useCallback(async () => {
    if (!input.trim() || isGenerating) return;

    const userMsg: GodmodeMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };
    setGodMessages(prev => [...prev, userMsg]);
    const sentInput = input;
    setInput('');
    setIsGenerating(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: sentInput, use_rag: ragEnabled }),
      });

      if (!res.ok) throw new Error('Failed to get response');

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let assistantContent = '';

      setGodMessages(prev => [...prev, {
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        ragContext: ragEnabled,
      }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
          try {
            const data = JSON.parse(line.replace('data: ', ''));
            if (data.chunk) {
              assistantContent += data.chunk;
              setGodMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, content: assistantContent };
                }
                return updated;
              });
            }
            if (data.done) break;
          } catch {}
        }
      }

      fetchSessionInfo();
    } catch (err) {
      setGodMessages(prev => [...prev, {
        role: 'assistant',
        content: `I apologize, but I encountered an error: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date().toISOString(),
      }]);
    }

    setIsGenerating(false);
  }, [input, isGenerating, ragEnabled]);

  const sendApiMessage = useCallback(async () => {
    if (!input.trim() || streaming) return;

    const config = getStoredApiConfig();
    if (!config) {
      toast.error('No API key configured. Click the key icon in the toolbar.');
      return;
    }

    const userMsg: ApiMessage = { id: generateId(), role: 'user', content: input.trim(), timestamp: Date.now() };
    const newMessages = [...apiMessages, userMsg];
    setApiMessages(newMessages);
    setInput('');
    setStreaming(true);
    setApiStatus('checking');

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const isOpenRouter = config.provider === 'openrouter';
      const isAnthropic = config.provider === 'anthropic';
      const isGoogle = config.provider === 'google';
      const systemPrompt = mode === 'enhanced' ? ENHANCED_SYSTEM_PROMPT : CLASSIC_SYSTEM_PROMPT;

      let url: string;
      let body: any;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      if (isAnthropic) {
        url = `${config.baseUrl || 'https://api.anthropic.com/v1'}/messages`;
        headers['x-api-key'] = config.key;
        headers['anthropic-version'] = '2023-06-01';
        body = {
          model: config.model,
          max_tokens: mode === 'enhanced' ? 4096 : 2048,
          messages: [{ role: 'user', content: `${systemPrompt}\n\nUser: ${userMsg.content}` }],
          stream: true,
        };
      } else if (isGoogle) {
        url = `${config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta'}/models/${config.model}:streamGenerateContent?key=${config.key}`;
        body = {
          contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nUser: ${userMsg.content}` }] }],
          generationConfig: { maxOutputTokens: mode === 'enhanced' ? 4096 : 2048 },
        };
      } else {
        url = `${config.baseUrl || 'https://api.openai.com/v1'}/chat/completions`;
        headers['Authorization'] = `Bearer ${config.key}`;
        if (isOpenRouter) {
          headers['HTTP-Referer'] = window.location.origin;
          headers['X-Title'] = 'STARIZ AI';
        }
        body = {
          model: config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...newMessages.slice(-15).map((m) => ({ role: m.role, content: m.content })),
          ],
          stream: true,
          max_tokens: mode === 'enhanced' ? 4096 : 2048,
          ...(mode === 'enhanced' && pythonTools ? {
            tools: [{
              type: 'function',
              function: {
                name: 'execute_python_tool',
                description: 'Execute a Python backend tool for system operations, file operations, image processing, or data analysis',
                parameters: {
                  type: 'object',
                  properties: {
                    tool: { type: 'string', description: 'Tool name (system_info, list_files, etc.)' },
                    params: { type: 'object', description: 'Tool parameters' },
                  },
                  required: ['tool', 'params'],
                },
              },
            }],
          } : {}),
        };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `HTTP ${res.status}`);
      }

      const assistantId = generateId();
      let assistantContent = '';
      const toolCalls: ApiMessage['toolCalls'] = [];

      setApiMessages((prev) => [...prev, {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        model: config.model,
        toolCalls: [],
      }]);

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;

          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              let chunk = '';

              if (isAnthropic) {
                chunk = data.delta?.text || '';
              } else if (isGoogle) {
                chunk = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
              } else {
                chunk = data.choices?.[0]?.delta?.content || '';

                if (mode === 'enhanced') {
                  const toolCall = data.choices?.[0]?.delta?.tool_calls?.[0];
                  if (toolCall) {
                    try {
                      const toolData = JSON.parse(toolCall.function.arguments || '{}');
                      toolCalls.push({
                        tool: toolData.tool || '',
                        params: toolData.params || {},
                      });
                    } catch {}
                  }
                }
              }

              if (chunk) {
                assistantContent += chunk;
                setApiMessages((prev) => prev.map((m) =>
                  m.id === assistantId ? { ...m, content: assistantContent } : m
                ));
              }
            } catch {}
          }
        }
      }

      if (mode === 'enhanced' && toolCalls.length > 0) {
        const toolResults: Array<{ tool: string; params: any; result?: any }> = [];
        for (const tc of toolCalls) {
          const result = await executeToolCall(tc);
          toolResults.push({ ...tc, result });
        }

        setApiMessages((prev) => prev.map((m) =>
          m.id === assistantId ? { ...m, toolCalls: toolResults } : m
        ));

        if (toolResults.length > 0) {
          const toolMsg = `Tool execution results:\n${JSON.stringify(toolResults, null, 2)}`;
          setApiMessages((prev) => [...prev.slice(0, -1), {
            ...prev[prev.length - 1],
            content: assistantContent + '\n\n' + toolMsg,
          }]);
        }
      }

      setApiStatus('connected');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        toast.info('Generation stopped');
      } else {
        const msg = err.message || 'Unknown error';
        setApiMessages((prev) => [...prev, {
          id: generateId(),
          role: 'assistant',
          content: `⚠️ Error: ${msg}\n\nPlease check your API key and model configuration.`,
          timestamp: Date.now(),
          model: 'error',
        }]);
        setApiStatus('disconnected');
        toast.error(msg);
      }
    } finally {
      setStreaming(false);
      setAbortController(null);
    }
  }, [input, streaming, apiMessages, setApiMessages, mode, pythonTools, executeToolCall]);

  const handleSend = useCallback(() => {
    if (parseSlashCommand(input)) {
      setInput('');
      return;
    }
    if (mode === 'godmode') {
      sendGodmode();
    } else {
      sendApiMessage();
    }
  }, [input, parseSlashCommand, mode, sendGodmode, sendApiMessage]);

  const stopGeneration = () => {
    abortController?.abort();
    setIsGenerating(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyMessage = (content: string, idx: number) => {
    navigator.clipboard.writeText(content);
    setCopiedId(idx);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const modeConfig = {
    godmode: { icon: Brain, label: 'GODMODE', color: '#ff00a0', subtitle: sessionInfo ? `${sessionInfo.message_count} msgs` : 'Ollama + RAG' },
    enhanced: { icon: Cpu, label: 'Enhanced', color: '#00ff88', subtitle: apiConfig?.model || 'API + Tools' },
    classic: { icon: Bot, label: 'Classic', color: '#00f0ff', subtitle: apiConfig?.model || 'API' },
  };

  const currentMode = modeConfig[mode];
  const ModeIcon = currentMode.icon;

  const filteredGodMessages = searchQuery
    ? godMessages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : godMessages;

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a3a] bg-[#0a0a1a]/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${currentMode.color}15`, borderColor: `${currentMode.color}30`, border: '1px solid' }}>
              <ModeIcon className="w-4 h-4" style={{ color: currentMode.color }} />
            </div>
            {mode === 'godmode' && <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
          </div>
          <div>
            <h2 className="text-sm font-display font-bold text-white">STARIZ {currentMode.label}</h2>
            <div className="flex items-center gap-2">
              {mode === 'godmode' ? (
                <span className="text-[10px] font-mono text-white/40">{currentMode.subtitle}</span>
              ) : (
                <>
                  <div className={`w-1.5 h-1.5 rounded-full ${apiStatus === 'connected' ? 'bg-[#00ff88] animate-pulse' : apiStatus === 'checking' ? 'bg-[#ffcc00]' : 'bg-[#ff3366]'}`} />
                  <span className="text-[10px] font-mono text-white/40">
                    {apiStatus === 'connected' ? currentMode.subtitle : apiStatus === 'checking' ? 'Processing...' : 'No API Key'}
                  </span>
                  {mode === 'enhanced' && pythonConnected && (
                    <span className="text-[9px] font-mono text-[#00ff88]">+ Python</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mode Switcher Buttons */}
        <div className="flex items-center gap-1.5">
          {(['godmode', 'enhanced', 'classic'] as ChatMode[]).map((m) => {
            const cfg = modeConfig[m];
            const MIcon = cfg.icon;
            return (
              <button
                key={m}
                onClick={() => handleModeSwitch(m)}
                className={`px-2 py-1 rounded text-[10px] font-mono transition-all flex items-center gap-1 ${
                  mode === m
                    ? 'text-white border border-white/20 bg-white/10'
                    : 'text-white/30 border border-transparent hover:text-white/60 hover:border-white/10'
                }`}
              >
                <MIcon className="w-3 h-3" />
                <span className="hidden sm:inline">{cfg.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {mode === 'godmode' && (
            <>
              <button
                onClick={() => setRagEnabled(!ragEnabled)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono transition-all ${
                  ragEnabled ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30' : 'bg-transparent text-white/30 border border-white/10'
                }`}
              >
                <Database className="w-3 h-3" />
                RAG
              </button>
              <button
                onClick={() => setShowSearch(!showSearch)}
                className={`p-1.5 rounded transition-all ${showSearch ? 'bg-[#00f0ff]/20 text-[#00f0ff]' : 'hover:bg-white/10 text-white/40'}`}
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="p-1.5 rounded hover:bg-white/10 transition-all text-white/40"
              >
                <Info className="w-4 h-4" />
              </button>
            </>
          )}
          {mode !== 'godmode' && (
            <button
              onClick={() => setShowModelInfo(!showModelInfo)}
              className="p-1.5 rounded text-white/30 hover:text-[#00f0ff] transition-colors"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${showModelInfo ? 'rotate-180' : ''}`} />
            </button>
          )}
          {mode !== 'godmode' && mode === 'enhanced' && (
            <button
              onClick={() => setPythonTools(!pythonTools)}
              className={`p-1.5 rounded transition-all ${
                pythonTools ? 'text-[#00ff88] bg-[#00ff88]/10' : 'text-white/30'
              }`}
            >
              <Terminal className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => {
              if (mode === 'godmode') {
                fetch(`${BACKEND_URL}/api/ai/clear`, { method: 'POST' }).catch(() => {});
                setGodMessages([]);
                fetchSessionInfo();
              } else {
                const greeting = mode === 'enhanced'
                  ? 'Greetings, Commander. I am STARIZ, your integrated AI assistant with Python backend capabilities.'
                  : 'Greetings, Commander. I am STARIZ, your integrated AI assistant.';
                setApiMessages([{ id: generateId(), role: 'assistant', content: greeting, timestamp: Date.now(), model: 'STARIZ-AI' }]);
              }
              toast.info('Chat cleared');
            }}
            className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Godmode: Search Bar */}
      {mode === 'godmode' && (
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-white/10 bg-[#0a0a1a]/30 overflow-hidden"
            >
              <div className="p-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search messages..."
                  className="w-full bg-[#1a1a3a]/50 border border-white/10 rounded px-3 py-1.5 text-xs font-mono text-white placeholder:text-white/30 focus:border-[#00f0ff]/50 focus:outline-none"
                  autoFocus
                />
                {searchQuery && (
                  <p className="text-[10px] text-white/40 font-mono mt-1">
                    {filteredGodMessages.length} of {godMessages.length} messages
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Godmode: Session Info */}
      {mode === 'godmode' && (
        <AnimatePresence>
          {showInfo && sessionInfo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-white/10 bg-[#0a0a1a]/30 overflow-hidden"
            >
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/40 font-mono">Session</span>
                  <span className="text-[10px] text-white/60 font-mono">{sessionInfo.session_id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/40 font-mono">Messages</span>
                  <span className="text-[10px] text-white/60 font-mono">{sessionInfo.message_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/40 font-mono">Total Interactions</span>
                  <span className="text-[10px] text-[#00f0ff] font-mono">{sessionInfo.user_patterns.interaction_count}</span>
                </div>
                {sessionInfo.user_patterns.frequent_commands.length > 0 && (
                  <div>
                    <span className="text-[10px] text-white/40 font-mono">Frequent Commands</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {sessionInfo.user_patterns.frequent_commands.slice(0, 8).map(cmd => (
                        <span key={cmd.keyword} className="px-1.5 py-0.5 rounded bg-[#a855f7]/10 text-[#a855f7] text-[10px] font-mono">
                          {cmd.keyword} ({cmd.count})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/40 font-mono">Model</span>
                  <span className="text-[10px] text-[#00ff88] font-mono">{sessionInfo.model || 'qwen3:4b'}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Classic/Enhanced: Model Info Panel */}
      {mode !== 'godmode' && (
        <AnimatePresence>
          {showModelInfo && apiConfig && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-[#1a1a3a] bg-[#0a0a1a]/30"
            >
              <div className="px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-[#00f0ff]" />
                  <div>
                    <div className="text-[9px] font-mono text-white/30 uppercase">Provider</div>
                    <div className="text-[11px] font-mono text-white/70">{apiConfig.provider}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#a855f7]" />
                  <div>
                    <div className="text-[9px] font-mono text-white/30 uppercase">Model</div>
                    <div className="text-[11px] font-mono text-white/70 truncate max-w-[120px]">{apiConfig.model}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Wifi className="w-3.5 h-3.5 text-[#00ff88]" />
                  <div>
                    <div className="text-[9px] font-mono text-white/30 uppercase">Status</div>
                    <div className="text-[11px] font-mono text-[#00ff88]">{apiStatus}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#ffcc00]" />
                  <div>
                    <div className="text-[9px] font-mono text-white/30 uppercase">Messages</div>
                    <div className="text-[11px] font-mono text-white/70">{apiMessages.length}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Godmode messages */}
        {mode === 'godmode' && (
          <>
            {godMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Sparkles className="w-12 h-12 text-[#ff00a0]/30 mb-4" />
                <h3 className="text-lg font-mono font-bold text-white mb-2">STARIZ GODMODE Online</h3>
                <p className="text-sm text-white/40 font-mono mb-6 max-w-md">
                  Created by Zingri_Master. Full offline AI with voice, RAG knowledge base, memory, and autonomous learning.
                </p>
                <p className="text-[10px] text-white/20 font-mono mb-4">Type <span className="text-[#ff00a0]">/help</span> for commands</p>
                <div className="grid grid-cols-2 gap-2 max-w-md">
                  {MODE_SUGGESTIONS.godmode.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                      className="px-3 py-2 rounded-lg bg-[#1a1a3a]/50 border border-white/5 text-xs font-mono text-white/60 hover:border-[#00f0ff]/30 hover:text-white transition-all text-left"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filteredGodMessages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-[#ff00a0]/20 border border-[#ff00a0]/30 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-[#ff00a0]" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === 'user'
                    ? 'bg-[#00f0ff]/10 border border-[#00f0ff]/20'
                    : 'bg-[#1a1a3a]/50 border border-white/5'
                }`}>
                  {msg.role === 'assistant' ? (
                    <div className="text-sm text-white markdown-content">
                      {renderMarkdown(msg.content)}
                    </div>
                  ) : (
                    <div className="text-sm font-mono text-white whitespace-pre-wrap">{msg.content}</div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[9px] text-white/20 font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                    {msg.ragContext && (
                      <span className="text-[9px] text-[#00f0ff]/40 font-mono flex items-center gap-0.5">
                        <Database className="w-2.5 h-2.5" /> RAG
                      </span>
                    )}
                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => copyMessage(msg.content, i)}
                        className="ml-auto text-white/20 hover:text-white/60 transition-all"
                      >
                        {copiedId === i ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-[#00f0ff]/20 border border-[#00f0ff]/30 flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4 text-[#00f0ff]" />
                  </div>
                )}
              </motion.div>
            ))}

            {isGenerating && godMessages[godMessages.length - 1]?.role !== 'assistant' && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#ff00a0]/20 border border-[#ff00a0]/30 flex items-center justify-center">
                  <Loader className="w-4 h-4 text-[#ff00a0] animate-spin" />
                </div>
                <div className="bg-[#1a1a3a]/50 border border-white/5 rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-[#ff00a0]/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-[#ff00a0]/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-[#ff00a0]/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Classic/Enhanced messages */}
        {mode !== 'godmode' && (
          <>
            {apiMessages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-[#00f0ff]/10 border border-[#00f0ff]/30'
                    : 'bg-[#ff00a0]/10 border border-[#ff00a0]/30'
                }`}>
                  {msg.role === 'user' ? <User className="w-3.5 h-3.5 text-[#00f0ff]" /> : <Bot className="w-3.5 h-3.5 text-[#ff00a0]" />}
                </div>
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block px-4 py-2.5 rounded-xl text-xs font-mono leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#00f0ff]/10 border border-[#00f0ff]/20 text-[#00f0ff]'
                      : 'bg-[#0a0a1a] border border-[#1a1a3a] text-white/80'
                  }`}>
                    <ApiMessageContent content={msg.content} />
                    {msg.content === '' && streaming && (
                      <div className="flex items-center gap-1 py-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#ff00a0] animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-[#ff00a0] animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-[#ff00a0] animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    )}
                  </div>
                  <div className={`flex items-center gap-2 mt-1 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    <span className="text-[9px] font-mono text-white/20">{formatTime(msg.timestamp)}</span>
                    {msg.model && msg.model !== 'STARIZ-AI' && (
                      <span className="text-[9px] font-mono text-white/15">{msg.model}</span>
                    )}
                    {msg.role === 'assistant' && msg.content && (
                      <button
                        onClick={() => copyToClipboard(msg.content).then((ok) => toast[ok ? 'success' : 'error'](ok ? 'Copied' : 'Failed'))}
                        className="text-white/15 hover:text-[#00f0ff] transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {msg.toolCalls.map((tc, i) => (
                        <div key={i} className="text-[10px] font-mono p-2 rounded bg-[#0a0a1a]/50 border border-[#1a1a3a]">
                          <div className="flex items-center gap-1 text-[#00ff88] mb-1">
                            <Terminal className="w-3 h-3" />
                            <span className="font-semibold">{tc.tool}</span>
                          </div>
                          <pre className="text-white/50 text-[9px] overflow-x-auto">
                            {JSON.stringify(tc.params, null, 2)}
                          </pre>
                          {tc.result && (
                            <div className="mt-1 pt-1 border-t border-[#1a1a3a]">
                              <span className="text-[#00ff88]">Result: </span>
                              <span className="text-white/60">{JSON.stringify(tc.result).slice(0, 100)}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Suggested Prompts for Classic/Enhanced */}
            {apiMessages.length <= 2 && apiConfig && !streaming && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-3.5 h-3.5 text-[#ffcc00]" />
                  <span className="text-[10px] font-mono text-[#ffcc00]/60 uppercase tracking-widest">Suggested</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {MODE_SUGGESTIONS[mode].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                      className="text-left px-3 py-2 rounded-lg bg-[#0a0a1a]/50 border border-[#1a1a3a] text-xs font-mono text-white/50 hover:text-white/80 hover:border-[#00f0ff]/20 transition-all"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="px-4 py-3 border-t border-[#1a1a3a] bg-[#0a0a1a]/40">
        {mode !== 'godmode' && !apiConfig && (
          <div className="flex items-center gap-2 px-3 py-2 mb-3 rounded-lg bg-[#ffcc00]/5 border border-[#ffcc00]/20 text-[#ffcc00]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-[11px] font-mono">No API key configured. Click the key icon in the toolbar to connect.</span>
          </div>
        )}
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                mode === 'godmode'
                  ? "Ask STARIZ anything... (/godmode, /enhanced, /classic, /help)"
                  : apiConfig
                    ? (mode === 'enhanced' && pythonTools ? "Ask STARIZ anything... (Python tools enabled)" : "Ask STARIZ anything...")
                    : "Configure API key to start chatting"
              }
              disabled={(mode !== 'godmode' && !apiConfig) || streaming || isGenerating}
              rows={1}
              className="w-full bg-[#0f0f2a] border border-[#1a1a3a] rounded-xl pl-3 pr-12 py-3 text-xs font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-[#00f0ff]/40 resize-none min-h-[44px] max-h-[120px] disabled:opacity-50"
              style={{ fieldSizing: 'content' }}
            />
            <span className="absolute right-3 bottom-3 text-[9px] font-mono text-white/15">
              {input.length}
            </span>
          </div>
          {(streaming || isGenerating) ? (
            <button
              onClick={stopGeneration}
              className="w-10 h-10 rounded-xl bg-[#ff3366]/10 border border-[#ff3366]/30 flex items-center justify-center hover:bg-[#ff3366]/20 transition-colors shrink-0"
            >
              <StopCircle className="w-4 h-4 text-[#ff3366]" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim() || (mode !== 'godmode' && !apiConfig)}
              className="w-10 h-10 rounded-xl bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center hover:bg-[#00f0ff]/20 transition-colors shrink-0 disabled:opacity-30"
            >
              <Send className="w-4 h-4 text-[#00f0ff]" />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[9px] font-mono text-white/15">
            {mode === 'godmode'
              ? `GODMODE · ${sessionInfo ? `${sessionInfo.user_patterns.interaction_count} interactions` : 'Ollama backend'}`
              : apiConfig
                ? `Connected to ${apiConfig.provider} · ${apiConfig.model}`
                : 'No AI provider connected'}
          </span>
          <span className="text-[9px] font-mono text-white/15">
            {mode === 'godmode' ? 'Type /help for commands' : 'Shift+Enter for new line'}
          </span>
        </div>
      </div>
    </div>
  );
}
