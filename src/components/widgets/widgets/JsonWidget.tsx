import { useState } from 'react';
import { Braces, Copy } from 'lucide-react';
import { copyToClipboard } from '../../../utils/helpers';
import { toast } from '../../Toast';

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
