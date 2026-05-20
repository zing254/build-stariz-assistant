import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  className?: string;
  count?: number;
  height?: string;
}

export function SkeletonBox({ className = '', height = 'h-4' }: SkeletonLoaderProps) {
  return (
    <div className={`skeleton rounded bg-[#0a0a1a] ${height} ${className}`} />
  );
}

export function SkeletonText({ className = '' }: SkeletonLoaderProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <SkeletonBox height="h-3" className="w-full" />
      <SkeletonBox height="h-3" className="w-5/6" />
      <SkeletonBox height="h-3" className="w-4/6" />
    </div>
  );
}

export function SkeletonCard({ className = '' }: SkeletonLoaderProps) {
  return (
    <div className={`p-4 rounded-lg border border-[#1a1a3a] bg-[#0f0f2a]/50 ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <SkeletonBox height="h-10 w-10" className="rounded-lg" />
        <div className="flex-1">
          <SkeletonBox height="h-4" className="w-32 mb-2" />
          <SkeletonBox height="h-3" className="w-24" />
        </div>
      </div>
      <SkeletonText />
    </div>
  );
}

export function SkeletonWidget({ className = '' }: SkeletonLoaderProps) {
  return (
    <div className={`cyber-border bg-[#0f0f2a]/80 backdrop-blur p-5 rounded-lg ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <SkeletonBox height="h-4 w-4" className="rounded" />
        <SkeletonBox height="h-3" className="w-24" />
      </div>
      <SkeletonBox height="h-32" className="w-full" />
    </div>
  );
}

export function SkeletonList({ count = 3 }: SkeletonLoaderProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
        >
          <div className="flex items-center gap-3 p-2">
            <SkeletonBox height="h-8 w-8" className="rounded" />
            <div className="flex-1">
              <SkeletonBox height="h-3" className="w-full mb-1" />
              <SkeletonBox height="h-2" className="w-2/3" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="h-full flex items-end gap-1 px-4 pb-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="flex-1 bg-[#00f0ff]/20 rounded-t"
          style={{ height: `${Math.random() * 100}%` }}
          initial={{ height: 0 }}
          animate={{ height: `${Math.random() * 100}%` }}
          transition={{ duration: 0.5, delay: i * 0.05 }}
        />
      ))}
    </div>
  );
}

export default SkeletonBox;
