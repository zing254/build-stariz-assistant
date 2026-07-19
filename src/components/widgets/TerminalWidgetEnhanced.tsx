import { useState, useEffect, useRef } from 'react';
import { Terminal, Play, Trash2, Copy } from 'lucide-react';
import { toast } from '../Toast';
import { evaluateMathExpression } from '../../utils/helpers';

const BACKEND_URL = import.meta.env.VITE_PYTHON_BACKEND_URL || 'http://localhost:8000';

interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'system';
  text: string;
  timestamp?: number;
}

export default function TerminalWidgetEnhanced() {
  const [history, setHistory] = useState<TerminalLine[]>([
    { id: '1', type: 'system', text: 'STARIZ Terminal v2.4.1 — Enhanced Mode with Python Backend', timestamp: Date.now() },
    { id: '2', type: 'system', text: 'Type "help" for available commands, "connect" to test Python backend', timestamp: Date.now() },
  ]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const addLine = (type: TerminalLine['type'], text: string) => {
    setHistory(prev => [...prev, {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      type,
      text,
      timestamp: Date.now(),
    }]);
  };

  const executeCommand = async (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    // Add input to history
    addLine('input', `user@stariz:~$ ${trimmed}`);

    // Parse command
    const parts = trimmed.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    setLoading(true);

    try {
      // Try Python backend first
      if (connected) {
        try {
          const response = await fetch(`${BACKEND_URL}/api/tools/system/info`);
          if (response.ok) {
            const data = await response.json();
            if (command === 'connect' || command === 'status') {
              addLine('output', `Python Backend: CONNECTED`);
              addLine('output', `Platform: ${data.platform} ${data.platform_release}`);
              addLine('output', `Python: ${data.python_version}`);
              addLine('output', `CPU Cores: ${data.cpu_count}`);
              addLine('output', `Memory: ${Math.round(data.memory_total / 1024 / 1024 / 1024 * 100) / 100} GB total`);
              setLoading(false);
              return;
            }
          }
        } catch {
          setConnected(false);
        }
      }

      // Local command processing
      switch (command) {
        case 'help':
          addLine('output', 'Available commands:');
          addLine('output', '  help          - Show this help message');
          addLine('output', '  connect       - Connect to Python backend');
          addLine('output', '  status        - Show system status');
          addLine('output', '  clear         - Clear terminal');
          addLine('output', '  date          - Show current date');
          addLine('output', '  time          - Show current time');
          addLine('output', '  echo <text>  - Echo text back');
          addLine('output', '  calc <expr>  - Calculate expression');
          addLine('output', '  ls <path>    - List directory (requires backend)');
          addLine('output', '  ping <host>  - Ping a host (requires backend)');
          break;

        case 'connect':
          setConnected(true);
          addLine('system', 'Connecting to Python backend...');
          try {
            const response = await fetch(`${BACKEND_URL}/health`);
            if (response.ok) {
              addLine('output', '✓ Connected to Python backend successfully!');
              addLine('output', 'You now have access to real system commands.');
            } else {
              addLine('error', '✗ Failed to connect: Backend returned ' + response.status);
              setConnected(false);
            }
          } catch {
            addLine('error', '✗ Failed to connect: Python backend not running');
            addLine('system', 'Start the backend with: cd backend && python main.py');
            setConnected(false);
          }
          break;

        case 'status':
          if (connected) {
            addLine('output', 'Connected to Python backend - use "system" command for details');
          } else {
            addLine('output', 'Not connected to Python backend');
            addLine('system', 'Type "connect" to connect to the Python backend');
          }
          break;

        case 'clear':
          setHistory([
            { id: '1', type: 'system', text: 'Terminal cleared', timestamp: Date.now() },
          ]);
          break;

        case 'date':
          addLine('output', new Date().toLocaleDateString('en', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }));
          break;

        case 'time':
          addLine('output', new Date().toLocaleTimeString());
          break;

        case 'echo':
          addLine('output', args.join(' '));
          break;

        case 'calc':
          try {
            const expr = args.join(' ');
            const result = evaluateMathExpression(expr);
            addLine('output', `${expr} = ${result}`);
          } catch {
            addLine('error', 'Invalid expression');
          }
          break;

        case 'ls':
          if (!connected) {
            addLine('error', 'Backend connection required for file operations');
            addLine('system', 'Type "connect" to connect to Python backend');
          } else {
            const path = args[0] || '.';
            try {
              const response = await fetch(`${BACKEND_URL}/api/tools/file/operation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path, operation: 'list' }),
              });
              const data = await response.json();
              if (data.success) {
                addLine('output', `Contents of ${path}:`);
                data.items.forEach((item: any) => {
                  const type = item.is_dir ? 'DIR' : 'FILE';
                  const size = item.size ? `${Math.round(item.size / 1024)}KB` : '-';
                  addLine('output', `  [${type}] ${item.name} (${size})`);
                });
              } else {
                addLine('error', data.error || 'Failed to list directory');
              }
            } catch (e: any) {
              addLine('error', `Error: ${e.message}`);
            }
          }
          break;

        case 'ping':
          if (!connected) {
            addLine('error', 'Backend connection required for ping');
          } else if (args.length === 0) {
            addLine('error', 'Usage: ping <host>');
          } else {
            const host = args[0];
            addLine('system', `Pinging ${host}...`);
            try {
              const response = await fetch(
                `${BACKEND_URL}/api/tools/system/ping/${host}?count=2`,
                { method: 'GET' }
              );
              const data = await response.json();
              if (data.success) {
                addLine('output', data.output || 'Ping successful');
              } else {
                addLine('error', data.error || 'Ping failed');
              }
            } catch (e: any) {
              addLine('error', `Error: ${e.message}`);
            }
          }
          break;

        default:
          addLine('error', `Command not found: ${command}. Type "help" for available commands.`);
      }
    } catch (error: any) {
      addLine('error', `Error: ${error.message}`);
    }

    setLoading(false);
  };

  const handleSubmit = () => {
    if (!input.trim() || loading) return;
    executeCommand(input);
    setInput('');
  };

  const handleClear = () => {
    setHistory([
      { id: '1', type: 'system', text: 'Terminal cleared', timestamp: Date.now() },
    ]);
  };

  const handleCopyAll = async () => {
    const text = history.map(line => line.text).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Terminal output copied!');
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="cyber-border bg-[#0a0a1a]/90 backdrop-blur p-4 rounded-lg h-full flex flex-col font-mono">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#00ff88]" />
          <span className="text-xs text-[#00ff88]/60 uppercase tracking-widest">Terminal</span>
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-[#00ff88]' : 'bg-[#ff3366]'}`} />
          <span className="text-[10px] font-mono text-white/30">
            {connected ? 'BACKEND' : 'OFFLINE'}
          </span>
        </div>
        <div className="flex gap-1.5">
          <button onClick={handleCopyAll} className="p-1 text-white/30 hover:text-[#00f0ff] transition-colors">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleClear} className="p-1 text-white/30 hover:text-[#ff3366] transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-0.5 mb-2 text-xs pr-1 font-mono"
        style={{ fontSize: '12px', lineHeight: '1.5' }}
      >
        {history.map((line) => {
          let textColor = '#ffffff90';
          if (line.type === 'input') textColor = '#00f0ff';
          else if (line.type === 'error') textColor = '#ff3366';
          else if (line.type === 'system') textColor = '#ffcc00';

          return (
            <div key={line.id} style={{ color: textColor, whiteSpace: 'pre-wrap' }}>
              {line.text}
            </div>
          );
        })}
        {loading && (
          <div className="text-[#ffcc00] animate-pulse">Processing...</div>
        )}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 border-t border-[#1a1a3a] pt-2">
        <span className="text-[#00f0ff] text-xs shrink-0">$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
            if (e.key === 'ArrowUp') {
              // Simple history navigation could be added here
            }
          }}
          placeholder={connected ? 'Enter command...' : 'Type "connect" to use Python backend...'}
          className="flex-1 bg-transparent text-xs text-white/80 focus:outline-none font-mono"
          autoFocus
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !input.trim()}
          className="px-2 py-1 bg-[#00f0ff]/10 border border-[#00f0ff]/30 rounded text-[#00f0ff] text-xs font-mono hover:bg-[#00f0ff]/20 disabled:opacity-30"
        >
          <Play className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
