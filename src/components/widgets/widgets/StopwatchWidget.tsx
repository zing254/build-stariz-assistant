import { useState, useEffect, useRef, memo } from 'react';
import { Clock, Play, Pause, Timer, RotateCcw } from 'lucide-react';
import { generateUUID } from '../../../utils/helpers';
import { useLocalStorage } from '../../../hooks/useLocalStorage';

export const StopwatchWidget = memo(function StopwatchWidget() {
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
});
