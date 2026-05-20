import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, Cloud, CloudRain, Sun, Snowflake, CloudLightning, Wind, Droplets,
  Eye, CheckCircle2, Circle, Trash2, Plus, StickyNote, ChevronRight, Thermometer,
  MapPin, RefreshCw, AlertTriangle
} from 'lucide-react';
import { formatTime, formatDate, generateId, weatherCodeToDesc, getWeatherIcon, fetchWithFallback } from '../../utils/helpers';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { toast } from '../Toast';

// ==================== CLOCK WIDGET ====================
export function ClockWidget() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full flex flex-col justify-center">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-[#00f0ff]" />
        <span className="text-xs font-mono text-[#00f0ff]/60 uppercase tracking-widest">System Time</span>
      </div>
      <div className="font-display text-4xl font-bold text-white tracking-wider tabular-nums">
        {formatTime(time)}
      </div>
      <div className="text-sm text-[#00f0ff]/50 font-mono mt-1">{formatDate(time)}</div>
      <div className="mt-3 flex gap-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div
            key={i}
            className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono ${
              i === time.getDay()
                ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30'
                : 'text-white/30'
            }`}
          >
            {d}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== WEATHER WIDGET ====================
const CITIES: Record<string, [number, number]> = {
   'New York': [40.71, -74.01], 'London': [51.51, -0.13], 'Tokyo': [35.68, 139.69],
   'Sydney': [-33.87, 151.21], 'Dubai': [25.20, 55.27], 'Paris': [48.86, 2.35],
   'Berlin': [52.52, 13.41], 'Singapore': [1.35, 103.82], 'Nairobi': [-1.29, 36.82],
};

export function WeatherWidget() {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [city, setCity] = useState('New York');
  const [usingGeo, setUsingGeo] = useState(false);

  const fetchWeather = async (lat: number, lon: number, cityName: string) => {
    setLoading(true);
    setError('');
    const data = await fetchWithFallback(
      async () => {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`,
          { signal: AbortSignal.timeout(8000) }
        );
        if (!res.ok) throw new Error('Weather API failed');
        return res.json();
      },
      null
    );
    if (data) {
      setWeather(data);
      setCity(cityName);
    } else {
      setError('Failed to load weather');
    }
    setLoading(false);
  };

  useEffect(() => {
    // Try geolocation first
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUsingGeo(true);
          fetchWeather(pos.coords.latitude, pos.coords.longitude, 'My Location');
        },
        () => {
          const [lat, lon] = CITIES['New York'];
          fetchWeather(lat, lon, 'New York');
        },
        { timeout: 5000 }
      );
    } else {
      const [lat, lon] = CITIES['New York'];
      fetchWeather(lat, lon, 'New York');
    }
  }, []);

  const handleCityChange = (c: string) => {
    setUsingGeo(false);
    const [lat, lon] = CITIES[c];
    fetchWeather(lat, lon, c);
  };

  const WeatherIcon = ({ code, className }: { code: number; className?: string }) => {
    const icon = getWeatherIcon(code);
    const props = { className: className || 'w-5 h-5' };
    switch (icon) {
      case 'sun': return <Sun {...props} className={`${props.className} text-[#ffcc00]`} />;
      case 'cloud-sun': return <Cloud {...props} className={`${props.className} text-[#00f0ff]`} />;
      case 'cloud-fog': return <Eye {...props} className={`${props.className} text-[#a855f7]`} />;
      case 'cloud-rain': return <CloudRain {...props} className={`${props.className} text-[#00f0ff]`} />;
      case 'snowflake': return <Snowflake {...props} className={`${props.className} text-[#00f0ff]`} />;
      case 'cloud-lightning': return <CloudLightning {...props} className={`${props.className} text-[#ffcc00]`} />;
      default: return <Sun {...props} className={`${props.className} text-[#ffcc00]`} />;
    }
  };

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Cloud className="w-4 h-4 text-[#00f0ff]" />
          <span className="text-xs font-mono text-[#00f0ff]/60 uppercase tracking-widest">Weather</span>
          {usingGeo && <MapPin className="w-3 h-3 text-[#00ff88]" />}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (usingGeo && weather) {
                navigator.geolocation.getCurrentPosition(
                  (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude, 'My Location'),
                  () => {}
                );
              } else {
                handleCityChange(city);
              }
            }}
            className="text-white/30 hover:text-[#00f0ff] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <select
            value={usingGeo ? '_geo' : city}
            onChange={(e) => {
              if (e.target.value === '_geo') {
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    setUsingGeo(true);
                    fetchWeather(pos.coords.latitude, pos.coords.longitude, 'My Location');
                  }
                );
              } else {
                handleCityChange(e.target.value);
              }
            }}
            className="bg-[#0a0a1a] border border-[#1a1a3a] rounded px-2 py-1 text-xs font-mono text-[#00f0ff] focus:outline-none max-w-[110px]"
          >
            <option value="_geo">📍 My Location</option>
            {Object.keys(CITIES).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#00f0ff]/30 border-t-[#00f0ff] rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <AlertTriangle className="w-8 h-8 text-[#ff3366]/50 mb-2" />
          <span className="text-xs font-mono text-[#ff3366]/60">{error}</span>
          <button onClick={() => handleCityChange(city)} className="mt-2 text-[10px] font-mono text-[#00f0ff]/60 hover:text-[#00f0ff]">Retry</button>
        </div>
      ) : weather ? (
        <>
          <div className="flex items-center gap-4 mb-4">
            <WeatherIcon code={weather.current.weather_code} className="w-12 h-12" />
            <div>
              <div className="text-3xl font-display font-bold text-white">{Math.round(weather.current.temperature_2m)}°C</div>
              <div className="text-xs text-[#00f0ff]/60 font-mono">{weatherCodeToDesc(weather.current.weather_code)}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            <div className="flex items-center gap-1 text-[#00f0ff]/60">
              <Droplets className="w-3 h-3" />
              <span>{weather.current.relative_humidity_2m}%</span>
            </div>
            <div className="flex items-center gap-1 text-[#00f0ff]/60">
              <Wind className="w-3 h-3" />
              <span>{weather.current.wind_speed_10m}km/h</span>
            </div>
            <div className="flex items-center gap-1 text-[#00f0ff]/60">
              <Thermometer className="w-3 h-3" />
              <span>Feels {Math.round(weather.current.apparent_temperature)}°</span>
            </div>
          </div>
          {weather.daily && (
            <div className="mt-3 pt-3 border-t border-[#1a1a3a] flex gap-3 overflow-x-auto">
              {weather.daily.time.slice(0, 5).map((t: string, i: number) => (
                <div key={t} className="flex flex-col items-center min-w-[50px]">
                  <span className="text-[10px] text-white/40 font-mono">{new Date(t).toLocaleDateString('en', { weekday: 'short' })}</span>
                  <WeatherIcon code={weather.daily.weather_code[i]} className="w-4 h-4 my-1" />
                  <span className="text-[10px] text-[#00f0ff]/70 font-mono">{Math.round(weather.daily.temperature_2m_max[i])}°</span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

// ==================== TASKS WIDGET ====================
export function TasksWidget() {
  const [tasks, setTasks] = useLocalStorage<Array<{ id: string; text: string; done: boolean; priority: 'low' | 'medium' | 'high' }>>('stariz-tasks', [
    { id: '1', text: 'Review system diagnostics', done: false, priority: 'high' },
    { id: '2', text: 'Update security protocols', done: true, priority: 'medium' },
    { id: '3', text: 'Sync neural network data', done: false, priority: 'low' },
  ]);
  const [newTask, setNewTask] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: generateId(), text: newTask, done: false, priority }]);
    setNewTask('');
    toast.success('Task added');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
    toast.info('Task removed');
  };

  const priorityColor = { low: '#00ff88', medium: '#ffcc00', high: '#ff3366' };
  const pending = tasks.filter((t) => !t.done).length;

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 className="w-4 h-4 text-[#00ff88]" />
        <span className="text-xs font-mono text-[#00ff88]/60 uppercase tracking-widest">Task Manager</span>
        <span className="ml-auto text-[10px] font-mono text-white/30">{pending} pending</span>
      </div>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
          placeholder="Add new mission..."
          className="flex-1 bg-[#0a0a1a] border border-[#1a1a3a] rounded px-3 py-1.5 text-xs font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-[#00ff88]/50"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as any)}
          className="bg-[#0a0a1a] border border-[#1a1a3a] rounded px-2 py-1.5 text-[10px] font-mono text-white focus:outline-none"
        >
          <option value="low">LOW</option>
          <option value="medium">MED</option>
          <option value="high">HIGH</option>
        </select>
        <button
          onClick={addTask}
          className="px-3 py-1.5 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded text-[#00ff88] hover:bg-[#00ff88]/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        <AnimatePresence>
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-2 p-2 rounded bg-[#0a0a1a]/50 group hover:bg-[#0a0a1a] transition-colors"
            >
              <button onClick={() => toggleTask(task.id)}>
                {task.done ? (
                  <CheckCircle2 className="w-4 h-4 text-[#00ff88]" />
                ) : (
                  <Circle className="w-4 h-4 text-white/30" />
                )}
              </button>
              <span className={`flex-1 text-xs font-mono ${task.done ? 'line-through text-white/30' : 'text-white/80'}`}>
                {task.text}
              </span>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: priorityColor[task.priority] }} />
              <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="w-3 h-3 text-[#ff3366]/60 hover:text-[#ff3366]" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {tasks.length === 0 && (
          <div className="text-center py-8 text-xs font-mono text-white/20">No missions assigned</div>
        )}
      </div>
    </div>
  );
}

