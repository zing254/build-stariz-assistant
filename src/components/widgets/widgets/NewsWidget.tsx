import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, Radio, Loader2, AlertCircle } from 'lucide-react';
import { mockNews } from '../../../utils/helpers';

export function NewsWidget() {
  const [news, setNews] = useState<typeof mockNews>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setNews(mockNews);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Newspaper className="w-4 h-4 text-[#ffcc00]" />
        <span className="text-xs font-mono text-[#ffcc00]/60 uppercase tracking-widest">News Feed</span>
        <div className="ml-auto flex items-center gap-1">
          <Radio className="w-3 h-3 text-[#ffcc00]/40 animate-pulse" />
          <span className="text-[10px] font-mono text-[#ffcc00]/40">LIVE</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <Loader2 className="w-6 h-6 text-[#ffcc00]/50 animate-spin mb-2" />
            <span className="text-[10px] font-mono text-white/40">Loading news...</span>
          </div>
        ) : news.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <AlertCircle className="w-8 h-8 text-white/20 mb-2" />
            <span className="text-xs font-mono text-white/30">No news available</span>
          </div>
        ) : (
          news.map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.01 }}
              className="w-full text-left p-2.5 rounded bg-[#0a0a1a]/50 border border-[#1a1a3a] hover:border-[#ffcc00]/20 transition-all"
            >
              <div className="flex items-start gap-2">
                <div className="w-1 h-full min-h-[20px] rounded-full bg-[#ffcc00]/30 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono text-white/80 leading-tight">{item.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono text-[#ffcc00]/50">{item.source}</span>
                    <span className="text-[10px] font-mono text-white/30">{item.time}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#ffcc00]/10 text-[#ffcc00]/60">{item.category}</span>
                  </div>
                </div>
              </div>
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
}
