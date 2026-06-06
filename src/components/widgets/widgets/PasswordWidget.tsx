import { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, Copy } from 'lucide-react';
import { generatePassword, copyToClipboard } from '../../../utils/helpers';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { toast } from '../../Toast';

export function PasswordWidget() {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [opts, setOpts] = useState({ upper: true, lower: true, numbers: true, symbols: true });
  const [visible, setVisible] = useState(false);
  const [history, setHistory] = useLocalStorage<string[]>('stariz-passwords', []);

  const generate = () => {
    const pwd = generatePassword(length, opts);
    setPassword(pwd);
    setHistory([pwd, ...history].slice(0, 10));
  };

  useEffect(() => { generate(); }, []);

  const handleCopy = async () => {
    const ok = await copyToClipboard(password);
    toast[ok ? 'success' : 'error'](ok ? 'Password copied!' : 'Failed to copy');
  };

  const strength = () => {
    let score = 0;
    if (opts.upper) score++;
    if (opts.lower) score++;
    if (opts.numbers) score++;
    if (opts.symbols) score++;
    if (length >= 12) score++;
    if (length >= 20) score++;
    const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong', 'Unbreakable'];
    const colors = ['#ff3366', '#ff6600', '#ffcc00', '#00ff88', '#00f0ff', '#a855f7'];
    return { label: labels[Math.min(score, 5)], color: colors[Math.min(score, 5)] };
  };

  const s = strength();

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-[#00ff88]" />
        <span className="text-xs font-mono text-[#00ff88]/60 uppercase tracking-widest">Password Gen</span>
      </div>

      <div className="bg-[#0a0a1a] border border-[#1a1a3a] rounded-lg p-3 mb-3 flex items-center gap-2">
        <span className="flex-1 text-sm font-mono text-[#00f0ff] truncate">{visible ? password : '•'.repeat(password.length)}</span>
        <button onClick={() => setVisible(!visible)} className="text-white/30 hover:text-white/60">
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
        <button onClick={handleCopy} className="text-white/30 hover:text-[#00f0ff]">
          <Copy className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-mono text-white/40">LENGTH: {length}</span>
        <input type="range" min="6" max="64" value={length} onChange={(e) => setLength(Number(e.target.value))} className="flex-1 h-1 bg-[#1a1a3a] rounded-full appearance-none cursor-pointer" style={{ accentColor: '#00ff88' }} />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        {(['upper', 'lower', 'numbers', 'symbols'] as const).map((k) => (
          <label key={k} className="flex items-center gap-2 text-[10px] font-mono text-white/50 cursor-pointer">
            <input type="checkbox" checked={opts[k]} onChange={(e) => setOpts({ ...opts, [k]: e.target.checked })} className="accent-[#00ff88]" />
            {k.toUpperCase()}
          </label>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-1.5 bg-[#1a1a3a] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${(length / 64) * 100}%`, backgroundColor: s.color }} />
        </div>
        <span className="text-[10px] font-mono" style={{ color: s.color }}>{s.label}</span>
      </div>

      <button onClick={generate} className="w-full py-2 rounded border border-[#00ff88]/30 bg-[#00ff88]/5 text-[#00ff88] text-xs font-mono hover:bg-[#00ff88]/10 transition-colors">
        GENERATE
      </button>
    </div>
  );
}
