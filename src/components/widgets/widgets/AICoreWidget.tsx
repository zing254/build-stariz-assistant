import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from '../../Toast';

export function AICoreWidget() {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [metrics, setMetrics] = useState({ accuracy: 97.3, tokens: 12450, models: 8, latency: 45 });

  const runInference = () => {
    setProcessing(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setProcessing(false);
          setMetrics({
            accuracy: Math.min(99.9, metrics.accuracy + Math.random() * 0.5),
            tokens: metrics.tokens + Math.floor(Math.random() * 1000),
            models: metrics.models,
            latency: Math.max(20, metrics.latency + (Math.random() - 0.5) * 10),
          });
          toast.success('Inference complete');
          return 100;
        }
        return p + 2;
      });
    }, 50);
  };

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-4 h-4 rounded border border-[#ff00a0]/40 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-[#ff00a0] animate-pulse" />
        </div>
        <span className="text-xs font-mono text-[#ff00a0]/60 uppercase tracking-widest">AI Core</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: 'Accuracy', value: `${metrics.accuracy.toFixed(1)}%`, color: '#00ff88' },
          { label: 'Tokens', value: metrics.tokens.toLocaleString(), color: '#00f0ff' },
          { label: 'Models', value: String(metrics.models), color: '#a855f7' },
          { label: 'Latency', value: `${Math.round(metrics.latency)}ms`, color: '#ffcc00' },
        ].map((m) => (
          <div key={m.label} className="bg-[#0a0a1a]/50 rounded p-2.5 text-center">
            <div className="text-[10px] font-mono text-white/40 mb-1">{m.label}</div>
            <div className="text-sm font-mono font-bold" style={{ color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {processing && (
        <div className="mb-3">
          <div className="flex justify-between text-[10px] font-mono text-white/40 mb-1">
            <span>Processing inference...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-[#1a1a3a] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#ff00a0]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <button
        onClick={runInference}
        disabled={processing}
        className="w-full py-2 rounded border border-[#ff00a0]/30 bg-[#ff00a0]/5 text-[#ff00a0] text-xs font-mono hover:bg-[#ff00a0]/10 transition-colors disabled:opacity-50"
      >
        {processing ? 'PROCESSING...' : 'RUN INFERENCE'}
      </button>
    </div>
  );
}
