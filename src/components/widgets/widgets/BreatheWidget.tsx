import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wind } from 'lucide-react';

export function BreatheWidget() {
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale' | 'rest'>('rest');
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) { setPhase('rest'); setCount(0); return; }
    const cycle = [
      { phase: 'inhale' as const, duration: 4000 },
      { phase: 'hold' as const, duration: 4000 },
      { phase: 'exhale' as const, duration: 4000 },
      { phase: 'rest' as const, duration: 4000 },
    ];
    let step = 0;
    setPhase(cycle[0].phase);
    const interval = setInterval(() => {
      step = (step + 1) % cycle.length;
      setPhase(cycle[step].phase);
      setCount((c) => c + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, [active]);

  const labels = { inhale: 'INHALE', hold: 'HOLD', exhale: 'EXHALE', rest: 'REST' };
  const sizes = { inhale: 80, hold: 80, exhale: 40, rest: 40 };

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Wind className="w-4 h-4 text-[#a855f7]" />
        <span className="text-xs font-mono text-[#a855f7]/60 uppercase tracking-widest">Breathe</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div
          className="rounded-full border-2 border-[#a855f7]/30 flex items-center justify-center"
          animate={{ width: sizes[phase], height: sizes[phase] }}
          transition={{ duration: 3.5, ease: 'easeInOut' }}
          style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)' }}
        >
          <span className="text-xs font-mono font-bold text-[#a855f7]">{labels[phase]}</span>
        </motion.div>
        <div className="mt-4 text-[10px] font-mono text-white/30">Cycles: {Math.floor(count / 4)}</div>
      </div>

      <button
        onClick={() => setActive(!active)}
        className={`w-full py-2 rounded border text-xs font-mono transition-colors ${
          active
            ? 'border-[#ff3366]/30 bg-[#ff3366]/5 text-[#ff3366] hover:bg-[#ff3366]/10'
            : 'border-[#a855f7]/30 bg-[#a855f7]/5 text-[#a855f7] hover:bg-[#a855f7]/10'
        }`}
      >
        {active ? 'STOP' : 'START'}
      </button>
    </div>
  );
}
