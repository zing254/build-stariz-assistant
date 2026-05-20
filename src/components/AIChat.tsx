import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Bot, User, Copy, Check, Trash2, Sparkles,
  ChevronDown, AlertCircle, StopCircle,
  Cpu, Wifi, Clock, Lightbulb
} from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { getStoredApiConfig, type ApiConfig } from './ApiKeyManager';
import { copyToClipboard } from '../utils/helpers';
import { toast } from './Toast';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string;
  tokens?: { prompt: number; completion: number };
}

const SYSTEM_PROMPT = `You are STARIZ, an advanced cyberpunk AI assistant integrated into a personal dashboard. You have access to various tools and widgets including: clock, weather, tasks, notes, calendar, music player, calculator, terminal, crypto prices, password generator, unit converter, color tools, JSON formatter, dev tools, clipboard manager, world clock, pomodoro timer, stopwatch, security scanner, network monitor, AI core metrics, and a drawing whiteboard.

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

function MessageContent({ content }: { content: string }) {
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

export default function AIChat() {
  const [messages, setMessages] = useLocalStorage<Message[]>('stariz-chat-history', [
    { id: generateId(), role: 'assistant', content: 'Greetings, Commander. I am STARIZ, your integrated AI assistant. I have full awareness of your dashboard systems. How may I assist you today?', timestamp: Date.now(), model: 'STARIZ-AI' },
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [apiStatus, setApiStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [apiConfig, setApiConfig] = useState<ApiConfig | null>(null);
  const [showModelInfo, setShowModelInfo] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const config = getStoredApiConfig();
    setApiConfig(config);
    setApiStatus(config ? 'connected' : 'disconnected');
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streaming]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || streaming) return;

    const config = getStoredApiConfig();
    if (!config) {
      toast.error('No API key configured. Click the key icon in the toolbar.');
      return;
    }

    const userMsg: Message = { id: generateId(), role: 'user', content: input.trim(), timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setStreaming(true);
    setApiStatus('checking');

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const isOpenRouter = config.provider === 'openrouter';
      const isAnthropic = config.provider === 'anthropic';
      const isGoogle = config.provider === 'google';

      let url: string;
      let body: any;
      let headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (isAnthropic) {
        url = `${config.baseUrl || 'https://api.anthropic.com/v1'}/messages`;
        headers['x-api-key'] = config.key;
        headers['anthropic-version'] = '2023-06-01';
        body = {
          model: config.model,
          max_tokens: 2048,
          messages: [
            { role: 'user', content: `${SYSTEM_PROMPT}\n\nUser: ${userMsg.content}` },
          ],
          stream: true,
        };
      } else if (isGoogle) {
        url = `${config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta'}/models/${config.model}:streamGenerateContent?key=${config.key}`;
        body = {
          contents: [{ role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\nUser: ${userMsg.content}` }] }],
          generationConfig: { maxOutputTokens: 2048 },
        };
      } else {
        // OpenAI-compatible (OpenRouter, OpenAI, Custom)
        url = `${config.baseUrl || 'https://api.openai.com/v1'}/chat/completions`;
        headers['Authorization'] = `Bearer ${config.key}`;
        if (isOpenRouter) {
          headers['HTTP-Referer'] = window.location.origin;
          headers['X-Title'] = 'STARIZ AI';
        }
        body = {
          model: config.model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...newMessages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
          ],
          stream: true,
          max_tokens: 2048,
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

      setMessages((prev) => [...prev, {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        model: config.model,
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
              }

              if (chunk) {
                assistantContent += chunk;
                setMessages((prev) => prev.map((m) =>
                  m.id === assistantId ? { ...m, content: assistantContent } : m
                ));
              }
            } catch {
              // ignore malformed JSON
            }
          }
        }
      }

      setApiStatus('connected');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        toast.info('Generation stopped');
      } else {
        const msg = err.message || 'Unknown error';
        setMessages((prev) => [...prev, {
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
  }, [input, streaming, messages, setMessages]);

  const stopGeneration = () => {
    abortController?.abort();
  };

  const clearChat = () => {
    setMessages([{
      id: generateId(),
      role: 'assistant',
      content: 'Chat history cleared. How can I help you?',
      timestamp: Date.now(),
      model: 'STARIZ-AI',
    }]);
    toast.info('Chat cleared');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a3a] bg-[#0a0a1a]/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#ff00a0]/10 border border-[#ff00a0]/30 flex items-center justify-center">
            <Bot className="w-4 h-4 text-[#ff00a0]" />
          </div>
          <div>
            <h2 className="text-sm font-display font-bold text-white">STARIZ AI Chat</h2>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${apiStatus === 'connected' ? 'bg-[#00ff88] animate-pulse' : apiStatus === 'checking' ? 'bg-[#ffcc00]' : 'bg-[#ff3366]'}`} />
              <span className="text-[10px] font-mono text-white/40">
                {apiStatus === 'connected' ? apiConfig?.model || 'Ready' : apiStatus === 'checking' ? 'Processing...' : 'No API Key'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={clearChat} className="p-2 rounded border border-[#1a1a3a] text-white/30 hover:text-[#ff3366] hover:border-[#ff3366]/30 transition-colors" title="Clear chat">
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={() => setShowModelInfo(!showModelInfo)} className="p-2 rounded border border-[#1a1a3a] text-white/30 hover:text-[#00f0ff] hover:border-[#00f0ff]/30 transition-colors" title="Model info">
            <ChevronDown className={`w-4 h-4 transition-transform ${showModelInfo ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Model Info Panel */}
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
                  <div className="text-[11px] font-mono text-white/70">{messages.length}</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => (
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
                <MessageContent content={msg.content} />
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
            </div>
          </motion.div>
        ))}

        {/* Suggested Prompts */}
        {messages.length <= 2 && apiConfig && !streaming && (
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
              {[
                'What can you help me with?',
                'Write a Python script to fetch API data',
                'Explain quantum computing simply',
                'Generate a secure password for my server',
                'What is the weather looking like?',
                'Help me debug this error: TypeError...',
              ].map((prompt) => (
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
      </div>

      {/* Input Area */}
      <div className="px-4 py-3 border-t border-[#1a1a3a] bg-[#0a0a1a]/40">
        {!apiConfig && (
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
              placeholder={apiConfig ? "Ask STARIZ anything..." : "Configure API key to start chatting"}
              disabled={!apiConfig || streaming}
              rows={1}
              className="w-full bg-[#0f0f2a] border border-[#1a1a3a] rounded-xl px-4 py-3 pr-12 text-xs font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-[#00f0ff]/40 resize-none min-h-[44px] max-h-[120px] disabled:opacity-50"
              style={{ fieldSizing: 'content' }}
            />
            <span className="absolute right-3 bottom-3 text-[9px] font-mono text-white/15">
              {input.length}
            </span>
          </div>
          {streaming ? (
            <button
              onClick={stopGeneration}
              className="w-10 h-10 rounded-xl bg-[#ff3366]/10 border border-[#ff3366]/30 flex items-center justify-center hover:bg-[#ff3366]/20 transition-colors shrink-0"
            >
              <StopCircle className="w-4 h-4 text-[#ff3366]" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim() || !apiConfig}
              className="w-10 h-10 rounded-xl bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center hover:bg-[#00f0ff]/20 transition-colors shrink-0 disabled:opacity-30"
            >
              <Send className="w-4 h-4 text-[#00f0ff]" />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[9px] font-mono text-white/15">
            {apiConfig ? `Connected to ${apiConfig.provider} · ${apiConfig.model}` : 'No AI provider connected'}
          </span>
          <span className="text-[9px] font-mono text-white/15">Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  );
}
