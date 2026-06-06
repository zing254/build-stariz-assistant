import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Background from './components/Background';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import WelcomeModal from './components/WelcomeModal';
import OfflineIndicator from './components/OfflineIndicator';
import FocusMode from './components/FocusMode';
import StatusBar from './components/StatusBar';
import ApiKeyManager from './components/ApiKeyManager';
import Whiteboard from './components/Whiteboard';
import WidgetManager from './components/WidgetManager';
import { ToastContainer, toast } from './components/Toast';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { exportData } from './utils/helpers';
import {
  Keyboard, X, Command, Maximize2, Minimize2,
  Download, Upload, Key, Mic
} from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary';
import CommandPalette from './components/CommandPalette';
import NotificationProvider from './components/NotificationSystem';
import MobileNav from './components/MobileNav';
import { KnowledgeBaseManager } from './components/KnowledgeBaseManager';
import { MemoryViewer } from './components/MemoryViewer';
import { AgentStatus } from './components/AgentStatus';
import { PluginManager } from './components/PluginManager';
import { AmbientMode } from './components/AmbientMode';
import { useLocalStorage } from './hooks/useLocalStorage';

const CalendarWidget = React.lazy(() => import('./components/widgets/widgets/CalendarWidget').then(m => ({ default: m.CalendarWidget })));
const CalculatorWidget = React.lazy(() => import('./components/widgets/widgets/CalculatorWidget').then(m => ({ default: m.CalculatorWidget })));
const NewsWidget = React.lazy(() => import('./components/widgets/widgets/NewsWidget').then(m => ({ default: m.NewsWidget })));
const WorldClockWidget = React.lazy(() => import('./components/widgets/widgets/WorldClockWidget').then(m => ({ default: m.WorldClockWidget })));
const TerminalWidget = React.lazy(() => import('./components/widgets/widgets/TerminalWidget').then(m => ({ default: m.TerminalWidget })));
const SecurityWidget = React.lazy(() => import('./components/widgets/widgets/SecurityWidget').then(m => ({ default: m.SecurityWidget })));
const NetworkWidget = React.lazy(() => import('./components/widgets/widgets/NetworkWidget').then(m => ({ default: m.NetworkWidget })));
const AICoreWidget = React.lazy(() => import('./components/widgets/widgets/AICoreWidget').then(m => ({ default: m.AICoreWidget })));
const SettingsWidget = React.lazy(() => import('./components/widgets/widgets/SettingsWidget').then(m => ({ default: m.SettingsWidget })));
const PomodoroWidget = React.lazy(() => import('./components/widgets/widgets/PomodoroWidget').then(m => ({ default: m.PomodoroWidget })));
const CryptoWidget = React.lazy(() => import('./components/widgets/widgets/CryptoWidget').then(m => ({ default: m.CryptoWidget })));
const QuotesWidget = React.lazy(() => import('./components/widgets/widgets/QuotesWidget').then(m => ({ default: m.QuotesWidget })));
const StopwatchWidget = React.lazy(() => import('./components/widgets/widgets/StopwatchWidget').then(m => ({ default: m.StopwatchWidget })));
const PasswordWidget = React.lazy(() => import('./components/widgets/widgets/PasswordWidget').then(m => ({ default: m.PasswordWidget })));
const ConverterWidget = React.lazy(() => import('./components/widgets/widgets/ConverterWidget').then(m => ({ default: m.ConverterWidget })));
const ColorWidget = React.lazy(() => import('./components/widgets/widgets/ColorWidget').then(m => ({ default: m.ColorWidget })));
const JsonWidget = React.lazy(() => import('./components/widgets/widgets/JsonWidget').then(m => ({ default: m.JsonWidget })));
const ToolsWidget = React.lazy(() => import('./components/widgets/widgets/ToolsWidget').then(m => ({ default: m.ToolsWidget })));
const ClipboardWidget = React.lazy(() => import('./components/widgets/widgets/ClipboardWidget').then(m => ({ default: m.ClipboardWidget })));
const IpWidget = React.lazy(() => import('./components/widgets/widgets/IpWidget').then(m => ({ default: m.IpWidget })));
const BreatheWidget = React.lazy(() => import('./components/widgets/widgets/BreatheWidget').then(m => ({ default: m.BreatheWidget })));
const JournalWidget = React.lazy(() => import('./components/widgets/JournalWidget').then(m => ({ default: m.default })));
const SystemMonitorWidgetEnhanced = React.lazy(() => import('./components/widgets/SystemMonitorWidgetEnhanced').then(m => ({ default: m.default })));
const TerminalWidgetEnhanced = React.lazy(() => import('./components/widgets/TerminalWidgetEnhanced').then(m => ({ default: m.default })));
const FileManagerWidget = React.lazy(() => import('./components/widgets/FileManagerWidget').then(m => ({ default: m.default })));
const CodeEditorWidget = React.lazy(() => import('./components/widgets/CodeEditorWidget').then(m => ({ default: m.default })));
const AIChatUnified = React.lazy(() => import('./components/AIChatUnified').then(m => ({ default: m.default })));
const LogViewer = React.lazy(() => import('./components/LogViewer').then(m => ({ default: m.default })));
const BootSequence = React.lazy(() => import('./components/BootSequence').then(m => ({ default: m.default })));
const VoiceAssistantEnhanced = React.lazy(() => import('./components/VoiceAssistantEnhanced').then(m => ({ default: m.default })));

