import { useState, useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';
import { evaluateMathExpression } from '../../../utils/helpers';

export function TerminalWidget() {
  const [history, setHistory] = useState<Array<{ type: 'input' | 'output'; text: string; color?: string }>>([
    { type: 'output', text: 'STARIZ Terminal v2.4.1 — Type "help" for commands', color: '#00f0ff' },
    { type: 'output', text: 'Connected to neural network... OK', color: '#00ff88' },
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history]);

  const commands: Record<string, () => string> = {
    help: () => 'Available commands: help, clear, date, time, uptime, whoami, sysinfo, ping, matrix, reboot, shutdown, fortune, echo, calc',
    clear: () => { setHistory([]); return ''; },
    date: () => new Date().toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    time: () => new Date().toLocaleTimeString(),
    uptime: () => `System uptime: ${Math.floor(Math.random() * 72 + 1)}h ${Math.floor(Math.random() * 60)}m`,
    whoami: () => 'user@stariz-ai:~$ Commander Level 7 — Neural Link Active',
    sysinfo: () => `OS: STARIZ-OS v2.4.1\nKernel: Quantum-Neural 5.15.0\nCPU: 128-core Quantum Processor\nRAM: 512TB Quantum Memory\nStorage: 10PB Crystal Array\nBrowser: ${navigator.userAgent.split(' ').pop()?.replace(')', '') || 'Unknown'}`,
    ping: () => `PING google.com: 64 bytes from 142.250.80.46: icmp_seq=1 ttl=117 time=${Math.floor(Math.random() * 20 + 5)} ms`,
    matrix: () => '01001110 01100101 01101111 00100000 01010100 01101111 01101011 01111001 01101111',
    reboot: () => 'Initiating system reboot sequence...\n[OK] Neural link disconnected\n[OK] Subsystems shutting down\n[OK] Restarting...',
    shutdown: () => 'System shutdown initiated. Goodbye, Commander.',
    fortune: () => ['The future is quantum.', 'Trust the neural network.', 'Data never lies.', 'Encrypt everything.', 'Stay paranoid.', 'The code is the truth.'][Math.floor(Math.random() * 6)],
    echo: () => input.replace(/^echo\s*/, '') || '',
    calc: () => {
      try {
        const expr = input.replace(/^calc\s*/, '');
        return String(evaluateMathExpression(expr));
      } catch { return 'Invalid expression'; }
    },
  };

  const handleCommand = () => {
    if (!input.trim()) return;
    const cmd = input.trim().toLowerCase();
    const cmdName = cmd.split(' ')[0];
    setHistory((h) => [...h, { type: 'input', text: `user@stariz:~$ ${input}` }]);

    setTimeout(() => {
      if (commands[cmdName]) {
        const out = commands[cmdName]();
        if (out) setHistory((h) => [...h, { type: 'output', text: out, color: '#00ff88' }]);
      } else {
        setHistory((h) => [...h, { type: 'output', text: `Command not found: ${cmdName}. Type "help" for available commands.`, color: '#ff3366' }]);
      }
    }, 100);
    setInput('');
  };

  return (
    <div className="cyber-border bg-[#0a0a1a]/90 backdrop-blur p-4 rounded-lg h-full flex flex-col font-mono">
      <div className="flex items-center gap-2 mb-2">
        <Terminal className="w-4 h-4 text-[#00ff88]" />
        <span className="text-xs text-[#00ff88]/60 uppercase tracking-widest">Terminal</span>
        <div className="ml-auto flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff3366]/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#ffcc00]/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#00ff88]/60" />
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1 mb-2 text-xs pr-1">
        {history.map((h, i) => (
          <div key={i} className={h.type === 'input' ? 'text-[#00f0ff]/70' : ''} style={{ color: h.color || '#ffffff90', whiteSpace: 'pre-wrap' }}>
            {h.text}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[#00f0ff] text-xs shrink-0">$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCommand()}
          className="flex-1 bg-transparent text-xs text-white/80 focus:outline-none font-mono"
          placeholder="Enter command..."
          autoFocus
        />
      </div>
    </div>
  );
}
