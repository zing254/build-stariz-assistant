import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, MessageSquare, Lightbulb, Wrench, Search, User } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_PYTHON_BACKEND_URL || 'http://localhost:8000';

interface MemoryResult {
  type: string;
  content: string;
  metadata: { timestamp?: string; category?: string; workflow?: string };
}

interface MemoryStats {
  episodic_count: number;
  semantic_count: number;
  procedural_count: number;
  user_profile: string;
}

interface UserProfile {
  name: string;
  timezone: string;
  preferred_tone: string;
  preferred_model: string;
  work_hours: { start: string; end: string };
}

export function MemoryViewer() {
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MemoryResult[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'search' | 'profile'>('overview');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchProfile();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/memory/stats`);
      if (res.ok) setStats(await res.json());
    } catch {}
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/memory/profile`);
      if (res.ok) setProfile(await res.json());
    } catch {}
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/memory/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, memory_type: 'all', top_k: 5 }),
      });
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch {}
    setLoading(false);
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'episodic': return <MessageSquare className="w-3 h-3 text-[#00f0ff]" />;
      case 'semantic': return <Lightbulb className="w-3 h-3 text-[#a855f7]" />;
      case 'procedural': return <Wrench className="w-3 h-3 text-[#00ff88]" />;
      default: return <Brain className="w-3 h-3 text-white/40" />;
    }
  };

  const typeColor = (type: string) => {
    switch (type) {
      case 'episodic': return 'border-[#00f0ff]/20 bg-[#00f0ff]/5';
      case 'semantic': return 'border-[#a855f7]/20 bg-[#a855f7]/5';
      case 'procedural': return 'border-[#00ff88]/20 bg-[#00ff88]/5';
      default: return 'border-white/10 bg-white/5';
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-[#a855f7]" />
        <h2 className="text-lg font-mono font-bold text-white">Memory System</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        {[
          { id: 'overview' as const, icon: Brain, label: 'Overview' },
          { id: 'search' as const, icon: Search, label: 'Search' },
          { id: 'profile' as const, icon: User, label: 'Profile' },
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-mono transition-all ${
              activeTab === id
                ? 'bg-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/30'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-3">
          {stats ? (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Episodic', value: stats.episodic_count, icon: MessageSquare, color: '#00f0ff' },
                { label: 'Semantic', value: stats.semantic_count, icon: Lightbulb, color: '#a855f7' },
                { label: 'Procedural', value: stats.procedural_count, icon: Wrench, color: '#00ff88' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-[#1a1a3a]/50 rounded-lg p-3 border border-white/5 text-center">
                  <Icon className="w-4 h-4 mx-auto mb-1" style={{ color }} />
                  <div className="text-lg font-mono font-bold text-white">{value}</div>
                  <div className="text-[10px] text-white/40 font-mono">{label}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-white/30 font-mono text-sm">
              Memory system not initialized
            </div>
          )}
        </div>
      )}

      {/* Search */}
      {activeTab === 'search' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search memories..."
              className="flex-1 bg-[#1a1a3a]/50 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-white/30 focus:border-[#a855f7]/50 focus:outline-none"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-[#a855f7]/20 border border-[#a855f7]/30 text-[#a855f7] font-mono text-sm hover:bg-[#a855f7]/30 transition-all disabled:opacity-50"
            >
              {loading ? '...' : 'Search'}
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {searchResults.map((result, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`rounded-lg p-3 border ${typeColor(result.type)}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {typeIcon(result.type)}
                    <span className="text-[10px] text-white/40 font-mono uppercase">{result.type}</span>
                    {result.metadata?.timestamp && (
                      <span className="text-[10px] text-white/30 font-mono ml-auto">
                        {new Date(result.metadata.timestamp).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/70 font-mono line-clamp-2">{result.content}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profile */}
      {activeTab === 'profile' && (
        <div className="space-y-3">
          {profile ? (
            <div className="space-y-2">
              {Object.entries(profile).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between bg-[#1a1a3a]/30 rounded-lg p-2 border border-white/5">
                  <span className="text-[10px] text-white/40 font-mono uppercase">{key}</span>
                  <span className="text-xs text-white font-mono">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-white/30 font-mono text-sm">
              No profile data
            </div>
          )}
        </div>
      )}
    </div>
  );
}
