import { useState } from 'react';
import { motion } from 'framer-motion';
import Modal from '../ui/Modal';
import { toast } from '../ui/Toast';

interface Props {
  open: boolean;
  onClose: () => void;
  streak: any;
  onReset: () => void;
}

const milestones = [
  { d: 3,  icon: '🥉', label: '3 Days',    color: '#cd7f32' },
  { d: 7,  icon: '🥈', label: '1 Week',    color: '#c0c0c0' },
  { d: 14, icon: '🥇', label: '2 Weeks',   color: '#ffd700' },
  { d: 21, icon: '💎', label: '3 Weeks',   color: '#00bcd4' },
  { d: 30, icon: '🏆', label: '1 Month',   color: '#ffd700' },
  { d: 60, icon: '👑', label: '2 Months',  color: '#a78bfa' },
  { d: 90, icon: '🌟', label: '3 Months',  color: '#f472b6' },
];

export default function StreakModal({ open, onClose, streak, onReset }: Props) {
  const [confirmReset, setConfirmReset] = useState(false);

  const doReset = () => {
    onReset();
    toast('Streak reset', 'info');
    setConfirmReset(false);
    onClose();
  };

  const days = streak?.days || 0;
  const best = streak?.bestStreak || 0;
  const col  = days >= 30 ? '#fbbf24' : days >= 14 ? '#34d399' : days >= 7 ? '#60a5fa' : '#a78bfa';

  // Calendar — last 30 days
  const today = new Date();
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (29 - i));
    return d;
  });

  const startDate = streak?.startDate ? new Date(streak.startDate) : null;
  const lastCheckin = streak?.lastCheckin ? new Date(streak.lastCheckin) : null;

  const isStreakDay = (date: Date) => {
    if (!startDate || !streak?.active) return false;
    return date >= startDate && date <= (lastCheckin || today);
  };

  return (
    <Modal open={open} onClose={onClose} title="Healthy Eating Streak" icon="🔥" color="#fbbf24" wide>
      {/* Big streak display */}
      <div className="text-center mb-6 py-6 rounded-3xl border border-yellow-500/20 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,rgba(251,191,36,0.1),rgba(245,158,11,0.05))' }}>
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="text-6xl mb-2">🔥</motion.div>
        <motion.p className="font-black text-white" style={{ fontSize: 72, lineHeight: 1, color: col }}
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
          {days}
        </motion.p>
        <p className="text-gray-400 text-sm mt-1">days streak</p>
        <p style={{ color: col }} className="text-xs font-bold mt-2">
          {streak?.active ? '🟢 Active' : streak?.broken ? '🔴 Broken' : '⚪ Not started'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Current Streak', value: `${days}d`, color: col },
          { label: 'Best Ever',      value: `${best}d`, color: '#fbbf24' },
          { label: 'Milestones Hit', value: milestones.filter(m => best >= m.d).length, color: '#34d399' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 text-center border border-white/5" style={{ background: `${s.color}11` }}>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="rounded-2xl p-4 border border-white/5 mb-6" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <p className="text-xs text-gray-500 font-medium mb-3">LAST 30 DAYS</p>
        <div className="grid grid-cols-10 gap-1.5">
          {last30.map((d, i) => {
            const hit = isStreakDay(d);
            const isToday = d.toDateString() === today.toDateString();
            return (
              <motion.div key={i}
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.01 }}
                title={d.toLocaleDateString()}
                className="aspect-square rounded-lg flex items-center justify-center text-xs font-bold border"
                style={hit
                  ? { background: `${col}33`, borderColor: `${col}66`, color: col }
                  : isToday
                  ? { background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.3)', color: 'white' }
                  : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)', color: '#374151' }
                }>
                {hit ? '✓' : d.getDate()}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Milestones */}
      <div className="mb-6">
        <p className="text-white font-semibold mb-3">🏆 Milestones</p>
        <div className="grid grid-cols-4 gap-2">
          {milestones.map(m => {
            const done = best >= m.d;
            return (
              <motion.div key={m.d}
                className="flex flex-col items-center gap-1 p-3 rounded-xl border text-center"
                style={done ? { background: `${m.color}15`, borderColor: `${m.color}33` } : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}
                animate={done ? { scale: [1, 1.05, 1] } : {}}>
                <span className="text-2xl">{done ? m.icon : '🔒'}</span>
                <span className="text-xs font-bold" style={{ color: done ? m.color : '#374151' }}>{m.label}</span>
                <span className="text-xs text-gray-600">{m.d} days</span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {!confirmReset ? (
          <button onClick={() => setConfirmReset(true)}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-all">
            🔄 Reset Streak
          </button>
        ) : (
          <div className="flex-1 flex gap-2">
            <button onClick={doReset} className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-red-600/80 hover:bg-red-600 transition-all">
              Confirm Reset
            </button>
            <button onClick={() => setConfirmReset(false)} className="flex-1 py-3 rounded-xl text-sm text-gray-400 border border-white/10 hover:bg-white/5 transition-all">
              Cancel
            </button>
          </div>
        )}
        <button onClick={onClose} className="flex-1 btn-primary py-3 text-sm">
          ✓ Done
        </button>
      </div>
    </Modal>
  );
}
