import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Music, Play, Pause, SkipForward, SkipBack, Volume2, Upload,
  Link, Trash2, ListMusic, Plus
} from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { toast } from '../Toast';

interface Track {
  id: string;
  title: string;
  artist: string;
  src: string;
  type: 'local' | 'stream';
  duration?: number;
}

export default function MusicPlayerWidget() {
  const [tracks, setTracks] = useLocalStorage<Track[]>('stariz-music-tracks', [
    { id: 'd1', title: 'Neon Dreams', artist: 'Cyberwave', src: '', type: 'stream', duration: 245 },
    { id: 'd2', title: 'Digital Rain', artist: 'SynthMaster', src: '', type: 'stream', duration: 198 },
    { id: 'd3', title: 'Quantum Echo', artist: 'Neural Net', src: '', type: 'stream', duration: 312 },
  ]);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(70);
  const [showAdd, setShowAdd] = useState(false);
  const [streamUrl, setStreamUrl] = useState('');
  const [streamTitle, setStreamTitle] = useState('');
  const [streamArtist, setStreamArtist] = useState('');
  const [showPlaylist, setShowPlaylist] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate synthetic audio for demo tracks (oscillator-based beep melody)
  const getAudioSrc = (track: Track) => {
    if (track.type === 'local' || track.src) return track.src;
    // For demo tracks without real audio, we return empty - the visual player still works
    return '';
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      const track = tracks[currentTrack];
      if (track.duration) {
        setProgress(audio.currentTime);
      }
    };
    const onEnded = () => {
      setCurrentTrack((t) => (t + 1) % tracks.length);
      setProgress(0);
    };
    const onError = () => {
      // Silently handle audio errors for demo tracks
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [currentTrack, tracks]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      const src = getAudioSrc(tracks[currentTrack]);
      if (src) {
        audioRef.current.src = src;
        if (isPlaying) audioRef.current.play().catch(() => {});
      }
    }
  }, [currentTrack]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const src = getAudioSrc(tracks[currentTrack]);
    if (!src) { toast.info('This is a demo track. Upload or add a stream to play audio.'); return; }
    if (isPlaying) { audio.pause(); } else { audio.play().catch(() => {}); }
    setIsPlaying(!isPlaying);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      const newTrack: Track = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Local File',
        src: url,
        type: 'local',
        duration: 0,
      };
      // Get duration
      const tempAudio = new Audio(url);
      tempAudio.onloadedmetadata = () => {
        newTrack.duration = tempAudio.duration;
        setTracks((prev) => [...prev, newTrack]);
      };
      tempAudio.onerror = () => {
        setTracks((prev) => [...prev, newTrack]);
      };
    });
    toast.success(`${files.length} track${files.length > 1 ? 's' : ''} added`);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addStream = () => {
    if (!streamUrl.trim()) { toast.error('Stream URL is required'); return; }
    const newTrack: Track = {
      id: Date.now().toString(),
      title: streamTitle.trim() || 'Stream',
      artist: streamArtist.trim() || 'Unknown',
      src: streamUrl.trim(),
      type: 'stream',
    };
    setTracks([...tracks, newTrack]);
    setStreamUrl('');
    setStreamTitle('');
    setStreamArtist('');
    setShowAdd(false);
    toast.success('Stream added');
  };

  const removeTrack = (id: string) => {
    const track = tracks.find((t) => t.id === id);
    if (track?.type === 'local' && track.src) URL.revokeObjectURL(track.src);
    setTracks(tracks.filter((t) => t.id !== id));
    toast.info('Track removed');
  };

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  };

  const track = tracks[currentTrack];
  const maxDuration = track?.duration || 1;

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full flex flex-col">
      <audio ref={audioRef} className="hidden" />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-[#ff00a0]" />
          <span className="text-xs font-mono text-[#ff00a0]/60 uppercase tracking-widest">Music Player</span>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setShowPlaylist(!showPlaylist)} className="p-1 text-white/30 hover:text-[#ff00a0]">
            <ListMusic className="w-4 h-4" />
          </button>
          <button onClick={() => setShowAdd(!showAdd)} className="p-1 text-white/30 hover:text-[#ff00a0]">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Add Track Panel */}
      {showAdd && (
        <div className="mb-3 p-3 rounded-lg bg-[#0a0a1a] border border-[#1a1a3a] space-y-2">
          <div className="flex gap-2">
            <label className="flex-1 flex items-center justify-center gap-2 py-2 rounded border border-[#00f0ff]/20 bg-[#00f0ff]/5 text-[#00f0ff] text-[10px] font-mono cursor-pointer hover:bg-[#00f0ff]/10">
              <Upload className="w-3.5 h-3.5" />
              UPLOAD FILES
              <input ref={fileInputRef} type="file" accept="audio/*" multiple onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
          <div className="text-[10px] font-mono text-white/20 text-center">or</div>
          <div className="space-y-1.5">
            <input value={streamUrl} onChange={(e) => setStreamUrl(e.target.value)} placeholder="Stream URL (MP3, radio, etc.)" className="w-full bg-[#0f0f2a] border border-[#1a1a3a] rounded px-2 py-1.5 text-[10px] font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-[#ff00a0]/30" />
            <div className="flex gap-2">
              <input value={streamTitle} onChange={(e) => setStreamTitle(e.target.value)} placeholder="Title" className="flex-1 bg-[#0f0f2a] border border-[#1a1a3a] rounded px-2 py-1.5 text-[10px] font-mono text-white placeholder:text-white/20 focus:outline-none" />
              <input value={streamArtist} onChange={(e) => setStreamArtist(e.target.value)} placeholder="Artist" className="flex-1 bg-[#0f0f2a] border border-[#1a1a3a] rounded px-2 py-1.5 text-[10px] font-mono text-white placeholder:text-white/20 focus:outline-none" />
            </div>
            <button onClick={addStream} className="w-full py-1.5 rounded border border-[#ff00a0]/20 bg-[#ff00a0]/5 text-[#ff00a0] text-[10px] font-mono hover:bg-[#ff00a0]/10">
              <Link className="w-3 h-3 inline mr-1" /> ADD STREAM
            </button>
          </div>
        </div>
      )}

      {/* Now Playing */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-lg bg-[#ff00a0]/10 border border-[#ff00a0]/20 flex items-center justify-center">
          <Music className="w-6 h-6 text-[#ff00a0]/50" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-mono font-semibold text-white truncate">{track?.title || 'No Track'}</div>
          <div className="text-xs font-mono text-[#ff00a0]/60">{track?.artist || 'Unknown'}</div>
          <div className="text-[9px] font-mono text-white/20 mt-0.5">{track?.type === 'local' ? 'Local File' : track?.type === 'stream' ? 'Stream' : 'Demo'}</div>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="h-1 bg-[#1a1a3a] rounded-full overflow-hidden cursor-pointer" onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = (e.clientX - rect.left) / rect.width;
          if (audioRef.current && track?.src) {
            audioRef.current.currentTime = pct * maxDuration;
            setProgress(pct * maxDuration);
          }
        }}>
          <motion.div className="h-full bg-[#ff00a0]" style={{ width: `${(progress / maxDuration) * 100}%` }} />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-white/30 mt-1">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(maxDuration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mb-3">
        <button onClick={() => { setCurrentTrack((t) => (t - 1 + tracks.length) % tracks.length); setProgress(0); }}>
          <SkipBack className="w-4 h-4 text-white/50 hover:text-[#ff00a0]" />
        </button>
        <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-[#ff00a0]/20 border border-[#ff00a0]/40 flex items-center justify-center hover:bg-[#ff00a0]/30 transition-colors">
          {isPlaying ? <Pause className="w-4 h-4 text-[#ff00a0]" /> : <Play className="w-4 h-4 text-[#ff00a0] ml-0.5" />}
        </button>
        <button onClick={() => { setCurrentTrack((t) => (t + 1) % tracks.length); setProgress(0); }}>
          <SkipForward className="w-4 h-4 text-white/50 hover:text-[#ff00a0]" />
        </button>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2 mb-3">
        <Volume2 className="w-3 h-3 text-white/30" />
        <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="flex-1 h-1" />
        <span className="text-[10px] font-mono text-white/30 w-6">{volume}</span>
      </div>

      {/* Playlist */}
      {showPlaylist && (
        <div className="flex-1 overflow-y-auto space-y-1 pr-1 min-h-0">
          {tracks.map((t, i) => (
            <div
              key={t.id}
              onClick={() => { setCurrentTrack(i); setProgress(0); }}
              className={`flex items-center gap-2 p-2 rounded cursor-pointer group ${
                i === currentTrack ? 'bg-[#ff00a0]/10 border border-[#ff00a0]/20' : 'bg-[#0a0a1a]/30 hover:bg-[#0a0a1a]'
              }`}
            >
              <span className="text-[10px] font-mono text-white/30 w-4">{i === currentTrack && isPlaying ? '▶' : i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className={`text-[11px] font-mono truncate ${i === currentTrack ? 'text-[#ff00a0]' : 'text-white/70'}`}>{t.title}</div>
                <div className="text-[9px] font-mono text-white/30">{t.artist}</div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); removeTrack(t.id); }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="w-3 h-3 text-[#ff3366]/60" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
