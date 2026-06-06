import { motion } from 'framer-motion';
import { Zap, ExternalLink } from 'lucide-react';
import { quickLinks } from '../../../utils/helpers';

export function QuickLinksWidget() {
  return (
    <div className="cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg h-full">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-[#ffcc00]" />
        <span className="text-xs font-mono text-[#ffcc00]/60 uppercase tracking-widest">Quick Links</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {quickLinks.map((link) => (
          <motion.a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 p-2.5 rounded bg-[#0a0a1a]/50 border border-[#1a1a3a] hover:border-[#1a1a3a] transition-all group"
          >
            <ExternalLink className="w-3.5 h-3.5 shrink-0" style={{ color: link.color }} />
            <span className="text-xs font-mono text-white/70 group-hover:text-white truncate">{link.name}</span>
          </motion.a>
        ))}
      </div>
    </div>
  );
}
