import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Wifi, WifiOff, Cpu, Lock, Bot, MessageSquare, Server
} from 'lucide-react';
import { getStoredApiConfig } from './ApiKeyManager';

export default function StatusBar() {
  const [online, setOnline] = useState(navigator.onLine);
  const [apiConnected, setApiConnected] = useState(false);
  const [apiModel, setApiModel] = useState('');
  const [cpuUsage, setCpuUsage] = useState(12);
  const [memory, setMemory] = useState(0);
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    const checkApi = () => {
      const config = getStoredApiConfig();
      setApiConnected(!!config);
      setApiModel(config?.model || '');
    };
    checkApi();
    const interval = setInterval(checkApi, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage(Math.floor(Math.random() * 30) + 5);
      // Get message count from localStorage
      try {
        const chat = localStorage.getItem('stariz-chat-history-v2');
        if (chat) {
          const msgs = JSON.parse(chat);
          setMessageCount(msgs.length);
        }
      } catch { /* ignore */ }
      // Memory usage estimate
      if ('memory' in performance && (performance as any).memory) {
        const mem = (performance as any).memory;
        setMemory(Math.round((mem.usedJSHeapSize / mem.jsHeapSizeLimit) * 100));
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const indicators = [
    {
      icon: online ? Wifi : WifiOff,
      label: online ? 'ONLINE' : 'OFFLINE',
      color: online ? '#00ff88' : '#ff3366',
      active: online,
    },
    {
      icon: Bot,
      label: apiConnected ? (apiModel ? apiModel.split('/').pop()?.slice(0, 12) || 'AI' : 'AI') : 'NO AI',
      color: apiConnected ? '#ff00a0' : '#ffffff30',
      active: apiConnected,
    },
    {
      icon: MessageSquare,
      label: `${messageCount} MSG`,
      color: '#00f0ff',
      active: messageCount > 0,
    },
    {
      icon: Cpu,
      label: `${cpuUsage}% CPU`,
      color: cpuUsage > 70 ? '#ffcc00' : '#00f0ff',
      active: true,
    },
    {
      icon: Server,
      label: memory > 0 ? `${memory}% MEM` : 'MEM OK',
      color: memory > 80 ? '#ff3366' : '#a855f7',
      active: true,
    },
    {
      icon: Lock,
      label: 'AES-4096',
      color: '#00ff88',
      active: true,
    },
  ];

  return (
    <div className="relative z-20 flex items-center justify-between px-4 md:px-6 py-1.5 border-t border-[#1a1a3a] bg-[#0a0a1a]/80 backdrop-blur text-[10px] font-mono text-white/30">
      <div className="flex items-center gap-3 md:gap-4">
        <span className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
          <span className="hidden md:inline text-white/50">STARIZ AI v3.0.0</span>
        </span>
        <span className="hidden lg:inline text-white/20">|</span>
        <span className="hidden lg:inline text-white/30">NEURAL LINK: STABLE</span>
      </div>

      <div className="flex items-center gap-3 md:gap-5">
        {indicators.map((ind) => {
          const Icon = ind.icon;
          return (
            <motion.span
              key={ind.label}
              className="flex items-center gap-1"
              animate={{ opacity: ind.active ? 1 : 0.4 }}
            >
              <Icon className="w-3 h-3" style={{ color: ind.color }} />
              <span style={{ color: ind.color }} className="hidden sm:inline">{ind.label}</span>
            </motion.span>
          );
        })}
        <span className="hidden md:inline text-white/20">|</span>
        <span className="hidden md:inline">LATENCY: 12ms</span>
      </div>
    </div>
  );
}
