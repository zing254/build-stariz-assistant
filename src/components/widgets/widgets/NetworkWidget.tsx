import { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { Wifi, Download, Upload } from 'lucide-react';

export const NetworkWidget = memo(function NetworkWidget() {
  const [stats, setStats] = useState({ download: 45, upload: 12, ping: 23, packets: 1240 });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats({
        download: Math.floor(Math.random() * 80) + 10,
        upload: Math.floor(Math.random() * 30) + 5,
        ping: Math.floor(Math.random() * 20) + 10,
        packets: Math.floor(Math.random() * 500) + 1000,
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full">
      <div className="flex items-center gap-2 mb-3">
        <Wifi className="w-4 h-4 text-[#a855f7]" />
        <span className="text-xs font-mono text-[#a855f7]/60 uppercase tracking-widest">Network</span>
        <span className="ml-auto text-[10px] font-mono text-[#00ff88]">ONLINE</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#0a0a1a]/50 rounded p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Download className="w-3 h-3 text-[#00f0ff]" />
            <span className="text-[10px] font-mono text-white/40">DOWN</span>
          </div>
          <div className="text-lg font-mono font-bold text-[#00f0ff]">{stats.download}</div>
          <div className="text-[10px] font-mono text-white/30">Mbps</div>
        </div>
        <div className="bg-[#0a0a1a]/50 rounded p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Upload className="w-3 h-3 text-[#ff00a0]" />
            <span className="text-[10px] font-mono text-white/40">UP</span>
          </div>
          <div className="text-lg font-mono font-bold text-[#ff00a0]">{stats.upload}</div>
          <div className="text-[10px] font-mono text-white/30">Mbps</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-white/40">Latency</span>
          <span className="text-[#00ff88]">{stats.ping}ms</span>
        </div>
        <div className="flex justify-between text-xs font-mono">
          <span className="text-white/40">Packets/s</span>
          <span className="text-[#a855f7]">{stats.packets}</span>
        </div>
        <div className="h-1.5 bg-[#1a1a3a] rounded-full overflow-hidden mt-2">
          <motion.div
            className="h-full bg-[#a855f7]"
            animate={{ width: `${Math.random() * 60 + 20}%` }}
            transition={{ duration: 2 }}
          />
        </div>
      </div>
    </div>
  );
});
