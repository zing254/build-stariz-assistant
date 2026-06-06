import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { useWidgetLayout } from '../hooks/useWidgetLayout';
import {
  Maximize2, Minimize2, EyeOff
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

const SIZE_CLASSES: Record<string, { col: string; height: string }> = {
  small: { col: 'col-span-12 md:col-span-3', height: 'h-44' },
  medium: { col: 'col-span-12 md:col-span-4', height: 'h-72' },
  large: { col: 'col-span-12 md:col-span-6', height: 'h-96' },
};

export default function Dashboard() {
  const { visibleWidgets, toggleVisibility, toggleExpanded, cycleSize } = useWidgetLayout();

  return (
    <div className="flex-1 min-h-0">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-full overflow-y-auto p-4">
        <div className="grid grid-cols-12 gap-4">
          {visibleWidgets.map((config) => {
            const Component = WIDGET_COMPONENTS[config.id];
            if (!Component) return null;
            const size = SIZE_CLASSES[config.size] || SIZE_CLASSES.small;
            const isExpanded = config.expanded;

            return (
              <div
                key={config.id}
                className={`${size.col} ${isExpanded ? 'col-span-12 md:col-span-12' : ''} relative group transition-all duration-300`}
                style={{ height: isExpanded ? '500px' : size.height }}
              >
                <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => cycleSize(config.id)}
                    className="p-1 rounded bg-[#0a0a1a]/80 border border-[#1a1a3a] text-white/40 hover:text-[#00f0ff] text-[10px] font-mono"
                    title="Change size"
                  >
                    {config.size === 'small' ? 'S' : config.size === 'medium' ? 'M' : 'L'}
                  </button>
                  <button
                    onClick={() => toggleExpanded(config.id)}
                    className="p-1 rounded bg-[#0a0a1a]/80 border border-[#1a1a3a] text-white/40 hover:text-[#00f0ff]"
                    title={isExpanded ? 'Shrink' : 'Expand'}
                  >
                    {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => toggleVisibility(config.id)}
                    className="p-1 rounded bg-[#0a0a1a]/80 border border-[#1a1a3a] text-white/40 hover:text-[#ff3366]"
                    title="Hide"
                  >
                    <EyeOff className="w-3 h-3" />
                  </button>
                </div>
                <Component />
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
