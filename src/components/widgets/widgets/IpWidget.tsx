import { useState, useEffect } from 'react';
import { Globe, MapPin } from 'lucide-react';
import { fetchWithFallback } from '../../../utils/helpers';

const IP_FALLBACK = { ip: '127.0.0.1', city: 'Unknown', region: 'Unknown', country_name: 'Unknown', org: 'Unknown' };

export function IpWidget() {
  const [info, setInfo] = useState(IP_FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIp = async () => {
      const data = await fetchWithFallback(
        async () => {
          const res = await fetch('https://ipapi.co/json/');
          if (!res.ok) throw new Error('Failed');
          return res.json();
        },
        IP_FALLBACK
      );
      setInfo(data);
      setLoading(false);
    };
    fetchIp();
  }, []);

  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full">
      <div className="flex items-center gap-2 mb-3">
        <Globe className="w-4 h-4 text-[#00ff88]" />
        <span className="text-xs font-mono text-[#00ff88]/60 uppercase tracking-widest">My Network</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-20">
          <div className="w-5 h-5 border-2 border-[#00ff88]/30 border-t-[#00ff88] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2 rounded bg-[#0a0a1a]/50">
            <MapPin className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span className="text-[10px] font-mono text-white/40">IP</span>
            <span className="flex-1 text-xs font-mono text-white/80 text-right">{info.ip}</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded bg-[#0a0a1a]/50">
            <MapPin className="w-3.5 h-3.5 text-[#a855f7]" />
            <span className="text-[10px] font-mono text-white/40">Location</span>
            <span className="flex-1 text-xs font-mono text-white/80 text-right">{info.city}, {info.country_name}</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded bg-[#0a0a1a]/50">
            <Globe className="w-3.5 h-3.5 text-[#ffcc00]" />
            <span className="text-[10px] font-mono text-white/40">ISP</span>
            <span className="flex-1 text-xs font-mono text-white/80 text-right truncate">{info.org}</span>
          </div>
        </div>
      )}
    </div>
  );
}
