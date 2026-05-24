import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Terminal, Filter, RefreshCw, Trash2,
  AlertCircle, Info, AlertTriangle, Bug, ChevronDown, ChevronRight,
  Database, Brain, Cpu, Mic, HardDrive, Bot, Download, X,
} from 'lucide-react';
import { toast } from './Toast';

const BACKEND_URL = import.meta.env.VITE_PYTHON_BACKEND_URL || 'http://localhost:8000';

interface LogEntry {
  timestamp: string;
  source: string;
  type: string;
  level: string;
  message: string;
  metadata: Record<string, any>;
}

interface LogStats {
  total_entries: number;
  sources: Record<string, number>;
  levels: Record<string, number>;
  today: number;
}

const SOURCE_CONFIG: Record<string, { icon: any; color: string }> = {
  ai: { icon: Brain, color: '#ff00a0' },
  system: { icon: Cpu, color: '#00f0ff' },
  dashboard: { icon: Terminal, color: '#00ff88' },
  voice: { icon: Mic, color: '#a855f7' },
  rag: { icon: Database, color: '#00f0ff' },
  memory: { icon: HardDrive, color: '#ffcc00' },
  agent: { icon: Bot, color: '#ff00a0' },
};

const LEVEL_CONFIG: Record<string, { icon: any; color: string }> = {
  error: { icon: AlertCircle, color: '#ff3366' },
  warning: { icon: AlertTriangle, color: '#ffcc00' },
  info: { icon: Info, color: '#00f0ff' },
  debug: { icon: Bug, color: '#666' },
};

function formatTimestamp(ts: string) {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return ts;
  }
}

