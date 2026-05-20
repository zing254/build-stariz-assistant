import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Mic, Square, Play, Pause, Trash2, Save,
  Search, ChevronDown, AudioWaveform, Sparkles, Plus
} from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { generateId } from '../../utils/helpers';
import { toast } from '../Toast';

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  audioUrl?: string;
  audioDuration?: number;
  mood: string;
  tags: string[];
  createdAt: number;
  type: 'text' | 'voice' | 'mixed';
}

const MOODS = [
  { emoji: '😊', label: 'Happy', color: '#00ff88' },
  { emoji: '😔', label: 'Sad', color: '#00f0ff' },
  { emoji: '😤', label: 'Angry', color: '#ff3366' },
  { emoji: '😰', label: 'Anxious', color: '#ffcc00' },
  { emoji: '🤔', label: 'Thoughtful', color: '#a855f7' },
  { emoji: '⚡', label: 'Energetic', color: '#ff00a0' },
  { emoji: '😌', label: 'Calm', color: '#00f0ff' },
  { emoji: '🎯', label: 'Focused', color: '#ffcc00' },
];

export default function JournalWidget() {
  const [entries, setEntries] = useLocalStorage<JournalEntry[]>('stariz-journal', []);
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('Thoughtful');
  const [tags, setTags] = useState('');
  const [search, setSearch] = useState('');
  const [filterMood, setFilterMood] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';
      rec.onresult = (event: any) => {
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) final += event.results[i][0].transcript;
        }
        if (final) setContent((prev) => prev + ' ' + final);
      };
      rec.onerror = () => { };
      recognitionRef.current = rec;
    }
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      if (recognitionRef.current) {
        try { recognitionRef.current.start(); setIsTranscribing(true); } catch { }
      }

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); setIsTranscribing(false); } catch { }
    }
  };

  const saveEntry = () => {
    if (!title.trim() && !content.trim() && !audioUrl) {
      toast.error('Journal entry is empty');
      return;
    }
    const entry: JournalEntry = {
      id: activeEntry?.id || generateId(),
      title: title.trim() || 'Untitled Entry',
      content: content.trim(),
      audioUrl: audioUrl || activeEntry?.audioUrl,
      audioDuration: audioUrl ? recordingTime : activeEntry?.audioDuration,
      mood,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      createdAt: activeEntry?.createdAt || Date.now(),
      type: audioUrl && content.trim() ? 'mixed' : audioUrl ? 'voice' : 'text',
    };

    if (activeEntry) {
      setEntries(entries.map((e) => (e.id === activeEntry.id ? entry : e)));
      toast.success('Entry updated');
    } else {
      setEntries([entry, ...entries]);
      toast.success('Entry saved');
    }

    resetForm();
    setView('list');
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setMood('Thoughtful');
    setTags('');
    setAudioUrl('');
    setRecordingTime(0);
    setActiveEntry(null);
  };

  const deleteEntry = (id: string) => {
    const entry = entries.find((e) => e.id === id);
    if (entry?.audioUrl) URL.revokeObjectURL(entry.audioUrl);
    setEntries(entries.filter((e) => e.id !== id));
    toast.info('Entry deleted');
    if (activeEntry?.id === id) { setActiveEntry(null); setView('list'); }
  };

  const editEntry = (entry: JournalEntry) => {
    setActiveEntry(entry);
    setTitle(entry.title);
    setContent(entry.content);
    setMood(entry.mood);
    setTags(entry.tags.join(', '));
    setAudioUrl(entry.audioUrl || '');
    setView('edit');
  };

  const playEntryAudio = (url: string) => {
    if (playingAudio === url) {
      audioPlayerRef.current?.pause();
      setPlayingAudio(null);
      return;
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.src = url;
      audioPlayerRef.current.play().catch(() => { });
      setPlayingAudio(url);
      audioPlayerRef.current.onended = () => setPlayingAudio(null);
    }
  };

  const filteredEntries = entries.filter((e) => {
    const matchesSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.content.toLowerCase().includes(search.toLowerCase());
    const matchesMood = !filterMood || e.mood === filterMood;
    return matchesSearch && matchesMood;
  });

  const formatDate = (ts: number) => new Date(ts).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full flex flex-col">
      <audio ref={audioPlayerRef} className="hidden" />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#a855f7]" />
          <span className="text-xs font-mono text-[#a855f7]/60 uppercase tracking-widest">Voice Journal</span>
          <span className="text-[10px] font-mono text-white/30">{entries.length} entries</span>
        </div>
        {view === 'list' && (
          <button onClick={() => { resetForm(); setView('edit'); }} className="px-2.5 py-1 rounded border border-[#a855f7]/30 bg-[#a855f7]/10 text-[#a855f7] text-[10px] font-mono hover:bg-[#a855f7]/20">
            <Plus className="w-3 h-3 inline mr-1" />NEW
          </button>
        )}
      </div>

      {view === 'list' && (
        <>
          <div className="flex gap-2 mb-3">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search entries..." className="w-full bg-[#0a0a1a] border border-[#1a1a3a] rounded pl-7 pr-2 py-1.5 text-xs font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-[#a855f7]/30" />
            </div>
            <select value={filterMood} onChange={(e) => setFilterMood(e.target.value)} className="bg-[#0a0a1a] border border-[#1a1a3a] rounded px-2 py-1.5 text-[10px] font-mono text-white focus:outline-none">
              <option value="">All Moods</option>
              {MOODS.map((m) => <option key={m.label} value={m.label}>{m.emoji} {m.label}</option>)}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredEntries.map((entry) => {
              const entryMood = MOODS.find((m) => m.label === entry.mood) || MOODS[4];
              return (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 rounded-lg bg-[#0a0a1a]/50 border border-[#1a1a3a] hover:border-[#a855f7]/20 transition-all group cursor-pointer"
                  onClick={() => editEntry(entry)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{entryMood.emoji}</span>
                        <span className="text-xs font-mono font-semibold text-white/80 truncate">{entry.title}</span>
                      </div>
                      <p className="text-[10px] font-mono text-white/40 mt-1 line-clamp-2">{entry.content || 'No text content'}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[9px] font-mono text-white/20">{formatDate(entry.createdAt)} {formatTime(entry.createdAt)}</span>
                        {entry.type === 'voice' && <AudioWaveform className="w-3 h-3 text-[#ff00a0]" />}
                        {entry.type === 'mixed' && <span className="text-[9px] font-mono text-[#ff00a0]">mixed</span>}
                        {entry.tags.map((t) => (
                          <span key={t} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#a855f7]/10 text-[#a855f7]/60">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      {entry.audioUrl && (
                        <button
                          onClick={(e) => { e.stopPropagation(); playEntryAudio(entry.audioUrl!); }}
                          className="p-1.5 rounded bg-[#0a0a1a] text-white/30 hover:text-[#ff00a0]"
                        >
                          {playingAudio === entry.audioUrl ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id); }} className="p-1.5 rounded opacity-0 group-hover:opacity-100 text-white/20 hover:text-[#ff3366]">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {filteredEntries.length === 0 && (
              <div className="text-center py-10">
                <BookOpen className="w-8 h-8 text-white/10 mx-auto mb-2" />
                <p className="text-xs font-mono text-white/20">No journal entries yet</p>
                <p className="text-[10px] font-mono text-white/15 mt-1">Click NEW to create one</p>
              </div>
            )}
          </div>
        </>
      )}

      {view === 'edit' && (
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="flex items-center gap-2 mb-3">
            <button onClick={() => { resetForm(); setView('list'); }} className="text-white/30 hover:text-white">
              <ChevronDown className="w-4 h-4 rotate-90" />
            </button>
            <span className="text-xs font-mono text-white/50">{activeEntry ? 'Edit Entry' : 'New Entry'}</span>
          </div>

          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Entry title..." className="w-full bg-[#0a0a1a] border border-[#1a1a3a] rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-[#a855f7]/30 mb-3" />

          <div className="mb-3">
            <span className="text-[10px] font-mono text-white/40 mb-1.5 block">How are you feeling?</span>
            <div className="flex flex-wrap gap-1.5">
              {MOODS.map((m) => (
                <button
                  key={m.label}
                  onClick={() => setMood(m.label)}
                  className={`flex items-center gap-1 px-2 py-1 rounded border text-[10px] font-mono transition-all ${
                    mood === m.label
                      ? 'border-[#a855f7]/40 bg-[#a855f7]/10 text-[#a855f7]'
                      : 'border-[#1a1a3a] text-white/40 hover:text-white/60'
                  }`}
                >
                  <span>{m.emoji}</span>
                  <span className="hidden sm:inline">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-mono text-white/40">Voice Recording</span>
              {isRecording && (
                <span className="flex items-center gap-1 text-[10px] font-mono text-[#ff3366]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff3366] animate-pulse" />
                  REC {formatDuration(recordingTime)}
                </span>
              )}
              {isTranscribing && !isRecording && (
                <span className="flex items-center gap-1 text-[10px] font-mono text-[#00ff88]">
                  <Sparkles className="w-3 h-3 animate-spin" />
                  Transcribing...
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#ff3366]/30 bg-[#ff3366]/5 text-[#ff3366] text-xs font-mono hover:bg-[#ff3366]/10 transition-colors"
                >
                  <Mic className="w-4 h-4" />
                  RECORD
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#ff3366] bg-[#ff3366]/20 text-[#ff3366] text-xs font-mono animate-pulse"
                >
                  <Square className="w-4 h-4" />
                  STOP
                </button>
              )}
              {audioUrl && (
                <button onClick={() => playEntryAudio(audioUrl)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#00f0ff]/20 text-[#00f0ff] text-xs font-mono hover:bg-[#00f0ff]/10">
                  {playingAudio === audioUrl ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  Preview
                </button>
              )}
              {audioUrl && (
                <button onClick={() => { setAudioUrl(''); setRecordingTime(0); }} className="px-3 py-2 rounded-lg border border-[#1a1a3a] text-white/30 hover:text-[#ff3366] text-xs font-mono">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            {audioUrl && (
              <div className="mt-2 text-[10px] font-mono text-[#00ff88]">
                🎙️ Recording saved ({formatDuration(recordingTime)})
              </div>
            )}
          </div>

          <div className="flex-1 min-h-0 mb-3">
            <span className="text-[10px] font-mono text-white/40 mb-1.5 block">Journal Content</span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your thoughts here, or speak and I'll transcribe..."
              className="w-full h-full min-h-[100px] bg-[#0a0a1a] border border-[#1a1a3a] rounded-lg p-3 text-xs font-mono text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#a855f7]/30 resize-none"
            />
          </div>

          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags: work, ideas, dreams..." className="w-full bg-[#0a0a1a] border border-[#1a1a3a] rounded-lg px-3 py-2 text-xs font-mono text-white placeholder:text-white/20 focus:outline-none mb-3" />

          <div className="flex gap-2">
            <button onClick={saveEntry} className="flex-1 py-2.5 rounded-lg border border-[#a855f7]/30 bg-[#a855f7]/10 text-[#a855f7] text-xs font-mono font-semibold hover:bg-[#a855f7]/20 transition-colors">
              <Save className="w-3.5 h-3.5 inline mr-1" />
              SAVE ENTRY
            </button>
            <button onClick={() => { resetForm(); setView('list'); }} className="px-4 py-2.5 rounded-lg border border-[#1a1a3a] text-white/40 text-xs font-mono hover:text-white/70">
              CANCEL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
