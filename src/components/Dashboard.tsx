import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { useWidgetLayout } from '../hooks/useWidgetLayout';
import {
  Maximize2, Minimize2, EyeOff, Settings2, RotateCcw
} from 'lucide-react';

const ClockWidget = React.lazy(() => import('./widgets/widgets/ClockWidget').then(m => ({ default: m.ClockWidget })));
const WeatherWidget = React.lazy(() => import('./widgets/widgets/WeatherWidget').then(m => ({ default: m.WeatherWidget })));
const TasksWidget = React.lazy(() => import('./widgets/widgets/TasksWidget').then(m => ({ default: m.TasksWidget })));
const NotesWidget = React.lazy(() => import('./widgets/widgets/NotesWidget').then(m => ({ default: m.NotesWidget })));
const SystemMonitorWidget = React.lazy(() => import('./widgets/widgets/SystemMonitorWidget').then(m => ({ default: m.SystemMonitorWidget })));
const CalendarWidget = React.lazy(() => import('./widgets/widgets/CalendarWidget').then(m => ({ default: m.CalendarWidget })));
const VoiceAssistantWidget = React.lazy(() => import('./widgets/widgets/VoiceAssistantWidget').then(m => ({ default: m.VoiceAssistantWidget })));
const NewsWidget = React.lazy(() => import('./widgets/widgets/NewsWidget').then(m => ({ default: m.NewsWidget })));
const CalculatorWidget = React.lazy(() => import('./widgets/widgets/CalculatorWidget').then(m => ({ default: m.CalculatorWidget })));
const PomodoroWidget = React.lazy(() => import('./widgets/widgets/PomodoroWidget').then(m => ({ default: m.PomodoroWidget })));
const WorldClockWidget = React.lazy(() => import('./widgets/widgets/WorldClockWidget').then(m => ({ default: m.WorldClockWidget })));
const QuickLinksWidget = React.lazy(() => import('./widgets/widgets/QuickLinksWidget').then(m => ({ default: m.QuickLinksWidget })));
const SecurityWidget = React.lazy(() => import('./widgets/widgets/SecurityWidget').then(m => ({ default: m.SecurityWidget })));
const NetworkWidget = React.lazy(() => import('./widgets/widgets/NetworkWidget').then(m => ({ default: m.NetworkWidget })));
const AICoreWidget = React.lazy(() => import('./widgets/widgets/AICoreWidget').then(m => ({ default: m.AICoreWidget })));
const CryptoWidget = React.lazy(() => import('./widgets/widgets/CryptoWidget').then(m => ({ default: m.CryptoWidget })));
const QuotesWidget = React.lazy(() => import('./widgets/widgets/QuotesWidget').then(m => ({ default: m.QuotesWidget })));
const StopwatchWidget = React.lazy(() => import('./widgets/widgets/StopwatchWidget').then(m => ({ default: m.StopwatchWidget })));
const PasswordWidget = React.lazy(() => import('./widgets/widgets/PasswordWidget').then(m => ({ default: m.PasswordWidget })));
const ConverterWidget = React.lazy(() => import('./widgets/widgets/ConverterWidget').then(m => ({ default: m.ConverterWidget })));
const ColorWidget = React.lazy(() => import('./widgets/widgets/ColorWidget').then(m => ({ default: m.ColorWidget })));
const JsonWidget = React.lazy(() => import('./widgets/widgets/JsonWidget').then(m => ({ default: m.JsonWidget })));
const ToolsWidget = React.lazy(() => import('./widgets/widgets/ToolsWidget').then(m => ({ default: m.ToolsWidget })));
const ClipboardWidget = React.lazy(() => import('./widgets/widgets/ClipboardWidget').then(m => ({ default: m.ClipboardWidget })));
const IpWidget = React.lazy(() => import('./widgets/widgets/IpWidget').then(m => ({ default: m.IpWidget })));
const BreatheWidget = React.lazy(() => import('./widgets/widgets/BreatheWidget').then(m => ({ default: m.BreatheWidget })));
const MusicPlayerWidget = React.lazy(() => import('./widgets/MusicPlayer'));

const Skeleton = () => <div className="skeleton h-full rounded-lg bg-[#0f0f2a]/50 animate-pulse" />;

const WIDGET_COMPONENTS: Record<string, React.FC> = {
  clock: () => <Suspense fallback={<Skeleton />}><ClockWidget /></Suspense>,
  weather: () => <Suspense fallback={<Skeleton />}><WeatherWidget /></Suspense>,
  system: () => <Suspense fallback={<Skeleton />}><SystemMonitorWidget /></Suspense>,
  pomodoro: () => <Suspense fallback={<Skeleton />}><PomodoroWidget /></Suspense>,
  tasks: () => <Suspense fallback={<Skeleton />}><TasksWidget /></Suspense>,
  voice: () => <Suspense fallback={<Skeleton />}><VoiceAssistantWidget /></Suspense>,
  news: () => <Suspense fallback={<Skeleton />}><NewsWidget /></Suspense>,
  calendar: () => <Suspense fallback={<Skeleton />}><CalendarWidget /></Suspense>,
  music: () => <Suspense fallback={<Skeleton />}><MusicPlayerWidget /></Suspense>,
  notes: () => <Suspense fallback={<Skeleton />}><NotesWidget /></Suspense>,
  calc: () => <Suspense fallback={<Skeleton />}><CalculatorWidget /></Suspense>,
  crypto: () => <Suspense fallback={<Skeleton />}><CryptoWidget /></Suspense>,
  quotes: () => <Suspense fallback={<Skeleton />}><QuotesWidget /></Suspense>,
  stopwatch: () => <Suspense fallback={<Skeleton />}><StopwatchWidget /></Suspense>,
  password: () => <Suspense fallback={<Skeleton />}><PasswordWidget /></Suspense>,
  converter: () => <Suspense fallback={<Skeleton />}><ConverterWidget /></Suspense>,
  color: () => <Suspense fallback={<Skeleton />}><ColorWidget /></Suspense>,
  json: () => <Suspense fallback={<Skeleton />}><JsonWidget /></Suspense>,
  devtools: () => <Suspense fallback={<Skeleton />}><ToolsWidget /></Suspense>,
  clipboard: () => <Suspense fallback={<Skeleton />}><ClipboardWidget /></Suspense>,
  ip: () => <Suspense fallback={<Skeleton />}><IpWidget /></Suspense>,
  breathe: () => <Suspense fallback={<Skeleton />}><BreatheWidget /></Suspense>,
  world: () => <Suspense fallback={<Skeleton />}><WorldClockWidget /></Suspense>,
  links: () => <Suspense fallback={<Skeleton />}><QuickLinksWidget /></Suspense>,
  security: () => <Suspense fallback={<Skeleton />}><SecurityWidget /></Suspense>,
  network: () => <Suspense fallback={<Skeleton />}><NetworkWidget /></Suspense>,
  ai: () => <Suspense fallback={<Skeleton />}><AICoreWidget /></Suspense>,
};

