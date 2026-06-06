import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Music, Play, Pause, SkipForward, SkipBack, Volume2 } from 'lucide-react';

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
