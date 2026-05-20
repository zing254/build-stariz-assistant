import { motion } from 'framer-motion';
import { useWidgetLayout } from '../hooks/useWidgetLayout';
import {
  ClockWidget, WeatherWidget, TasksWidget, NotesWidget, SystemMonitorWidget
} from './widgets/Widgets1';
import {
  CalendarWidget, VoiceAssistantWidget, NewsWidget, CalculatorWidget
} from './widgets/Widgets2';
import {
  PomodoroWidget, WorldClockWidget, QuickLinksWidget,
  SecurityWidget, NetworkWidget, AICoreWidget
} from './widgets/Widgets3';
import {
  CryptoWidget, QuotesWidget, StopwatchWidget, PasswordWidget,
  ConverterWidget, ColorWidget, JsonWidget, ToolsWidget,
  ClipboardWidget, IpWidget, BreatheWidget
} from './widgets/Widgets4';
import MusicPlayerWidget from './widgets/MusicPlayer';
import {
  Maximize2, Minimize2, EyeOff
} from 'lucide-react';

const WIDGET_COMPONENTS: Record<string, React.FC> = {
  clock: ClockWidget,
  weather: WeatherWidget,
  system: SystemMonitorWidget,
  pomodoro: PomodoroWidget,
  tasks: TasksWidget,
  voice: VoiceAssistantWidget,
  news: NewsWidget,
  calendar: CalendarWidget,
  music: MusicPlayerWidget,
  notes: NotesWidget,
  calc: CalculatorWidget,
  crypto: CryptoWidget,
  quotes: QuotesWidget,
  stopwatch: StopwatchWidget,
  password: PasswordWidget,
  converter: ConverterWidget,
  color: ColorWidget,
  json: JsonWidget,
  devtools: ToolsWidget,
  clipboard: ClipboardWidget,
  ip: IpWidget,
  breathe: BreatheWidget,
  world: WorldClockWidget,
  links: QuickLinksWidget,
  security: SecurityWidget,
  network: NetworkWidget,
  ai: AICoreWidget,
};

const SIZE_CLASSES: Record<string, { col: string; height: string }> = {
  small: { col: 'col-span-12 md:col-span-3', height: 'h-44' },
  medium: { col: 'col-span-12 md:col-span-4', height: 'h-72' },
  large: { col: 'col-span-12 md:col-span-6', height: 'h-96' },
};

export default function Dashboard() {
  const { visibleWidgets, toggleVisibility, toggleExpanded, cycleSize } = useWidgetLayout();

  return (
    <div className="flex-1 min-h-0 overflow-hidden">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full overflow-y-auto p-4">
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
                {/* Hover controls */}
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
