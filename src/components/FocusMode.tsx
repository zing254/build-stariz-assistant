import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Focus, X } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function FocusMode() {
  const [active, setActive] = useLocalStorage('stariz-focus-mode', false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { setRunning(false); return 25 * 60; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  const format = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  if (!active) return (
    <button
      onClick={() => setActive(true)}
      className="fixed bottom-10 right-6 z-30 w-12 h-12 rounded-full bg-[#0f0f2a]/90 border border-[#00f0ff]/30 flex items-center justify-center hover:bg-[#00f0ff]/10 transition-colors shadow-lg"
      title="Focus Mode"
    >
      <Focus className="w-5 h-5 text-[#00f0ff]" />
    </button>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] bg-[#050510]/95 backdrop-blur-xl flex flex-col items-center justify-center"
      >
        <button
          onClick={() => { setActive(false); setRunning(false); }}
          className="absolute top-6 right-6 p-2 rounded-full border border-[#1a1a3a] text-white/40 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <Focus className="w-8 h-8 text-[#00f0ff] mb-6" />
        <h2 className="font-display text-xl font-bold text-white tracking-wider mb-2">FOCUS MODE</h2>
        <p className="text-xs font-mono text-white/40 mb-8">Eliminate distractions. Deep work.</p>

        <div className="text-6xl font-display font-bold text-[#00f0ff] tabular-nums mb-8">
          {format(timeLeft)}
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setRunning(!running)}
            className="px-6 py-2.5 rounded-lg border border-[#00f0ff]/30 bg-[#00f0ff]/10 text-[#00f0ff] text-xs font-mono font-semibold hover:bg-[#00f0ff]/20 transition-colors"
          >
            {running ? 'PAUSE' : 'START'}
          </button>
          <button
            onClick={() => { setRunning(false); setTimeLeft(25 * 60); }}
            className="px-6 py-2.5 rounded-lg border border-[#1a1a3a] bg-[#0a0a1a] text-white/50 text-xs font-mono hover:text-white transition-colors"
          >
            RESET
          </button>
        </div>

        <div className="absolute bottom-8 text-[10px] font-mono text-white/20">
          Press ESC to exit focus mode
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
