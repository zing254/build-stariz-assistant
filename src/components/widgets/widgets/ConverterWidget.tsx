import { useState } from 'react';
import { Ruler, ArrowRightLeft } from 'lucide-react';

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