const Skeleton = () => <div className="skeleton h-full rounded-lg bg-[#0f0f2a]/50 animate-pulse" />;

/* ─── Keyboard Help Overlay ─── */
function KeyboardHelp({ onClose }: { onClose: () => void }) {
  const shortcuts = [
    { keys: ['Ctrl', 'K'], desc: 'Focus search bar' },
    { keys: ['Ctrl', '/'], desc: 'Toggle this help' },
    { keys: ['Ctrl', 'D'], desc: 'Go to Dashboard' },
    { keys: ['Ctrl', 'T'], desc: 'Open Terminal' },
    { keys: ['Ctrl', 'N'], desc: 'New Note' },
    { keys: ['Ctrl', 'M'], desc: 'Toggle Music' },
    { keys: ['Ctrl', 'E'], desc: 'Export Data' },
    { keys: ['Ctrl', 'A'], desc: 'AI Chat' },
    { keys: ['F11'], desc: 'Fullscreen' },
    { keys: ['?'], desc: 'Show shortcuts' },
    { keys: ['Esc'], desc: 'Close overlays' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-[#0f0f2a] border border-[#1a1a3a] rounded-xl p-6 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Command className="w-5 h-5 text-[#00f0ff]" />
            <h2 className="text-sm font-display font-bold text-white">Keyboard Shortcuts</h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white" aria-label="Close keyboard shortcuts"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-2">
          {shortcuts.map((s) => (
            <div key={s.desc} className="flex items-center justify-between py-2 border-b border-[#1a1a3a] last:border-0">
              <span className="text-xs font-mono text-white/60">{s.desc}</span>
              <div className="flex gap-1">
                {s.keys.map((k) => (
                  <kbd key={k} className="px-2 py-0.5 rounded bg-[#0a0a1a] border border-[#1a1a3a] text-[10px] font-mono text-[#00f0ff]">{k}</kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Simple view wrappers ─── */
const wrapView = (Component: React.FC, maxWidth = 'max-w-2xl') => {
  const Wrapped = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full p-4 flex justify-center">
      <div className={`w-full ${maxWidth} h-full`}><Suspense fallback={<Skeleton />}><Component /></Suspense></div>
    </motion.div>
  );
  return Wrapped;
};

const TerminalView = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full p-4">
    <div className="h-full max-w-4xl mx-auto"><Suspense fallback={<Skeleton />}><TerminalWidget /></Suspense></div>
  </motion.div>
);

const CalculatorView = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full p-4 flex justify-center items-center">
    <div className="w-full max-w-sm"><Suspense fallback={<Skeleton />}><CalculatorWidget /></Suspense></div>
  </motion.div>
);

  const ChatUnifiedView = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full p-4">
      <div className="h-full max-w-4xl mx-auto"><Suspense fallback={<Skeleton />}><AIChatUnified /></Suspense></div>
    </motion.div>
  );

  const SystemView = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full p-4">
      <div className="h-full max-w-4xl mx-auto"><Suspense fallback={<Skeleton />}><SystemMonitorWidgetEnhanced /></Suspense></div>
    </motion.div>
  );

  const TerminalEnhancedView = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full p-4">
      <div className="h-full max-w-4xl mx-auto"><Suspense fallback={<Skeleton />}><TerminalWidgetEnhanced /></Suspense></div>
    </motion.div>
  );

const WhiteboardView = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
    <Whiteboard />
  </motion.div>
);

const WidgetManagerView = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full p-4 flex justify-center">
    <div className="w-full max-w-md h-full"><WidgetManager /></div>
  </motion.div>
);

const JournalView = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full p-4 flex justify-center">
    <div className="w-full max-w-2xl h-full"><Suspense fallback={<Skeleton />}><JournalWidget /></Suspense></div>
  </motion.div>
);

const KnowledgeBaseView = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full p-4">
    <div className="h-full max-w-4xl mx-auto"><KnowledgeBaseManager /></div>
  </motion.div>
);

