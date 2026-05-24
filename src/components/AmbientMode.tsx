import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, X } from 'lucide-react';
import { VoiceVisualizer } from './VoiceVisualizer';
import { useOfflineVoice } from '../hooks/useOfflineVoice';

const BACKEND_URL = import.meta.env.VITE_PYTHON_BACKEND_URL || 'http://localhost:8000';

interface AmbientModeProps {
  onClose: () => void;
}

export function AmbientMode({ onClose }: AmbientModeProps) {
  const {
    isListening,
    isSpeaking,
    transcription,
    partialTranscription,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  } = useOfflineVoice(BACKEND_URL);

  const [response, setResponse] = useState('');
  const [commandHistory, setCommandHistory] = useState<{ user: string; assistant: string }[]>([]);

  const processCommand = useCallback(async (command: string) => {
    const lower = command.toLowerCase().trim();
    let responseText = '';

    if (lower.includes('time') || lower.includes('what time')) {
      responseText = `The current time is ${new Date().toLocaleTimeString()}`;
    } else if (lower.includes('date') || lower.includes('today')) {
      responseText = `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
    } else if (lower.includes('hello') || lower.includes('hey') || lower.includes('hi')) {
      responseText = 'Hello! How can I assist you today?';
    } else if (lower.includes('status') || lower.includes('system')) {
      responseText = 'All systems operational. Neural link stable.';
    } else if (lower.includes('clear')) {
      setCommandHistory([]);
      responseText = 'Conversation cleared.';
    } else {
      // Send to backend AI
      try {
        const res = await fetch(`${BACKEND_URL}/api/rag/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: command, top_k: 3 }),
        });
        const data = await res.json();
        if (data.results?.length > 0) {
          responseText = `I found relevant information in my knowledge base. ${data.results[0].content.slice(0, 200)}...`;
        } else {
          responseText = `I heard: "${command}". I'm processing your request.`;
        }
      } catch {
        responseText = `I heard: "${command}". How can I help?`;
      }
    }

    setResponse(responseText);
    setCommandHistory(prev => [...prev.slice(-9), { user: command, assistant: responseText }]);
    speak(responseText);
  }, [speak, setResponse, setCommandHistory]);

  useEffect(() => {
    startListening();
    return () => stopListening();
  }, [startListening, stopListening]);

  useEffect(() => {
    if (transcription && !partialTranscription) {
      processCommand(transcription);
    }
  }, [transcription, partialTranscription, processCommand]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-white/20'}`} />
          <span className="text-sm font-mono text-white/80">
            {isListening ? 'LISTENING' : 'IDLE'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-white/10 transition-all"
        >
          <X className="w-5 h-5 text-white/60" />
        </button>
      </div>

      {/* Voice Visualizer */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-64 h-64">
          <VoiceVisualizer isActive={isListening || isSpeaking} mode="circle" color={isSpeaking ? '#a855f7' : '#00f0ff'} />
        </div>
      </div>

      {/* Transcription */}
      <div className="px-8 py-4 text-center">
        <AnimatePresence mode="wait">
          {partialTranscription && (
            <motion.p
              key="partial"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-lg font-mono text-white/50"
            >
              {partialTranscription}
            </motion.p>
          )}
          {transcription && !partialTranscription && (
            <motion.p
              key="final"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-xl font-mono text-white"
            >
              "{transcription}"
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Response */}
      {response && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-8 pb-4 text-center"
        >
          <p className="text-sm font-mono text-[#00f0ff]">{response}</p>
        </motion.div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 p-4 border-t border-white/10">
        <button
          onClick={isListening ? stopListening : startListening}
          className={`p-4 rounded-full transition-all ${
            isListening
              ? 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30'
              : 'bg-[#00f0ff]/20 border border-[#00f0ff]/30 text-[#00f0ff] hover:bg-[#00f0ff]/30'
          }`}
        >
          {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>
        <button
          onClick={isSpeaking ? stopSpeaking : () => speak(response || 'Hello')}
          className={`p-4 rounded-full transition-all ${
            isSpeaking
              ? 'bg-[#a855f7]/20 border border-[#a855f7]/30 text-[#a855f7] hover:bg-[#a855f7]/30'
              : 'bg-white/10 border border-white/20 text-white/60 hover:bg-white/20'
          }`}
        >
          {isSpeaking ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
        </button>
      </div>

      {/* Command History */}
      {commandHistory.length > 0 && (
        <div className="px-8 pb-4 max-h-32 overflow-y-auto space-y-1">
          {commandHistory.map((item, i) => (
            <div key={i} className="text-[10px] font-mono">
              <span className="text-white/30">You: </span>
              <span className="text-white/60">{item.user}</span>
              <span className="text-[#00f0ff]/30 ml-2">STARIZ: </span>
              <span className="text-[#00f0ff]/60">{item.assistant}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
