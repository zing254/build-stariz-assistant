import { useState, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

export interface WidgetConfig {
  id: string;
  visible: boolean;
  expanded: boolean;
  size: 'small' | 'medium' | 'large';
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'clock', visible: true, expanded: false, size: 'small' },
  { id: 'weather', visible: true, expanded: false, size: 'small' },
  { id: 'system', visible: true, expanded: false, size: 'small' },
  { id: 'pomodoro', visible: true, expanded: false, size: 'small' },
  { id: 'tasks', visible: true, expanded: false, size: 'medium' },
  { id: 'voice', visible: true, expanded: false, size: 'medium' },
  { id: 'news', visible: true, expanded: false, size: 'medium' },
  { id: 'calendar', visible: true, expanded: false, size: 'medium' },
  { id: 'music', visible: true, expanded: false, size: 'medium' },
  { id: 'notes', visible: true, expanded: false, size: 'medium' },
  { id: 'calc', visible: true, expanded: false, size: 'medium' },
  { id: 'crypto', visible: true, expanded: false, size: 'small' },
  { id: 'quotes', visible: true, expanded: false, size: 'small' },
  { id: 'stopwatch', visible: true, expanded: false, size: 'small' },
  { id: 'password', visible: true, expanded: false, size: 'small' },
  { id: 'converter', visible: true, expanded: false, size: 'small' },
  { id: 'color', visible: true, expanded: false, size: 'small' },
  { id: 'json', visible: true, expanded: false, size: 'small' },
  { id: 'devtools', visible: true, expanded: false, size: 'small' },
  { id: 'clipboard', visible: true, expanded: false, size: 'small' },
  { id: 'ip', visible: true, expanded: false, size: 'small' },
  { id: 'breathe', visible: true, expanded: false, size: 'small' },
  { id: 'world', visible: true, expanded: false, size: 'small' },
  { id: 'links', visible: true, expanded: false, size: 'small' },
  { id: 'security', visible: true, expanded: false, size: 'small' },
  { id: 'network', visible: true, expanded: false, size: 'small' },
  { id: 'ai', visible: true, expanded: false, size: 'small' },
];

export function useWidgetLayout() {
  const [widgets, setWidgets] = useLocalStorage<WidgetConfig[]>('stariz-widget-layout', DEFAULT_WIDGETS);
  const [editMode, setEditMode] = useState(false);

  const moveWidget = useCallback((fromIndex: number, toIndex: number) => {
    setWidgets((prev) => {
      const next = [...prev];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      return next;
    });
  }, [setWidgets]);

  const toggleVisibility = useCallback((id: string) => {
    setWidgets((prev) => prev.map((w) => w.id === id ? { ...w, visible: !w.visible } : w));
  }, [setWidgets]);

  const toggleExpanded = useCallback((id: string) => {
    setWidgets((prev) => prev.map((w) => w.id === id ? { ...w, expanded: !w.expanded } : w));
  }, [setWidgets]);

  const cycleSize = useCallback((id: string) => {
    setWidgets((prev) => prev.map((w) => {
      if (w.id !== id) return w;
      const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];
      const next = sizes[(sizes.indexOf(w.size) + 1) % sizes.length];
      return { ...w, size: next };
    }));
  }, [setWidgets]);

  const resetLayout = useCallback(() => {
    setWidgets(DEFAULT_WIDGETS);
  }, [setWidgets]);

  const visibleWidgets = widgets.filter((w) => w.visible);

  return {
    widgets,
    visibleWidgets,
    editMode,
    setEditMode,
    moveWidget,
    toggleVisibility,
    toggleExpanded,
    cycleSize,
    resetLayout,
  };
}