function formatDate(ts: string) {
  try {
    const d = new Date(ts);
    return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export default function LogViewer() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterSource, setFilterSource] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const [entriesRes, statsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/logs/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: filterSource || null,
            level: filterLevel || null,
            limit: 200,
          }),
        }),
        fetch(`${BACKEND_URL}/api/logs/stats`),
      ]);
      if (entriesRes.ok) {
        const data = await entriesRes.json();
        setEntries(data.entries || []);
      }
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
    } catch {
      // backend not available
    } finally {
      setLoading(false);
    }
  }, [filterSource, filterLevel]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchLogs, 5000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, fetchLogs]);

  const clearLogs = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/logs/clear`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Logs cleared');
        fetchLogs();
      }
    } catch {
      toast.error('Failed to clear logs');
    }
  };

  const exportLogs = () => {
    const text = entries.map(e =>
      `[${e.timestamp}] [${e.source}] [${e.level}] ${e.message}${e.metadata && Object.keys(e.metadata).length ? ' | ' + JSON.stringify(e.metadata) : ''}`
    ).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stariz-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleExpanded = (idx: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a3a] bg-[#0a0a1a]/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center">
            <Terminal className="w-4 h-4 text-[#00f0ff]" />
          </div>
          <div>
            <h2 className="text-sm font-display font-bold text-white">Log Viewer</h2>
            <p className="text-[10px] font-mono text-white/40">
              {stats ? `${stats.total_entries} entries · ${stats.today} today` : 'Loading...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${
              autoRefresh ? 'bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/30' : 'border border-[#1a1a3a] text-white/30'
            }`}
          >
            <RefreshCw className={`w-3 h-3 ${autoRefresh ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={fetchLogs} className="p-1.5 rounded hover:bg-white/10 text-white/40 transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={exportLogs} className="p-1.5 rounded hover:bg-white/10 text-white/40 transition-all">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={clearLogs} className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-all">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[#1a1a3a] bg-[#0a0a1a]/20">
        <Filter className="w-3.5 h-3.5 text-white/30" />
        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          className="bg-[#0f0f2a] border border-[#1a1a3a] rounded px-2 py-1 text-[10px] font-mono text-white/70 focus:outline-none focus:border-[#00f0ff]/40"
        >
          <option value="">All Sources</option>
          {Object.entries(SOURCE_CONFIG).map(([key]) => (
            <option key={key} value={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</option>
          ))}
        </select>
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          className="bg-[#0f0f2a] border border-[#1a1a3a] rounded px-2 py-1 text-[10px] font-mono text-white/70 focus:outline-none focus:border-[#00f0ff]/40"
        >
          <option value="">All Levels</option>
          <option value="error">Error</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
          <option value="debug">Debug</option>
        </select>
        {filterSource || filterLevel ? (
          <button
            onClick={() => { setFilterSource(''); setFilterLevel(''); }}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono text-[#ff3366] hover:bg-[#ff3366]/10 transition-all"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        ) : null}
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          {stats && Object.entries(stats.levels).map(([level, count]) => {
            const cfg = LEVEL_CONFIG[level];
            if (!cfg || count === 0) return null;
            const Icon = cfg.icon;
            return (
              <div key={level} className="flex items-center gap-1">
                <Icon className="w-3 h-3" style={{ color: cfg.color }} />
                <span className="text-[10px] font-mono text-white/40">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Log Entries */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-2 text-white/30">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-[11px] font-mono">Loading logs...</span>
            </div>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Terminal className="w-12 h-12 text-white/10 mb-4" />
            <p className="text-sm font-mono text-white/30">No log entries found</p>
            <p className="text-[10px] font-mono text-white/20 mt-1">Try adjusting filters or clear them</p>
          </div>
        ) : (
          entries.map((entry, i) => {
            const srcCfg = SOURCE_CONFIG[entry.source] || { icon: Terminal, color: '#fff' };
            const lvlCfg = LEVEL_CONFIG[entry.level] || { icon: Info, color: '#fff' };
            const SrcIcon = srcCfg.icon;
            const LvlIcon = lvlCfg.icon;
            const isExpanded = expanded.has(i);
            const hasMeta = entry.metadata && Object.keys(entry.metadata).length > 0;
            const isNewDay = i === 0 || formatDate(entry.timestamp) !== formatDate(entries[i - 1]?.timestamp || '');

            return (
              <div key={`${entry.timestamp}-${i}`}>
                {isNewDay && (
                  <div className="sticky top-0 z-10 px-4 py-1.5 bg-[#0a0a1a]/80 backdrop-blur border-b border-[#1a1a3a]">
                    <span className="text-[10px] font-mono text-white/30">
                      {formatDate(entry.timestamp) || 'Unknown date'}
                    </span>
                  </div>
                )}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-4 py-2 border-b border-[#1a1a3a]/40 hover:bg-[#0a0a1a]/30 transition-colors cursor-pointer"
                  onClick={() => hasMeta && toggleExpanded(i)}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="flex items-center gap-1.5 min-w-[60px] pt-0.5">
                      <SrcIcon className="w-3 h-3 shrink-0" style={{ color: srcCfg.color }} />
                      <span className="text-[9px] font-mono text-white/40 truncate">{entry.source}</span>
                    </div>
                    <LvlIcon className="w-3 h-3 mt-0.5 shrink-0" style={{ color: lvlCfg.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <span className="text-[11px] font-mono text-white/80 leading-relaxed break-words">
                          {entry.message}
                        </span>
                        {hasMeta && (
                          <button className="shrink-0 mt-0.5">
                            {isExpanded ? <ChevronDown className="w-3 h-3 text-white/20" /> : <ChevronRight className="w-3 h-3 text-white/20" />}
                          </button>
                        )}
                      </div>
                      {hasMeta && isExpanded && (
                        <pre className="mt-1.5 text-[9px] font-mono text-white/30 bg-[#050510] rounded p-2 overflow-x-auto">
                          {JSON.stringify(entry.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                    <span className="text-[9px] font-mono text-white/20 shrink-0 min-w-[50px] text-right">
                      {formatTimestamp(entry.timestamp)}
                    </span>
                  </div>
                </motion.div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer stats */}
      {stats && (
        <div className="flex items-center gap-4 px-4 py-2 border-t border-[#1a1a3a] bg-[#0a0a1a]/40">
          {Object.entries(stats.sources).map(([source, count]) => {
            const cfg = SOURCE_CONFIG[source];
            if (!cfg) return null;
            const Icon = cfg.icon;
            return (
              <div key={source} className="flex items-center gap-1">
                <Icon className="w-3 h-3" style={{ color: cfg.color }} />
                <span className="text-[9px] font-mono text-white/40">{count}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
