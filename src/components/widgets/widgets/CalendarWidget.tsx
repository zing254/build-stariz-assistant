import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { generateId } from '../../../utils/helpers';
import { useLocalStorage } from '../../../hooks/useLocalStorage';

export function CalendarWidget() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useLocalStorage<Array<{ id: string; date: string; title: string }>>('stariz-events', [
    { id: '1', date: new Date().toISOString().split('T')[0], title: 'System Update' },
    { id: '2', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], title: 'Team Sync' },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split('T')[0];

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const dateStr = (d: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const addEvent = () => {
    if (!newEventTitle.trim() || !selectedDate) return;
    setEvents([...events, { id: generateId(), date: selectedDate, title: newEventTitle }]);
    setNewEventTitle('');
    setShowAdd(false);
  };

  const monthEvents = events.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full flex flex-col relative">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-[#a855f7]" />
          <span className="text-xs font-mono text-[#a855f7]/60 uppercase tracking-widest">Calendar</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="p-1 text-white/40 hover:text-[#a855f7]">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-white/70 w-24 text-center">
            {currentDate.toLocaleDateString('en', { month: 'short', year: 'numeric' })}
          </span>
          <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="p-1 text-white/40 hover:text-[#a855f7]">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => (
          <div key={d} className="text-center text-[10px] font-mono text-white/30 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 flex-1">
        {days.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const ds = dateStr(day);
          const hasEvent = events.some((e) => e.date === ds);
          const isToday = ds === today;
          return (
            <button
              key={day}
              onClick={() => { setSelectedDate(ds); setShowAdd(true); }}
              className={`relative aspect-square rounded flex items-center justify-center text-[11px] font-mono transition-all ${
                isToday
                  ? 'bg-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/40'
                  : 'text-white/60 hover:bg-white/5'
              }`}
            >
              {day}
              {hasEvent && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-[#ff00a0]" />}
            </button>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-[#1a1a3a] space-y-1.5 max-h-24 overflow-y-auto">
        {monthEvents.slice(0, 4).map((e) => (
          <div key={e.id} className="flex items-center gap-2 text-xs font-mono">
            <div className="w-1.5 h-1.5 rounded-full bg-[#a855f7]" />
            <span className="text-white/40">{new Date(e.date).getDate()}</span>
            <span className="text-white/70 truncate">{e.title}</span>
            <button onClick={() => setEvents(events.filter((ev) => ev.id !== e.id))} className="ml-auto">
              <Trash2 className="w-3 h-3 text-[#ff3366]/40 hover:text-[#ff3366]" />
            </button>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute inset-x-4 bottom-4 bg-[#0a0a1a] border border-[#a855f7]/30 rounded-lg p-3 z-10"
          >
            <div className="text-[10px] font-mono text-[#a855f7] mb-2">{selectedDate}</div>
            <div className="flex gap-2">
              <input
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addEvent()}
                placeholder="Event title..."
                className="flex-1 bg-[#0f0f2a] border border-[#1a1a3a] rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-[#a855f7]/50"
                autoFocus
              />
              <button onClick={addEvent} className="px-2 py-1 bg-[#a855f7]/20 text-[#a855f7] rounded text-xs font-mono">ADD</button>
              <button onClick={() => setShowAdd(false)} className="px-2 py-1 text-white/40 text-xs font-mono">X</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
