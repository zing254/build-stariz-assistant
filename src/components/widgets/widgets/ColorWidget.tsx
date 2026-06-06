import { useState } from 'react';
import { Palette, Copy } from 'lucide-react';
import { copyToClipboard } from '../../../utils/helpers';
import { toast } from '../../Toast';

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
