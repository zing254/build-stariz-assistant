import { useState, useEffect } from 'react';
import { formatTime, formatDate, getGreeting } from '../utils/helpers';
import { Cpu, Wifi, Battery, Volume2, Bell, Search, Mic, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const [time, setTime] = useState(new Date());
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cpuUsage, setCpuUsage] = useState(12);
  const [battery, setBattery] = useState(87);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage(Math.floor(Math.random() * 30) + 5);
      setBattery((prev) => Math.max(0, Math.min(100, prev + (Math.random() > 0.7 ? -1 : 0))));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank');
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative z-20 flex items-center justify-between px-4 md:px-6 py-3 border-b border-[#1a1a3a] bg-[#0a0a1a]/80 backdrop-blur-xl"
    >
      {/* Mobile menu + Logo */}
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button onClick={onMenuToggle} className="md:hidden p-1.5 rounded border border-[#1a1a3a] text-white/50 hover:text-[#00f0ff]">
            <Menu className="w-4 h-4" />
          </button>
        )}
        <div className="relative w-10 h-10 flex items-center justify-center">
          <div className="absolute inset-0 rounded-lg bg-[#00f0ff]/10 animate-pulse" />
          <div className="w-8 h-8 rounded border-2 border-[#00f0ff] flex items-center justify-center">
            <span className="text-[#00f0ff] font-display font-bold text-sm">S</span>
          </div>
        </div>
        <div className="hidden sm:block">
          <h1 className="font-display font-bold text-lg tracking-wider text-white">
            STARIZ<span className="text-[#00f0ff]">.</span>AI
          </h1>
          <p className="text-[10px] text-[#00f0ff]/60 font-mono tracking-widest uppercase">
            {getGreeting()}, Commander
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-xl mx-4 md:mx-8">
        <motion.form
          onSubmit={handleSearch}
          className="relative flex items-center"
          animate={{ width: searchOpen ? '100%' : '100%' }}
        >
          <Search className="absolute left-3 w-4 h-4 text-[#00f0ff]/50" />
          <input
            type="text"
            placeholder="Search the web, commands, files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
            className="w-full bg-[#0f0f2a] border border-[#1a1a3a] rounded-lg pl-10 pr-10 py-2 text-sm text-white placeholder:text-[#00f0ff]/30 focus:outline-none focus:border-[#00f0ff]/50 focus:shadow-[0_0_15px_#00f0ff22] transition-all font-mono"
          />
          <button type="button" className="absolute right-3 text-[#00f0ff]/40 hover:text-[#00f0ff]">
            <Mic className="w-4 h-4" />
          </button>
        </motion.form>
      </div>

      {/* System Info */}
      <div className="flex items-center gap-3 md:gap-5">
        <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-[#00f0ff]/70">
          <Cpu className="w-3.5 h-3.5" />
          <span>{cpuUsage}%</span>
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-[#00f0ff]/70">
          <Wifi className="w-3.5 h-3.5" />
          <span>ONLINE</span>
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-[#00ff88]/70">
          <Battery className="w-3.5 h-3.5" />
          <span>{battery}%</span>
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-[#a855f7]/70">
          <Volume2 className="w-3.5 h-3.5" />
        </div>
        <div className="relative hidden md:block">
          <Bell className="w-4 h-4 text-[#ffcc00]/70" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#ff00a0] rounded-full animate-pulse" />
        </div>
        <div className="text-right">
          <div className="text-sm font-mono font-semibold text-white">{formatTime(time)}</div>
          <div className="text-[10px] font-mono text-[#00f0ff]/50 hidden sm:block">{formatDate(time)}</div>
        </div>
      </div>
    </motion.header>
  );
}
