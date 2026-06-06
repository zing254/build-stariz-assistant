import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic } from 'lucide-react';

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
