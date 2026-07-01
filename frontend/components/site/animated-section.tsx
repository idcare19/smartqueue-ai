'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export function AnimatedSection({ children }: { children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: 'easeOut' }}>
      {children}
    </motion.div>
  );
}

