import { useState, useEffect, memo } from 'react';
import { Quote, Copy, RefreshCw, Loader2 } from 'lucide-react';
import { copyToClipboard, fetchWithFallback } from '../../../utils/helpers';
import { toast } from '../../Toast';

const QUOTES_FALLBACK = [
  { content: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt' },
  { content: 'Innovation distinguishes between a leader and a follower.', author: 'Steve Jobs' },
  { content: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
];

export const QuotesWidget = memo(function QuotesWidget() {
  const [quote, setQuote] = useState(QUOTES_FALLBACK[0]);
  const [loading, setLoading] = useState(true);

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
          <button onClick={handleCopy} className="p-1 text-white/30 hover:text-[#a855f7] transition-colors" aria-label="Copy quote">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button onClick={fetchQuote} className="p-1 text-white/30 hover:text-[#a855f7] transition-colors" aria-label="Refresh quote">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-[#a855f7]/50 animate-spin" />
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-sm font-mono text-white/70 leading-relaxed italic">"{quote.content}"</p>
          <p className="text-xs font-mono text-[#a855f7]/60 mt-3 text-right">— {quote.author}</p>
        </div>
      )}
    </div>
  );
});
