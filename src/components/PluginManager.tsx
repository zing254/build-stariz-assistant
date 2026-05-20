import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Puzzle, Plus, RefreshCw, Trash2, Shield, ShieldAlert } from 'lucide-react';

interface Plugin {
  name: string;
  version: string;
  description: string;
  author: string;
  tools: string[];
  permissions: string[];
  enabled: boolean;
}

export function PluginManager() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPlugins();
  }, []);

  const loadPlugins = () => {
    // Scan plugins directory
    const pluginDir = './backend/plugins';
    // For now, show sample plugins
    setPlugins([
      {
        name: 'web_search',
        version: '1.0.0',
        description: 'Search the web using DuckDuckGo',
        author: 'STARIZ',
        tools: ['web_search'],
        permissions: ['network'],
        enabled: true,
      },
      {
        name: 'code_executor',
        version: '1.0.0',
        description: 'Execute Python/JavaScript code in sandbox',
        author: 'STARIZ',
        tools: ['execute_python', 'execute_javascript'],
        permissions: ['execute'],
        enabled: false,
      },
      {
        name: 'git_tools',
        version: '1.0.0',
        description: 'Git repository operations',
        author: 'STARIZ',
        tools: ['git_status', 'git_commit', 'git_log'],
        permissions: ['file_read', 'file_write'],
        enabled: true,
      },
    ]);
  };

  const togglePlugin = (name: string) => {
    setPlugins(prev =>
      prev.map(p => (p.name === name ? { ...p, enabled: !p.enabled } : p))
    );
  };

  const permissionIcon = (permission: string) => {
    if (permission === 'network') return <Shield className="w-3 h-3 text-[#00f0ff]" />;
    if (permission === 'execute') return <ShieldAlert className="w-3 h-3 text-red-400" />;
    return <Shield className="w-3 h-3 text-white/40" />;
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Puzzle className="w-5 h-5 text-[#00ff88]" />
          <h2 className="text-lg font-mono font-bold text-white">Plugins</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadPlugins}
            className="p-2 rounded-lg hover:bg-white/10 transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-white/40" />
          </button>
          <button
            className="p-2 rounded-lg bg-[#00ff88]/20 border border-[#00ff88]/30 text-[#00ff88] hover:bg-[#00ff88]/30 transition-all"
            title="Add Plugin"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {plugins.map((plugin, i) => (
          <motion.div
            key={plugin.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-lg border p-3 transition-all ${
              plugin.enabled
                ? 'bg-[#00ff88]/5 border-[#00ff88]/20'
                : 'bg-[#1a1a3a]/30 border-white/5 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${plugin.enabled ? 'bg-[#00ff88]' : 'bg-white/20'}`} />
                <span className="text-sm font-mono font-bold text-white">{plugin.name}</span>
                <span className="text-[10px] text-white/30 font-mono">v{plugin.version}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => togglePlugin(plugin.name)}
                  className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${
                    plugin.enabled
                      ? 'bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/30'
                      : 'bg-white/10 text-white/40 border border-white/10'
                  }`}
                >
                  {plugin.enabled ? 'Enabled' : 'Disabled'}
                </button>
                <button className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-all">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-white/50 font-mono mb-2">{plugin.description}</p>
            <div className="flex flex-wrap gap-2">
              {plugin.tools.map(tool => (
                <span
                  key={tool}
                  className="px-2 py-0.5 rounded bg-[#00f0ff]/10 text-[#00f0ff] text-[10px] font-mono"
                >
                  {tool}
                </span>
              ))}
              {plugin.permissions.map(perm => (
                <span
                  key={perm}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 text-white/40 text-[10px] font-mono"
                >
                  {permissionIcon(perm)}
                  {perm}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {plugins.length === 0 && (
        <div className="text-center py-12 text-white/30 font-mono text-sm">
          No plugins installed. Drop a plugin folder in backend/plugins/
        </div>
      )}
    </div>
  );
}
