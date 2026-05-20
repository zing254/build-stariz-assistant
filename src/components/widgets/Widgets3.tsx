import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Timer, Play, Pause, RotateCcw, Globe, Clock, Terminal,
  ExternalLink, Zap, Shield, Activity, Wifi,
  Lock, Unlock, EyeOff, Download, Upload, Trash2,
  AlertTriangle
} from 'lucide-react';
import { worldCities, quickLinks, exportData, importData } from '../../utils/helpers';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { toast } from '../Toast';

// ==================== POMODORO WIDGET ====================
export function PomodoroWidget() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'work' | 'short' | 'long'>('work');
  const [sessions, setSessions] = useLocalStorage('stariz-pomodoro-sessions', 0);

  const modes = {
    work: { time: 25 * 60, label: 'Focus', color: '#00f0ff' },
    short: { time: 5 * 60, label: 'Short Break', color: '#00ff88' },
    long: { time: 15 * 60, label: 'Long Break', color: '#a855f7' },
  };

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setIsRunning(false);
          if (mode === 'work') setSessions((s: number) => s + 1);
          toast.success(`${modes[mode].label} complete!`);
          return modes[mode].time;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, mode]);

  const switchMode = (m: 'work' | 'short' | 'long') => {
    setMode(m);
    setTimeLeft(modes[m].time);
    setIsRunning(false);
  };

  const format = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const progress = ((modes[mode].time - timeLeft) / modes[mode].time) * 100;

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Timer className="w-4 h-4 text-[#00f0ff]" />
        <span className="text-xs font-mono text-[#00f0ff]/60 uppercase tracking-widest">Pomodoro</span>
        <span className="ml-auto text-[10px] font-mono text-white/30">{sessions} sessions</span>
      </div>

      <div className="flex gap-1 mb-4">
        {(['work', 'short', 'long'] as const).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`flex-1 py-1 text-[10px] font-mono rounded border transition-all ${
              mode === m
                ? 'border-[#00f0ff]/40 text-[#00f0ff] bg-[#00f0ff]/10'
                : 'border-[#1a1a3a] text-white/30 hover:text-white/50'
            }`}
          >
            {modes[m].label.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative w-28 h-28 mb-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#1a1a3a" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              stroke={modes[mode].color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 42}`}
              strokeDashoffset={`${2 * Math.PI * 42 * (1 - progress / 100)}`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-display font-bold text-white tabular-nums">{format(timeLeft)}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="w-10 h-10 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center hover:bg-[#00f0ff]/20 transition-colors"
          >
            {isRunning ? <Pause className="w-4 h-4 text-[#00f0ff]" /> : <Play className="w-4 h-4 text-[#00f0ff] ml-0.5" />}
          </button>
          <button
            onClick={() => { setTimeLeft(modes[mode].time); setIsRunning(false); }}
            className="w-10 h-10 rounded-full bg-[#0a0a1a] border border-[#1a1a3a] flex items-center justify-center hover:border-[#ff3366]/30 transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-white/50" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== WORLD CLOCK WIDGET ====================
export function WorldClockWidget() {
  const [times, setTimes] = useState<Record<string, Date>>({});

  useEffect(() => {
    const update = () => {
      const now: Record<string, Date> = {};
      worldCities.forEach((c) => {
        now[c.name] = new Date(new Date().toLocaleString('en-US', { timeZone: c.timezone }));
      });
      setTimes(now);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full">
      <div className="flex items-center gap-2 mb-3">
        <Globe className="w-4 h-4 text-[#00ff88]" />
        <span className="text-xs font-mono text-[#00ff88]/60 uppercase tracking-widest">World Clock</span>
      </div>

      <div className="space-y-2">
        {worldCities.map((city) => {
          const t = times[city.name];
          if (!t) return null;
          const isDay = t.getHours() >= 6 && t.getHours() < 18;
          return (
            <motion.div
              key={city.name}
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-3 p-2.5 rounded bg-[#0a0a1a]/50 border border-[#1a1a3a]"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDay ? 'bg-[#ffcc00]/10' : 'bg-[#a855f7]/10'}`}>
                <Clock className={`w-4 h-4 ${isDay ? 'text-[#ffcc00]' : 'text-[#a855f7]'}`} />
              </div>
              <div className="flex-1">
                <div className="text-xs font-mono font-semibold text-white/80">{city.name}</div>
                <div className="text-[10px] font-mono text-white/30">{city.timezone.split('/')[1].replace('_', ' ')}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-mono font-bold text-[#00ff88] tabular-nums">
                  {t.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </div>
                <div className="text-[10px] font-mono text-white/30">
                  {t.toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ==================== TERMINAL WIDGET ====================
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
        // eslint-disable-next-line no-new-func
        return String(new Function('return ' + expr)());
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

// ==================== QUICK LINKS WIDGET ====================
export function QuickLinksWidget() {
  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-[#ffcc00]" />
        <span className="text-xs font-mono text-[#ffcc00]/60 uppercase tracking-widest">Quick Links</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {quickLinks.map((link) => (
          <motion.a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 p-2.5 rounded bg-[#0a0a1a]/50 border border-[#1a1a3a] hover:border-[#1a1a3a] transition-all group"
          >
            <ExternalLink className="w-3.5 h-3.5 shrink-0" style={{ color: link.color }} />
            <span className="text-xs font-mono text-white/70 group-hover:text-white truncate">{link.name}</span>
          </motion.a>
        ))}
      </div>
    </div>
  );
}

// ==================== SECURITY WIDGET ====================
export function SecurityWidget() {
  const [firewall, setFirewall] = useState(true);
  const [vpn, setVpn] = useState(true);
  const [encryption, setEncryption] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [threats, setThreats] = useState(0);
  const [lastScan, setLastScan] = useState('Never');

  const runScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      const found = Math.floor(Math.random() * 3);
      setThreats(found);
      setLastScan(new Date().toLocaleTimeString());
      if (found > 0) {
        toast.error(`${found} threat${found > 1 ? 's' : ''} detected!`);
      } else {
        toast.success('System secure — no threats found');
      }
    }, 3000);
  };

  const services = [
    { name: 'Firewall', active: firewall, toggle: () => setFirewall(!firewall), icon: Shield, color: '#00f0ff' },
    { name: 'VPN Tunnel', active: vpn, toggle: () => setVpn(!vpn), icon: Lock, color: '#00ff88' },
    { name: 'Encryption', active: encryption, toggle: () => setEncryption(!encryption), icon: EyeOff, color: '#a855f7' },
  ];

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-[#00f0ff]" />
        <span className="text-xs font-mono text-[#00f0ff]/60 uppercase tracking-widest">Security</span>
        <span className={`ml-auto text-[10px] font-mono px-2 py-0.5 rounded ${threats > 0 ? 'bg-[#ff3366]/20 text-[#ff3366]' : 'bg-[#00ff88]/20 text-[#00ff88]'}`}>
          {threats > 0 ? `${threats} THREATS` : 'SECURE'}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        {services.map((s) => {
          const Icon = s.active ? s.icon : Unlock;
          return (
            <div key={s.name} className="flex items-center justify-between p-2 rounded bg-[#0a0a1a]/50">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" style={{ color: s.active ? s.color : '#ffffff30' }} />
                <span className="text-xs font-mono text-white/70">{s.name}</span>
              </div>
              <button
                onClick={s.toggle}
                className={`w-8 h-4 rounded-full transition-colors relative ${s.active ? 'bg-[#00ff88]/30' : 'bg-[#1a1a3a]'}`}
              >
                <motion.div
                  className="absolute top-0.5 w-3 h-3 rounded-full"
                  style={{ backgroundColor: s.active ? '#00ff88' : '#ffffff30' }}
                  animate={{ left: s.active ? 18 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
          );
        })}
      </div>

      <div className="text-[10px] font-mono text-white/20 mb-2 text-right">Last scan: {lastScan}</div>

      <button
        onClick={runScan}
        disabled={scanning}
        className="w-full py-2 rounded border border-[#00f0ff]/30 bg-[#00f0ff]/5 text-[#00f0ff] text-xs font-mono hover:bg-[#00f0ff]/10 transition-colors disabled:opacity-50"
      >
        {scanning ? (
          <span className="flex items-center justify-center gap-2">
            <Activity className="w-3 h-3 animate-spin" /> SCANNING...
          </span>
        ) : (
          'RUN SECURITY SCAN'
        )}
      </button>
    </div>
  );
}

// ==================== NETWORK WIDGET ====================
export function NetworkWidget() {
  const [stats, setStats] = useState({ download: 45, upload: 12, ping: 23, packets: 1240 });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats({
        download: Math.floor(Math.random() * 80) + 10,
        upload: Math.floor(Math.random() * 30) + 5,
        ping: Math.floor(Math.random() * 20) + 10,
        packets: Math.floor(Math.random() * 500) + 1000,
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full">
      <div className="flex items-center gap-2 mb-3">
        <Wifi className="w-4 h-4 text-[#a855f7]" />
        <span className="text-xs font-mono text-[#a855f7]/60 uppercase tracking-widest">Network</span>
        <span className="ml-auto text-[10px] font-mono text-[#00ff88]">ONLINE</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#0a0a1a]/50 rounded p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Download className="w-3 h-3 text-[#00f0ff]" />
            <span className="text-[10px] font-mono text-white/40">DOWN</span>
          </div>
          <div className="text-lg font-mono font-bold text-[#00f0ff]">{stats.download}</div>
          <div className="text-[10px] font-mono text-white/30">Mbps</div>
        </div>
        <div className="bg-[#0a0a1a]/50 rounded p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Upload className="w-3 h-3 text-[#ff00a0]" />
            <span className="text-[10px] font-mono text-white/40">UP</span>
          </div>
          <div className="text-lg font-mono font-bold text-[#ff00a0]">{stats.upload}</div>
          <div className="text-[10px] font-mono text-white/30">Mbps</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-white/40">Latency</span>
          <span className="text-[#00ff88]">{stats.ping}ms</span>
        </div>
        <div className="flex justify-between text-xs font-mono">
          <span className="text-white/40">Packets/s</span>
          <span className="text-[#a855f7]">{stats.packets}</span>
        </div>
        <div className="h-1.5 bg-[#1a1a3a] rounded-full overflow-hidden mt-2">
          <motion.div
            className="h-full bg-[#a855f7]"
            animate={{ width: `${Math.random() * 60 + 20}%` }}
            transition={{ duration: 2 }}
          />
        </div>
      </div>
    </div>
  );
}

// ==================== AI CORE WIDGET ====================
export function AICoreWidget() {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [metrics, setMetrics] = useState({ accuracy: 97.3, tokens: 12450, models: 8, latency: 45 });

  const runInference = () => {
    setProcessing(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setProcessing(false);
          setMetrics({
            accuracy: Math.min(99.9, metrics.accuracy + Math.random() * 0.5),
            tokens: metrics.tokens + Math.floor(Math.random() * 1000),
            models: metrics.models,
            latency: Math.max(20, metrics.latency + (Math.random() - 0.5) * 10),
          });
          toast.success('Inference complete');
          return 100;
        }
        return p + 2;
      });
    }, 50);
  };

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-4 h-4 rounded border border-[#ff00a0]/40 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-[#ff00a0] animate-pulse" />
        </div>
        <span className="text-xs font-mono text-[#ff00a0]/60 uppercase tracking-widest">AI Core</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: 'Accuracy', value: `${metrics.accuracy.toFixed(1)}%`, color: '#00ff88' },
          { label: 'Tokens', value: metrics.tokens.toLocaleString(), color: '#00f0ff' },
          { label: 'Models', value: String(metrics.models), color: '#a855f7' },
          { label: 'Latency', value: `${Math.round(metrics.latency)}ms`, color: '#ffcc00' },
        ].map((m) => (
          <div key={m.label} className="bg-[#0a0a1a]/50 rounded p-2.5 text-center">
            <div className="text-[10px] font-mono text-white/40 mb-1">{m.label}</div>
            <div className="text-sm font-mono font-bold" style={{ color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {processing && (
        <div className="mb-3">
          <div className="flex justify-between text-[10px] font-mono text-white/40 mb-1">
            <span>Processing inference...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-[#1a1a3a] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#ff00a0]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <button
        onClick={runInference}
        disabled={processing}
        className="w-full py-2 rounded border border-[#ff00a0]/30 bg-[#ff00a0]/5 text-[#ff00a0] text-xs font-mono hover:bg-[#ff00a0]/10 transition-colors disabled:opacity-50"
      >
        {processing ? 'PROCESSING...' : 'RUN INFERENCE'}
      </button>
    </div>
  );
}

// ==================== SETTINGS WIDGET ====================
export function SettingsWidget() {
  const [theme, setTheme] = useLocalStorage('stariz-theme', 'cyber');
  const [notifications, setNotifications] = useLocalStorage('stariz-notifications', true);
  const [animations, setAnimations] = useLocalStorage('stariz-animations', true);
  const [compact, setCompact] = useLocalStorage('stariz-compact', false);
  const [confirmClear, setConfirmClear] = useState(false);

  const themes = [
    { id: 'cyber', name: 'Cyberpunk', primary: '#00f0ff', secondary: '#ff00a0' },
    { id: 'matrix', name: 'Matrix', primary: '#00ff88', secondary: '#00ff00' },
    { id: 'sunset', name: 'Sunset', primary: '#ff6600', secondary: '#ffcc00' },
    { id: 'ice', name: 'Ice', primary: '#a5f3fc', secondary: '#67e8f9' },
  ];

  const handleExport = () => {
    exportData();
    toast.success('Data exported to JSON');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ok = await importData(file);
    toast[ok ? 'success' : 'error'](ok ? 'Data imported! Reloading...' : 'Import failed — invalid file');
    if (ok) setTimeout(() => window.location.reload(), 1500);
  };

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('stariz-')) localStorage.removeItem(key);
    });
    toast.success('All data cleared. Reloading...');
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full overflow-y-auto">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-4 h-4 rounded border border-white/20 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
        </div>
        <span className="text-xs font-mono text-white/60 uppercase tracking-widest">Settings</span>
      </div>

      <div className="space-y-5">
        {/* Theme */}
        <div>
          <div className="text-[10px] font-mono text-white/40 mb-2 uppercase tracking-wider">Theme</div>
          <div className="grid grid-cols-2 gap-2">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`p-2 rounded border text-xs font-mono transition-all ${
                  theme === t.id
                    ? 'border-[#00f0ff]/40 bg-[#00f0ff]/10 text-[#00f0ff]'
                    : 'border-[#1a1a3a] text-white/40 hover:text-white/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: `linear-gradient(135deg, ${t.primary}, ${t.secondary})` }} />
                  {t.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          {[
            { label: 'Notifications', value: notifications, toggle: () => setNotifications(!notifications) },
            { label: 'Animations', value: animations, toggle: () => setAnimations(!animations) },
            { label: 'Compact Mode', value: compact, toggle: () => setCompact(!compact) },
          ].map((s) => (
            <div key={s.label} className="flex items-center justify-between">
              <span className="text-xs font-mono text-white/60">{s.label}</span>
              <button
                onClick={s.toggle}
                className={`w-8 h-4 rounded-full transition-colors relative ${s.value ? 'bg-[#00f0ff]/30' : 'bg-[#1a1a3a]'}`}
              >
                <motion.div
                  className="absolute top-0.5 w-3 h-3 rounded-full"
                  style={{ backgroundColor: s.value ? '#00f0ff' : '#ffffff30' }}
                  animate={{ left: s.value ? 18 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
          ))}
        </div>

        {/* Data Management */}
        <div className="pt-3 border-t border-[#1a1a3a]">
          <div className="text-[10px] font-mono text-white/40 mb-2 uppercase tracking-wider">Data Management</div>
          <div className="space-y-2">
            <button onClick={handleExport} className="w-full flex items-center justify-center gap-2 py-2 rounded border border-[#00f0ff]/20 bg-[#00f0ff]/5 text-[#00f0ff] text-xs font-mono hover:bg-[#00f0ff]/10 transition-colors">
              <Download className="w-3.5 h-3.5" /> EXPORT ALL DATA
            </button>
            <label className="w-full flex items-center justify-center gap-2 py-2 rounded border border-[#00ff88]/20 bg-[#00ff88]/5 text-[#00ff88] text-xs font-mono hover:bg-[#00ff88]/10 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> IMPORT DATA
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
            <button
              onClick={handleClear}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded border text-xs font-mono transition-colors ${
                confirmClear
                  ? 'border-[#ff3366] bg-[#ff3366]/20 text-[#ff3366]'
                  : 'border-[#ff3366]/20 bg-[#ff3366]/5 text-[#ff3366]/70 hover:bg-[#ff3366]/10'
              }`}
            >
              {confirmClear ? <AlertTriangle className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
              {confirmClear ? 'CLICK AGAIN TO CONFIRM' : 'CLEAR ALL DATA'}
            </button>
          </div>
        </div>

        {/* System Info */}
        <div className="pt-3 border-t border-[#1a1a3a]">
          <div className="text-[10px] font-mono text-white/30 mb-2 uppercase tracking-wider">System Info</div>
          <div className="space-y-1.5 text-[10px] font-mono text-white/40">
            <div className="flex justify-between"><span>App</span><span className="text-white/60">STARIZ AI v2.4.1</span></div>
            <div className="flex justify-between"><span>Build</span><span className="text-white/60">2026.01.15-stable</span></div>
            <div className="flex justify-between"><span>Stack</span><span className="text-white/60">React 19 + Tailwind 4</span></div>
            <div className="flex justify-between"><span>Platform</span><span className="text-white/60">{navigator.platform}</span></div>
            <div className="flex justify-between"><span>Language</span><span className="text-white/60">{navigator.language}</span></div>
            <div className="flex justify-between"><span>Cores</span><span className="text-white/60">{navigator.hardwareConcurrency || '?'}</span></div>
            <div className="flex justify-between"><span>Memory</span><span className="text-white/60">{(navigator as any).deviceMemory || '?'} GB</span></div>
            <div className="flex justify-between"><span>Online</span><span className="text-[#00ff88]">{navigator.onLine ? 'YES' : 'NO'}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
