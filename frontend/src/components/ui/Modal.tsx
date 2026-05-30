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
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', padding: '0' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 60, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            onClick={e => e.stopPropagation()}
            className={`relative w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} flex flex-col`}
            style={{
              maxHeight: '92vh',
              margin: '0 auto',
              background: 'linear-gradient(135deg,rgba(15,23,42,0.99),rgba(2,8,23,0.99))',
              border: `1px solid ${color}33`,
              boxShadow: `0 0 60px ${color}22, 0 24px 80px rgba(0,0,0,0.6)`,
              borderRadius: '1.5rem 1.5rem 1.5rem 1.5rem',
            }}
          >
            {/* Top glow line */}
            <div className="absolute top-0 left-0 right-0 h-px rounded-t-3xl"
              style={{ background: `linear-gradient(90deg,transparent,${color}99,transparent)` }} />

            {/* Header — sticky */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0"
              style={{ background: 'rgba(2,8,23,0.95)', backdropFilter: 'blur(20px)', borderRadius: '1.5rem 1.5rem 0 0' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
                  {icon}
                </div>
                <div>
                  <h2 className="text-white font-bold text-base">{title}</h2>
                  <p className="text-gray-500 text-xs">View, add, update & delete</p>
                </div>
              </div>
              <button onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all text-lg">
                ✕
              </button>
            </div>

            {/* Body — scrollable */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-5" style={{ WebkitOverflowScrolling: 'touch' }}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