const MemoryView = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full p-4">
    <div className="h-full max-w-4xl mx-auto"><MemoryViewer /></div>
  </motion.div>
);

const AgentView = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full p-4">
    <div className="h-full max-w-4xl mx-auto"><AgentStatus /></div>
  </motion.div>
);

const PluginView = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full p-4">
    <div className="h-full max-w-4xl mx-auto"><PluginManager /></div>
  </motion.div>
);

/* ─── Main App ─── */
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showApiManager, setShowApiManager] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAmbientMode, setShowAmbientMode] = useState(false);
  const [bootDone, setBootDone] = useLocalStorage('stariz-boot-done', false);

  const handleExport = useCallback(() => {
    exportData();
    toast.success('Data exported successfully');
  }, []);

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { importData } = await import('./utils/helpers');
    const ok = await importData(file);
    toast[ok ? 'success' : 'error'](ok ? 'Data imported! Reloading...' : 'Import failed');
    if (ok) setTimeout(() => window.location.reload(), 1500);
  }, []);

  useKeyboardShortcuts([
    { key: '/', ctrl: true, action: () => setShowShortcuts((s) => !s), description: 'Toggle shortcuts help' },
    { key: 'd', ctrl: true, action: () => setActiveTab('dashboard'), description: 'Dashboard' },
    { key: 't', ctrl: true, action: () => setActiveTab('terminal'), description: 'Terminal' },
    { key: 'a', ctrl: true, action: () => setActiveTab('chat'), description: 'AI Chat' },
    { key: 'e', ctrl: true, action: handleExport, description: 'Export data' },
    { key: 'p', ctrl: true, shift: true, action: () => setShowCommandPalette(true), description: 'Command palette' },
    { key: 'v', ctrl: true, shift: true, action: () => setShowAmbientMode(true), description: 'Ambient voice mode' },
    { key: '?', action: () => setShowShortcuts((s) => !s), description: 'Show shortcuts' },
    { key: 'Escape', action: () => { setShowShortcuts(false); setShowCommandPalette(false); setMobileMenuOpen(false); }, description: 'Close overlays' },
  ]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

   const renderContent = () => {
     switch (activeTab) {
       case 'dashboard': return <Dashboard />;
       case 'terminal': return <TerminalView />;
       case 'terminal-enhanced': return <TerminalEnhancedView />;
       case 'calendar': return wrapView(CalendarWidget)();
       case 'calculator': return <CalculatorView />;
        case 'chat': return <ChatUnifiedView />;
        case 'chat-classic': return <ChatUnifiedView />;
        case 'chat-enhanced': return <ChatUnifiedView />;
       case 'voice': return wrapView(VoiceAssistantEnhanced)();
       case 'whiteboard': return <WhiteboardView />;
       case 'journal': return <JournalView />;
       case 'widgets': return <WidgetManagerView />;
       case 'world': return wrapView(WorldClockWidget, 'max-w-md')();
       case 'security': return wrapView(SecurityWidget, 'max-w-md')();
       case 'network': return wrapView(NetworkWidget, 'max-w-md')();
       case 'ai': return wrapView(AICoreWidget, 'max-w-md')();
       case 'settings': return wrapView(SettingsWidget, 'max-w-md')();
       case 'crypto': return wrapView(CryptoWidget, 'max-w-md')();
       case 'quotes': return wrapView(QuotesWidget, 'max-w-md')();
       case 'stopwatch': return wrapView(StopwatchWidget, 'max-w-md')();
       case 'password': return wrapView(PasswordWidget, 'max-w-md')();
       case 'converter': return wrapView(ConverterWidget, 'max-w-md')();
       case 'color': return wrapView(ColorWidget, 'max-w-md')();
       case 'json': return wrapView(JsonWidget, 'max-w-md')();
       case 'devtools': return wrapView(ToolsWidget, 'max-w-md')();
       case 'clipboard': return wrapView(ClipboardWidget, 'max-w-md')();
       case 'ip': return wrapView(IpWidget, 'max-w-md')();
       case 'breathe': return wrapView(BreatheWidget, 'max-w-md')();
       case 'pomodoro': return wrapView(PomodoroWidget)();
       case 'news': return wrapView(NewsWidget)();
       case 'system': return <SystemView />;
       case 'files': return wrapView(FileManagerWidget)();
       case 'code': return wrapView(CodeEditorWidget)();
       case 'knowledge': return <KnowledgeBaseView />;
       case 'memory': return <MemoryView />;
       case 'agent': return <AgentView />;
        case 'plugins': return <PluginView />;
        case 'logs': return wrapView(LogViewer)();
        default: return <Dashboard />;
     }
   };

   return (
     <ErrorBoundary>
       <NotificationProvider>
         <div className="relative h-screen w-screen overflow-hidden flex flex-col">
           <Background />
           <WelcomeModal />
           <OfflineIndicator />
           <FocusMode />
           <Header onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
           <ToastContainer />
           <ApiKeyManager open={showApiManager} onClose={() => setShowApiManager(false)} />

        <AnimatePresence>
          {showShortcuts && <KeyboardHelp onClose={() => setShowShortcuts(false)} />}
          {showCommandPalette && (
            <CommandPalette
              isOpen={showCommandPalette}
              onClose={() => setShowCommandPalette(false)}
              onNavigate={(tab) => { setActiveTab(tab); setShowCommandPalette(false); }}
            />
          )}
          {showAmbientMode && <AmbientMode onClose={() => setShowAmbientMode(false)} />}
        </AnimatePresence>

        {!bootDone && <Suspense fallback={null}><BootSequence onComplete={() => setBootDone(true)} /></Suspense>}

        {/* Main content area - takes remaining space */}
        <div className="flex-1 overflow-hidden">
          <div className="flex flex-1 overflow-hidden relative z-10">
            <Sidebar
              activeTab={activeTab}
              onTabChange={(tab) => { setActiveTab(tab); setMobileMenuOpen(false); }}
              mobileOpen={mobileMenuOpen}
              onMobileClose={() => setMobileMenuOpen(false)}
            />

            <main className="flex-1 min-h-0 overflow-y-auto bg-[#050510]/40 relative pb-16 md:pb-0">
              {/* Floating toolbar */}
               <div className="absolute top-3 right-4 z-30 flex items-center gap-2 flex-wrap justify-end max-w-[70%]">
                 <button
                   onClick={() => setShowAmbientMode(true)}
                   className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-[#00ff88]/30 bg-[#00ff88]/5 text-[10px] font-mono text-[#00ff88] hover:bg-[#00ff88]/10 transition-colors"
                 >
                   <Mic className="w-3 h-3" />
                   VOICE
                 </button>
                 <button
                  onClick={() => setShowApiManager(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-[#ff00a0]/30 bg-[#ff00a0]/5 text-[10px] font-mono text-[#ff00a0] hover:bg-[#ff00a0]/10 transition-colors"
                >
                  <Key className="w-3 h-3" />
                  API
                </button>
                <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-[#1a1a3a] bg-[#0a0a1a]/60 text-[10px] font-mono text-white/40 hover:text-white/70 cursor-pointer transition-colors">
                  <Upload className="w-3 h-3" />
                  IMPORT
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
                <button onClick={handleExport} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-[#1a1a3a] bg-[#0a0a1a]/60 text-[10px] font-mono text-white/40 hover:text-white/70 transition-colors">
                  <Download className="w-3 h-3" />
                  EXPORT
                </button>
                <button onClick={() => setShowShortcuts(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-[#1a1a3a] bg-[#0a0a1a]/60 text-[10px] font-mono text-white/40 hover:text-white/70 transition-colors">
                  <Keyboard className="w-3 h-3" />
                  KEYS
                </button>
                <button onClick={toggleFullscreen} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-[#1a1a3a] bg-[#0a0a1a]/60 text-[10px] font-mono text-white/40 hover:text-white/70 transition-colors" aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
                  {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                </button>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="min-h-full pt-10"
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>

        {/* Footer - Status Bar */}
        <div className="flex-shrink-0">
          <StatusBar />
          
          {/* Mobile Navigation */}
          <MobileNav activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); }} />
        </div>
      </div>
    </NotificationProvider>
    </ErrorBoundary>
   );
}
