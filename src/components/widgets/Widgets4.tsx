import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, TrendingDown, Quote, Clock, Timer, Play, Pause,
  RotateCcw, Copy, RefreshCw, Shield, Ruler,
  ArrowRightLeft, Palette, Code, Braces, Fingerprint, FileText, ClipboardList,
  Globe, Wind, MapPin, Trash2, Eye, EyeOff
} from 'lucide-react';
import { generatePassword, generateUUID, generateLorem, copyToClipboard, fetchWithFallback } from '../../utils/helpers';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { toast } from '../Toast';

// ==================== CRYPTO PRICES ====================
const CRYPTO_FALLBACK = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', current_price: 67234.50, price_change_percentage_24h: 2.34, image: '' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', current_price: 3456.78, price_change_percentage_24h: -1.12, image: '' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', current_price: 178.92, price_change_percentage_24h: 5.67, image: '' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', current_price: 0.58, price_change_percentage_24h: -0.45, image: '' },
];

export function CryptoWidget() {
  const [coins, setCoins] = useState(CRYPTO_FALLBACK);
  const [loading, setLoading] = useState(true);

  const fetchCoins = async () => {
    setLoading(true);
    const data = await fetchWithFallback(
      async () => {
        const res = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,cardano,polkadot,chainlink&order=market_cap_desc&per_page=6&page=1&sparkline=false&price_change_percentage=24h');
        if (!res.ok) throw new Error('Failed');
        return res.json();
      },
      CRYPTO_FALLBACK
    );
    setCoins(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCoins();
    const interval = setInterval(fetchCoins, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-[#ffcc00]" />
          <span className="text-xs font-mono text-[#ffcc00]/60 uppercase tracking-widest">Crypto Live</span>
        </div>
        <button onClick={fetchCoins} className="text-white/30 hover:text-[#ffcc00] transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {coins.map((coin) => (
          <div key={coin.id} className="flex items-center justify-between p-2.5 rounded bg-[#0a0a1a]/50 border border-[#1a1a3a]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#ffcc00]/10 flex items-center justify-center text-[10px] font-bold text-[#ffcc00]">
                {coin.symbol}
              </div>
              <div>
                <div className="text-xs font-mono font-semibold text-white/80">{coin.name}</div>
                <div className="text-[10px] font-mono text-white/30">{coin.symbol}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono font-bold text-white">${coin.current_price.toLocaleString()}</div>
              <div className={`text-[10px] font-mono flex items-center justify-end gap-0.5 ${coin.price_change_percentage_24h >= 0 ? 'text-[#00ff88]' : 'text-[#ff3366]'}`}>
                {coin.price_change_percentage_24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== QUOTES ====================
const QUOTES_FALLBACK = [
  { content: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt' },
  { content: 'Innovation distinguishes between a leader and a follower.', author: 'Steve Jobs' },
  { content: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
];

export function QuotesWidget() {
  const [quote, setQuote] = useState(QUOTES_FALLBACK[0]);
  const [loading, setLoading] = useState(false);

  const fetchQuote = async () => {
    setLoading(true);
    const data = await fetchWithFallback(
      async () => {
        const res = await fetch('https://api.quotable.io/random');
        if (!res.ok) throw new Error('Failed');
        return res.json();
      },
      QUOTES_FALLBACK[Math.floor(Math.random() * QUOTES_FALLBACK.length)]
    );
    setQuote(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchQuote();
  }, []);

  const handleCopy = async () => {
    const text = `"${quote.content}" — ${quote.author}`;
    const ok = await copyToClipboard(text);
    toast[ok ? 'success' : 'error'](ok ? 'Quote copied!' : 'Failed to copy');
  };

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Quote className="w-4 h-4 text-[#a855f7]" />
          <span className="text-xs font-mono text-[#a855f7]/60 uppercase tracking-widest">Daily Quote</span>
        </div>
        <div className="flex gap-1">
          <button onClick={handleCopy} className="p-1 text-white/30 hover:text-[#a855f7] transition-colors">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button onClick={fetchQuote} className="p-1 text-white/30 hover:text-[#a855f7] transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <p className="text-sm font-mono text-white/70 leading-relaxed italic">"{quote.content}"</p>
        <p className="text-xs font-mono text-[#a855f7]/60 mt-3 text-right">— {quote.author}</p>
      </div>
    </div>
  );
}

// ==================== STOPWATCH & TIMER ====================
export function StopwatchWidget() {
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useLocalStorage<Array<{ id: string; time: number }>>('stariz-laps', []);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setTime((t) => t + 10), 10);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const format = (ms: number) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  };

  const addLap = () => setLaps([{ id: generateUUID(), time }, ...laps].slice(0, 10));
  const reset = () => { setRunning(false); setTime(0); setLaps([]); };

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-[#00f0ff]" />
        <span className="text-xs font-mono text-[#00f0ff]/60 uppercase tracking-widest">Stopwatch</span>
      </div>

      <div className="text-center mb-4">
        <div className="text-3xl font-display font-bold text-white tabular-nums">{format(time)}</div>
      </div>

      <div className="flex justify-center gap-2 mb-3">
        <button onClick={() => setRunning(!running)} className="w-9 h-9 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center hover:bg-[#00f0ff]/20">
          {running ? <Pause className="w-4 h-4 text-[#00f0ff]" /> : <Play className="w-4 h-4 text-[#00f0ff] ml-0.5" />}
        </button>
        <button onClick={addLap} disabled={!running} className="w-9 h-9 rounded-full bg-[#0a0a1a] border border-[#1a1a3a] flex items-center justify-center hover:border-[#ffcc00]/30 disabled:opacity-30">
          <Timer className="w-4 h-4 text-[#ffcc00]" />
        </button>
        <button onClick={reset} className="w-9 h-9 rounded-full bg-[#0a0a1a] border border-[#1a1a3a] flex items-center justify-center hover:border-[#ff3366]/30">
          <RotateCcw className="w-4 h-4 text-[#ff3366]" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {laps.map((lap, i) => (
          <div key={lap.id} className="flex justify-between text-xs font-mono px-2 py-1 rounded bg-[#0a0a1a]/30">
            <span className="text-white/40">Lap {laps.length - i}</span>
            <span className="text-[#00f0ff]">{format(lap.time)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== PASSWORD GENERATOR ====================
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

// ==================== UNIT CONVERTER ====================
const UNITS: Record<string, { label: string; toBase: number }> = {
  m: { label: 'Meters', toBase: 1 },
  km: { label: 'Kilometers', toBase: 1000 },
  cm: { label: 'Centimeters', toBase: 0.01 },
  mm: { label: 'Millimeters', toBase: 0.001 },
  mi: { label: 'Miles', toBase: 1609.344 },
  ft: { label: 'Feet', toBase: 0.3048 },
  in: { label: 'Inches', toBase: 0.0254 },
  yd: { label: 'Yards', toBase: 0.9144 },
};

export function ConverterWidget() {
  const [amount, setAmount] = useState(1);
  const [from, setFrom] = useState('m');
  const [to, setTo] = useState('ft');

  const result = (amount * UNITS[from].toBase) / UNITS[to].toBase;

  const swap = () => { setFrom(to); setTo(from); };

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Ruler className="w-4 h-4 text-[#ff00a0]" />
        <span className="text-xs font-mono text-[#ff00a0]/60 uppercase tracking-widest">Converter</span>
      </div>

      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        className="w-full bg-[#0a0a1a] border border-[#1a1a3a] rounded-lg px-3 py-2 text-lg font-mono text-white focus:outline-none focus:border-[#ff00a0]/50 mb-3"
      />

      <div className="flex items-center gap-2 mb-3">
        <select value={from} onChange={(e) => setFrom(e.target.value)} className="flex-1 bg-[#0a0a1a] border border-[#1a1a3a] rounded px-2 py-2 text-xs font-mono text-white focus:outline-none">
          {Object.entries(UNITS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button onClick={swap} className="p-2 rounded bg-[#0a0a1a] border border-[#1a1a3a] hover:border-[#ff00a0]/30">
          <ArrowRightLeft className="w-3.5 h-3.5 text-[#ff00a0]" />
        </button>
        <select value={to} onChange={(e) => setTo(e.target.value)} className="flex-1 bg-[#0a0a1a] border border-[#1a1a3a] rounded px-2 py-2 text-xs font-mono text-white focus:outline-none">
          {Object.entries(UNITS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-display font-bold text-[#ff00a0]">{result.toLocaleString(undefined, { maximumFractionDigits: 6 })}</div>
          <div className="text-xs font-mono text-white/40 mt-1">{UNITS[to].label}</div>
        </div>
      </div>
    </div>
  );
}

// ==================== COLOR TOOLS ====================
export function ColorWidget() {
  const [hex, setHex] = useState('#00f0ff');
  const [rgb, setRgb] = useState({ r: 0, g: 240, b: 255 });

  const hexToRgb = (h: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : { r: 0, g: 0, b: 0 };
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
  };

  const handleHexChange = (h: string) => {
    setHex(h);
    if (/^#[0-9A-Fa-f]{6}$/.test(h)) setRgb(hexToRgb(h));
  };

  const handleRgbChange = (key: 'r' | 'g' | 'b', val: number) => {
    const newRgb = { ...rgb, [key]: Math.max(0, Math.min(255, val)) };
    setRgb(newRgb);
    setHex(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  };

  const handleCopy = async (text: string) => {
    const ok = await copyToClipboard(text);
    toast[ok ? 'success' : 'error'](ok ? 'Copied!' : 'Failed');
  };

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Palette className="w-4 h-4 text-[#a855f7]" />
        <span className="text-xs font-mono text-[#a855f7]/60 uppercase tracking-widest">Color Tool</span>
      </div>

      <div className="w-full h-16 rounded-lg border border-[#1a1a3a] mb-3" style={{ backgroundColor: hex }} />

      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-mono text-white/40 w-8">HEX</span>
        <input value={hex} onChange={(e) => handleHexChange(e.target.value)} className="flex-1 bg-[#0a0a1a] border border-[#1a1a3a] rounded px-2 py-1 text-xs font-mono text-white focus:outline-none uppercase" />
        <button onClick={() => handleCopy(hex)} className="text-white/30 hover:text-[#a855f7]"><Copy className="w-3.5 h-3.5" /></button>
      </div>

      {(['r', 'g', 'b'] as const).map((c) => (
        <div key={c} className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono text-white/40 w-8 uppercase">{c}</span>
          <input type="range" min="0" max="255" value={rgb[c]} onChange={(e) => handleRgbChange(c, Number(e.target.value))} className="flex-1 h-1 bg-[#1a1a3a] rounded-full appearance-none cursor-pointer" />
          <input type="number" min="0" max="255" value={rgb[c]} onChange={(e) => handleRgbChange(c, Number(e.target.value))} className="w-12 bg-[#0a0a1a] border border-[#1a1a3a] rounded px-1 py-0.5 text-[10px] font-mono text-white text-center focus:outline-none" />
        </div>
      ))}
    </div>
  );
}

// ==================== JSON FORMATTER ====================
export function JsonWidget() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const format = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
      setError('');
    } catch (e) {
      setError('Invalid JSON');
      setOutput('');
    }
  };

  const minify = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setError('');
    } catch {
      setError('Invalid JSON');
    }
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(output);
    toast[ok ? 'success' : 'error'](ok ? 'Copied!' : 'Failed');
  };

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Braces className="w-4 h-4 text-[#00f0ff]" />
        <span className="text-xs font-mono text-[#00f0ff]/60 uppercase tracking-widest">JSON Tool</span>
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder='Paste JSON here...'
        className="flex-1 bg-[#0a0a1a] border border-[#1a1a3a] rounded-lg p-3 text-xs font-mono text-white/80 placeholder:text-white/20 focus:outline-none resize-none mb-2"
      />

      <div className="flex gap-2 mb-2">
        <button onClick={format} className="flex-1 py-1.5 rounded border border-[#00f0ff]/30 bg-[#00f0ff]/5 text-[#00f0ff] text-[10px] font-mono hover:bg-[#00f0ff]/10">PRETTIFY</button>
        <button onClick={minify} className="flex-1 py-1.5 rounded border border-[#ffcc00]/30 bg-[#ffcc00]/5 text-[#ffcc00] text-[10px] font-mono hover:bg-[#ffcc00]/10">MINIFY</button>
      </div>

      {error && <div className="text-[10px] font-mono text-[#ff3366] mb-1">{error}</div>}

      {output && (
        <div className="relative">
          <pre className="bg-[#0a0a1a] border border-[#1a1a3a] rounded-lg p-3 text-[10px] font-mono text-[#00ff88] overflow-auto max-h-24">{output}</pre>
          <button onClick={handleCopy} className="absolute top-1 right-1 p-1 text-white/30 hover:text-[#00f0ff]"><Copy className="w-3 h-3" /></button>
        </div>
      )}
    </div>
  );
}

// ==================== BASE64 / UUID / LOREM ====================
export function ToolsWidget() {
  const [base64Input, setBase64Input] = useState('');
  const [base64Output, setBase64Output] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [uuid, setUuid] = useState(generateUUID());
  const [lorem, setLorem] = useState('');
  const [loremParas, setLoremParas] = useState(2);

  const runBase64 = () => {
    try {
      if (mode === 'encode') {
        setBase64Output(btoa(base64Input));
      } else {
        setBase64Output(atob(base64Input));
      }
    } catch {
      setBase64Output('Invalid input');
    }
  };

  const genLorem = () => setLorem(generateLorem(loremParas));

  const handleCopy = async (text: string) => {
    const ok = await copyToClipboard(text);
    toast[ok ? 'success' : 'error'](ok ? 'Copied!' : 'Failed');
  };

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full flex flex-col overflow-y-auto">
      <div className="flex items-center gap-2 mb-3">
        <Code className="w-4 h-4 text-[#00ff88]" />
        <span className="text-xs font-mono text-[#00ff88]/60 uppercase tracking-widest">Dev Tools</span>
      </div>

      {/* Base64 */}
      <div className="mb-3">
        <div className="flex gap-1 mb-1">
          <button onClick={() => setMode('encode')} className={`px-2 py-0.5 rounded text-[10px] font-mono border ${mode === 'encode' ? 'border-[#00f0ff]/40 text-[#00f0ff] bg-[#00f0ff]/10' : 'border-[#1a1a3a] text-white/40'}`}>ENCODE</button>
          <button onClick={() => setMode('decode')} className={`px-2 py-0.5 rounded text-[10px] font-mono border ${mode === 'decode' ? 'border-[#00f0ff]/40 text-[#00f0ff] bg-[#00f0ff]/10' : 'border-[#1a1a3a] text-white/40'}`}>DECODE</button>
        </div>
        <div className="flex gap-1">
          <input value={base64Input} onChange={(e) => setBase64Input(e.target.value)} placeholder="Text..." className="flex-1 bg-[#0a0a1a] border border-[#1a1a3a] rounded px-2 py-1 text-[10px] font-mono text-white focus:outline-none" />
          <button onClick={runBase64} className="px-2 py-1 bg-[#00f0ff]/10 border border-[#00f0ff]/30 rounded text-[#00f0ff] text-[10px] font-mono">GO</button>
        </div>
        {base64Output && (
          <div className="flex items-center gap-1 mt-1">
            <span className="flex-1 text-[10px] font-mono text-[#00ff88] truncate">{base64Output}</span>
            <button onClick={() => handleCopy(base64Output)}><Copy className="w-3 h-3 text-white/30 hover:text-[#00f0ff]" /></button>
          </div>
        )}
      </div>

      {/* UUID */}
      <div className="mb-3 pt-2 border-t border-[#1a1a3a]">
        <div className="flex items-center gap-2 mb-1">
          <Fingerprint className="w-3 h-3 text-[#a855f7]" />
          <span className="text-[10px] font-mono text-white/40">UUID</span>
        </div>
        <div className="flex gap-1">
          <span className="flex-1 text-[10px] font-mono text-[#a855f7] truncate bg-[#0a0a1a] border border-[#1a1a3a] rounded px-2 py-1">{uuid}</span>
          <button onClick={() => setUuid(generateUUID())} className="px-2 py-1 bg-[#a855f7]/10 border border-[#a855f7]/30 rounded text-[#a855f7] text-[10px] font-mono">NEW</button>
          <button onClick={() => handleCopy(uuid)}><Copy className="w-3 h-3 text-white/30 hover:text-[#a855f7] mt-1.5" /></button>
        </div>
      </div>

      {/* Lorem Ipsum */}
      <div className="pt-2 border-t border-[#1a1a3a]">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-3 h-3 text-[#ffcc00]" />
          <span className="text-[10px] font-mono text-white/40">Lorem Ipsum</span>
          <input type="number" min="1" max="10" value={loremParas} onChange={(e) => setLoremParas(Number(e.target.value))} className="w-10 bg-[#0a0a1a] border border-[#1a1a3a] rounded px-1 py-0.5 text-[10px] font-mono text-white text-center" />
          <button onClick={genLorem} className="px-2 py-0.5 bg-[#ffcc00]/10 border border-[#ffcc00]/30 rounded text-[#ffcc00] text-[10px] font-mono">GEN</button>
        </div>
        {lorem && (
          <div className="relative">
            <p className="text-[10px] font-mono text-white/50 max-h-16 overflow-y-auto pr-4">{lorem}</p>
            <button onClick={() => handleCopy(lorem)} className="absolute top-0 right-0"><Copy className="w-3 h-3 text-white/30 hover:text-[#ffcc00]" /></button>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== CLIPBOARD MANAGER ====================
export function ClipboardWidget() {
  const [history, setHistory] = useLocalStorage<Array<{ id: string; text: string; time: number }>>('stariz-clipboard', []);
  const [input, setInput] = useState('');

  const addItem = () => {
    if (!input.trim()) return;
    setHistory([{ id: generateUUID(), text: input, time: Date.now() }, ...history].slice(0, 20));
    setInput('');
    toast.success('Added to clipboard');
  };

  const removeItem = (id: string) => setHistory(history.filter((h) => h.id !== id));

  const clearAll = () => { setHistory([]); toast.info('Clipboard cleared'); };

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-[#00f0ff]" />
          <span className="text-xs font-mono text-[#00f0ff]/60 uppercase tracking-widest">Clipboard</span>
        </div>
        <button onClick={clearAll} className="text-[10px] font-mono text-[#ff3366]/60 hover:text-[#ff3366]">CLEAR</button>
      </div>

      <div className="flex gap-2 mb-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
          placeholder="Save text to clipboard..."
          className="flex-1 bg-[#0a0a1a] border border-[#1a1a3a] rounded px-3 py-1.5 text-xs font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-[#00f0ff]/50"
        />
        <button onClick={addItem} className="px-3 py-1.5 bg-[#00f0ff]/10 border border-[#00f0ff]/30 rounded text-[#00f0ff] text-xs font-mono hover:bg-[#00f0ff]/20">ADD</button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {history.map((item) => (
          <div key={item.id} className="flex items-center gap-2 p-2 rounded bg-[#0a0a1a]/50 group">
            <span className="flex-1 text-[10px] font-mono text-white/60 truncate">{item.text}</span>
            <button onClick={() => copyToClipboard(item.text).then((ok) => toast[ok ? 'success' : 'error'](ok ? 'Copied!' : 'Failed'))} className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Copy className="w-3 h-3 text-[#00f0ff]/60 hover:text-[#00f0ff]" />
            </button>
            <button onClick={() => removeItem(item.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 className="w-3 h-3 text-[#ff3366]/40 hover:text-[#ff3366]" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== IP / LOCATION ====================
const IP_FALLBACK = { ip: '127.0.0.1', city: 'Unknown', region: 'Unknown', country_name: 'Unknown', org: 'Unknown' };

export function IpWidget() {
  const [info, setInfo] = useState(IP_FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIp = async () => {
      const data = await fetchWithFallback(
        async () => {
          const res = await fetch('https://ipapi.co/json/');
          if (!res.ok) throw new Error('Failed');
          return res.json();
        },
        IP_FALLBACK
      );
      setInfo(data);
      setLoading(false);
    };
    fetchIp();
  }, []);

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full">
      <div className="flex items-center gap-2 mb-3">
        <Globe className="w-4 h-4 text-[#00ff88]" />
        <span className="text-xs font-mono text-[#00ff88]/60 uppercase tracking-widest">My Network</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-20">
          <div className="w-5 h-5 border-2 border-[#00ff88]/30 border-t-[#00ff88] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2 rounded bg-[#0a0a1a]/50">
            <MapPin className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span className="text-[10px] font-mono text-white/40">IP</span>
            <span className="flex-1 text-xs font-mono text-white/80 text-right">{info.ip}</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded bg-[#0a0a1a]/50">
            <MapPin className="w-3.5 h-3.5 text-[#a855f7]" />
            <span className="text-[10px] font-mono text-white/40">Location</span>
            <span className="flex-1 text-xs font-mono text-white/80 text-right">{info.city}, {info.country_name}</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded bg-[#0a0a1a]/50">
            <Globe className="w-3.5 h-3.5 text-[#ffcc00]" />
            <span className="text-[10px] font-mono text-white/40">ISP</span>
            <span className="flex-1 text-xs font-mono text-white/80 text-right truncate">{info.org}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== BREATHING EXERCISE ====================
export function BreatheWidget() {
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale' | 'rest'>('rest');
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) { setPhase('rest'); setCount(0); return; }
    const cycle = [
      { phase: 'inhale' as const, duration: 4000 },
      { phase: 'hold' as const, duration: 4000 },
      { phase: 'exhale' as const, duration: 4000 },
      { phase: 'rest' as const, duration: 4000 },
    ];
    let step = 0;
    setPhase(cycle[0].phase);
    const interval = setInterval(() => {
      step = (step + 1) % cycle.length;
      setPhase(cycle[step].phase);
      setCount((c) => c + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, [active]);

  const labels = { inhale: 'INHALE', hold: 'HOLD', exhale: 'EXHALE', rest: 'REST' };
  const sizes = { inhale: 80, hold: 80, exhale: 40, rest: 40 };

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Wind className="w-4 h-4 text-[#a855f7]" />
        <span className="text-xs font-mono text-[#a855f7]/60 uppercase tracking-widest">Breathe</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div
          className="rounded-full border-2 border-[#a855f7]/30 flex items-center justify-center"
          animate={{ width: sizes[phase], height: sizes[phase] }}
          transition={{ duration: 3.5, ease: 'easeInOut' }}
          style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)' }}
        >
          <span className="text-xs font-mono font-bold text-[#a855f7]">{labels[phase]}</span>
        </motion.div>
        <div className="mt-4 text-[10px] font-mono text-white/30">Cycles: {Math.floor(count / 4)}</div>
      </div>

      <button
        onClick={() => setActive(!active)}
        className={`w-full py-2 rounded border text-xs font-mono transition-colors ${
          active
            ? 'border-[#ff3366]/30 bg-[#ff3366]/5 text-[#ff3366] hover:bg-[#ff3366]/10'
            : 'border-[#a855f7]/30 bg-[#a855f7]/5 text-[#a855f7] hover:bg-[#a855f7]/10'
        }`}
      >
        {active ? 'STOP' : 'START'}
      </button>
    </div>
  );
}
