import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

let toastListeners: ((toasts: ToastMessage[]) => void)[] = [];
let toasts: ToastMessage[] = [];

const notify = (message: string, type: ToastMessage['type'] = 'info', duration = 3000) => {
  const id = Math.random().toString(36).substring(2, 9);
  const toast = { id, message, type, duration };
  toasts = [...toasts, toast];
  toastListeners.forEach((l) => l(toasts));
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    toastListeners.forEach((l) => l(toasts));
  }, duration);
};

export const toast = {
  success: (msg: string, duration?: number) => notify(msg, 'success', duration),
  error: (msg: string, duration?: number) => notify(msg, 'error', duration),
  info: (msg: string, duration?: number) => notify(msg, 'info', duration),
};

export function ToastContainer() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const listener = (t: ToastMessage[]) => setMessages([...t]);
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  const removeToast = (id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    toastListeners.forEach((l) => l(toasts));
  };

  const icons = {
    success: <CheckCircle className="w-4 h-4 text-[#00ff88]" />,
    error: <AlertCircle className="w-4 h-4 text-[#ff3366]" />,
    info: <Info className="w-4 h-4 text-[#00f0ff]" />,
  };

  const borders = {
    success: 'border-[#00ff88]/30',
    error: 'border-[#ff3366]/30',
    info: 'border-[#00f0ff]/30',
  };

  return (
    <div className="fixed top-20 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {messages.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg bg-[#0f0f2a]/95 backdrop-blur-xl border ${borders[t.type]} shadow-lg min-w-[280px] max-w-[400px]`}
          >
            {icons[t.type]}
            <span className="text-xs font-mono text-white/80 flex-1">{t.message}</span>
            <button onClick={() => removeToast(t.id)} className="text-white/30 hover:text-white/60" aria-label="Dismiss notification">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
