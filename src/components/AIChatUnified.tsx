import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Bot, User, Trash2, Copy, Sparkles, Database, Search, Info,
  AlertCircle, StopCircle, Terminal, Mic, MicOff, Volume2, VolumeX,
} from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { getStoredApiConfig, type ApiConfig } from './ApiKeyManager';
import { usePythonBackend } from '../hooks/usePythonBackend';
import { renderMarkdown } from '../utils/markdown';
import { copyToClipboard } from '../utils/helpers';
import { toast } from './Toast';

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

const SYSTEM_PROMPT = `You are STARIZ, an advanced cyberpunk AI assistant integrated into a personal dashboard. You have access to various tools and widgets including: clock, weather, tasks, notes, calendar, music player, calculator, terminal, crypto prices, password generator, unit converter, color tools, JSON formatter, dev tools, clipboard manager, world clock, pomodoro timer, stopwatch, security scanner, network monitor, AI core metrics, whiteboard, journal, and more.

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

type ConnectionStatus = 'checking' | 'backend' | 'api' | 'disconnected';

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
}

const SUGGESTIONS = [
  "What can you do?",
  "Tell me about my usage patterns",
  "Search my knowledge base for recent projects",
  "What's my system status?",
  "Help me organize my tasks",
  "Show me my CPU and memory usage",
];

export default function AIChatUnified() {
  const [messages, setMessages] = useLocalStorage<ApiMessage[]>('stariz-chat-history-v2', [
    { id: generateId(), role: 'assistant', content: 'Greetings, Commander. I am STARIZ, your integrated AI assistant. I have full awareness of your dashboard systems. How may I assist you today?', timestamp: Date.now(), model: 'STARIZ-AI' },
  ]);

  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('checking');
  const [apiConfig, setApiConfig] = useState<ApiConfig | null>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [ragEnabled, setRagEnabled] = useState(true);
  const [pythonTools, setPythonTools] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [backendAvailable, setBackendAvailable] = useState(false);
  const [modelName, setModelName] = useState('STARIZ-AI');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const spokenMessageRef = useRef<string>('');

  const speak = useCallback((text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window) || !text.trim()) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/```[\s\S]*?```/g, ' code block ').replace(/[*_#>`~-]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(clean.slice(0, 4000));
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

  useEffect(() => {
    if (isGenerating || !voiceEnabled) return;
    const last = messages[messages.length - 1];
    if (last?.role === 'assistant' && last.content && last.id !== spokenMessageRef.current) {
      spokenMessageRef.current = last.id;
      speak(last.content);
    }
  }, [messages, isGenerating, voiceEnabled, speak]);

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { toast.error('Voice input is not supported in this browser'); return; }
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = navigator.language || 'en-US';
    recognition.interimResults = true;
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join('');
      setInput(transcript);
    };
    recognition.onerror = () => { setIsListening(false); toast.error('Could not access the microphone'); };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    try { recognition.start(); setIsListening(true); } catch { setIsListening(false); }
  };

  useEffect(() => () => { recognitionRef.current?.stop(); window.speechSynthesis?.cancel(); }, []);

  const { connected: pythonConnected, callTool: callPythonTool } = usePythonBackend();

  useEffect(() => {
    const config = getStoredApiConfig();
    setApiConfig(config);
    checkBackend();
  }, []);

  useEffect(() => {
    if (backendAvailable) {
      fetchSessionInfo();
    }
  }, [backendAvailable]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isGenerating]);

  const checkBackend = async () => {
    setConnectionStatus('checking');
    try {
      const res = await fetch(`${BACKEND_URL}/api/ai/session`);
      if (res.ok) {
        setBackendAvailable(true);
        setConnectionStatus('backend');
        const info = await res.json();
        setSessionInfo(info);
        setModelName(info.model || 'Ollama');
        return;
      }
    } catch {}
    const config = getStoredApiConfig();
    if (config) {
      setConnectionStatus('api');
      setModelName(config.model);
    } else {
      setConnectionStatus('disconnected');
    }
  };

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

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isGenerating) return;

    const userMsg: ApiMessage = { id: generateId(), role: 'user', content: input.trim(), timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    const sentInput = input;
    setInput('');
    setIsGenerating(true);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      // A configured browser provider is authoritative. This avoids silently
      // routing to a running-but-unconfigured backend and then failing when
      // Ollama is not installed.
      if (backendAvailable && !apiConfig) {
        const res = await fetch(`${BACKEND_URL}/api/ai/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: sentInput, use_rag: ragEnabled }),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error('Failed to get response');

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No reader');

        const decoder = new TextDecoder();
        let buffer = '';
        let assistantContent = '';

        const assistantId = generateId();
        setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', timestamp: Date.now(), model: modelName }]);

        while (true) {
          const { done, value } = await reader.read();
          buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.chunk) {
                assistantContent += data.chunk;
                setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: assistantContent } : m));
              }
            } catch {
              // Ignore malformed keep-alive lines, but preserve incomplete
              // lines in buffer so network chunk boundaries never lose text.
            }
          }
          if (done) break;
        }
        if (buffer.startsWith('data: ')) {
          try {
            const data = JSON.parse(buffer.slice(6));
            if (data.chunk) assistantContent += data.chunk;
          } catch { /* incomplete final event */ }
        }

        fetchSessionInfo();
      } else if (apiConfig) {
        const isOpenRouter = apiConfig.provider === 'openrouter';
        const isAnthropic = apiConfig.provider === 'anthropic';
        const isGoogle = apiConfig.provider === 'google';

        let url: string;
        let body: any;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };

        if (isAnthropic) {
          url = `${apiConfig.baseUrl || 'https://api.anthropic.com/v1'}/messages`;
          headers['x-api-key'] = apiConfig.key;
          headers['anthropic-version'] = '2023-06-01';
          body = {
            model: apiConfig.model,
            max_tokens: 4096,
            messages: [{ role: 'user', content: `${SYSTEM_PROMPT}\n\nUser: ${sentInput}` }],
            stream: true,
          };
        } else if (isGoogle) {
          url = `${apiConfig.baseUrl || 'https://generativelanguage.googleapis.com/v1beta'}/models/${apiConfig.model}:streamGenerateContent?key=${apiConfig.key}`;
          body = {
            contents: [{ role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\nUser: ${sentInput}` }] }],
            generationConfig: { maxOutputTokens: 4096 },
          };
        } else {
          url = `${apiConfig.baseUrl || 'https://api.openai.com/v1'}/chat/completions`;
          headers['Authorization'] = `Bearer ${apiConfig.key}`;
          if (isOpenRouter) {
            headers['HTTP-Referer'] = window.location.origin;
            headers['X-Title'] = 'STARIZ AI';
          }
          body = {
            model: apiConfig.model,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              ...newMessages.slice(-15).map((m) => ({ role: m.role, content: m.content })),
            ],
            stream: true,
            max_tokens: 4096,
            ...(pythonTools ? {
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

        setMessages((prev) => [...prev, {
          id: assistantId,
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          model: apiConfig.model,
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

                if (chunk) {
                  assistantContent += chunk;
                  setMessages((prev) => prev.map((m) =>
                    m.id === assistantId ? { ...m, content: assistantContent } : m
                  ));
                }
              } catch {}
            }
          }
        }

        if (toolCalls.length > 0) {
          const toolResults: Array<{ tool: string; params: any; result?: any }> = [];
          for (const tc of toolCalls) {
            const result = await executeToolCall(tc);
            toolResults.push({ ...tc, result });
          }

          setMessages((prev) => prev.map((m) =>
            m.id === assistantId ? { ...m, toolCalls: toolResults } : m
          ));

          if (toolResults.length > 0) {
            const toolMsg = `Tool execution results:\n${JSON.stringify(toolResults, null, 2)}`;
            setMessages((prev) => [...prev.slice(0, -1), {
              ...prev[prev.length - 1],
              content: assistantContent + '\n\n' + toolMsg,
            }]);
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        toast.info('Generation stopped');
      } else {
        const msg = err.message || 'Unknown error';
        setMessages((prev) => [...prev, {
          id: generateId(),
          role: 'assistant',
          content: `⚠️ Error: ${msg}`,
          timestamp: Date.now(),
          model: 'error',
        }]);
        toast.error(msg);
      }
    } finally {
      setIsGenerating(false);
      setAbortController(null);
    }
  }, [input, isGenerating, messages, setMessages, backendAvailable, apiConfig, ragEnabled, modelName, pythonTools, executeToolCall]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    const lower = trimmed.toLowerCase();

    if (lower === '/clear') {
      if (backendAvailable) {
        fetch(`${BACKEND_URL}/api/ai/clear`, { method: 'POST' }).catch(() => {});
        fetchSessionInfo();
      }
      setMessages([{ id: generateId(), role: 'assistant', content: 'Greetings, Commander. I am STARIZ, your integrated AI assistant.', timestamp: Date.now(), model: 'STARIZ-AI' }]);
      toast.info('Chat cleared');
      setInput('');
      return;
    }

    sendMessage();
  }, [input, backendAvailable, sendMessage, setMessages]);

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

  const filteredMessages = searchQuery
    ? messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  const canChat = connectionStatus !== 'disconnected' && connectionStatus !== 'checking';

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a3a] bg-[#0a0a1a]/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#ff00a0]/15 border border-[#ff00a0]/30 flex items-center justify-center">
            <Bot className="w-4 h-4 text-[#ff00a0]" />
          </div>
          <div>
            <h2 className="text-sm font-display font-bold text-white">STARIZ AI</h2>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${
                connectionStatus === 'backend' ? 'bg-green-500 animate-pulse' :
                connectionStatus === 'api' ? 'bg-yellow-500' :
                connectionStatus === 'checking' ? 'bg-yellow-400' : 'bg-red-500'
              }`} />
              <span className="text-[10px] font-mono text-white/40">{modelName}</span>
              {backendAvailable && pythonConnected && (
                <span className="text-[9px] font-mono text-[#00ff88]">+Python</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {backendAvailable && (
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
                aria-label={showSearch ? 'Hide search' : 'Search messages'}
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="p-1.5 rounded hover:bg-white/10 transition-all text-white/40"
                aria-label={showInfo ? 'Hide session info' : 'Show session info'}
              >
                <Info className="w-4 h-4" />
              </button>
            </>
          )}
          {!backendAvailable && apiConfig && (
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
              if (backendAvailable) {
                fetch(`${BACKEND_URL}/api/ai/clear`, { method: 'POST' }).catch(() => {});
                fetchSessionInfo();
              }
              setMessages([{ id: generateId(), role: 'assistant', content: 'Greetings, Commander. I am STARIZ, your integrated AI assistant.', timestamp: Date.now(), model: 'STARIZ-AI' }]);
              toast.info('Chat cleared');
            }}
            className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-all"
            aria-label="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
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
                  {filteredMessages.length} of {messages.length} messages
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session Info */}
      <AnimatePresence>
        {showInfo && backendAvailable && sessionInfo && (
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

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {filteredMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Sparkles className="w-12 h-12 text-[#ff00a0]/30 mb-4" />
            <h3 className="text-lg font-mono font-bold text-white mb-2">STARIZ AI Online</h3>
            <p className="text-sm text-white/40 font-mono mb-6 max-w-md">
              Created by Zingri_Master. Full AI with knowledge base, memory, and autonomous capabilities.
            </p>
            <p className="text-[10px] text-white/20 font-mono mb-4">Type <span className="text-[#ff00a0]">/clear</span> to reset</p>
            <div className="grid grid-cols-2 gap-2 max-w-md">
              {SUGGESTIONS.map((prompt, i) => (
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

        {filteredMessages.map((msg) => (
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
                <div className="text-sm text-white markdown-content">
                  {renderMarkdown(msg.content)}
                </div>
                {msg.content === '' && isGenerating && (
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
                    aria-label="Copy message"
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
      </div>

      {/* Input Area */}
      <div className="px-4 py-3 border-t border-[#1a1a3a] bg-[#0a0a1a]/40">
        {connectionStatus === 'disconnected' && (
          <div className="flex items-center gap-2 px-3 py-2 mb-3 rounded-lg bg-[#ffcc00]/5 border border-[#ffcc00]/20 text-[#ffcc00]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-[11px] font-mono">No AI backend or API key configured. Click the key icon in the toolbar to connect.</span>
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
                connectionStatus === 'disconnected'
                  ? "Configure AI to start chatting"
                  : "Ask STARIZ anything... (/clear to reset)"
              }
              disabled={!canChat}
              rows={1}
              className="w-full bg-[#0f0f2a] border border-[#1a1a3a] rounded-xl pl-3 pr-12 py-3 text-xs font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-[#00f0ff]/40 resize-none min-h-[44px] max-h-[120px] disabled:opacity-50"
              style={{ fieldSizing: 'content' }}
            />
            <span className="absolute right-3 bottom-3 text-[9px] font-mono text-white/15">
              {input.length}
            </span>
          </div>
          <button
            onClick={toggleListening}
            disabled={!canChat}
            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors shrink-0 disabled:opacity-30 ${isListening ? 'bg-[#ff3366]/20 border-[#ff3366]/50' : 'bg-[#a855f7]/10 border-[#a855f7]/30 hover:bg-[#a855f7]/20'}`}
            aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
            title={isListening ? 'Stop voice input' : 'Speak your message'}
          >
            {isListening ? <MicOff className="w-4 h-4 text-[#ff3366]" /> : <Mic className="w-4 h-4 text-[#a855f7]" />}
          </button>
          <button
            onClick={() => { setVoiceEnabled((enabled) => !enabled); if (voiceEnabled) window.speechSynthesis?.cancel(); }}
            className="w-10 h-10 rounded-xl border border-[#1a1a3a] flex items-center justify-center hover:bg-white/10 transition-colors shrink-0"
            aria-label={voiceEnabled ? 'Mute spoken responses' : 'Enable spoken responses'}
            title={voiceEnabled ? 'Mute spoken responses' : 'Enable spoken responses'}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4 text-[#00ff88]" /> : <VolumeX className="w-4 h-4 text-white/30" />}
          </button>
          {isGenerating ? (
            <button
              onClick={stopGeneration}
              className="w-10 h-10 rounded-xl bg-[#ff3366]/10 border border-[#ff3366]/30 flex items-center justify-center hover:bg-[#ff3366]/20 transition-colors shrink-0"
              aria-label="Stop generating"
            >
              <StopCircle className="w-4 h-4 text-[#ff3366]" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim() || !canChat}
              className="w-10 h-10 rounded-xl bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center hover:bg-[#00f0ff]/20 transition-colors shrink-0 disabled:opacity-30"
              aria-label="Send message"
            >
              <Send className="w-4 h-4 text-[#00f0ff]" />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[9px] font-mono text-white/15">
            {connectionStatus === 'backend'
              ? `Backend · ${sessionInfo ? `${sessionInfo.user_patterns.interaction_count} interactions` : 'Ollama'}`
              : connectionStatus === 'api'
                ? `Connected to ${apiConfig?.provider} · ${apiConfig?.model}`
                : 'No AI provider connected'}
          </span>
          <span className="text-[9px] font-mono text-white/15">
            Shift+Enter for new line
          </span>
        </div>
      </div>
    </div>
  );
}
