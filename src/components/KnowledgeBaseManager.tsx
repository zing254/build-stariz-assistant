import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, Search, Upload, Trash2, FolderOpen, FileText, BarChart3 } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_PYTHON_BACKEND_URL || 'http://localhost:8000';

interface RAGStats {
  total_documents: number;
  embedding_model: string;
  chunk_size: number;
  chunk_overlap: number;
  db_path: string;
}

interface SearchResult {
  content: string;
  metadata: { source: string; chunk_index: number };
  score: number;
}

export function KnowledgeBaseManager() {
  const [stats, setStats] = useState<RAGStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [ingestText, setIngestText] = useState('');
  const [ingestSource, setIngestSource] = useState('');
  const [ingestPath, setIngestPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'search' | 'ingest'>('stats');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/rag/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // RAG not available yet
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/rag/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, top_k: 5 }),
      });
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch {
      setMessage({ type: 'error', text: 'Search failed' });
    }
    setLoading(false);
  };

  const handleIngestText = async () => {
    if (!ingestText.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/rag/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: ingestText,
          source: ingestSource || 'manual',
        }),
      });
      const data = await res.json();
      setMessage({ type: 'success', text: `Ingested ${data.chunks_ingested} chunks` });
      setIngestText('');
      fetchStats();
    } catch {
      setMessage({ type: 'error', text: 'Ingestion failed' });
    }
    setLoading(false);
  };

  const handleIngestPath = async () => {
    if (!ingestPath.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/rag/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_path: ingestPath,
        }),
      });
      const data = await res.json();
      setMessage({ type: 'success', text: `Ingested ${data.chunks_ingested} chunks` });
      setIngestPath('');
      fetchStats();
    } catch {
      setMessage({ type: 'error', text: 'Ingestion failed' });
    }
    setLoading(false);
  };

  const handleReset = async () => {
    if (!confirm('Reset entire knowledge base? This cannot be undone.')) return;
    try {
      await fetch(`${BACKEND_URL}/api/rag/reset`, { method: 'POST' });
      setMessage({ type: 'success', text: 'Knowledge base reset' });
      fetchStats();
    } catch {
      setMessage({ type: 'error', text: 'Reset failed' });
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Database className="w-5 h-5 text-[#00f0ff]" />
        <h2 className="text-lg font-mono font-bold text-white">Knowledge Base</h2>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-2 rounded text-xs font-mono ${
            message.type === 'success'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}
        >
          {message.text}
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2">
        {[
          { id: 'stats' as const, icon: BarChart3, label: 'Stats' },
          { id: 'search' as const, icon: Search, label: 'Search' },
          { id: 'ingest' as const, icon: Upload, label: 'Ingest' },
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-mono transition-all ${
              activeTab === id
                ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-3">
          {stats ? (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Documents', value: stats.total_documents },
                { label: 'Model', value: stats.embedding_model },
                { label: 'Chunk Size', value: stats.chunk_size },
                { label: 'Overlap', value: stats.chunk_overlap },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#1a1a3a]/50 rounded-lg p-3 border border-white/5">
                  <div className="text-[10px] text-white/40 font-mono">{label}</div>
                  <div className="text-sm text-white font-mono mt-1">{value}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-white/30 font-mono text-sm">
              Knowledge base not initialized
            </div>
          )}
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-2 rounded text-xs font-mono text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all"
          >
            <Trash2 className="w-3 h-3" />
            Reset Knowledge Base
          </button>
        </div>
      )}

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search knowledge base..."
              className="flex-1 bg-[#1a1a3a]/50 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-white/30 focus:border-[#00f0ff]/50 focus:outline-none"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-[#00f0ff]/20 border border-[#00f0ff]/30 text-[#00f0ff] font-mono text-sm hover:bg-[#00f0ff]/30 transition-all disabled:opacity-50"
            >
              {loading ? '...' : 'Search'}
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {searchResults.map((result, i) => (
                <div key={i} className="bg-[#1a1a3a]/30 rounded-lg p-3 border border-white/5">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-3 h-3 text-[#00f0ff]" />
                    <span className="text-[10px] text-white/40 font-mono truncate">
                      {result.metadata?.source || 'unknown'}
                    </span>
                    <span className="text-[10px] text-white/30 font-mono ml-auto">
                      Score: {result.score}
                    </span>
                  </div>
                  <p className="text-xs text-white/70 font-mono line-clamp-3">{result.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ingest Tab */}
      {activeTab === 'ingest' && (
        <div className="space-y-4">
          <div>
            <label className="text-[10px] text-white/40 font-mono block mb-1">Ingest Text</label>
            <textarea
              value={ingestText}
              onChange={(e) => setIngestText(e.target.value)}
              placeholder="Paste text to add to knowledge base..."
              rows={4}
              className="w-full bg-[#1a1a3a]/50 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-white/30 focus:border-[#00f0ff]/50 focus:outline-none resize-none"
            />
            <input
              type="text"
              value={ingestSource}
              onChange={(e) => setIngestSource(e.target.value)}
              placeholder="Source name (optional)"
              className="mt-2 w-full bg-[#1a1a3a]/50 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder:text-white/30 focus:border-[#00f0ff]/50 focus:outline-none"
            />
            <button
              onClick={handleIngestText}
              disabled={loading || !ingestText.trim()}
              className="mt-2 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00f0ff]/20 border border-[#00f0ff]/30 text-[#00f0ff] font-mono text-sm hover:bg-[#00f0ff]/30 transition-all disabled:opacity-50"
            >
              <Upload className="w-3 h-3" />
              Ingest Text
            </button>
          </div>
          <div className="border-t border-white/10 pt-4">
            <label className="text-[10px] text-white/40 font-mono block mb-1">Ingest File/Directory</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={ingestPath}
                onChange={(e) => setIngestPath(e.target.value)}
                placeholder="/path/to/file or /path/to/directory"
                className="flex-1 bg-[#1a1a3a]/50 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder:text-white/30 focus:border-[#00f0ff]/50 focus:outline-none"
              />
              <button
                onClick={handleIngestPath}
                disabled={loading || !ingestPath.trim()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#a855f7]/20 border border-[#a855f7]/30 text-[#a855f7] font-mono text-sm hover:bg-[#a855f7]/30 transition-all disabled:opacity-50"
              >
                <FolderOpen className="w-3 h-3" />
                Ingest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
