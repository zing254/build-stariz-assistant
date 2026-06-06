import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Unlock, EyeOff, Activity, AlertTriangle } from 'lucide-react';
import { toast } from '../../Toast';

export function SecurityWidget() {
  const [firewall, setFirewall] = useState(true);
  const [vpn, setVpn] = useState(true);
  const [encryption, setEncryption] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [threats, setThreats] = useState(0);
  const [lastScan, setLastScan] = useState('Never');

  const runScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      const found = Math.floor(Math.random() * 3);
      setThreats(found);
      setLastScan(new Date().toLocaleTimeString());
      if (found > 0) {
        toast.error(`${found} threat${found > 1 ? 's' : ''} detected!`);
      } else {
        toast.success('System secure — no threats found');
      }
    }, 3000);
  };

  const services = [
    { name: 'Firewall', active: firewall, toggle: () => setFirewall(!firewall), icon: Shield, color: '#00f0ff' },
    { name: 'VPN Tunnel', active: vpn, toggle: () => setVpn(!vpn), icon: Lock, color: '#00ff88' },
    { name: 'Encryption', active: encryption, toggle: () => setEncryption(!encryption), icon: EyeOff, color: '#a855f7' },
  ];

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-[#00f0ff]" />
        <span className="text-xs font-mono text-[#00f0ff]/60 uppercase tracking-widest">Security</span>
        <span className={`ml-auto text-[10px] font-mono px-2 py-0.5 rounded ${threats > 0 ? 'bg-[#ff3366]/20 text-[#ff3366]' : 'bg-[#00ff88]/20 text-[#00ff88]'}`}>
          {threats > 0 ? `${threats} THREATS` : 'SECURE'}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        {services.map((s) => {
          const Icon = s.active ? s.icon : Unlock;
          return (
            <div key={s.name} className="flex items-center justify-between p-2 rounded bg-[#0a0a1a]/50">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" style={{ color: s.active ? s.color : '#ffffff30' }} />
                <span className="text-xs font-mono text-white/70">{s.name}</span>
              </div>
              <button
                onClick={s.toggle}
                className={`w-8 h-4 rounded-full transition-colors relative ${s.active ? 'bg-[#00ff88]/30' : 'bg-[#1a1a3a]'}`}
              >
                <motion.div
                  className="absolute top-0.5 w-3 h-3 rounded-full"
                  style={{ backgroundColor: s.active ? '#00ff88' : '#ffffff30' }}
                  animate={{ left: s.active ? 18 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
          );
        })}
      </div>

      <div className="text-[10px] font-mono text-white/20 mb-2 text-right">Last scan: {lastScan}</div>

      <button
        onClick={runScan}
        disabled={scanning}
        className="w-full py-2 rounded border border-[#00f0ff]/30 bg-[#00f0ff]/5 text-[#00f0ff] text-xs font-mono hover:bg-[#00f0ff]/10 transition-colors disabled:opacity-50"
      >
        {scanning ? (
          <span className="flex items-center justify-center gap-2">
            <Activity className="w-3 h-3 animate-spin" /> SCANNING...
          </span>
        ) : (
          'RUN SECURITY SCAN'
        )}
      </button>
    </div>
  );
}
