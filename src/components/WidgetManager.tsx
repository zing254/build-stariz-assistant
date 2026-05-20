import { Reorder } from 'framer-motion';
import {
  GripVertical, Eye, EyeOff, RotateCcw,
  LayoutGrid, Square, RectangleHorizontal, Expand
} from 'lucide-react';
import { useWidgetLayout } from '../hooks/useWidgetLayout';
import { toast } from './Toast';

const WIDGET_NAMES: Record<string, string> = {
  clock: 'Clock', weather: 'Weather', system: 'System Monitor', pomodoro: 'Pomodoro',
  tasks: 'Tasks', voice: 'Voice Assistant', news: 'News Feed',
  calendar: 'Calendar', music: 'Music Player', notes: 'Notes', calc: 'Calculator',
  crypto: 'Crypto', quotes: 'Quotes', stopwatch: 'Stopwatch', password: 'Password Gen',
  converter: 'Converter', color: 'Color Tool', json: 'JSON Tool', devtools: 'Dev Tools',
  clipboard: 'Clipboard', ip: 'IP Info', breathe: 'Breathe', world: 'World Clock',
  links: 'Quick Links', security: 'Security', network: 'Network', ai: 'AI Core',
};

const SIZE_ICONS = {
  small: Square,
  medium: RectangleHorizontal,
  large: Expand,
};

export default function WidgetManager() {
  const { widgets, moveWidget, toggleVisibility, cycleSize, resetLayout } = useWidgetLayout();

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a3a]">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-[#00f0ff]" />
          <span className="text-xs font-mono text-[#00f0ff]/60 uppercase tracking-widest">Widget Manager</span>
        </div>
        <button
          onClick={() => { resetLayout(); toast.success('Layout reset'); }}
          className="flex items-center gap-1 px-2 py-1 rounded border border-[#1a1a3a] text-[10px] font-mono text-white/30 hover:text-[#ffcc00] hover:border-[#ffcc00]/20 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          RESET
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <p className="text-[10px] font-mono text-white/20 mb-3">
          Drag to reorder · Click eye to hide · Click size icon to resize
        </p>

        <Reorder.Group
          axis="y"
          values={widgets}
          onReorder={(newOrder) => {
            // Map back to move operations
            newOrder.forEach((widget, index) => {
              const oldIndex = widgets.findIndex((w) => w.id === widget.id);
              if (oldIndex !== index) {
                moveWidget(oldIndex, index);
              }
            });
          }}
          className="space-y-1"
        >
          {widgets.map((widget) => {
            const SizeIcon = SIZE_ICONS[widget.size];
            return (
              <Reorder.Item
                key={widget.id}
                value={widget}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0a0a1a]/50 border border-[#1a1a3a] cursor-grab active:cursor-grabbing group"
                whileDrag={{ scale: 1.02, boxShadow: '0 0 20px rgba(0, 240, 255, 0.1)' }}
              >
                <GripVertical className="w-4 h-4 text-white/10 group-hover:text-white/30 shrink-0" />
                <span className="flex-1 text-xs font-mono text-white/70">{WIDGET_NAMES[widget.id] || widget.id}</span>

                <button
                  onClick={(e) => { e.stopPropagation(); cycleSize(widget.id); }}
                  className="p-1 rounded text-white/20 hover:text-[#00f0ff] transition-colors"
                  title={`Size: ${widget.size}`}
                >
                  <SizeIcon className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); toggleVisibility(widget.id); }}
                  className={`p-1 rounded transition-colors ${widget.visible ? 'text-[#00ff88]' : 'text-white/20 hover:text-white/40'}`}
                  title={widget.visible ? 'Hide' : 'Show'}
                >
                  {widget.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      </div>

      <div className="px-4 py-3 border-t border-[#1a1a3a] text-center">
        <span className="text-[10px] font-mono text-white/20">
          {widgets.filter((w) => w.visible).length} of {widgets.length} widgets visible
        </span>
      </div>
    </div>
  );
}
