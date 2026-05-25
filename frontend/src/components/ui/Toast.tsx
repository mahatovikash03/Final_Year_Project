import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, []);

  const colors = {
    success: { bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.4)', icon: '✅' },
    error:   { bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.4)', icon: '❌' },
    info:    { bg: 'rgba(96,165,250,0.15)',  border: 'rgba(96,165,250,0.4)',  icon: 'ℹ️' },
  };
  const c = colors[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className="flex items-center gap-3 px-5 py-3 rounded-2xl border shadow-2xl"
      style={{ background: c.bg, borderColor: c.border, backdropFilter: 'blur(20px)', minWidth: 280 }}
    >
      <span className="text-xl">{c.icon}</span>
      <span className="text-white text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-auto text-gray-400 hover:text-white text-sm">✕</button>
    </motion.div>
  );
}

// Toast container — place once in App
let toastFn: ((msg: string, type?: 'success'|'error'|'info') => void) | null = null;
export function setToastFn(fn: typeof toastFn) { toastFn = fn; }
export function toast(msg: string, type: 'success'|'error'|'info' = 'success') {
  toastFn?.(msg, type);
}
