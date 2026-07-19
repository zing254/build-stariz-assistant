import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Upload, Trash2, AlertTriangle } from 'lucide-react';
import { exportData, importData } from '../../../utils/helpers';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { toast } from '../../Toast';

export function SettingsWidget() {
  const [theme, setTheme] = useLocalStorage('stariz-theme', 'cyber');
  const [notifications, setNotifications] = useLocalStorage('stariz-notifications', true);
  const [animations, setAnimations] = useLocalStorage('stariz-animations', true);
  const [compact, setCompact] = useLocalStorage('stariz-compact', false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme === 'ice' ? 'light' : 'dark';
  }, [theme]);

  const changeTheme = (nextTheme: string) => {
    setTheme(nextTheme);
    window.dispatchEvent(new CustomEvent('stariz-theme-change', { detail: nextTheme }));
  };

  const themes = [
    { id: 'cyber', name: 'Cyberpunk', primary: '#00f0ff', secondary: '#ff00a0' },
    { id: 'matrix', name: 'Matrix', primary: '#00ff88', secondary: '#00ff00' },
    { id: 'sunset', name: 'Sunset', primary: '#ff6600', secondary: '#ffcc00' },
    { id: 'ice', name: 'Ice', primary: '#a5f3fc', secondary: '#67e8f9' },
  ];

  const handleExport = () => {
    exportData();
    toast.success('Data exported to JSON');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ok = await importData(file);
    toast[ok ? 'success' : 'error'](ok ? 'Data imported! Reloading...' : 'Import failed — invalid file');
    if (ok) setTimeout(() => window.location.reload(), 1500);
  };

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('stariz-')) localStorage.removeItem(key);
    });
    toast.success('All data cleared. Reloading...');
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full overflow-y-auto">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-4 h-4 rounded border border-white/20 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
        </div>
        <span className="text-xs font-mono text-white/60 uppercase tracking-widest">Settings</span>
      </div>

      <div className="space-y-5">
        {/* Theme */}
        <div>
          <div className="text-[10px] font-mono text-white/40 mb-2 uppercase tracking-wider">Theme</div>
          <div className="grid grid-cols-2 gap-2">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => changeTheme(t.id)}
                className={`p-2 rounded border text-xs font-mono transition-all ${
                  theme === t.id
                    ? 'border-[#00f0ff]/40 bg-[#00f0ff]/10 text-[#00f0ff]'
                    : 'border-[#1a1a3a] text-white/40 hover:text-white/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: `linear-gradient(135deg, ${t.primary}, ${t.secondary})` }} />
                  {t.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          {[
            { label: 'Notifications', value: notifications, toggle: () => setNotifications(!notifications) },
            { label: 'Animations', value: animations, toggle: () => setAnimations(!animations) },
            { label: 'Compact Mode', value: compact, toggle: () => setCompact(!compact) },
          ].map((s) => (
            <div key={s.label} className="flex items-center justify-between">
              <span className="text-xs font-mono text-white/60">{s.label}</span>
              <button
                onClick={s.toggle}
                className={`w-8 h-4 rounded-full transition-colors relative ${s.value ? 'bg-[#00f0ff]/30' : 'bg-[#1a1a3a]'}`}
              >
                <motion.div
                  className="absolute top-0.5 w-3 h-3 rounded-full"
                  style={{ backgroundColor: s.value ? '#00f0ff' : '#ffffff30' }}
                  animate={{ left: s.value ? 18 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
          ))}
        </div>

        {/* Data Management */}
        <div className="pt-3 border-t border-[#1a1a3a]">
          <div className="text-[10px] font-mono text-white/40 mb-2 uppercase tracking-wider">Data Management</div>
          <div className="space-y-2">
            <button onClick={handleExport} className="w-full flex items-center justify-center gap-2 py-2 rounded border border-[#00f0ff]/20 bg-[#00f0ff]/5 text-[#00f0ff] text-xs font-mono hover:bg-[#00f0ff]/10 transition-colors">
              <Download className="w-3.5 h-3.5" /> EXPORT ALL DATA
            </button>
            <label className="w-full flex items-center justify-center gap-2 py-2 rounded border border-[#00ff88]/20 bg-[#00ff88]/5 text-[#00ff88] text-xs font-mono hover:bg-[#00ff88]/10 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> IMPORT DATA
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
            <button
              onClick={handleClear}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded border text-xs font-mono transition-colors ${
                confirmClear
                  ? 'border-[#ff3366] bg-[#ff3366]/20 text-[#ff3366]'
                  : 'border-[#ff3366]/20 bg-[#ff3366]/5 text-[#ff3366]/70 hover:bg-[#ff3366]/10'
              }`}
            >
              {confirmClear ? <AlertTriangle className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
              {confirmClear ? 'CLICK AGAIN TO CONFIRM' : 'CLEAR ALL DATA'}
            </button>
          </div>
        </div>

        {/* System Info */}
        <div className="pt-3 border-t border-[#1a1a3a]">
          <div className="text-[10px] font-mono text-white/30 mb-2 uppercase tracking-wider">System Info</div>
          <div className="space-y-1.5 text-[10px] font-mono text-white/40">
            <div className="flex justify-between"><span>App</span><span className="text-white/60">STARIZ AI v3.0.0</span></div>
            <div className="flex justify-between"><span>Build</span><span className="text-white/60">2026.01.15-stable</span></div>
            <div className="flex justify-between"><span>Stack</span><span className="text-white/60">React 19 + Tailwind 4</span></div>
            <div className="flex justify-between"><span>Platform</span><span className="text-white/60">{navigator.platform}</span></div>
            <div className="flex justify-between"><span>Language</span><span className="text-white/60">{navigator.language}</span></div>
            <div className="flex justify-between"><span>Cores</span><span className="text-white/60">{navigator.hardwareConcurrency || '?'}</span></div>
            <div className="flex justify-between"><span>Memory</span><span className="text-white/60">{(navigator as any).deviceMemory || '?'} GB</span></div>
            <div className="flex justify-between"><span>Online</span><span className="text-[#00ff88]">{navigator.onLine ? 'YES' : 'NO'}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
