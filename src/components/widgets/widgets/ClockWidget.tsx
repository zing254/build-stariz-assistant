import { useState, useEffect, memo } from 'react';
import { Clock } from 'lucide-react';
import { formatTime, formatDate } from '../../../utils/helpers';

export const ClockWidget = memo(function ClockWidget() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full flex flex-col justify-center">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-[#00f0ff]" />
        <span className="text-xs font-mono text-[#00f0ff]/60 uppercase tracking-widest">System Time</span>
      </div>
      <div className="font-display text-4xl font-bold text-white tracking-wider tabular-nums">
        {formatTime(time)}
      </div>
      <div className="text-sm text-[#00f0ff]/50 font-mono mt-1">{formatDate(time)}</div>
      <div className="mt-3 flex gap-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div
            key={i}
            className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono ${
              i === time.getDay()
                ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30'
                : 'text-white/30'
            }`}
          >
            {d}
          </div>
        ))}
      </div>
    </div>
  );
});
