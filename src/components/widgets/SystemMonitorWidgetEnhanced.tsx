import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Cpu, MemoryStick, HardDrive, Wifi, Activity } from 'lucide-react';
import { usePythonBackend } from '../../hooks/usePythonBackend';
import { toast } from '../Toast';

export default function SystemMonitorWidgetEnhanced() {
  const { connected, systemStats, callTool } = usePythonBackend();
  const [processes, setProcesses] = useState<Array<{ pid: number; name: string; cpu_percent: number; memory_percent: number }>>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'processes' | 'disk'>('overview');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!connected) return;

    const fetchProcesses = async () => {
      try {
        const result = await callTool('system/processes', { limit: 10 });
        if (result && !result.error) {
          setProcesses(result.processes || []);
        }
      } catch (error) {
        console.error('Failed to fetch processes:', error);
      }
    };

    fetchProcesses();
    const interval = setInterval(fetchProcesses, 5000);
    return () => clearInterval(interval);
  }, [connected, callTool]);

  // Draw usage bars on canvas
  useEffect(() => {
    if (!systemStats || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const { cpu_percent, memory, disk } = systemStats;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw CPU history (simulated for now)
    const historyLength = 50;
    ctx.fillStyle = 'rgba(0, 240, 255, 0.1)';
    ctx.beginPath();
    for (let i = 0; i < historyLength; i++) {
      const x = (i / historyLength) * canvas.width;
      const y = canvas.height - ((cpu_percent || 0) / 100) * canvas.height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fill();

    // Draw line
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < historyLength; i++) {
      const x = (i / historyLength) * canvas.width;
      const y = canvas.height - ((cpu_percent || 0) / 100) * canvas.height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [systemStats]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#00f0ff]" />
          <span className="text-xs font-mono text-[#00f0ff]/60 uppercase tracking-widest">System Monitor</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-[#00ff88]' : 'bg-[#ff3366]'}`} />
          <span className="text-[10px] font-mono text-white/30">
            {connected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3">
        {(['overview', 'processes', 'disk'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${
              activeTab === tab
                ? 'bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30'
                : 'border border-[#1a1a3a] text-white/40 hover:text-white/60'
            }`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="flex-1 flex flex-col">
          {/* CPU Usage Graph */}
          <div className="mb-3 flex-1 min-h-0">
            <div className="text-[10px] font-mono text-white/40 mb-1">CPU Usage</div>
            <canvas
              ref={canvasRef}
              className="w-full h-full rounded bg-[#0a0a1a]/50"
            />
          </div>

          {/* Stats Grid */}
          {systemStats ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#0a0a1a]/50 rounded p-2">
                <div className="text-[10px] font-mono text-white/30">CPU</div>
                <div className="text-lg font-mono font-bold text-[#00f0ff]">
                  {systemStats.cpu_percent?.toFixed(1) || 0}%
                </div>
              </div>
              <div className="bg-[#0a0a1a]/50 rounded p-2">
                <div className="text-[10px] font-mono text-white/30">MEMORY</div>
                <div className="text-lg font-mono font-bold text-[#a855f7]">
                  {systemStats.memory?.percent?.toFixed(1) || 0}%
                </div>
                <div className="text-[9px] font-mono text-white/20">
                  {formatBytes(systemStats.memory?.used || 0)} / {formatBytes(systemStats.memory?.total || 0)}
                </div>
              </div>
              <div className="bg-[#0a0a1a]/50 rounded p-2">
                <div className="text-[10px] font-mono text-white/30">DISK</div>
                <div className="text-lg font-mono font-bold text-[#00ff88]">
                  {systemStats.disk?.percent?.toFixed(1) || 0}%
                </div>
                <div className="text-[9px] font-mono text-white/20">
                  {formatBytes(systemStats.disk?.used || 0)} / {formatBytes(systemStats.disk?.total || 0)}
                </div>
              </div>
              <div className="bg-[#0a0a1a]/50 rounded p-2">
                <div className="text-[10px] font-mono text-white/30">UPTIME</div>
                <div className="text-sm font-mono font-bold text-[#ffcc00]">
                  {systemStats.uptime ? Math.floor(systemStats.uptime / 3600) + 'h' : 'N/A'}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-xs font-mono text-white/30">
                {connected ? 'Loading system stats...' : 'Python backend not connected'}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'processes' && (
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {processes.map((proc) => (
            <div key={proc.pid} className="flex items-center gap-2 p-2 rounded bg-[#0a0a1a]/50 hover:bg-[#0a0a1a] transition-colors">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-mono text-white/80 truncate">{proc.name}</div>
                <div className="text-[9px] font-mono text-white/30">PID: {proc.pid}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono text-[#00f0ff]">{proc.cpu_percent?.toFixed(1) || 0}%</div>
                <div className="text-[9px] font-mono text-white/30">{proc.memory_percent?.toFixed(1) || 0}%</div>
              </div>
            </div>
          ))}
          {processes.length === 0 && (
            <div className="text-center py-4 text-xs font-mono text-white/20">
              No process data available
            </div>
          )}
        </div>
      )}

      {activeTab === 'disk' && systemStats && (
        <div className="flex-1 overflow-y-auto space-y-2">
          {systemStats.disk && (
            <div className="bg-[#0a0a1a]/50 rounded p-3">
              <div className="text-xs font-mono text-white/60 mb-2">Main Disk (/)</div>
              <div className="h-2 bg-[#1a1a3a] rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-[#00ff88] rounded-full transition-all"
                  style={{ width: `${systemStats.disk.percent || 0}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                <div>
                  <div className="text-white/30">Total</div>
                  <div className="text-white/70">{formatBytes(systemStats.disk.total)}</div>
                </div>
                <div>
                  <div className="text-white/30">Used</div>
                  <div className="text-[#ff3366]">{formatBytes(systemStats.disk.used)}</div>
                </div>
                <div>
                  <div className="text-white/30">Free</div>
                  <div className="text-[#00ff88]">{formatBytes(systemStats.disk.free)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
