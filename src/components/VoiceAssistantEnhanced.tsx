import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, Volume2, VolumeX,
  Settings, Trash2, Copy,
  Bot, User, MicOff, Loader2,
} from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { copyToClipboard } from '../utils/helpers';
import { toast } from './Toast';
import soundManager from '../utils/sounds';

interface VoiceMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  audioUrl?: string;
  isVoice: boolean;
}

interface VoiceSettings {
  sttEnabled: boolean;
  ttsEnabled: boolean;
  ttsRate: number;
  ttsPitch: number;
  ttsVoice: string;
  autoSpeak: boolean;
  continuousListening: boolean;
  language: string;
}

export default function VoiceAssistantEnhanced() {
  const [messages, setMessages] = useLocalStorage<VoiceMessage[]>('stariz-voice-messages', []);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [settings, setSettings] = useLocalStorage<VoiceSettings>('stariz-voice-settings', {
    sttEnabled: true,
    ttsEnabled: true,
    ttsRate: 1.0,
    ttsPitch: 1.0,
    ttsVoice: '',
    autoSpeak: true,
    continuousListening: false,
    language: 'en-US',
  });

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize speech systems
  useEffect(() => {
    // Text-to-Speech setup
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      
      const loadVoices = () => {
        const availableVoices = synthRef.current?.getVoices() || [];
        setVoices(availableVoices);
        
        // Auto-select a good English voice if none selected
        if (!settings.ttsVoice && availableVoices.length > 0) {
          const preferred = availableVoices.find(
            v => v.lang.startsWith('en') && v.localService
          ) || availableVoices.find(v => v.lang.startsWith('en')) || availableVoices[0];
          
          if (preferred) {
            setSettings({ ...settings, ttsVoice: preferred.name });
          }
        }
      };

      loadVoices();
      synthRef.current.onvoiceschanged = loadVoices;
    }

    // Speech-to-Text setup (Web Speech API - works offline in Chrome)
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition && settings.sttEnabled) {
      const rec = new SpeechRecognition();
      rec.continuous = settings.continuousListening;
      rec.interimResults = true;
      rec.lang = settings.language;

      rec.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        if (finalTranscript) {
          setTranscript(finalTranscript);
          handleVoiceCommand(finalTranscript);
        }

        // Reset silence timer
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (isListening && settings.continuousListening) {
          silenceTimerRef.current = setTimeout(() => {
            // Auto-stop after 3 seconds of silence
            if (isListening) {
              stopListening();
            }
          }, 3000);
        }
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied');
          setIsListening(false);
        }
      };

      rec.onend = () => {
        if (settings.continuousListening && isListening) {
          // Restart if continuous mode
          try { rec.start(); } catch {}
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const speak = useCallback((text: string) => {
    if (!settings.ttsEnabled || !synthRef.current) return;

    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice
    if (settings.ttsVoice) {
      const voice = voices.find(v => v.name === settings.ttsVoice);
      if (voice) utterance.voice = voice;
    }
    
    utterance.rate = settings.ttsRate;
    utterance.pitch = settings.ttsPitch;
    utterance.lang = settings.language;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
    soundManager.voiceStart();
  }, [settings, voices]);

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      soundManager.voiceStop();
    }
  };

  const handleVoiceCommand = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: VoiceMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim(),
      timestamp: Date.now(),
      isVoice: true,
    };

    setMessages(prev => [...prev, userMsg]);
    setTranscript('');
    setProcessing(true);
    soundManager.voiceProcessing();

    // Process command locally (offline-capable)
    const response = await processVoiceCommand(text.trim());
    
    const assistantMsg: VoiceMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      text: response,
      timestamp: Date.now(),
      isVoice: true,
    };

    setMessages(prev => [...prev, assistantMsg]);
    setProcessing(false);

    // Auto-speak response
    if (settings.autoSpeak) {
      speak(response);
    }

    soundManager.messageReceived();
  };

  const processVoiceCommand = async (input: string): Promise<string> => {
    const lower = input.toLowerCase();

    // Time queries
    if (lower.includes('time')) {
      return `The current time is ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}.`;
    }

    if (lower.includes('date')) {
      return `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`;
    }

    // System queries
    if (lower.includes('system status') || lower.includes('how are you')) {
      return 'All systems are operational. Neural link is stable. CPU and memory usage are within normal parameters.';
    }

    // Widget control
    if (lower.includes('open calendar') || lower.includes('show calendar')) {
      window.dispatchEvent(new CustomEvent('stariz-navigate', { detail: 'calendar' }));
      return 'Opening calendar widget.';
    }

    if (lower.includes('open terminal') || lower.includes('show terminal')) {
      window.dispatchEvent(new CustomEvent('stariz-navigate', { detail: 'terminal' }));
      return 'Opening terminal.';
    }

    if (lower.includes('open chat') || lower.includes('open ai')) {
      window.dispatchEvent(new CustomEvent('stariz-navigate', { detail: 'chat' }));
      return 'Opening AI chat.';
    }

    // Task management
    if (lower.includes('add task') || lower.includes('create task')) {
      const taskText = input.replace(/add task|create task/i, '').trim();
      if (taskText) {
        try {
          const tasks = JSON.parse(localStorage.getItem('stariz-tasks') || '[]');
          tasks.push({ id: Date.now().toString(), text: taskText, done: false, priority: 'medium' });
          localStorage.setItem('stariz-tasks', JSON.stringify(tasks));
          return `Task added: ${taskText}`;
        } catch {}
      }
      return 'Please specify a task after "add task".';
    }

    // Notes
    if (lower.includes('new note') || lower.includes('create note')) {
      const noteText = input.replace(/new note|create note/i, '').trim();
      try {
        const notes = JSON.parse(localStorage.getItem('stariz-notes') || '[]');
        notes.push({ id: Date.now().toString(), title: noteText || 'Voice Note', content: '', color: '#00f0ff' });
        localStorage.setItem('stariz-notes', JSON.stringify(notes));
        return 'Note created.';
      } catch {}
      return 'Failed to create note.';
    }

    // Calculator
    if (lower.includes('calculate') || lower.match(/\d+\s*[\+\-\*\/]\s*\d+/)) {
      try {
        const match = input.match(/(\d+\.?\d*)\s*([\+\-\*\/])\s*(\d+\.?\d*)/);
        if (match) {
          const result = eval(match[0]);
          return `The result is ${result}.`;
        }
      } catch {}
    }

    // Weather (would need API call - simulated)
    if (lower.includes('weather')) {
      return 'The weather is currently 72 degrees and partly cloudy. Weather data requires an internet connection for real-time updates.';
    }

    // Jokes
    if (lower.includes('joke') || lower.includes('funny')) {
      const jokes = [
        'Why did the quantum computer go to therapy? It had too many entangled issues.',
        'How many programmers does it take to change a light bulb? None, that\'s a hardware problem.',
        'The future is quantum. Trust the neural network. Data never lies.',
        'Why do Java developers wear glasses? Because they can\'t C#.',
        'There are only 10 types of people: those who understand binary, and those who don\'t.',
      ];
      return jokes[Math.floor(Math.random() * jokes.length)];
    }

    // Greetings
    if (lower.includes('hello') || lower.includes('hi ') || lower.includes('hey')) {
      const hour = new Date().getHours();
      const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
      return `${greeting}, Commander. How may I assist you today?`;
    }

    // Help
    if (lower.includes('help') || lower.includes('what can you do')) {
      return 'I can help with: time and date, system status, opening widgets, managing tasks and notes, calculations, jokes, and general assistance. Try saying "What time is it?" or "Open calendar".';
    }

    // Clear/reset
    if (lower.includes('clear messages') || lower.includes('clear chat')) {
      setMessages([]);
      return 'Message history cleared.';
    }

    // Default response
    return `I heard: "${input}". I'm processing your request through the neural network. You can ask me about time, date, system status, or try commands like "open calendar" or "add task buy groceries".`;
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    try {
      recognitionRef.current.start();
      setIsListening(true);
      soundManager.voiceStart();
      toast.info('Listening...');
    } catch (e) {
      console.error('Failed to start recognition:', e);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setIsListening(false);
    soundManager.voiceStop();
  };

  const clearMessages = () => {
    setMessages([]);
    toast.info('Voice history cleared');
    soundManager.click();
  };

  const copyMessage = async (text: string) => {
    const ok = await copyToClipboard(text);
    toast[ok ? 'success' : 'error'](ok ? 'Copied!' : 'Failed');
    soundManager.click();
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-4 rounded-lg h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isListening ? 'bg-[#ff3366]/20 border border-[#ff3366]/40' : 'bg-[#00f0ff]/10 border border-[#00f0ff]/30'
          }`}>
            {isListening ? (
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                <Mic className="w-4 h-4 text-[#ff3366]" />
              </motion.div>
            ) : (
              <Bot className="w-4 h-4 text-[#00f0ff]" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-display font-bold text-white">STARIZ Voice</h3>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${
                isListening ? 'bg-[#ff3366] animate-pulse' : isSpeaking ? 'bg-[#00ff88] animate-pulse' : 'bg-[#00f0ff]'
              }`} />
              <span className="text-[10px] font-mono text-white/40">
                {isListening ? 'LISTENING' : isSpeaking ? 'SPEAKING' : 'READY'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 rounded border border-[#1a1a3a] text-white/30 hover:text-white/60"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button onClick={clearMessages} className="p-1.5 rounded border border-[#1a1a3a] text-white/30 hover:text-[#ff3366]">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-3"
          >
            <div className="p-3 bg-[#0a0a1a]/50 rounded-lg space-y-3">
              <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Voice Settings</div>
              
              {/* TTS Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-white/60">Text-to-Speech</span>
                <button
                  onClick={() => {
                    setSettings({ ...settings, ttsEnabled: !settings.ttsEnabled });
                    soundManager.click();
                  }}
                  className={`w-8 h-4 rounded-full transition-colors relative ${
                    settings.ttsEnabled ? 'bg-[#00f0ff]/30' : 'bg-[#1a1a3a]'
                  }`}
                >
                  <motion.div
                    className="absolute top-0.5 w-3 h-3 rounded-full"
                    style={{ backgroundColor: settings.ttsEnabled ? '#00f0ff' : '#ffffff30' }}
                    animate={{ left: settings.ttsEnabled ? 18 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* TTS Rate */}
              {settings.ttsEnabled && (
                <>
                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-white/40 mb-1">
                      <span>Speech Rate</span>
                      <span>{settings.ttsRate.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={settings.ttsRate}
                      onChange={(e) => setSettings({ ...settings, ttsRate: parseFloat(e.target.value) })}
                      className="w-full h-1 bg-[#1a1a3a] rounded-full appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Voice Selection */}
                  {voices.length > 0 && (
                    <div>
                      <div className="text-[10px] font-mono text-white/40 mb-1">Voice</div>
                      <select
                        value={settings.ttsVoice}
                        onChange={(e) => {
                          setSettings({ ...settings, ttsVoice: e.target.value });
                          // Test the voice
                          if (synthRef.current) {
                            const utterance = new SpeechSynthesisUtterance('Testing voice');
                            const voice = voices.find(v => v.name === e.target.value);
                            if (voice) utterance.voice = voice;
                            synthRef.current.speak(utterance);
                          }
                        }}
                        className="w-full bg-[#0a0a1a] border border-[#1a1a3a] rounded px-2 py-1 text-xs font-mono text-white focus:outline-none"
                      >
                        {voices
                          .filter(v => v.lang.startsWith('en'))
                          .map(voice => (
                            <option key={voice.name} value={voice.name}>
                              {voice.name} ({voice.localService ? 'Local' : 'Remote'})
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              {/* STT Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-white/60">Speech Recognition</span>
                <button
                  onClick={() => {
                    setSettings({ ...settings, sttEnabled: !settings.sttEnabled });
                    soundManager.click();
                  }}
                  className={`w-8 h-4 rounded-full transition-colors relative ${
                    settings.sttEnabled ? 'bg-[#00f0ff]/30' : 'bg-[#1a1a3a]'
                  }`}
                >
                  <motion.div
                    className="absolute top-0.5 w-3 h-3 rounded-full"
                    style={{ backgroundColor: settings.sttEnabled ? '#00f0ff' : '#ffffff30' }}
                    animate={{ left: settings.sttEnabled ? 18 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* Auto-speak */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-white/60">Auto-Speak Responses</span>
                <button
                  onClick={() => {
                    setSettings({ ...settings, autoSpeak: !settings.autoSpeak });
                    soundManager.click();
                  }}
                  className={`w-8 h-4 rounded-full transition-colors relative ${
                    settings.autoSpeak ? 'bg-[#00f0ff]/30' : 'bg-[#1a1a3a]'
                  }`}
                >
                  <motion.div
                    className="absolute top-0.5 w-3 h-3 rounded-full"
                    style={{ backgroundColor: settings.autoSpeak ? '#00f0ff' : '#ffffff30' }}
                    animate={{ left: settings.autoSpeak ? 18 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
        {messages.length === 0 && !isListening && (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="w-16 h-16 rounded-full bg-[#00f0ff]/10 flex items-center justify-center mb-3">
              <Mic className="w-8 h-8 text-[#00f0ff]/50" />
            </div>
            <p className="text-sm font-mono text-white/40 mb-1">Voice Assistant Ready</p>
            <p className="text-[10px] font-mono text-white/20">
              Click the mic button or type a command below
            </p>
            <div className="mt-4 text-[10px] font-mono text-white/20 space-y-1">
              <p>Try saying:</p>
              <p>"What time is it?"</p>
              <p>"Open calendar"</p>
              <p>"Add task buy groceries"</p>
              <p>"Tell me a joke"</p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === 'user' ? 'bg-[#00f0ff]/20' : 'bg-[#ff00a0]/20'
            }`}>
              {msg.role === 'user' ? (
                <User className="w-3 h-3 text-[#00f0ff]" />
              ) : (
                <Bot className="w-3 h-3 text-[#ff00a0]" />
              )}
            </div>
            <div className={`flex-1 max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
              <div className={`inline-block px-3 py-2 rounded-lg text-xs font-mono leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#00f0ff]/10 border border-[#00f0ff]/20 text-[#00f0ff]'
                  : 'bg-[#0a0a1a] border border-[#1a1a3a] text-white/80'
              }`}>
                {msg.text}
              </div>
              <div className={`flex items-center gap-2 mt-1 text-[9px] font-mono text-white/20 ${
                msg.role === 'user' ? 'justify-end' : ''
              }`}>
                <span>{formatTime(msg.timestamp)}</span>
                {msg.isVoice && <span className="text-[#00ff88]">VOICE</span>}
                {msg.role === 'assistant' && (
                  <>
                    <button
                      onClick={() => copyMessage(msg.text)}
                      className="hover:text-[#00f0ff] transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    {settings.ttsEnabled && (
                      <button
                        onClick={() => speak(msg.text)}
                        className="hover:text-[#ff00a0] transition-colors"
                      >
                        <Volume2 className="w-3 h-3" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {processing && (
          <div className="flex items-center gap-2 text-[#ffcc00]">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs font-mono">Processing...</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && transcript.trim()) {
                handleVoiceCommand(transcript);
                soundManager.messageSent();
              }
            }}
            placeholder="Type or speak a command..."
            className="w-full bg-[#0a0a1a] border border-[#1a1a3a] rounded-xl pl-3 pr-12 py-2.5 text-xs font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-[#00f0ff]/40"
          />
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-[#ff3366] hover:text-[#ff3366]/80"
            >
              <VolumeX className="w-4 h-4" />
            </button>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={isListening ? stopListening : startListening}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            isListening
              ? 'bg-[#ff3366]/20 border border-[#ff3366]/40'
              : 'bg-[#00f0ff]/10 border border-[#00f0ff]/30 hover:bg-[#00f0ff]/20'
          }`}
        >
          {isListening ? (
            <MicOff className="w-4 h-4 text-[#ff3366]" />
          ) : (
            <Mic className="w-4 h-4 text-[#00f0ff]" />
          )}
        </motion.button>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between mt-2 text-[9px] font-mono text-white/20">
        <span className="flex items-center gap-1">
          {isListening ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff3366] animate-pulse" />
              Listening...
            </>
          ) : isSpeaking ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
              Speaking...
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff]" />
              Ready
            </>
          )}
        </span>
        <span>{messages.length} messages</span>
      </div>
    </div>
  );
}
