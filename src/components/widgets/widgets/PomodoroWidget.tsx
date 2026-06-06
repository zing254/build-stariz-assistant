import { useState, useEffect, useMemo, memo } from 'react';
import { Timer, Play, Pause, RotateCcw } from 'lucide-react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { toast } from '../../Toast';

export const PomodoroWidget = memo(function PomodoroWidget() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'work' | 'short' | 'long'>('work');
  const [sessions, setSessions] = useLocalStorage('stariz-pomodoro-sessions', 0);

  const modes = useMemo(() => ({
    work: { time: 25 * 60, label: 'Focus', color: '#00f0ff' },
    short: { time: 5 * 60, label: 'Short Break', color: '#00ff88' },
    long: { time: 15 * 60, label: 'Long Break', color: '#a855f7' },
  }), []);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setIsRunning(false);
          if (mode === 'work') setSessions((s: number) => s + 1);
          toast.success(`${modes[mode].label} complete!`);
          return modes[mode].time;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, mode, modes, setSessions]);

  const switchMode = (m: 'work' | 'short' | 'long') => {
    setMode(m);
    setTimeLeft(modes[m].time);
    setIsRunning(false);
  };

  const format = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const progress = ((modes[mode].time - timeLeft) / modes[mode].time) * 100;

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Timer className="w-4 h-4 text-[#00f0ff]" />
        <span className="text-xs font-mono text-[#00f0ff]/60 uppercase tracking-widest">Pomodoro</span>
        <span className="ml-auto text-[10px] font-mono text-white/30">{sessions} sessions</span>
      </div>

      <div className="flex gap-1 mb-4">
        {(['work', 'short', 'long'] as const).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`flex-1 py-1 text-[10px] font-mono rounded border transition-all ${
              mode === m
                ? 'border-[#00f0ff]/40 text-[#00f0ff] bg-[#00f0ff]/10'
                : 'border-[#1a1a3a] text-white/30 hover:text-white/50'
            }`}
          >
            {modes[m].label.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative w-28 h-28 mb-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#1a1a3a" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              stroke={modes[mode].color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 42}`}
              strokeDashoffset={`${2 * Math.PI * 42 * (1 - progress / 100)}`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-display font-bold text-white tabular-nums">{format(timeLeft)}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="w-10 h-10 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center hover:bg-[#00f0ff]/20 transition-colors"
          >
            {isRunning ? <Pause className="w-4 h-4 text-[#00f0ff]" /> : <Play className="w-4 h-4 text-[#00f0ff] ml-0.5" />}
          </button>
          <button
            onClick={() => { setTimeLeft(modes[mode].time); setIsRunning(false); }}
            className="w-10 h-10 rounded-full bg-[#0a0a1a] border border-[#1a1a3a] flex items-center justify-center hover:border-[#ff3366]/30 transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-white/50" />
          </button>
        </div>
      </div>
    </div>
  );
});
