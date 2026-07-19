import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePythonBackend } from '../../../hooks/usePythonBackend';

export function SystemMonitorWidget() {
  const { connected, systemStats } = usePythonBackend();
  const [history, setHistory] = useState<number[]>(Array(20).fill(0));

  useEffect(() => {
    if (!systemStats) return;
    setHistory((previous) => [...previous.slice(1), systemStats.cpu_percent]);
  }, [systemStats]);

  const values = [
    { label: 'CPU', value: systemStats?.cpu_percent ?? 0, color: '#00f0ff' },
    { label: 'RAM', value: systemStats?.memory?.percent ?? 0, color: '#a855f7' },
    { label: 'DISK', value: systemStats?.disk?.percent ?? 0, color: '#00ff88' },
    { label: 'NET', value: systemStats ? Math.min(100, Math.round(((systemStats.network?.bytes_recv ?? 0) + (systemStats.network?.bytes_sent ?? 0)) / 1024 / 1024)) : 0, color: '#ff00a0' },
  ];

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full flex flex-col">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-[#00ff88] animate-pulse' : 'bg-[#ffcc00]'}`} />
          <span className="truncate text-xs font-mono text-[#00f0ff]/60 uppercase tracking-widest">System Monitor</span>
        </div>
        <span className="shrink-0 text-[9px] font-mono text-white/30">{connected ? 'LIVE' : 'WAITING'}</span>
      </div>

      <div className="flex items-end gap-1 h-16 mb-3" aria-label="CPU activity history" role="img">
        {history.map((value, index) => (
          <div key={`${index}-${value}`} className="flex-1 min-w-0 rounded-t" style={{
            height: `${Math.max(2, (value / 100) * 60)}px`,
            backgroundColor: value > 70 ? '#ff3366' : value > 40 ? '#ffcc00' : '#00f0ff',
            opacity: 0.3 + (index / history.length) * 0.7,
          }} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {values.map((item) => (
          <div key={item.label} className="min-w-0 rounded bg-[#0a0a1a]/50 p-2">
            <div className="mb-1 flex justify-between gap-1 text-[10px] font-mono">
              <span style={{ color: item.color }}>{item.label}</span>
              <span className="truncate text-white/60">{systemStats ? `${Math.round(item.value)}${item.label === 'NET' ? ' MB' : '%'}` : '—'}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#1a1a3a]">
              <motion.div className="h-full rounded-full" style={{ backgroundColor: item.color }} animate={{ width: `${Math.min(100, Math.max(0, item.value))}%` }} transition={{ duration: 0.5 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
