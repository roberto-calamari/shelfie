'use client';

import { motion } from 'framer-motion';
import { useWizardStore } from '@/lib/store';

export function IntroScreen() {
  const setStep = useWizardStore((s) => s.setStep);

  return (
    <motion.div
      className="flex-1 flex flex-col items-center justify-center px-8 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Logo / wordmark area */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.6 }}
      >
        <h1
          className="text-4xl font-bold tracking-tight"
          style={{ fontFamily: "'Lora', Georgia, serif" }}
        >
          shelfie
        </h1>
        <p className="mt-3 text-shell-muted text-sm leading-relaxed max-w-[260px] mx-auto">
          Beautiful story cards for the books you just finished.
        </p>
      </motion.div>

      {/* CTA */}
      <motion.button
        className="mt-10 px-8 py-3.5 rounded-full text-white font-semibold text-base shadow-lg active:scale-95 transition-transform"
        style={{ backgroundColor: 'var(--shell-accent)' }}
        onClick={() => setStep('search')}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        whileTap={{ scale: 0.95 }}
      >
        Find a Book
      </motion.button>

      {/* Subtle footer */}
      <motion.p
        className="absolute bottom-8 text-[11px] text-shell-muted/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        Free &amp; open source · No account needed
      </motion.p>
    </motion.div>
  );
}
