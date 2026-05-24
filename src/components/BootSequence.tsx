import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Brain, Database, Mic, Shield, Zap } from 'lucide-react';

interface BootStep {
  label: string;
  icon: any;
  color: string;
  duration: number;
}

const BOOT_STEPS: BootStep[] = [
  { label: 'Initializing AI Core', icon: Brain, color: '#ff00a0', duration: 800 },
  { label: 'Loading Voice Engine', icon: Mic, color: '#a855f7', duration: 600 },
  { label: 'Connecting RAG Database', icon: Database, color: '#00f0ff', duration: 700 },
  { label: 'Mounting Memory System', icon: Cpu, color: '#00ff88', duration: 500 },
  { label: 'Starting Agent Services', icon: Zap, color: '#ffcc00', duration: 400 },
  { label: 'Securing Dashboard', icon: Shield, color: '#00f0ff', duration: 300 },
];

const TOTAL_STEPS = BOOT_STEPS.length;

function speakGreeting() {
  try {
    const utterance = new SpeechSynthesisUtterance('STARIZ AI Assistant online. All systems ready, Commander.');
    utterance.rate = 1.0;
    utterance.pitch = 1.1;
    utterance.volume = 0.8;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch {}
}

export default function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const spokenRef = useRef(false);

  useEffect(() => {
    if (currentStep >= TOTAL_STEPS) {
      if (!spokenRef.current) {
        spokenRef.current = true;
        speakGreeting();
      }
      const timer = setTimeout(() => setVisible(false), 1500);
      return () => clearTimeout(timer);
    }

    const step = BOOT_STEPS[currentStep];
    const interval = 30;
    const increments = step.duration / interval;
    let count = 0;

    const timer = setInterval(() => {
      count++;
      const stepProg = Math.min(count / increments, 1);
      setStepProgress(stepProg);
      setProgress(((currentStep + stepProg) / TOTAL_STEPS) * 100);

      if (stepProg >= 1) {
        clearInterval(timer);
        setCurrentStep(prev => prev + 1);
        setStepProgress(0);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [currentStep]);

  useEffect(() => {
    if (!visible) {
      const t = setTimeout(onComplete, 300);
      return () => clearTimeout(t);
    }
  }, [visible, onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[200] bg-[#050510] flex flex-col items-center justify-center"
        >
          {/* Central logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="mb-12 text-center"
          >
            <div className="relative inline-flex items-center justify-center mb-6">
              <div className="w-20 h-20 rounded-2xl border-2 border-[#00f0ff] flex items-center justify-center bg-[#00f0ff]/5">
                <span className="text-[#00f0ff] font-display font-bold text-3xl">S</span>
              </div>
              <motion.div
                className="absolute inset-0 rounded-2xl"
                animate={{ boxShadow: ['0 0 0px rgba(0,240,255,0)', '0 0 30px rgba(0,240,255,0.3)', '0 0 0px rgba(0,240,255,0)'] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <h1 className="font-display font-bold text-3xl text-white tracking-wider mb-2">
              STARIZ<span className="text-[#00f0ff]">.</span>AI
            </h1>
            <p className="text-xs font-mono text-white/30">v2.4.1 — Initializing System</p>
          </motion.div>

          {/* Boot steps */}
          <div className="w-full max-w-md space-y-2 mb-8">
            {BOOT_STEPS.map((step, i) => {
              const Icon = step.icon;
              const isActive = i === currentStep;
              const isDone = i < currentStep;

              return (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-white/5 border border-white/10'
                      : isDone
                        ? 'opacity-60'
                        : 'opacity-30'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-all ${
                      isActive ? 'animate-pulse' : ''
                    }`}
                    style={{ color: isDone ? step.color : (isActive ? step.color : '#ffffff40') }}
                  />
                  <span className={`text-xs font-mono flex-1 ${
                    isDone ? 'text-white/60' : (isActive ? 'text-white' : 'text-white/30')
                  }`}>
                    {step.label}
                    {isActive && (
                      <span className="text-white/30 ml-1">
                        {Array.from({ length: 3 }, (_, j) => (
                          <span
                            key={j}
                            className="inline-block"
                            style={{
                              animation: `blink 1s step-end ${j * 0.2}s infinite`,
                            }}
                          >
                            .
                          </span>
                        ))}
                      </span>
                    )}
                  </span>
                  {isDone && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-[10px] font-mono text-[#00ff88]"
                    >
                      OK
                    </motion.span>
                  )}
                  {isActive && (
                    <span className="text-[10px] font-mono text-[#00f0ff]">
                      {Math.round(stepProgress * 100)}%
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-md">
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #00f0ff, #ff00a0)',
                  width: `${progress}%`,
                }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <p className="text-[10px] font-mono text-white/20 text-center mt-2">
              {currentStep >= TOTAL_STEPS
                ? 'System ready'
                : `Step ${currentStep + 1} of ${TOTAL_STEPS}`}
            </p>
          </div>

          {/* Status messages */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 max-w-md text-center"
          >
            <p className="text-[10px] font-mono text-white/15 leading-relaxed">
              {currentStep >= TOTAL_STEPS
                ? 'STARIZ AI is now fully operational. Welcome, Commander.'
                : 'Loading subsystems...'}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
