import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Music, Play, Pause, SkipForward,
  SkipBack, Volume2, Mic, Radio, Newspaper, Trash2
} from 'lucide-react';
import { generateId, mockNews } from '../../utils/helpers';
import { useLocalStorage } from '../../hooks/useLocalStorage';

// ==================== CALENDAR WIDGET ====================
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

// ==================== MUSIC PLAYER WIDGET ====================
export function MusicPlayerWidget() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(70);

  const tracks = useMemo(() => [
    { title: 'Neon Dreams', artist: 'Cyberwave', duration: 245 },
    { title: 'Digital Rain', artist: 'SynthMaster', duration: 198 },
    { title: 'Quantum Echo', artist: 'Neural Net', duration: 312 },
    { title: 'Midnight Protocol', artist: 'ByteRunner', duration: 276 },
  ], []);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= tracks[currentTrack].duration) {
          setCurrentTrack((t) => (t + 1) % tracks.length);
          return 0;
        }
        return p + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack, tracks]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Music className="w-4 h-4 text-[#ff00a0]" />
        <span className="text-xs font-mono text-[#ff00a0]/60 uppercase tracking-widest">Music Player</span>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-lg bg-[#ff00a0]/10 border border-[#ff00a0]/20 flex items-center justify-center">
          <Music className="w-6 h-6 text-[#ff00a0]/50" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-mono font-semibold text-white truncate">{tracks[currentTrack].title}</div>
          <div className="text-xs font-mono text-[#ff00a0]/60">{tracks[currentTrack].artist}</div>
        </div>
      </div>

      <div className="mb-3">
        <div className="h-1 bg-[#1a1a3a] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#ff00a0]"
            style={{ width: `${(progress / tracks[currentTrack].duration) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-white/30 mt-1">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(tracks[currentTrack].duration)}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mb-3">
        <button onClick={() => { setCurrentTrack((t) => (t - 1 + tracks.length) % tracks.length); setProgress(0); }}>
          <SkipBack className="w-4 h-4 text-white/50 hover:text-[#ff00a0]" />
        </button>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-10 h-10 rounded-full bg-[#ff00a0]/20 border border-[#ff00a0]/40 flex items-center justify-center hover:bg-[#ff00a0]/30 transition-colors"
        >
          {isPlaying ? <Pause className="w-4 h-4 text-[#ff00a0]" /> : <Play className="w-4 h-4 text-[#ff00a0] ml-0.5" />}
        </button>
        <button onClick={() => { setCurrentTrack((t) => (t + 1) % tracks.length); setProgress(0); }}>
          <SkipForward className="w-4 h-4 text-white/50 hover:text-[#ff00a0]" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <Volume2 className="w-3 h-3 text-white/30" />
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="flex-1 h-1 bg-[#1a1a3a] rounded-full appearance-none cursor-pointer"
          style={{ accentColor: '#ff00a0' }}
        />
        <span className="text-[10px] font-mono text-white/30 w-6">{volume}</span>
      </div>
    </div>
  );
}

// ==================== VOICE ASSISTANT WIDGET ====================
export function VoiceAssistantWidget() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [responses, setResponses] = useState<Array<{ type: 'user' | 'ai'; text: string }>>([
    { type: 'ai', text: 'Greetings, Commander. STARIZ is online and ready for your commands.' },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [responses]);

  const simulateResponse = (input: string) => {
    const lower = input.toLowerCase();
    let response = '';
    if (lower.includes('time')) response = `The current time is ${new Date().toLocaleTimeString()}.`;
    else if (lower.includes('date')) response = `Today is ${new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}.`;
    else if (lower.includes('weather')) response = 'I can check the weather for you. Which city would you like to know about?';
    else if (lower.includes('hello') || lower.includes('hi')) response = 'Hello, Commander. How may I assist you today?';
    else if (lower.includes('status')) response = 'All systems are operating at optimal levels. Neural link is stable.';
    else if (lower.includes('joke')) response = 'Why did the quantum computer go to therapy? It had too many entangled issues.';
    else if (lower.includes('help')) response = 'Available commands: time, date, weather, status, joke, clear. You can also ask me anything.';
    else if (lower.includes('clear')) {
      setResponses([]);
      return;
    }
    else response = `I understand: "${input}". I'm processing your request through the neural network...`;

    setTimeout(() => {
      setResponses((prev) => [...prev, { type: 'ai', text: response }]);
    }, 800);
  };

  const handleSubmit = () => {
    if (!transcript.trim()) return;
    setResponses((prev) => [...prev, { type: 'user', text: transcript }]);
    simulateResponse(transcript);
    setTranscript('');
  };

  const toggleListening = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setTimeout(() => {
        setIsListening(false);
        setTranscript('What is the current system status?');
      }, 2000);
    }
  };

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Mic className="w-4 h-4 text-[#00f0ff]" />
        <span className="text-xs font-mono text-[#00f0ff]/60 uppercase tracking-widest">STARIZ Voice</span>
        <div className="ml-auto flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-[#00f0ff] animate-pulse' : 'bg-[#00f0ff]/30'}`} />
          <span className="text-[10px] font-mono text-white/30">{isListening ? 'LISTENING' : 'IDLE'}</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1 min-h-0">
        {responses.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-3 py-2 rounded-lg text-xs font-mono ${
                msg.type === 'user'
                  ? 'bg-[#00f0ff]/10 border border-[#00f0ff]/20 text-[#00f0ff]'
                  : 'bg-[#0a0a1a] border border-[#1a1a3a] text-white/70'
              }`}
            >
              {msg.text}
            </div>
          </motion.div>
        ))}
      </div>

      {isListening && (
        <div className="flex items-center justify-center gap-1 h-8 mb-2">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 bg-[#00f0ff] rounded-full"
              animate={{ height: [4, 20 + Math.random() * 12, 4] }}
              transition={{ repeat: Infinity, duration: 0.5 + Math.random() * 0.5, delay: i * 0.05 }}
            />
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={toggleListening}
          className={`p-2 rounded-lg border transition-all ${
            isListening
              ? 'bg-[#00f0ff]/20 border-[#00f0ff] text-[#00f0ff]'
              : 'bg-[#0a0a1a] border-[#1a1a3a] text-white/40 hover:text-[#00f0ff]'
          }`}
        >
          <Mic className="w-4 h-4" />
        </button>
        <input
          type="text"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Type a command..."
          className="flex-1 bg-[#0a0a1a] border border-[#1a1a3a] rounded-lg px-3 py-2 text-xs font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-[#00f0ff]/50"
        />
        <button
          onClick={handleSubmit}
          className="px-3 py-2 bg-[#00f0ff]/10 border border-[#00f0ff]/30 rounded-lg text-[#00f0ff] text-xs font-mono hover:bg-[#00f0ff]/20"
        >
          SEND
        </button>
      </div>
    </div>
  );
}

// ==================== NEWS WIDGET ====================
export function NewsWidget() {
  const [news] = useState(mockNews);
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Newspaper className="w-4 h-4 text-[#ffcc00]" />
        <span className="text-xs font-mono text-[#ffcc00]/60 uppercase tracking-widest">News Feed</span>
        <div className="ml-auto flex items-center gap-1">
          <Radio className="w-3 h-3 text-[#ffcc00]/40 animate-pulse" />
          <span className="text-[10px] font-mono text-[#ffcc00]/40">LIVE</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {news.map((item) => (
          <motion.button
            key={item.id}
            onClick={() => setExpanded(expanded === item.id ? null : item.id)}
            whileHover={{ scale: 1.01 }}
            className="w-full text-left p-2.5 rounded bg-[#0a0a1a]/50 border border-[#1a1a3a] hover:border-[#ffcc00]/20 transition-all"
          >
            <div className="flex items-start gap-2">
              <div className="w-1 h-full min-h-[20px] rounded-full bg-[#ffcc00]/30 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-mono text-white/80 leading-tight">{item.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-mono text-[#ffcc00]/50">{item.source}</span>
                  <span className="text-[10px] font-mono text-white/30">{item.time}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#ffcc00]/10 text-[#ffcc00]/60">{item.category}</span>
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ==================== CALCULATOR WIDGET ====================
export function CalculatorWidget() {
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState('');
  const [op, setOp] = useState('');
  const [newNum, setNewNum] = useState(true);

  const handleNum = (n: string) => {
    if (newNum) {
      setDisplay(n);
      setNewNum(false);
    } else {
      setDisplay(display === '0' ? n : display + n);
    }
  };

  const handleOp = (o: string) => {
    setPrev(display);
    setOp(o);
    setNewNum(true);
  };

  const calculate = () => {
    const a = parseFloat(prev);
    const b = parseFloat(display);
    let res = 0;
    switch (op) {
      case '+': res = a + b; break;
      case '-': res = a - b; break;
      case '*': res = a * b; break;
      case '/': res = b !== 0 ? a / b : 0; break;
    }
    setDisplay(String(Math.round(res * 1000000) / 1000000));
    setOp('');
    setNewNum(true);
  };

  const clear = () => {
    setDisplay('0');
    setPrev('');
    setOp('');
    setNewNum(true);
  };

  const buttons = [
    ['C', '÷', '×', '⌫'],
    ['7', '8', '9', '-'],
    ['4', '5', '6', '+'],
    ['1', '2', '3', '='],
    ['0', '.', '%', '='],
  ];

  const getBtnClass = (btn: string) => {
    if (['C', '⌫'].includes(btn)) return 'bg-[#ff3366]/10 text-[#ff3366] border-[#ff3366]/30 hover:bg-[#ff3366]/20';
    if (['÷', '×', '-', '+', '=', '%'].includes(btn)) return 'bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]/30 hover:bg-[#00f0ff]/20';
    return 'bg-[#0a0a1a] text-white/80 border-[#1a1a3a] hover:bg-[#1a1a3a]';
  };

  const handleBtn = (btn: string) => {
    if (btn >= '0' && btn <= '9') handleNum(btn);
    else if (btn === '.') handleNum('.');
    else if (btn === 'C') clear();
    else if (btn === '⌫') setDisplay(display.length > 1 ? display.slice(0, -1) : '0');
    else if (btn === '÷') handleOp('/');
    else if (btn === '×') handleOp('*');
    else if (['+', '-'].includes(btn)) handleOp(btn);
    else if (btn === '%') setDisplay(String(parseFloat(display) / 100));
    else if (btn === '=') calculate();
  };

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-4 h-4 rounded border border-[#00f0ff]/40 flex items-center justify-center">
          <span className="text-[#00f0ff] text-[10px] font-mono">=</span>
        </div>
        <span className="text-xs font-mono text-[#00f0ff]/60 uppercase tracking-widest">Calculator</span>
      </div>

      <div className="bg-[#0a0a1a] border border-[#1a1a3a] rounded-lg p-3 mb-3 text-right">
        <div className="text-[10px] font-mono text-white/30 h-4">{prev} {op}</div>
        <div className="text-xl font-mono font-bold text-[#00f0ff] truncate">{display}</div>
      </div>

      <div className="grid grid-cols-4 gap-1.5 flex-1">
        {buttons.flat().map((btn, i) => (
          <button
            key={`${btn}-${i}`}
            onClick={() => handleBtn(btn)}
            className={`rounded border text-sm font-mono font-semibold transition-all active:scale-95 ${getBtnClass(btn)} ${
              btn === '0' ? 'col-span-1' : ''
            }`}
          >
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
}
