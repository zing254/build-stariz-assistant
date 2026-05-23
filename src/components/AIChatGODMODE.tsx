import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader, Bot, User, Trash2, Copy, Check, Sparkles, Brain, Database, Clock, X, Search, Info } from 'lucide-react';
import { renderMarkdown } from '../utils/markdown.tsx';

const BACKEND_URL = import.meta.env.VITE_PYTHON_BACKEND_URL || 'http://localhost:8000';

interface Message {
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
    frequent_commands: Array<{keyword: string; count: number}>;
    active_hours: number[];
    interaction_count: number;
  };
}

export default function AIChatGODMODE() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [ragEnabled, setRagEnabled] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    fetchSessionInfo();
  }, []);

  const fetchSessionInfo = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/ai/session`);
      if (res.ok) setSessionInfo(await res.json());
    } catch {}
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isGenerating) return;

    const userMsg: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsGenerating(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          use_rag: ragEnabled,
        }),
      });

      if (!res.ok) throw new Error('Failed to get response');

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let assistantContent = '';
      const assistantMsgIndex = messages.length;

      setMessages(prev => [...prev, {
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
              setMessages(prev => {
                const updated = [...prev];
                const idx = assistantMsgIndex;
                if (updated[idx]?.role === 'assistant') {
                  updated[idx] = { ...updated[idx], content: assistantContent };
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
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I apologize, but I encountered an error: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date().toISOString(),
      }]);
    }

    setIsGenerating(false);
  }, [input, isGenerating, ragEnabled, messages.length]);

  const clearChat = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/ai/clear`, { method: 'POST' });
      setMessages([]);
      fetchSessionInfo();
    } catch {}
  };

  const copyMessage = (content: string, idx: number) => {
    navigator.clipboard.writeText(content);
    setCopiedId(idx);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredMessages = searchQuery
    ? messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  const suggestedPrompts = [
    "What can you do?",
    "Tell me about my usage patterns",
    "Search my knowledge base for recent projects",
    "What's my system status?",
    "Who created you?",
    "Help me organize my tasks",
    "Show me my CPU and memory usage",
    "What have we talked about before?",
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0a0a1a]/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Brain className="w-5 h-5 text-[#ff00a0]" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-mono font-bold text-white">STARIZ GODMODE</h2>
            <p className="text-[10px] text-white/40 font-mono">
              {sessionInfo ? `${sessionInfo.message_count} messages · ${sessionInfo.user_patterns.interaction_count} interactions` : 'Initializing...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRagEnabled(!ragEnabled)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono transition-all ${
              ragEnabled
                ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30'
                : 'bg-white/5 text-white/30 border border-white/10'
            }`}
          >
            <Database className="w-3 h-3" />
            RAG {ragEnabled ? 'ON' : 'OFF'}
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
          <button
            onClick={clearChat}
            className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-all"
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

      {/* Session Info Panel */}
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
                <span className="text-[10px] text-white/40 font-mono">Active Hours</span>
                <span className="text-[10px] text-white/60 font-mono">
                  {sessionInfo.user_patterns.active_hours.map(h => `${h}:00`).join(', ')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/40 font-mono">Model</span>
                <span className="text-[10px] text-[#00ff88] font-mono">{sessionInfo.model || 'qwen3:4b'}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Sparkles className="w-12 h-12 text-[#ff00a0]/30 mb-4" />
            <h3 className="text-lg font-mono font-bold text-white mb-2">STARIZ GODMODE Online</h3>
            <p className="text-sm text-white/40 font-mono mb-6 max-w-md">
              Created by Zingri_Master. Full offline AI with voice, RAG knowledge base, memory, and autonomous learning.
            </p>
            <div className="grid grid-cols-2 gap-2 max-w-md">
              {suggestedPrompts.map((prompt, i) => (
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

        {filteredMessages.map((msg, i) => (
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

        {isGenerating && messages[messages.length - 1]?.role !== 'assistant' && (
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

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10 bg-[#0a0a1a]/50">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask STARIZ anything..."
            rows={1}
            className="flex-1 bg-[#1a1a3a]/50 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-white/30 focus:border-[#ff00a0]/50 focus:outline-none resize-none"
          />
          <button
            onClick={sendMessage}
            disabled={isGenerating || !input.trim()}
            className="px-4 py-2 rounded-lg bg-[#ff00a0]/20 border border-[#ff00a0]/30 text-[#ff00a0] font-mono text-sm hover:bg-[#ff00a0]/30 transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
