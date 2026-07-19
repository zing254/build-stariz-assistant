import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, Eye, EyeOff, Check, Trash2, ExternalLink, RefreshCw, Plus } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { toast } from './Toast';

export interface ApiConfig {
  provider: 'openrouter' | 'openai' | 'anthropic' | 'google' | 'custom';
  key: string;
  model: string;
  baseUrl?: string;
}

const PRESETS: Record<string, { name: string; models: string[]; baseUrl: string; docs: string }> = {
  openrouter: {
    name: 'OpenRouter',
    models: [
      'openrouter/auto',
      'meta-llama/llama-3.3-70b-instruct',
      'google/gemini-2.0-flash-exp:free',
      'google/gemini-2.0-flash-thinking-exp:free',
      'deepseek/deepseek-chat:free',
      'nvidia/llama-3.1-nemotron-70b-instruct:free',
      'qwen/qwen-2.5-72b-instruct:free',
      'mistralai/mistral-7b-instruct:free',
    ],
    baseUrl: 'https://openrouter.ai/api/v1',
    docs: 'https://openrouter.ai/keys',
  },
  openai: {
    name: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
    baseUrl: 'https://api.openai.com/v1',
    docs: 'https://platform.openai.com/api-keys',
  },
  anthropic: {
    name: 'Anthropic',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
    baseUrl: 'https://api.anthropic.com/v1',
    docs: 'https://console.anthropic.com/settings/keys',
  },
  google: {
    name: 'Google AI',
    models: ['gemini-1.5-flash', 'gemini-1.5-pro'],
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    docs: 'https://aistudio.google.com/app/apikey',
  },
  custom: {
    name: 'Custom',
    models: ['custom-model'],
    baseUrl: '',
    docs: '',
  },
};

