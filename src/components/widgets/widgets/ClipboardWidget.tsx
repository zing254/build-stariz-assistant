import { useState } from 'react';
import { ClipboardList, Copy, Trash2 } from 'lucide-react';
import { generateUUID, copyToClipboard } from '../../../utils/helpers';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { toast } from '../../Toast';

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
