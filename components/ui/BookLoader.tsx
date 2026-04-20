'use client';

import { motion } from 'framer-motion';

export function BookLoader({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <motion.div
        className="w-10 h-14 rounded-sm bg-shell-accent/80 shadow-md"
        style={{ transformOrigin: 'bottom center' }}
        animate={{
          rotateZ: [-3, 3, -3],
          scaleY: [1, 0.97, 1.03, 0.98, 1],
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Page lines */}
        <div className="mt-3 mx-1.5 space-y-1">
          <div className="h-0.5 bg-white/40 rounded" />
          <div className="h-0.5 bg-white/30 rounded w-3/4" />
          <div className="h-0.5 bg-white/20 rounded w-1/2" />
        </div>
      </motion.div>
      {message && (
        <p className="text-sm text-shell-muted animate-pulse">{message}</p>
      )}
    </div>
  );
}
