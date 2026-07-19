import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Command, Search, Terminal, MessageSquare, Settings,
  Calendar, Calculator, Shield, Zap, Globe,
  FileText, Code, Database,
  CornerDownLeft,
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  category: string;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

export default function CommandPalette({ isOpen, onClose, onNavigate }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const commands: CommandItem[] = [
    // Navigation
    { id: 'nav-dashboard', label: 'Dashboard', description: 'Go to main dashboard', icon: Command, action: () => onNavigate('dashboard'), category: 'Navigation' },
    { id: 'nav-chat', label: 'AI GODMODE', description: 'Full AI with memory, RAG, voice', icon: Zap, action: () => onNavigate('chat'), category: 'Navigation', keywords: ['godmode', 'ai', 'stariz'] },
    { id: 'nav-chat-classic', label: 'AI Chat', description: 'Standard AI chat', icon: MessageSquare, action: () => onNavigate('chat'), category: 'Navigation' },
    { id: 'nav-voice', label: 'Voice Assistant', description: 'Offline voice control', icon: Zap, action: () => onNavigate('voice'), category: 'Navigation', keywords: ['voice', 'speak', 'listen'] },
    { id: 'nav-knowledge', label: 'Knowledge Base', description: 'RAG document search', icon: Database, action: () => onNavigate('knowledge'), category: 'Navigation', keywords: ['rag', 'docs', 'search'] },
    { id: 'nav-memory', label: 'Memory System', description: 'Browse AI memories', icon: Database, action: () => onNavigate('memory'), category: 'Navigation', keywords: ['memory', 'remember'] },
    { id: 'nav-agent', label: 'Agent Loop', description: 'Autonomous task execution', icon: Zap, action: () => onNavigate('agent'), category: 'Navigation', keywords: ['agent', 'auto'] },
    { id: 'nav-plugins', label: 'Plugins', description: 'Manage plugins', icon: Command, action: () => onNavigate('plugins'), category: 'Navigation' },
    { id: 'nav-terminal', label: 'Terminal', description: 'Open terminal emulator', icon: Terminal, action: () => onNavigate('terminal'), category: 'Navigation' },
    { id: 'nav-files', label: 'File Manager', description: 'Browse files with Python backend', icon: FileText, action: () => onNavigate('files'), category: 'Navigation' },
    { id: 'nav-code', label: 'Code Editor', description: 'Multi-file code editor', icon: Code, action: () => onNavigate('code'), category: 'Navigation' },
    { id: 'nav-system', label: 'System Monitor', description: 'Real-time system stats', icon: Zap, action: () => onNavigate('system'), category: 'Navigation' },
    { id: 'nav-health', label: 'System Health', description: 'Check backend and optional capabilities', icon: Zap, action: () => onNavigate('health'), category: 'Navigation', keywords: ['health', 'diagnostics', 'status'] },
    { id: 'nav-settings', label: 'Settings', description: 'App configuration', icon: Settings, action: () => onNavigate('settings'), category: 'Navigation' },

    // Tools
    { id: 'tool-calendar', label: 'Calendar', description: 'Event management', icon: Calendar, action: () => onNavigate('calendar'), category: 'Tools' },
    { id: 'tool-calculator', label: 'Calculator', description: 'Basic calculator', icon: Calculator, action: () => onNavigate('calculator'), category: 'Tools' },
    { id: 'tool-crypto', label: 'Crypto Prices', description: 'Live cryptocurrency prices', icon: Globe, action: () => onNavigate('crypto'), category: 'Tools' },
    { id: 'tool-password', label: 'Password Generator', description: 'Secure password generator', icon: Shield, action: () => onNavigate('password'), category: 'Tools' },
    { id: 'tool-converter', label: 'Unit Converter', description: 'Convert between units', icon: Globe, action: () => onNavigate('converter'), category: 'Tools' },

    // Actions
    { id: 'action-export', label: 'Export Data', description: 'Export all app data to JSON', icon: Database, action: () => { localStorage.setItem('stariz-export-trigger', 'true'); onClose(); }, category: 'Actions' },
    { id: 'action-import', label: 'Import Data', description: 'Import data from JSON file', icon: Database, action: () => { localStorage.setItem('stariz-import-trigger', 'true'); onClose(); }, category: 'Actions' },
    { id: 'action-clear-chat', label: 'Clear Chat History', description: 'Clear AI chat messages', icon: MessageSquare, action: () => { localStorage.removeItem('stariz-chat-history-v2'); onClose(); }, category: 'Actions' },
  ];

  const filteredCommands = commands.filter(cmd => {
    const searchText = `${cmd.label} ${cmd.description} ${cmd.keywords?.join(' ') || ''}`.toLowerCase();
    return searchText.includes(query.toLowerCase());
  });

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  const flatFiltered = filteredCommands;

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0] as HTMLElement;
        const last = focusable[focusable.length - 1] as HTMLElement;

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, flatFiltered.length - 1));
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    }

    if (e.key === 'Enter' && flatFiltered[selectedIndex]) {
      e.preventDefault();
      flatFiltered[selectedIndex].action();
      onClose();
    }
  }, [flatFiltered, selectedIndex, onClose]);

  useEffect(() => {
    if (listRef.current && flatFiltered.length > 0) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, flatFiltered]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[20vh]"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Command Palette"
        >
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-2xl bg-[#0f0f2a] border border-[#1a1a3a] rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-label="Command palette search and navigation"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1a1a3a]">
              <Search className="w-5 h-5 text-[#00f0ff] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or search..."
                className="flex-1 bg-transparent text-sm font-mono text-white placeholder:text-white/30 focus:outline-none"
                aria-label="Search commands"
                aria-describedby="command-palette-help"
              />
              <div id="command-palette-help" className="flex items-center gap-1 text-[10px] font-mono text-white/30">
                <kbd className="px-1.5 py-0.5 rounded bg-[#1a1a3a]">ESC</kbd>
                <span>to close</span>
              </div>
            </div>

            {/* Command List */}
            <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
              {Object.entries(groupedCommands).map(([category, cmds]) => (
                <div key={category} className="mb-2">
                  <div className="px-2 py-1 text-[10px] font-mono text-white/30 uppercase tracking-wider">
                    {category}
                  </div>
                   {cmds.map((cmd, _idx) => {
                     const globalIdx = flatFiltered.indexOf(cmd);
                     const isSelected = globalIdx === selectedIndex;
                     const IconComponent = cmd.icon;

                     return (
                       <motion.button
                         key={cmd.id}
                         whileHover={{ x: 2 }}
                         onClick={() => { cmd.action(); onClose(); }}
                         aria-label={`${cmd.label}${cmd.description ? ` - ${cmd.description}` : ''}`}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                           isSelected ? 'bg-[#00f0ff]/10 border border-[#00f0ff]/20' : 'hover:bg-[#1a1a3a]/50'
                         }`}
                       >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-[#00f0ff]/20' : 'bg-[#1a1a3a]'
                          }`}>
                            <IconComponent className={`w-4 h-4 ${isSelected ? 'text-[#00f0ff]' : 'text-white/40'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs font-mono font-semibold ${isSelected ? 'text-white' : 'text-white/70'}`}>
                            {cmd.label}
                          </div>
                          {cmd.description && (
                            <div className={`text-[10px] font-mono ${isSelected ? 'text-white/60' : 'text-white/30'}`}>
                              {cmd.description}
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-1 text-[10px] font-mono text-white/30 shrink-0">
                            <CornerDownLeft className="w-3 h-3" />
                            <span>Enter</span>
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              ))}

              {filteredCommands.length === 0 && (
                <div className="py-8 text-center">
                  <Search className="w-8 h-8 text-white/10 mx-auto mb-2" />
                  <p className="text-xs font-mono text-white/30">No commands found</p>
                  <p className="text-[10px] font-mono text-white/20 mt-1">Try a different search term</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-[#1a1a3a] bg-[#0a0a1a]/50">
              <div className="flex items-center gap-3 text-[10px] font-mono text-white/30">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-[#1a1a3a]">↑</kbd>
                  <kbd className="px-1 py-0.5 rounded bg-[#1a1a3a]">↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-[#1a1a3a]">Enter</kbd>
                  Select
                </span>
              </div>
              <span className="text-[10px] font-mono text-white/20">
                {filteredCommands.length} command{filteredCommands.length !== 1 ? 's' : ''}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
