import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  icon: string;
  color: string;
  children: React.ReactNode;
  wide?: boolean;
}

export default function Modal({ open, onClose, title, icon, color, children, wide }: Props) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.85, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            onClick={e => e.stopPropagation()}
            className={`relative w-full ${wide ? 'max-w-4xl' : 'max-w-2xl'} max-h-[90vh] overflow-y-auto rounded-3xl`}
            style={{
              background: 'linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,8,23,0.99))',
              border: `1px solid ${color}33`,
              boxShadow: `0 0 60px ${color}22, 0 24px 80px rgba(0,0,0,0.6)`,
            }}
          >
            {/* Top glow line */}
            <div className="absolute top-0 left-0 right-0 h-px rounded-t-3xl"
              style={{ background: `linear-gradient(90deg,transparent,${color}99,transparent)` }} />

            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/5"
              style={{ background: 'rgba(2,8,23,0.95)', backdropFilter: 'blur(20px)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
                  {icon}
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">{title}</h2>
                  <p className="text-gray-500 text-xs">View, add, update & delete</p>
                </div>
              </div>
              <button onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all text-lg">
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
