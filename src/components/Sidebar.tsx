import { useState } from 'react';
import {
  LayoutDashboard, Terminal, Calendar, Calculator, Settings,
  Globe, Zap, Shield, Radio, BrainCircuit,
  DollarSign, Quote, Clock, Lock, Ruler, Palette, Braces, Code,
  ClipboardList, Wind, MessageSquare, Paintbrush, BookOpen,
  LayoutGrid, HardDrive, FileCode, Activity, Timer, Square, X,
  Database, Brain, Puzzle, Mic,
  ScrollText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import soundManager from '../utils/sounds';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const navItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', color: '#00f0ff' },
  { id: 'chat', icon: MessageSquare, label: 'AI Chat', color: '#ff00a0' },
  { id: 'voice', icon: Mic, label: 'Voice', color: '#00ff88' },
  { id: 'knowledge', icon: Database, label: 'Knowledge', color: '#00f0ff' },
  { id: 'memory', icon: Brain, label: 'Memory', color: '#a855f7' },
  { id: 'agent', icon: BrainCircuit, label: 'Agent', color: '#ff00a0' },
  { id: 'plugins', icon: Puzzle, label: 'Plugins', color: '#00ff88' },
  { id: 'logs', icon: ScrollText, label: 'Logs', color: '#00f0ff' },
  { id: 'whiteboard', icon: Paintbrush, label: 'Whiteboard', color: '#a855f7' },
  { id: 'journal', icon: BookOpen, label: 'Journal', color: '#a855f7' },
  { id: 'terminal', icon: Terminal, label: 'Terminal', color: '#00ff88' },
  { id: 'terminal-enhanced', icon: Terminal, label: 'Term+Python', color: '#00ff88' },
  { id: 'files', icon: HardDrive, label: 'File Manager', color: '#ffcc00' },
  { id: 'code', icon: FileCode, label: 'Code Editor', color: '#a855f7' },
  { id: 'system', icon: Zap, label: 'System Mon', color: '#00f0ff' },
  { id: 'calendar', icon: Calendar, label: 'Calendar', color: '#a855f7' },
  { id: 'calculator', icon: Calculator, label: 'Calc', color: '#00f0ff' },
  { id: 'crypto', icon: DollarSign, label: 'Crypto', color: '#ffcc00' },
  { id: 'quotes', icon: Quote, label: 'Quotes', color: '#a855f7' },
  { id: 'stopwatch', icon: Clock, label: 'Timer', color: '#00f0ff' },
  { id: 'pomodoro', icon: Timer, label: 'Pomodoro', color: '#00f0ff' },
  { id: 'password', icon: Lock, label: 'Password', color: '#00ff88' },
  { id: 'converter', icon: Ruler, label: 'Convert', color: '#ff00a0' },
  { id: 'color', icon: Palette, label: 'Color', color: '#a855f7' },
  { id: 'json', icon: Braces, label: 'JSON', color: '#00f0ff' },
  { id: 'devtools', icon: Code, label: 'DevTools', color: '#00ff88' },
  { id: 'clipboard', icon: ClipboardList, label: 'Clipboard', color: '#ffcc00' },
  { id: 'breathe', icon: Wind, label: 'Breathe', color: '#a855f7' },
  { id: 'world', icon: Globe, label: 'World', color: '#00ff88' },
  { id: 'security', icon: Shield, label: 'Security', color: '#ff3366' },
  { id: 'network', icon: Radio, label: 'Network', color: '#a855f7' },
  { id: 'ai', icon: BrainCircuit, label: 'AI Core', color: '#ff00a0' },
  { id: 'news', icon: Activity, label: 'News', color: '#00f0ff' },
  { id: 'music', icon: Square, label: 'Music', color: '#ff00a0' },
  { id: 'widgets', icon: LayoutGrid, label: 'Widgets', color: '#00f0ff' },
  { id: 'settings', icon: Settings, label: 'Settings', color: '#ffcc00' },
];

export default function Sidebar({ activeTab, onTabChange, mobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const sidebarContent = (
    <>
      <div className="flex-1 py-4 overflow-y-auto">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.02 }}
              onClick={() => { soundManager.navigate(); onTabChange(item.id); }}
              className={`relative w-full flex items-center gap-3 px-4 py-2.5 transition-all group ${
                isActive ? 'bg-[#00f0ff]/5' : 'hover:bg-white/5'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute left-0 top-0 bottom-0 w-0.5"
                  style={{ backgroundColor: item.color }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <Icon
                className="w-5 h-5 shrink-0 transition-colors"
                style={{ color: isActive ? item.color : '#ffffff50' }}
              />
              {!collapsed && (
                <span
                  className="text-sm font-medium transition-colors"
                  style={{ color: isActive ? item.color : '#ffffff70' }}
                >
                  {item.label}
                </span>
              )}
              {isActive && !collapsed && (
                <Zap className="w-3 h-3 ml-auto" style={{ color: item.color }} />
              )}
            </motion.button>
          );
        })}
      </div>

      <button
        onClick={() => { soundManager.select(); setCollapsed(!collapsed); }}
        className="hidden md:flex p-4 border-t border-[#1a1a3a] text-[#00f0ff]/50 hover:text-[#00f0ff] transition-colors items-center justify-center"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <motion.div animate={{ rotate: collapsed ? 180 : 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
          </svg>
        </motion.div>
      </button>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="hidden md:flex relative z-20 flex-col border-r border-[#1a1a3a] bg-[#0a0a1a]/80 backdrop-blur-xl"
        style={{ width: collapsed ? 64 : 200 }}
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: -200 }}
              animate={{ x: 0 }}
              exit={{ x: -200 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="md:hidden fixed left-0 top-0 bottom-0 z-[70] w-64 flex flex-col border-r border-[#1a1a3a] bg-[#0a0a1a]/95 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-[#1a1a3a]">
                <h2 className="font-display font-bold text-white tracking-wider">STARIZ<span className="text-[#00f0ff]">.</span>AI</h2>
                <button onClick={onMobileClose} className="text-white/40 hover:text-white" aria-label="Close sidebar">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
