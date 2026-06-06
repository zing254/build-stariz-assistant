import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, CheckCircle, AlertTriangle, Info, Bell, BellOff,
  Trash2, Volume2, VolumeX,
} from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import soundManager from '../utils/sounds';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  persistent?: boolean;
}

interface NotificationSystemProps {
  children: React.ReactNode;
}

interface NotificationContextType {
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => string;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotify(): NotificationContextType['addNotification'] {
  const ctx = useContext(NotificationContext);
  return ctx?.addNotification ?? (() => '');
}

export function NotificationProvider({ children }: NotificationSystemProps) {
  const [notifications, setNotifications] = useLocalStorage<Notification[]>('stariz-notifications', []);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showPanel, setShowPanel] = useState(false);
  const [soundEnabled, setSoundEnabled] = useLocalStorage('stariz-notif-sound', true);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) return;
    
    const result = await Notification.requestPermission();
    setPermission(result);
    
    if (result === 'granted') {
      new Notification('STARIZ Notifications Enabled', {
        body: 'You will now receive notifications',
        icon: '/icon-192x192.png',
      });
      soundManager.notification();
    }
  };

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: Date.now(),
      read: false,
    };

    setNotifications(prev => [newNotif, ...prev].slice(0, 50));

    // Play sound
    if (soundEnabled) {
      if (notification.type === 'success') soundManager.success();
      else if (notification.type === 'error') soundManager.error();
      else if (notification.type === 'warning') soundManager.warning();
      else soundManager.notification();
    }

    // Show browser notification
    if (permission === 'granted' && 'Notification' in window) {
      try {
        new Notification(`STARIZ: ${notification.title}`, {
          body: notification.message,
          icon: '/icon-192x192.png',
          tag: notification.type,
        });
      } catch {}
    }

    return newNotif.id;
  }, [permission, soundEnabled, setNotifications]);

  const markRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const notifCtx: NotificationContextType = { addNotification };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-[#00ff88]" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-[#ff3366]" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-[#ffcc00]" />;
      default: return <Info className="w-4 h-4 text-[#00f0ff]" />;
    }
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'border-[#00ff88]/30 bg-[#00ff88]/5';
      case 'error': return 'border-[#ff3366]/30 bg-[#ff3366]/5';
      case 'warning': return 'border-[#ffcc00]/30 bg-[#ffcc00]/5';
      default: return 'border-[#00f0ff]/30 bg-[#00f0ff]/5';
    }
  };

  return (
    <NotificationContext.Provider value={notifCtx}>
      {/* Notification Bell Button */}
      <div className="relative">
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="relative p-1.5 rounded border border-[#1a1a3a] text-white/40 hover:text-white/60 hover:border-white/30 transition-colors"
        >
          {showPanel ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-[#ff3366] rounded-full flex items-center justify-center text-[9px] font-mono text-white font-bold"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.div>
          )}
        </button>
      </div>

      {/* Notification Panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed right-4 top-16 w-80 max-h-[70vh] bg-[#0f0f2a] border border-[#1a1a3a] rounded-2xl shadow-2xl z-[100] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a3a]">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#00f0ff]" />
                <span className="text-sm font-mono text-white/80">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#ff3366] text-[9px] font-mono text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="p-1 rounded hover:bg-[#1a1a3a] transition-colors"
                    title={soundEnabled ? 'Disable sounds' : 'Enable sounds'}
                    aria-label={soundEnabled ? 'Disable notification sounds' : 'Enable notification sounds'}
                  >
                  {soundEnabled ? (
                    <Volume2 className="w-3.5 h-3.5 text-[#00ff88]" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-white/30" />
                  )}
                </button>
                {permission !== 'granted' && (
                  <button
                    onClick={requestPermission}
                    className="px-2 py-1 rounded text-[10px] font-mono bg-[#00f0ff]/10 text-[#00f0ff] hover:bg-[#00f0ff]/20"
                  >
                    Enable Push
                  </button>
                )}
                <button
                  onClick={clearAll}
                  className="p-1 rounded hover:bg-[#ff3366]/20 transition-colors"
                  title="Clear all"
                  aria-label="Clear all notifications"
                >
                  <Trash2 className="w-3.5 h-3.5 text-white/30 hover:text-[#ff3366]" />
                </button>
                <button
                  onClick={() => setShowPanel(false)}
                  className="p-1 rounded hover:bg-[#1a1a3a]"
                  aria-label="Close notification panel"
                >
                  <X className="w-3.5 h-3.5 text-white/30" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-8 h-8 text-white/10 mx-auto mb-2" />
                  <p className="text-xs font-mono text-white/30">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-[#1a1a3a]">
                  {notifications.map((notif) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 transition-all hover:bg-[#1a1a3a]/50 ${
                        !notif.read ? 'bg-[#0a0a1a]/30' : ''
                      } ${getTypeColor(notif.type)}`}
                      onClick={() => markRead(notif.id)}
                    >
                      <div className="flex items-start gap-2">
                        <div className="shrink-0 mt-0.5">
                          {getIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className={`text-xs font-mono font-semibold ${!notif.read ? 'text-white' : 'text-white/60'}`}>
                              {notif.title}
                            </span>
                            <span className="text-[9px] font-mono text-white/20 shrink-0 ml-2">
                              {new Date(notif.timestamp).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[10px] font-mono text-white/50 leading-relaxed">
                            {notif.message}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notif.id);
                          }}
                          className="shrink-0 p-0.5 rounded hover:bg-[#ff3366]/20 opacity-0 group-hover:opacity-100"
                          aria-label={`Remove ${notif.title} notification`}
                        >
                          <X className="w-3 h-3 text-white/20 hover:text-[#ff3366]" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-t border-[#1a1a3a] bg-[#0a0a1a]/50">
                <button
                  onClick={markAllRead}
                  className="text-[10px] font-mono text-[#00f0ff] hover:underline"
                >
                  Mark all as read
                </button>
              </div>
            )}
          </motion.div>
        )}
       </AnimatePresence>

      {children}
    </NotificationContext.Provider>
  );
}

export default NotificationProvider;