// ==================== NOTES WIDGET ====================
export function NotesWidget() {
  const [notes, setNotes] = useLocalStorage<Array<{ id: string; title: string; content: string; color: string }>>('stariz-notes', [
    { id: '1', title: 'System Logs', content: 'All subsystems operational. Neural link stable at 99.7% efficiency.', color: '#00f0ff' },
    { id: '2', title: 'Meeting Notes', content: 'Discuss quantum encryption upgrade with engineering team.', color: '#ff00a0' },
  ]);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');

  const colors = ['#00f0ff', '#ff00a0', '#a855f7', '#00ff88', '#ffcc00'];

  const addNote = () => {
    if (!newTitle.trim()) return;
    const id = generateId();
    setNotes([...notes, { id, title: newTitle, content: '', color: colors[Math.floor(Math.random() * colors.length)] }]);
    setNewTitle('');
    setActiveNote(id);
    toast.success('Note created');
  };

  const updateNote = (id: string, updates: Partial<{ title: string; content: string }>) => {
    setNotes(notes.map((n) => (n.id === id ? { ...n, ...updates } : n)));
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id));
    if (activeNote === id) setActiveNote(null);
    toast.info('Note deleted');
  };

  const activeNoteData = notes.find((n) => n.id === activeNote);

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <StickyNote className="w-4 h-4 text-[#ffcc00]" />
        <span className="text-xs font-mono text-[#ffcc00]/60 uppercase tracking-widest">Quick Notes</span>
      </div>

      {activeNoteData ? (
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => setActiveNote(null)} className="text-[#00f0ff]/60 hover:text-[#00f0ff]">
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
            <input
              value={activeNoteData.title}
              onChange={(e) => updateNote(activeNoteData.id, { title: e.target.value })}
              className="flex-1 bg-transparent text-sm font-mono font-semibold text-white focus:outline-none"
              style={{ color: activeNoteData.color }}
            />
            <button onClick={() => deleteNote(activeNoteData.id)}>
              <Trash2 className="w-3.5 h-3.5 text-[#ff3366]/60 hover:text-[#ff3366]" />
            </button>
          </div>
          <textarea
            value={activeNoteData.content}
            onChange={(e) => updateNote(activeNoteData.id, { content: e.target.value })}
            placeholder="Type your notes here..."
            className="flex-1 bg-[#0a0a1a] border border-[#1a1a3a] rounded p-3 text-xs font-mono text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#ffcc00]/30 resize-none"
          />
        </div>
      ) : (
        <>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addNote()}
              placeholder="New note title..."
              className="flex-1 bg-[#0a0a1a] border border-[#1a1a3a] rounded px-3 py-1.5 text-xs font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-[#ffcc00]/50"
            />
            <button onClick={addNote} className="px-3 py-1.5 bg-[#ffcc00]/10 border border-[#ffcc00]/30 rounded text-[#ffcc00] hover:bg-[#ffcc00]/20">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {notes.map((note) => (
              <motion.button
                key={note.id}
                onClick={() => setActiveNote(note.id)}
                whileHover={{ scale: 1.02 }}
                className="w-full text-left p-3 rounded bg-[#0a0a1a]/50 border border-[#1a1a3a] hover:border-[#1a1a3a] transition-all group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: note.color }} />
                  <span className="text-xs font-mono font-semibold text-white/80 truncate">{note.title}</span>
                </div>
                <p className="text-[10px] font-mono text-white/40 mt-1 truncate">{note.content || 'No content...'}</p>
              </motion.button>
            ))}
            {notes.length === 0 && (
              <div className="text-center py-8 text-xs font-mono text-white/20">No notes yet</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ==================== SYSTEM MONITOR WIDGET ====================
export function SystemMonitorWidget() {
  const [stats, setStats] = useState({ cpu: 15, ram: 42, disk: 68, net: 23 });
  const [history, setHistory] = useState<number[]>(Array(20).fill(15));

  useEffect(() => {
    const interval = setInterval(() => {
      const newCpu = Math.floor(Math.random() * 40) + 10;
      setStats((prev) => ({
        cpu: newCpu,
        ram: Math.min(100, Math.max(20, prev.ram + (Math.random() - 0.5) * 4)),
        disk: 68,
        net: Math.floor(Math.random() * 80),
      }));
      setHistory((prev) => [...prev.slice(1), newCpu]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const maxH = 60;

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
        <span className="text-xs font-mono text-[#00f0ff]/60 uppercase tracking-widest">System Monitor</span>
      </div>

      <div className="flex items-end gap-1 h-16 mb-3">
        {history.map((v, i) => (
          <div
            key={i}
            className="flex-1 rounded-t"
            style={{
              height: `${(v / 100) * maxH}px`,
              backgroundColor: v > 70 ? '#ff3366' : v > 40 ? '#ffcc00' : '#00f0ff',
              opacity: 0.3 + (i / history.length) * 0.7,
            }}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'CPU', value: stats.cpu, color: '#00f0ff' },
          { label: 'RAM', value: Math.round(stats.ram), color: '#a855f7' },
          { label: 'DISK', value: stats.disk, color: '#00ff88' },
          { label: 'NET', value: stats.net, color: '#ff00a0' },
        ].map((s) => (
          <div key={s.label} className="bg-[#0a0a1a]/50 rounded p-2">
            <div className="flex justify-between text-[10px] font-mono mb-1">
              <span style={{ color: s.color }}>{s.label}</span>
              <span className="text-white/60">{s.value}%</span>
            </div>
            <div className="h-1.5 bg-[#1a1a3a] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: s.color }}
                animate={{ width: `${s.value}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
