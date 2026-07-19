import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder, FileText, ArrowLeft, Home, RefreshCw,
  Trash2, Plus, Copy
} from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { toast } from '../Toast';

const BACKEND_URL = import.meta.env.VITE_PYTHON_BACKEND_URL || 'http://localhost:8000';

interface FileItem {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  modified: number;
}

export default function FileManagerWidget() {
  const [currentPath, setCurrentPath] = useLocalStorage('stariz-file-path', '/tmp');
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const fetchDirectory = useCallback(async (path: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${BACKEND_URL}/api/tools/file/operation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, operation: 'list' }),
      });

      const data = await response.json();
      if (data.success) {
        setItems(data.items || []);
        setCurrentPath(path);
      } else {
        setError(data.error || 'Failed to list directory');
      }
    } catch (e: any) {
      setError('Backend not connected. Start Python backend.');
    } finally {
      setLoading(false);
    }
  }, [setCurrentPath]);

  useEffect(() => {
    fetchDirectory(currentPath);
  }, [currentPath, fetchDirectory]);

  const handleItemClick = (item: FileItem) => {
    if (item.is_dir) {
      fetchDirectory(item.path);
    }
  };

  const handleGoBack = () => {
    const parent = currentPath.split('/').slice(0, -1).join('/') || '/';
    fetchDirectory(parent);
  };

  const handleGoHome = () => {
    fetchDirectory('/tmp');
  };

  const handleDelete = async (item: FileItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete ${item.is_dir ? 'folder' : 'file'} "${item.name}"?`)) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/tools/file/operation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: item.path, operation: 'delete' }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`${item.name} deleted`);
        fetchDirectory(currentPath);
      } else {
        toast.error(data.error || 'Delete failed');
      }
    } catch {
      toast.error('Backend not connected');
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    const path = `${currentPath}/${newFolderName.trim()}`;
    try {
      const response = await fetch(`${BACKEND_URL}/api/tools/file/operation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, operation: 'mkdir' }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Folder created');
        setShowNewFolder(false);
        setNewFolderName('');
        fetchDirectory(currentPath);
      } else {
        toast.error(data.error || 'Failed to create folder');
      }
    } catch {
      toast.error('Backend not connected');
    }
  };

  const handleCopyPath = async (item: FileItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(item.path);
      toast.success('Path copied!');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '-';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-4 rounded-lg h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-[#ffcc00]" />
          <span className="text-xs font-mono text-[#ffcc00]/60 uppercase tracking-widest">File Manager</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => fetchDirectory(currentPath)}
            className="p-1 text-white/30 hover:text-[#ffcc00] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowNewFolder(!showNewFolder)}
            className="p-1 text-white/30 hover:text-[#00ff88] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Path bar */}
      <div className="flex items-center gap-1 mb-3 text-[10px] font-mono">
        <button onClick={handleGoHome} className="text-[#00f0ff] hover:underline">
          <Home className="w-3 h-3 inline mr-1" />
          HOME
        </button>
        <span className="text-white/20">/</span>
        <button onClick={handleGoBack} className="text-white/40 hover:text-white/60">
          <ArrowLeft className="w-3 h-3 inline mr-1" />
          BACK
        </button>
        <span className="text-white/20 truncate flex-1">{currentPath}</span>
      </div>

      {/* New folder input */}
      <AnimatePresence>
        {showNewFolder && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 flex gap-2"
          >
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              placeholder="Folder name..."
              className="flex-1 bg-[#0a0a1a] border border-[#1a1a3a] rounded px-2 py-1 text-xs font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-[#00ff88]/50"
              autoFocus
            />
            <button
              onClick={handleCreateFolder}
              className="px-2 py-1 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded text-[#00ff88] text-xs font-mono hover:bg-[#00ff88]/20"
            >
              CREATE
            </button>
            <button
              onClick={() => { setShowNewFolder(false); setNewFolderName(''); }}
              className="px-2 py-1 text-white/40 text-xs font-mono hover:text-white/60"
            >
              X
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      {error && (
        <div className="mb-3 p-2 rounded bg-[#ff3366]/10 border border-[#ff3366]/30 text-[10px] font-mono text-[#ff3366]">
          {error}
        </div>
      )}

      {/* File list */}
      <div className="flex-1 overflow-y-auto pr-1">
        {loading ? (
          <div className="flex items-center justify-center h-20">
            <div className="w-5 h-5 border-2 border-[#ffcc00]/30 border-t-[#ffcc00] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-0.5">
            {items.map((item) => (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => handleItemClick(item)}
                className="flex items-center gap-2 p-2 rounded bg-[#0a0a1a]/50 hover:bg-[#0a0a1a] transition-colors cursor-pointer group"
              >
                {item.is_dir ? (
                  <Folder className="w-4 h-4 text-[#ffcc00]/60 shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-[#00f0ff]/60 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono text-white/80 truncate">{item.name}</div>
                  {!item.is_dir && (
                    <div className="text-[9px] font-mono text-white/30">{formatSize(item.size)}</div>
                  )}
                </div>
                <div className="text-[9px] font-mono text-white/20 shrink-0">
                  {formatDate(item.modified)}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleCopyPath(item, e)}
                    className="p-0.5 text-white/30 hover:text-[#00f0ff]"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(item, e)}
                    className="p-0.5 text-white/30 hover:text-[#ff3366]"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))}

            {items.length === 0 && !loading && (
              <div className="text-center py-8 text-xs font-mono text-white/20">
                {error ? 'Unable to load directory' : 'Directory is empty'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
