import { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { Globe, Clock } from 'lucide-react';
import { worldCities } from '../../../utils/helpers';

export const WorldClockWidget = memo(function WorldClockWidget() {
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
});
