import { useState } from 'react';
import { motion } from 'framer-motion';
import SleepModal     from './SleepModal';
import MoodModal      from './MoodModal';
import WorkoutModal   from './WorkoutModal';
import HydrationModal from './HydrationModal';
import LogsModal      from './LogsModal';
import StreakModal    from './StreakModal';

interface Props {
  icon: string; label: string; value: string | number;
  unit?: string; color: string; grad: string; delay: number;
  cardType: 'sleep' | 'mood' | 'workout' | 'hydration' | 'logs' | 'streak';
  streakData?: any; onStreakReset?: () => void;
}

export default function ClickableStatCard({
  icon, label, value, unit, color, grad, delay, cardType, streakData, onStreakReset
}: Props) {
  const [open, setOpen] = useState(false);
  const [hov, setHov]   = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
        onClick={() => setOpen(true)}
        style={{ perspective: 800, cursor: 'pointer' }}
      >
        <motion.div
          animate={{ rotateY: hov ? 8 : 0, rotateX: hov ? -5 : 0, scale: hov ? 1.06 : 1 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden rounded-2xl p-5 border border-white/10 h-full"
          style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))', backdropFilter: 'blur(20px)' }}
        >
          {/* Animated glow */}
          <motion.div className="absolute inset-0 rounded-2xl" style={{ background: grad }}
            animate={{ opacity: hov ? 0.2 : 0 }} transition={{ duration: 0.3 }} />
          {/* Top line */}
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: `linear-gradient(90deg,transparent,${color}77,transparent)` }} />
          {/* Click hint */}
          <motion.div className="absolute top-2 right-2 text-xs text-gray-700 font-medium"
            animate={{ opacity: hov ? 1 : 0 }} transition={{ duration: 0.2 }}>
            tap to view →
          </motion.div>

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <motion.span className="text-4xl"
                animate={{ scale: hov ? 1.25 : 1, rotate: hov ? 12 : 0 }}
                transition={{ duration: 0.3 }}>{icon}</motion.span>
              <motion.div className="w-2.5 h-2.5 rounded-full mt-1" style={{ backgroundColor: color }}
                animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
                transition={{ repeat: Infinity, duration: 2 }} />
            </div>
            <motion.p className="text-4xl font-black mb-1" style={{ color }}
              animate={{ scale: hov ? 1.06 : 1 }}>
              {typeof value === 'number' ? value.toFixed(value % 1 === 0 ? 0 : 1) : value}
            </motion.p>
            {unit && <p className="text-xs text-gray-500 mb-1.5">{unit}</p>}
            <p className="text-sm text-gray-400 font-semibold">{label}</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Modals */}
      <SleepModal     open={open && cardType === 'sleep'}     onClose={() => setOpen(false)} />
      <MoodModal      open={open && cardType === 'mood'}      onClose={() => setOpen(false)} />
      <WorkoutModal   open={open && cardType === 'workout'}   onClose={() => setOpen(false)} />
      <HydrationModal open={open && cardType === 'hydration'} onClose={() => setOpen(false)} />
      <LogsModal      open={open && cardType === 'logs'}      onClose={() => setOpen(false)} />
      <StreakModal
        open={open && cardType === 'streak'}
        onClose={() => setOpen(false)}
        streak={streakData}
        onReset={onStreakReset || (() => {})}
      />
    </>
  );
}
