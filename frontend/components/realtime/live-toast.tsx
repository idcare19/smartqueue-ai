import { motion, AnimatePresence } from 'framer-motion';

export function LiveToast({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="fixed bottom-6 right-6 z-50 rounded-2xl border border-emerald-400/20 bg-slate-950/90 px-4 py-3 text-sm text-emerald-200 shadow-2xl shadow-black/40 backdrop-blur-xl"
        >
          {message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

