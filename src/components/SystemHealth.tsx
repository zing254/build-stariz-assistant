import { useCallback, useEffect, useState } from 'react';
import { Activity, CheckCircle2, RefreshCw, XCircle, Server, Mic, Database, Brain, Bot } from 'lucide-react';
import { toast } from './Toast';

const BACKEND_URL = import.meta.env.VITE_PYTHON_BACKEND_URL || 'http://localhost:8000';

type HealthState = { status: string; version?: string; service?: string };
type CapabilityState = Record<string, boolean> & { timestamp?: string };

export default function SystemHealth() {
  const [health, setHealth] = useState<HealthState | null>(null);
  const [capabilities, setCapabilities] = useState<CapabilityState | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const check = useCallback(async () => {
    setLoading(true);
    try {
      const [healthResponse, capabilitiesResponse] = await Promise.all([
        fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(5000) }),
        fetch(`${BACKEND_URL}/api/capabilities`, { signal: AbortSignal.timeout(5000) }),
      ]);
      const nextHealth = healthResponse.ok ? await healthResponse.json() : null;
      const nextCapabilities = capabilitiesResponse.ok ? await capabilitiesResponse.json() : null;
      setHealth(nextHealth);
      setCapabilities(nextCapabilities);
      setLastChecked(new Date());
      if (!healthResponse.ok) toast.error('Backend health check failed');
    } catch {
      setHealth(null);
      setCapabilities(null);
      setLastChecked(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { check(); }, [check]);

  const rows = [
    { key: 'backend', label: 'Python backend', icon: Server, value: !!health },
    { key: 'ai', label: 'AI core', icon: Bot, value: !!capabilities?.ai },
    { key: 'ollama', label: 'Ollama', icon: Activity, value: !!capabilities?.ollama },
    { key: 'voice_stt', label: 'Voice recognition', icon: Mic, value: !!capabilities?.voice_stt },
    { key: 'voice_tts', label: 'Voice synthesis', icon: Mic, value: !!capabilities?.voice_tts },
    { key: 'rag', label: 'Knowledge base', icon: Database, value: !!capabilities?.rag },
    { key: 'memory', label: 'Memory system', icon: Brain, value: !!capabilities?.memory },
  ];

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#1a1a3a] bg-[#0a0a1a]/70 p-4">
        <div>
          <div className="flex items-center gap-2"><Activity className="h-5 w-5 text-[#00f0ff]" /><h2 className="font-display text-sm font-bold text-white">SYSTEM HEALTH</h2></div>
          <p className="mt-1 text-xs font-mono text-white/40">Live capability checks and connection diagnostics</p>
        </div>
        <button onClick={check} disabled={loading} className="dashboard-action" aria-label="Refresh system health">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Check now
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => {
          const Icon = row.icon;
          return <div key={row.key} className="cyber-border flex min-w-0 items-center gap-3 rounded-xl bg-[#0f0f2a]/70 p-4">
            <Icon className={`h-5 w-5 shrink-0 ${row.value ? 'text-[#00ff88]' : 'text-white/25'}`} />
            <div className="min-w-0 flex-1"><p className="truncate text-xs font-mono text-white/70">{row.label}</p><p className={`text-[10px] font-mono ${row.value ? 'text-[#00ff88]' : 'text-white/35'}`}>{row.value ? 'AVAILABLE' : 'UNAVAILABLE'}</p></div>
            {row.value ? <CheckCircle2 className="h-4 w-4 text-[#00ff88]" /> : <XCircle className="h-4 w-4 text-white/25" />}
          </div>;
        })}
      </div>
      <div className="rounded-xl border border-[#1a1a3a] bg-[#0a0a1a]/50 p-4 text-xs font-mono text-white/45">
        <p>Backend: <span className="text-white/70">{health?.service || 'Not reachable'}</span></p>
        <p className="mt-1">Version: <span className="text-white/70">{health?.version || '—'}</span></p>
        <p className="mt-1">Last checked: <span className="text-white/70">{lastChecked?.toLocaleTimeString() || '—'}</span></p>
        <p className="mt-3 text-white/30">Unavailable optional modules can be enabled by installing their backend dependencies or configuring Ollama/voice models.</p>
      </div>
    </div>
  );
}
