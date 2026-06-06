import { useState } from 'react';
import { Code, Copy, Fingerprint, FileText } from 'lucide-react';
import { generateUUID, generateLorem, copyToClipboard } from '../../../utils/helpers';
import { toast } from '../../Toast';

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
