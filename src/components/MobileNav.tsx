import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, MessageSquare, Mic, Terminal,
  FileText, Code, Zap, Settings, Menu, X,
} from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const quickTabs = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
  { id: 'chat', icon: MessageSquare, label: 'Chat' },
  { id: 'voice', icon: Mic, label: 'Voice' },
  { id: 'terminal', icon: Terminal, label: 'Term' },
  { id: 'files', icon: FileText, label: 'Files' },
  { id: 'code', icon: Code, label: 'Code' },
  { id: 'system', icon: Zap, label: 'Sys' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export default function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a1a]/95 backdrop-blur-md border-t border-[#1a1a3a] z-50 px-2 py-1">
        <div className="flex items-center justify-around">
          {quickTabs.slice(0, 5).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { onTabChange(tab.id); setExpanded(false); }}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-all ${
                  isActive ? 'text-[#00f0ff]' : 'text-white/40'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#00f0ff]' : ''}`} />
                <span className="text-[9px] font-mono">{tab.label}</span>
              </button>
            );
          })}
          
          {/* More Button */}
          <button
            onClick={() => setExpanded(!expanded)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-all ${
              expanded ? 'text-[#ff00a0]' : 'text-white/40'
            }`}
          >
            {expanded ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            <span className="text-[9px] font-mono">More</span>
          </button>
        </div>
      </div>

      {/* Expanded Menu */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-end"
            onClick={() => setExpanded(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full bg-[#0f0f2a] border-t border-[#1a1a3a] rounded-t-2xl p-4 pb-20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-[#1a1a3a] rounded-full mx-auto mb-4" />
              
              <div className="grid grid-cols-3 gap-3">
                {quickTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => { onTabChange(tab.id); setExpanded(false); }}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                        isActive 
                          ? 'bg-[#00f0ff]/10 border border-[#00f0ff]/30' 
                          : 'bg-[#0a0a1a] border border-[#1a1a3a]'
                      }`}
                    >
                      <Icon className={`w-6 h-6 ${isActive ? 'text-[#00f0ff]' : 'text-white/60'}`} />
                      <span className={`text-xs font-mono ${isActive ? 'text-[#00f0ff]' : 'text-white/60'}`}>
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
       </AnimatePresence>
    </>
  );
}