export function getStoredApiConfig(): ApiConfig | null {
  try {
    const raw = localStorage.getItem('stariz-api-config');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveApiConfig(config: ApiConfig) {
  localStorage.setItem('stariz-api-config', JSON.stringify(config));
}

interface ApiKeyManagerProps {
  open: boolean;
  onClose: () => void;
}

export default function ApiKeyManager({ open, onClose }: ApiKeyManagerProps) {
  const [stored, setStored] = useLocalStorage<ApiConfig | null>('stariz-api-config', null);
  const [provider, setProvider] = useState<ApiConfig['provider']>(stored?.provider || 'openrouter');
  const [key, setKey] = useState(stored?.key || '');
  const [model, setModel] = useState(stored?.model || PRESETS.openrouter.models[0]);
  const [baseUrl, setBaseUrl] = useState(stored?.baseUrl || PRESETS.openrouter.baseUrl);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [customModel, setCustomModel] = useState('');

  const preset = PRESETS[provider];
  const modelOptions = Array.from(new Set([...preset.models, ...availableModels]));

  // OpenRouter changes its free catalogue frequently. Fetch it instead of
  // shipping stale model IDs, while retaining the built-in list as a fallback.
  const loadOpenRouterFreeModels = async () => {
    if (provider !== 'openrouter' || !key.trim()) {
      toast.info('Enter an OpenRouter key first');
      return;
    }
    setLoadingModels(true);
    try {
      const response = await fetch(`${preset.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${key.trim()}` },
      });
      if (!response.ok) throw new Error(`OpenRouter returned ${response.status}`);
      const data = await response.json();
      const free = (data.data || [])
        .filter((item: { id?: string; pricing?: { prompt?: string; completion?: string } }) =>
          item.id && (item.id.endsWith(':free') || (item.pricing?.prompt === '0' && item.pricing?.completion === '0')))
        .map((item: { id: string }) => item.id)
        .sort();
      setAvailableModels(free);
      if (free.length) setModel(free[0]);
      toast.success(`${free.length} free OpenRouter models loaded`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load OpenRouter models');
    } finally {
      setLoadingModels(false);
    }
  };

  const addCustomModel = () => {
    const value = customModel.trim();
    if (!value) return;
    setAvailableModels((current) => Array.from(new Set([...current, value])));
    setModel(value);
    setCustomModel('');
    toast.success('Model added');
  };

  const handleSave = () => {
    if (!key.trim()) { toast.error('API key is required'); return; }
    const config: ApiConfig = { provider, key: key.trim(), model, baseUrl: provider === 'custom' ? baseUrl : preset.baseUrl };
    saveApiConfig(config);
    setStored(config);
    toast.success(`Connected to ${preset.name}`);
    onClose();
  };

  const handleDelete = () => {
    localStorage.removeItem('stariz-api-config');
    setStored(null);
    setKey('');
    toast.info('API key removed');
  };

  const testConnection = async () => {
    if (!key.trim()) { toast.error('Enter an API key first'); return; }
    setTesting(true);
    try {
      const url = provider === 'openrouter'
        ? `${preset.baseUrl}/models`
        : provider === 'openai'
        ? `${preset.baseUrl}/models`
        : null;

      if (!url) { toast.info('Test not available for this provider'); setTesting(false); return; }

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${key.trim()}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'STARIZ AI',
        },
      });

      if (res.ok) {
        toast.success('Connection successful!');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error?.message || `Connection failed (${res.status})`);
      }
    } catch {
      toast.error('Network error — check your connection');
    }
    setTesting(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-[#0f0f2a] border border-[#1a1a3a] rounded-xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-[#00f0ff]" />
                <h2 className="text-sm font-display font-bold text-white">AI API Configuration</h2>
              </div>
              <button onClick={onClose} className="text-white/40 hover:text-white" aria-label="Close API key manager"><X className="w-5 h-5" /></button>
            </div>

            {/* Provider */}
            <div className="mb-4">
              <label className="text-[10px] font-mono text-white/40 uppercase tracking-wider mb-1.5 block">Provider</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(PRESETS) as ApiConfig['provider'][]).map((p) => (
                  <button
                    key={p}
                    onClick={() => { setProvider(p); setModel(PRESETS[p].models[0]); setBaseUrl(PRESETS[p].baseUrl); }}
                    className={`px-2 py-1.5 rounded border text-[10px] font-mono transition-all ${
                      provider === p
                        ? 'border-[#00f0ff]/40 bg-[#00f0ff]/10 text-[#00f0ff]'
                        : 'border-[#1a1a3a] text-white/40 hover:text-white/60'
                    }`}
                  >
                    {PRESETS[p].name}
                  </button>
                ))}
              </div>
            </div>

            {/* API Key */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-mono text-white/40 uppercase tracking-wider">API Key</label>
                {preset.docs && (
                  <a href={preset.docs} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-mono text-[#00f0ff]/50 hover:text-[#00f0ff]">
                    Get key <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder={`Enter your ${preset.name} API key`}
                  className="w-full bg-[#0a0a1a] border border-[#1a1a3a] rounded-lg pl-3 pr-10 py-2.5 text-xs font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-[#00f0ff]/50"
                />
                <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60" aria-label={showKey ? 'Hide API key' : 'Show API key'}>
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Model */}
            <div className="mb-4">
              <label className="text-[10px] font-mono text-white/40 uppercase tracking-wider mb-1.5 block">Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-[#0a0a1a] border border-[#1a1a3a] rounded-lg px-3 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#00f0ff]/50"
              >
                {modelOptions.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <div className="mt-2 flex gap-2">
                <input
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomModel(); } }}
                  placeholder="Add model ID, e.g. provider/model:free"
                  className="min-w-0 flex-1 bg-[#0a0a1a] border border-[#1a1a3a] rounded-lg px-3 py-2 text-[10px] font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-[#00f0ff]/50"
                />
                <button type="button" onClick={addCustomModel} className="px-2 rounded-lg border border-[#1a1a3a] text-white/60 hover:text-[#00f0ff]" aria-label="Add model"><Plus className="w-4 h-4" /></button>
                {provider === 'openrouter' && (
                  <button type="button" onClick={loadOpenRouterFreeModels} disabled={loadingModels} className="px-2 rounded-lg border border-[#00ff88]/30 text-[#00ff88] hover:bg-[#00ff88]/10 disabled:opacity-50" title="Load current free OpenRouter models" aria-label="Refresh free OpenRouter models">
                    <RefreshCw className={`w-4 h-4 ${loadingModels ? 'animate-spin' : ''}`} />
                  </button>
                )}
              </div>
              <p className="mt-1 text-[9px] text-white/30">Add any OpenRouter model ID. Use Refresh to load the current free catalogue.</p>
            </div>

            {/* Custom Base URL */}
            {provider === 'custom' && (
              <div className="mb-4">
                <label className="text-[10px] font-mono text-white/40 uppercase tracking-wider mb-1.5 block">Base URL</label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.example.com/v1"
                  className="w-full bg-[#0a0a1a] border border-[#1a1a3a] rounded-lg px-3 py-2.5 text-xs font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-[#00f0ff]/50"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={testConnection}
                disabled={testing}
                className="flex-1 py-2.5 rounded-lg border border-[#ffcc00]/30 bg-[#ffcc00]/5 text-[#ffcc00] text-xs font-mono hover:bg-[#ffcc00]/10 transition-colors disabled:opacity-50"
              >
                {testing ? 'TESTING...' : 'TEST'}
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 rounded-lg border border-[#00f0ff]/30 bg-[#00f0ff]/10 text-[#00f0ff] text-xs font-mono hover:bg-[#00f0ff]/20 transition-colors"
              >
                <Check className="w-3.5 h-3.5 inline mr-1" />
                SAVE
              </button>
              {stored && (
                <button
                  onClick={handleDelete}
                  className="px-3 py-2.5 rounded-lg border border-[#ff3366]/20 text-[#ff3366]/60 hover:bg-[#ff3366]/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {stored && (
              <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded bg-[#00ff88]/5 border border-[#00ff88]/20">
                <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
                <span className="text-[10px] font-mono text-[#00ff88]">
                  Active: {PRESETS[stored.provider]?.name || stored.provider} / {stored.model}
                </span>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