// The dashboard uses a responsive auto-fit grid rather than a fixed 12-column
// layout. Fixed column spans made small widgets narrower than their controls and
// caused cards to overlap on tablets and narrow desktop windows.
const SIZE_CLASSES: Record<string, { col: string; minHeight: string }> = {
  small: { col: 'dashboard-item dashboard-item-small', minHeight: '176px' },
  medium: { col: 'dashboard-item dashboard-item-medium', minHeight: '288px' },
  large: { col: 'dashboard-item dashboard-item-large', minHeight: '384px' },
};

export default function Dashboard() {
  const { widgets, visibleWidgets, toggleVisibility, toggleExpanded, cycleSize, editMode, setEditMode, resetLayout } = useWidgetLayout();

  return (
    <div className="flex-1 min-h-0">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-full overflow-y-auto p-3 sm:p-4">
        <div className="dashboard-toolbar mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#1a1a3a] bg-[#0a0a1a]/60 px-3 py-2.5">
          <div className="min-w-0">
            <h2 className="font-display text-sm font-bold tracking-wider text-white">COMMAND CENTER</h2>
            <p className="text-[10px] font-mono text-white/35">{visibleWidgets.length} active modules · responsive layout</p>
          </div>
          <div className="flex items-center gap-2">
            {editMode && <button onClick={() => { resetLayout(); }} className="dashboard-action" aria-label="Reset dashboard layout"><RotateCcw className="h-3.5 w-3.5" /> Reset</button>}
            <button onClick={() => setEditMode((value) => !value)} className={`dashboard-action ${editMode ? 'dashboard-action-active' : ''}`} aria-pressed={editMode}>
              <Settings2 className="h-3.5 w-3.5" /> {editMode ? 'Done' : 'Customize'}
            </button>
          </div>
        </div>
        <div className="dashboard-grid">
          {visibleWidgets.map((config) => {
            const Component = WIDGET_COMPONENTS[config.id];
            if (!Component) return null;
            const size = SIZE_CLASSES[config.size] || SIZE_CLASSES.small;
            const isExpanded = config.expanded;

            return (
              <div
                key={config.id}
                className={`${size.col} ${isExpanded ? 'dashboard-item-expanded' : ''} relative group transition-all duration-300`}
                style={{ minHeight: isExpanded ? '500px' : size.minHeight }}
              >
                <div className={`absolute top-2 right-2 z-10 flex gap-1 transition-opacity ${editMode ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100 focus-within:opacity-100'}`}>
                  <button
                    onClick={() => cycleSize(config.id)}
                    className="p-1 rounded bg-[#0a0a1a]/80 border border-[#1a1a3a] text-white/40 hover:text-[#00f0ff] text-[10px] font-mono"
                    title={`Change ${config.id} size`}
                    aria-label={`Change ${config.id} size`}
                  >
                    {config.size === 'small' ? 'S' : config.size === 'medium' ? 'M' : 'L'}
                  </button>
                  <button
                    onClick={() => toggleExpanded(config.id)}
                    className="p-1 rounded bg-[#0a0a1a]/80 border border-[#1a1a3a] text-white/40 hover:text-[#00f0ff]"
                    title={isExpanded ? 'Shrink' : 'Expand'}
                    aria-label={isExpanded ? `Shrink ${config.id}` : `Expand ${config.id}`}
                  >
                    {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => toggleVisibility(config.id)}
                    className="p-1 rounded bg-[#0a0a1a]/80 border border-[#1a1a3a] text-white/40 hover:text-[#ff3366]"
                    title={`Hide ${config.id}`}
                    aria-label={`Hide ${config.id}`}
                  >
                    <EyeOff className="w-3 h-3" />
                  </button>
                </div>
                <Component />
              </div>
            );
          })}
        </div>
        {visibleWidgets.length === 0 && (
          <div className="cyber-border rounded-xl bg-[#0a0a1a]/60 p-8 text-center">
            <EyeOff className="mx-auto mb-3 h-6 w-6 text-white/30" />
            <p className="text-sm font-mono text-white/60">All modules are hidden.</p>
            <p className="mt-1 text-xs text-white/30">Open Customize to restore the modules you want to use.</p>
            <button onClick={() => widgets.forEach((widget) => { if (!widget.visible) toggleVisibility(widget.id); })} className="dashboard-action mt-4">
              <EyeOff className="h-3.5 w-3.5" /> Restore all modules
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
