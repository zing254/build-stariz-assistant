import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function SystemMonitorWidget() {
  const [stats, setStats] = useState({ cpu: 15, ram: 42, disk: 68, net: 23 });
  const [history, setHistory] = useState<number[]>(Array(20).fill(15));

  useEffect(() => {
    const interval = setInterval(() => {
      const newCpu = Math.floor(Math.random() * 40) + 10;
      setStats((prev) => ({
        cpu: newCpu,
        ram: Math.min(100, Math.max(20, prev.ram + (Math.random() - 0.5) * 4)),
        disk: 68,
        net: Math.floor(Math.random() * 80),
      }));
      setHistory((prev) => [...prev.slice(1), newCpu]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const maxH = 60;

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
        <span className="text-xs font-mono text-[#00f0ff]/60 uppercase tracking-widest">System Monitor</span>
      </div>

      <div className="flex items-end gap-1 h-16 mb-3">
        {history.map((v, i) => (
          <div
            key={i}
            className="flex-1 rounded-t"
            style={{
              height: `${(v / 100) * maxH}px`,
              backgroundColor: v > 70 ? '#ff3366' : v > 40 ? '#ffcc00' : '#00f0ff',
              opacity: 0.3 + (i / history.length) * 0.7,
            }}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'CPU', value: stats.cpu, color: '#00f0ff' },
          { label: 'RAM', value: Math.round(stats.ram), color: '#a855f7' },
          { label: 'DISK', value: stats.disk, color: '#00ff88' },
          { label: 'NET', value: stats.net, color: '#ff00a0' },
        ].map((s) => (
          <div key={s.label} className="bg-[#0a0a1a]/50 rounded p-2">
            <div className="flex justify-between text-[10px] font-mono mb-1">
              <span style={{ color: s.color }}>{s.label}</span>
              <span className="text-white/60">{s.value}%</span>
            </div>
            <div className="h-1.5 bg-[#1a1a3a] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: s.color }}
                animate={{ width: `${s.value}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
