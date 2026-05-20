import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Zap, Shield, Globe } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function WelcomeModal() {
  const [seen, setSeen] = useLocalStorage('stariz-welcome-seen', false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!seen) {
      const timer = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, [seen]);

  const dismiss = () => {
    setOpen(false);
    setSeen(true);
  };

  const features = [
    { icon: Zap, title: '24+ Live Widgets', desc: 'Real-time weather, crypto, system monitoring, and more.', color: '#00f0ff' },
    { icon: Shield, title: 'Local-First Data', desc: 'All your data stays in your browser. Export & import anytime.', color: '#00ff88' },
    { icon: Globe, title: 'Zero API Keys', desc: 'Works out of the box with free public APIs. No setup needed.', color: '#a855f7' },
    { icon: Sparkles, title: 'Keyboard Driven', desc: 'Press Ctrl+/ or ? to see all shortcuts. Work faster.', color: '#ffcc00' },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
          onClick={dismiss}
        >
          <motion.div
            initial={{ scale: 0.85, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.85, y: 30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-[#0f0f2a] border border-[#1a1a3a] rounded-2xl p-8 max-w-lg w-full shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#00f0ff]/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#ff00a0]/10 rounded-full blur-3xl" />

            <button onClick={dismiss} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl border-2 border-[#00f0ff] flex items-center justify-center bg-[#00f0ff]/5">
                  <span className="text-[#00f0ff] font-display font-bold text-xl">S</span>
                </div>
                <div>
                  <h1 className="font-display font-bold text-2xl text-white tracking-wider">
                    STARIZ<span className="text-[#00f0ff]">.</span>AI
                  </h1>
                  <p className="text-xs font-mono text-[#00f0ff]/60">v2.4.1 — Personal Command Center</p>
                </div>
              </div>

              <p className="text-sm text-white/50 font-mono mt-4 mb-6 leading-relaxed">
                Welcome, Commander. Your cyberpunk personal assistant is online and ready. 
                All tools are connected, functional, and require zero configuration.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {features.map((f) => {
                  const Icon = f.icon;
                  return (
                    <div key={f.title} className="flex items-start gap-3 p-3 rounded-lg bg-[#0a0a1a]/60 border border-[#1a1a3a]">
                      <Icon className="w-5 h-5 shrink-0 mt-0.5" style={{ color: f.color }} />
                      <div>
                        <div className="text-xs font-mono font-semibold text-white/80">{f.title}</div>
                        <div className="text-[10px] font-mono text-white/40 mt-0.5">{f.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={dismiss}
                  className="flex-1 py-2.5 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] text-xs font-mono font-semibold hover:bg-[#00f0ff]/20 transition-colors"
                >
                  ENTER DASHBOARD
                </button>
              </div>

              <p className="text-center text-[10px] font-mono text-white/20 mt-3">
                Press <kbd className="px-1.5 py-0.5 rounded bg-[#0a0a1a] border border-[#1a1a3a] text-[#00f0ff]">?</kbd> anytime for keyboard shortcuts
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
