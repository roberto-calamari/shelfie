'use client';

import { motion } from 'framer-motion';

interface StepProgressProps {
  current: number;
  total: number;
}

export function StepProgress({ current, total }: StepProgressProps) {
  return (
    <div className="sticky top-0 z-50 bg-shell-bg/90 backdrop-blur-sm px-6 py-3 flex items-center justify-between">
      <span className="text-xs font-medium text-shell-muted tracking-wide">
        {current} of {total}
      </span>
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <motion.div
            key={i}
            className="h-1 rounded-full"
            style={{
              width: i < current ? 24 : 12,
              backgroundColor: i < current ? 'var(--shell-accent, #C4956A)' : 'var(--shell-border, #E8E0D4)',
            }}
            animate={{ width: i < current ? 24 : 12 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        ))}
      </div>
    </div>
  );
}
