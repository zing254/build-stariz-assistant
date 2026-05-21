import { useState, useRef, useCallback, useEffect } from 'react';

interface UseOfflineVoiceReturn {
  isListening: boolean;
  isSpeaking: boolean;
  transcription: string;
  partialTranscription: string;
  startListening: () => Promise<void>;
  stopListening: () => void;
  speak: (text: string) => Promise<void>;
  stopSpeaking: () => void;
  isInitialized: boolean;
  error: string | null;
}

export function useOfflineVoice(backendUrl: string = 'http://localhost:8000'): UseOfflineVoiceReturn {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [partialTranscription, setPartialTranscription] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connectVoiceWS = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return wsRef.current;
    }

    const wsUrl = backendUrl.replace('http', 'ws');
    const ws = new WebSocket(`${wsUrl}/ws/voice/${Date.now()}`);
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
      setIsInitialized(true);
      setError(null);
      reconnectAttemptsRef.current = 0;
    };

    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'transcription') {
            if (msg.is_final) {
              setTranscription(msg.text);
              setPartialTranscription('');
            } else {
              setPartialTranscription(msg.text);
            }
          }
        } catch {
          // ignore parse errors
        }
      } else if (event.data instanceof ArrayBuffer) {
        const blob = new Blob([event.data], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        if (!audioRef.current) {
          audioRef.current = new Audio();
        }
        audioRef.current.src = url;
        audioRef.current.play().catch(() => {});
        setIsSpeaking(true);
        audioRef.current.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(url);
        };
      }
    };

    ws.onerror = () => {
      setError('Voice WebSocket connection failed');
    };

    ws.onclose = () => {
      setIsInitialized(false);
      // Auto-reconnect if still listening
      if (isListening && reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current += 1;
        const delay = Math.min(1000 * reconnectAttemptsRef.current, 5000);
        setTimeout(() => {
          if (isListening) connectVoiceWS();
        }, delay);
      }
    };

    wsRef.current = ws;
    return ws;
  }, [backendUrl, isListening]);

  const startListening = useCallback(async () => {
    try {
      setError(null);
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      }
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
          channelCount: 1,
        }
      });
      streamRef.current = stream;

      connectVoiceWS();

      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const audioData = e.inputBuffer.getChannelData(0);
          const int16 = new Int16Array(audioData.length);
          for (let i = 0; i < audioData.length; i++) {
            int16[i] = Math.max(-32768, Math.min(32767, audioData[i] * 32767));
          }
          wsRef.current.send(int16.buffer);
        }
      };

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
      processorRef.current = processor;
      setIsListening(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start listening';
      setError(message);
      setIsListening(false);
    }
  }, [connectVoiceWS]);

  const stopListening = useCallback(() => {
    processorRef.current?.disconnect();
    streamRef.current?.getTracks().forEach(t => t.stop());
    wsRef.current?.close();
    wsRef.current = null;
    setIsListening(false);
    setPartialTranscription('');
  }, []);

  const speak = useCallback(async (text: string) => {
    try {
      const response = await fetch(`${backendUrl}/api/voice/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      if (data.audio && data.status === 'success') {
        const binary = atob(data.audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        if (!audioRef.current) {
          audioRef.current = new Audio();
        }
        audioRef.current.src = url;
        audioRef.current.play().catch(() => {});
        setIsSpeaking(true);
        audioRef.current.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(url);
        };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'TTS failed';
      setError(message);
    }
  }, [backendUrl]);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    return () => {
      stopListening();
      stopSpeaking();
      audioContextRef.current?.close();
    };
  }, [stopListening, stopSpeaking]);

  return {
    isListening,
    isSpeaking,
    transcription,
    partialTranscription,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    isInitialized,
    error,
  };
}
