import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../ui/Modal';
import { toast } from '../ui/Toast';
import api from '../../services/api';

// ── Types ─────────────────────────────────────────────────────────────────────
interface StreakEntry {
  _id: string;
  active: boolean;
  startDate: string;
  endDate?: string;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  bestDays: number;
  breakReason?: string;
  checkIns: string[];
  createdAt: string;
}

interface Elapsed {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

// ── Live Timer ─────────────────────────────────────────────────────────────────
function useTimer(startDate: string | null | undefined) {
  const calc = useCallback((): Elapsed => {
    if (!startDate) return { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
    const diff = Math.max(0, Math.floor((Date.now() - new Date(startDate).getTime()) / 1000));
    return {
      days:    Math.floor(diff / 86400),
      hours:   Math.floor((diff % 86400) / 3600),
      minutes: Math.floor((diff % 3600) / 60),
      seconds: diff % 60,
      totalSeconds: diff,
    };
  }, [startDate]);

  const [elapsed, setElapsed] = useState<Elapsed>(calc);

  useEffect(() => {
    if (!startDate) return;
    const id = setInterval(() => setElapsed(calc()), 1000);
    return () => clearInterval(id);
  }, [startDate, calc]);

  return elapsed;
}

// ── Pad number ────────────────────────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, '0');

// ── Timer Ring ────────────────────────────────────────────────────────────────
function TimerRing({ elapsed, active }: { elapsed: Elapsed; active: boolean }) {
  const col = elapsed.days >= 30 ? '#ffd700'
    : elapsed.days >= 14 ? '#34d399'
    : elapsed.days >= 7  ? '#60a5fa'
    : '#a78bfa';

  return (
    <div className="relative flex flex-col items-center justify-center py-4">
      {/* Outer glow */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: 200, height: 200, background: `radial-gradient(circle, ${col}15, transparent 70%)` }}
        animate={{ scale: [1, 1.05, 1], opacity: [0.6, 0.3, 0.6] }}
        transition={{ repeat: Infinity, duration: 3 }}
      />

      {/* Days display */}
      <motion.div
        className="relative flex flex-col items-center justify-center w-44 h-44 rounded-full border-4"
        style={{
          borderColor: col,
          background: 'rgba(2,8,23,0.8)',
          boxShadow: `0 0 30px ${col}44, inset 0 0 20px ${col}11`,
        }}
        animate={active ? { boxShadow: [`0 0 30px ${col}44`, `0 0 50px ${col}88`, `0 0 30px ${col}44`] } : {}}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <motion.span
          key={elapsed.days}
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-6xl font-black text-white"
        >
          {elapsed.days}
        </motion.span>
        <span className="text-xs font-bold tracking-[4px] mt-1" style={{ color: col }}>DAYS</span>
        {active && (
          <span className="text-xs text-gray-600 tracking-widest mt-0.5">STREAK</span>
        )}
      </motion.div>

      {/* HH:MM:SS Timer */}
      {active && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-center gap-1 font-mono"
        >
          {[
            { val: elapsed.hours,   label: 'HRS' },
            { val: elapsed.minutes, label: 'MIN' },
            { val: elapsed.seconds, label: 'SEC' },
          ].map((item, i) => (
            <div key={item.label} className="flex items-center gap-1">
              {i > 0 && <span className="text-gray-600 text-lg font-bold">:</span>}
              <div className="flex flex-col items-center">
                <motion.span
                  key={item.val}
                  initial={{ y: -8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-2xl font-black text-white tabular-nums"
                  style={{ minWidth: 40, textAlign: 'center' }}
                >
                  {pad(item.val)}
                </motion.span>
                <span className="text-xs text-gray-600 tracking-widest">{item.label}</span>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Pulse rings */}
      {active && [1, 2].map(i => (
        <motion.div
          key={i}
          className="absolute rounded-full border"
          style={{ width: 200 + i * 20, height: 200 + i * 20, borderColor: `${col}22` }}
          animate={{ scale: [1, 1.06, 1], opacity: [0.4, 0.05, 0.4] }}
          transition={{ repeat: Infinity, duration: 2.5, delay: i * 0.4 }}
        />
      ))}
    </div>
  );
}

// ── Milestone badges ──────────────────────────────────────────────────────────
const MILESTONES = [
  { d: 3,   icon: '🥉', label: '3d',   color: '#cd7f32' },
  { d: 7,   icon: '🥈', label: '1w',   color: '#c0c0c0' },
  { d: 14,  icon: '🥇', label: '2w',   color: '#ffd700' },
  { d: 21,  icon: '💎', label: '3w',   color: '#00bcd4' },
  { d: 30,  icon: '🏆', label: '1mo',  color: '#ffd700' },
  { d: 60,  icon: '👑', label: '2mo',  color: '#a78bfa' },
  { d: 90,  icon: '🌟', label: '3mo',  color: '#f472b6' },
  { d: 180, icon: '🔱', label: '6mo',  color: '#f59e0b' },
];

// ── Break Reason Modal ─────────────────────────────────────────────────────────
function BreakReasonModal({
  open, onClose, onConfirm, streakDays
}: {
  open: boolean; onClose: () => void;
  onConfirm: (reason: string) => void;
  streakDays: number;
}) {
  const [reason, setReason] = useState('');
  const suggestions = [
    'Ate junk food at a party 🎉',
    'Stress eating 😰',
    'Couldn\'t resist fast food 🍔',
    'Skipped meal prep this week',
    'Social gathering with unhealthy food',
    'Travel/holiday disruption ✈️',
    'Emotional eating 💔',
  ];

  return (
    <Modal open={open} onClose={onClose} title="Break Your Streak?" icon="💔" color="#f87171">
      <div className="text-center mb-5">
        <motion.div animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 0.5 }} className="text-5xl mb-3">💔</motion.div>
        <p className="text-white font-bold text-lg">Your {streakDays}-day streak will be reset</p>
        <p className="text-gray-400 text-sm mt-1">Tell us why — it helps you learn your patterns</p>
      </div>

      <div className="mb-4">
        <label className="text-xs text-gray-400 mb-2 block font-medium uppercase tracking-wide">What happened?</label>
        <textarea
          rows={3}
          placeholder="Write your reason here... (optional but recommended)"
          className="input-field resize-none text-sm mb-3"
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
        <p className="text-xs text-gray-600 mb-2">Quick select:</p>
        <div className="flex flex-wrap gap-2">
          {suggestions.map(s => (
            <button key={s} onClick={() => setReason(s)}
              className="text-xs px-3 py-1.5 rounded-full border transition-all"
              style={reason === s
                ? { background: 'rgba(248,113,113,0.2)', borderColor: 'rgba(248,113,113,0.5)', color: '#f87171' }
                : { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: '#6b7280' }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onClose} className="btn-secondary flex-1 py-3">
          Keep Going 💪
        </button>
        <button
          onClick={() => { onConfirm(reason || 'No reason given'); setReason(''); }}
          className="flex-1 py-3 rounded-xl font-bold text-white transition-all"
          style={{ background: 'linear-gradient(135deg,#ef4444,#b91c1c)', boxShadow: '0 8px 20px rgba(239,68,68,0.3)' }}
        >
          Break Streak 😔
        </button>
      </div>
    </Modal>
  );
}

// ── Edit Reason Modal ─────────────────────────────────────────────────────────
function EditReasonModal({
  open, onClose, onSave, currentReason, streakId
}: {
  open: boolean; onClose: () => void;
  onSave: (id: string, reason: string) => void;
  currentReason: string;
  streakId: string;
}) {
  const [reason, setReason] = useState(currentReason);
  useEffect(() => setReason(currentReason), [currentReason]);

  return (
    <Modal open={open} onClose={onClose} title="Edit Break Reason" icon="✏️" color="#60a5fa">
      <label className="text-xs text-gray-400 mb-2 block">Break Reason</label>
      <textarea
        rows={4}
        className="input-field resize-none text-sm mb-4"
        value={reason}
        onChange={e => setReason(e.target.value)}
        placeholder="Why did you break the streak?"
      />
      <div className="flex gap-3">
        <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button
          onClick={() => { onSave(streakId, reason); onClose(); }}
          className="btn-primary flex-1"
        >
          💾 Save Reason
        </button>
      </div>
    </Modal>
  );
}

// ── History Modal ─────────────────────────────────────────────────────────────
function HistoryModal({
  open, onClose, history, best, onDelete, onEditReason
}: {
  open: boolean; onClose: () => void;
  history: StreakEntry[];
  best: number;
  onDelete: (id: string) => void;
  onEditReason: (entry: StreakEntry) => void;
}) {
  const [deleting, setDeleting] = useState<string | null>(null);

  return (
    <Modal open={open} onClose={onClose} title="Streak History" icon="📜" color="#a78bfa" wide>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total Attempts', value: history.length, color: '#a78bfa' },
          { label: 'Best Streak',    value: `${best}d`,     color: '#ffd700' },
          { label: 'Total Days',     value: `${history.reduce((s, h) => s + h.days, 0)}d`, color: '#34d399' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 text-center border border-white/5"
            style={{ background: `${s.color}11` }}>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {history.length === 0 ? (
        <p className="text-center text-gray-600 py-12">No streak history yet. Start your first streak!</p>
      ) : (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {history.map((entry, i) => {
            const col = entry.days >= 30 ? '#ffd700' : entry.days >= 14 ? '#34d399' : entry.days >= 7 ? '#60a5fa' : '#a78bfa';
            const start = new Date(entry.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            const end   = entry.endDate ? new Date(entry.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Ongoing';

            return (
              <motion.div key={entry._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="flex items-start gap-4">
                  {/* Day badge */}
                  <div className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center border shrink-0"
                    style={{ background: `${col}15`, borderColor: `${col}33` }}>
                    <span className="text-xl font-black" style={{ color: col }}>{entry.days}</span>
                    <span className="text-xs" style={{ color: col }}>days</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${entry.active ? 'badge-green' : 'badge-red'}`}>
                        {entry.active ? '🟢 Active' : '🔴 Broken'}
                      </span>
                      <span className="text-xs text-gray-600">
                        {start} → {end}
                      </span>
                    </div>
                    <div className="flex gap-2 text-xs text-gray-500 mb-2">
                      <span>{pad(entry.hours)}h {pad(entry.minutes)}m {pad(entry.seconds)}s</span>
                    </div>
                    {entry.breakReason && (
                      <div className="flex items-start gap-2 bg-red-500/5 border border-red-500/10 rounded-xl p-2">
                        <span className="text-red-400 text-xs shrink-0">💔 Reason:</span>
                        <p className="text-xs text-gray-400 flex-1">{entry.breakReason}</p>
                        <button
                          onClick={() => onEditReason(entry)}
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors shrink-0"
                        >✏️</button>
                      </div>
                    )}
                    {!entry.active && !entry.breakReason && (
                      <button
                        onClick={() => onEditReason(entry)}
                        className="text-xs text-gray-600 hover:text-blue-400 transition-colors"
                      >
                        + Add break reason
                      </button>
                    )}
                  </div>

                  {/* Delete */}
                  {deleting === entry._id ? (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => { onDelete(entry._id); setDeleting(null); }}
                        className="text-xs text-red-400 px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20">✓</button>
                      <button onClick={() => setDeleting(null)}
                        className="text-xs text-gray-500 px-2 py-1">✕</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleting(entry._id)}
                      className="text-xs text-gray-600 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-all shrink-0">
                      🗑
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function HealthyEatingStreak() {
  const [current, setCurrent]         = useState<StreakEntry | null>(null);
  const [history, setHistory]         = useState<StreakEntry[]>([]);
  const [best, setBest]               = useState(0);
  const [loading, setLoading]         = useState(true);
  const [showBreak, setShowBreak]     = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showStart, setShowStart]     = useState(false);
  const [editEntry, setEditEntry]     = useState<StreakEntry | null>(null);
  const [showConfetti, setConfetti]   = useState(false);

  // Live timer from server startDate
  const elapsed = useTimer(current?.active ? current.startDate : null);

  const load = useCallback(async () => {
    try {
      const r = await api.get('/streak/current');
      setCurrent(r.data.data.current);
      setHistory(r.data.data.history);
      const allBest = [...(r.data.data.history || []), r.data.data.current].reduce(
        (b: number, s: any) => s ? Math.max(b, s.bestDays || s.longestStreak || s.days || 0) : b, 0
      );
      setBest(allBest);
    } catch {
      // fallback: not logged in or API down
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStart = async () => {
    try {
      await api.post('/streak/start');
      toast('🔥 Streak started! Stay strong!', 'success');
      setShowStart(false);
      setConfetti(true);
      setTimeout(() => setConfetti(false), 3000);
      load();
    } catch { toast('Failed to start streak', 'error'); }
  };

  const handleBreak = async (reason: string) => {
    try {
      await api.post('/streak/break', { reason });
      toast('Streak broken. You can restart anytime! 💪', 'info');
      setShowBreak(false);
      load();
    } catch { toast('Failed to record break', 'error'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/streak/${id}`);
      setHistory(h => h.filter(x => x._id !== id));
      toast('Entry deleted', 'info');
    } catch { toast('Failed to delete', 'error'); }
  };

  const handleEditReason = async (id: string, reason: string) => {
    try {
      await api.patch(`/streak/${id}/reason`, { reason });
      setHistory(h => h.map(x => x._id === id ? { ...x, breakReason: reason } : x));
      toast('Reason updated ✓', 'success');
    } catch { toast('Failed to update reason', 'error'); }
  };

  const col = elapsed.days >= 30 ? '#ffd700'
    : elapsed.days >= 14 ? '#34d399'
    : elapsed.days >= 7  ? '#60a5fa'
    : '#a78bfa';

  const milestone = MILESTONES.slice().reverse().find(m => elapsed.days >= m.d);
  const nextMilestone = MILESTONES.find(m => elapsed.days < m.d);

  if (loading) {
    return (
      <div className="rounded-3xl p-5 border border-white/8 shimmer h-64"
        style={{ background: 'rgba(255,255,255,0.03)' }} />
    );
  }

  return (
    <>
      {/* ── Modals ─────────────────────────────────────────────────────── */}
      <BreakReasonModal
        open={showBreak}
        onClose={() => setShowBreak(false)}
        onConfirm={handleBreak}
        streakDays={elapsed.days}
      />
      <HistoryModal
        open={showHistory}
        onClose={() => setShowHistory(false)}
        history={[...(current && !current.active ? [current] : []), ...history]}
        best={best}
        onDelete={handleDelete}
        onEditReason={entry => { setEditEntry(entry); setShowHistory(false); }}
      />
      {editEntry && (
        <EditReasonModal
          open={!!editEntry}
          onClose={() => { setEditEntry(null); setShowHistory(true); }}
          onSave={handleEditReason}
          currentReason={editEntry.breakReason || ''}
          streakId={editEntry._id}
        />
      )}

      {/* Start confirm */}
      <AnimatePresence>
        {showStart && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}
            onClick={() => setShowStart(false)}
          >
            <motion.div
              initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85 }}
              onClick={e => e.stopPropagation()}
              className="glass-card p-7 max-w-sm w-full text-center"
            >
              <div className="text-6xl mb-4">🥗</div>
              <h2 className="text-white text-xl font-bold mb-2">Start Healthy Eating Streak</h2>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                Commit to eating <span className="text-green-400 font-semibold">healthy food every day</span>.
                No junk food. No fast food. The timer starts now and counts every second!
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowStart(false)} className="btn-secondary flex-1">Cancel</button>
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={handleStart}
                  className="flex-1 py-3 rounded-xl font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 8px 20px rgba(16,185,129,0.3)' }}
                >
                  🚀 Start Now!
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Widget ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="relative overflow-hidden rounded-3xl border"
        style={{
          background: current?.active
            ? `linear-gradient(135deg, ${col}0f, rgba(2,8,23,0.9))`
            : 'linear-gradient(135deg,rgba(255,255,255,0.04),rgba(2,8,23,0.9))',
          borderColor: current?.active ? `${col}33` : 'rgba(255,255,255,0.08)',
        }}
      >
        {/* Confetti */}
        <AnimatePresence>
          {showConfetti && (
            <>
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div key={i}
                  className="absolute text-xl pointer-events-none"
                  style={{ left: `${Math.random() * 100}%`, top: 0 }}
                  initial={{ y: -20, opacity: 1 }}
                  animate={{ y: 300, opacity: 0, rotate: Math.random() * 360 }}
                  transition={{ duration: 2 + Math.random(), delay: Math.random() * 0.5 }}
                >
                  {['🔥','⭐','✨','🎉','💪'][Math.floor(Math.random() * 5)]}
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Top glow line */}
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${current?.active ? col : '#ffffff33'}, transparent)` }} />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-white font-bold flex items-center gap-2">
                🥗 Healthy Eating Streak
              </h2>
              <p className="text-gray-500 text-xs mt-0.5">No junk food. No fast food. Stay consistent.</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600">Best</p>
              <p className="text-sm font-black" style={{ color: '#ffd700' }}>{best} days</p>
            </div>
          </div>

          {/* ── NOT STARTED ── */}
          {!current?.active && !current && (
            <div className="flex flex-col items-center py-6 gap-4">
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="text-6xl">🥗</motion.div>
              <div className="text-center">
                <p className="text-white font-semibold">Start Your Healthy Eating Journey</p>
                <p className="text-gray-500 text-sm mt-1">Timer counts every day, hour, minute and second</p>
              </div>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                onClick={() => setShowStart(true)}
                className="btn-primary px-8 py-3"
                style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 8px 25px rgba(16,185,129,0.3)' }}>
                🚀 Start Streak
              </motion.button>
              {history.length > 0 && (
                <button onClick={() => setShowHistory(true)} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
                  View history ({history.length} attempts)
                </button>
              )}
            </div>
          )}

          {/* ── ACTIVE ── */}
          {current?.active && (
            <div className="flex flex-col items-center">
              {/* Timer Ring */}
              <TimerRing elapsed={elapsed} active={true} />

              {/* Start date */}
              <p className="text-xs text-gray-600 mb-3">
                Started {new Date(current.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                {' at '}
                {new Date(current.startDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </p>

              {/* Milestone badge */}
              {milestone && (
                <motion.div key={milestone.d} initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full border mb-3 font-bold text-sm"
                  style={{ background: `${milestone.color}15`, borderColor: `${milestone.color}33`, color: milestone.color }}>
                  {milestone.icon} {milestone.label} milestone reached!
                </motion.div>
              )}

              {/* Next milestone */}
              {nextMilestone && (
                <p className="text-xs text-gray-600 mb-4">
                  Next: {nextMilestone.icon} {nextMilestone.label} in {nextMilestone.d - elapsed.days} day{nextMilestone.d - elapsed.days !== 1 ? 's' : ''}
                </p>
              )}

              {/* Milestone mini badges */}
              <div className="flex gap-2 flex-wrap justify-center mb-4">
                {MILESTONES.slice(0, 5).map(m => (
                  <motion.div key={m.d}
                    className="flex flex-col items-center px-2 py-1.5 rounded-xl border text-xs"
                    style={elapsed.days >= m.d
                      ? { background: `${m.color}15`, borderColor: `${m.color}33`, color: m.color }
                      : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)', color: '#374151' }}>
                    <span className="text-base">{elapsed.days >= m.d ? m.icon : '🔒'}</span>
                    <span>{m.label}</span>
                  </motion.div>
                ))}
              </div>

              {/* Break button */}
              <button
                onClick={() => setShowBreak(true)}
                className="text-xs text-gray-600 hover:text-red-400 transition-colors flex items-center gap-1"
              >
                😔 I broke my streak — write a reason
              </button>

              {/* History link */}
              {history.length > 0 && (
                <button onClick={() => setShowHistory(true)} className="text-xs text-gray-700 hover:text-gray-500 transition-colors mt-2">
                  📜 View {history.length} past attempt{history.length !== 1 ? 's' : ''}
                </button>
              )}
            </div>
          )}

          {/* ── BROKEN (no active streak, has history) ── */}
          {!current?.active && history.length > 0 && (
            <div className="flex flex-col items-center py-4 gap-3">
              <motion.div animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ duration: 0.5, delay: 0.2 }} className="text-5xl">💔</motion.div>
              <div className="text-center">
                <p className="text-red-400 font-bold text-lg">Streak Broken</p>
                <p className="text-gray-500 text-sm">Best was <span className="text-white font-semibold">{best} days</span>. Every day is a fresh start 💪</p>
              </div>
              {history[0]?.breakReason && (
                <div className="w-full bg-red-500/5 border border-red-500/10 rounded-2xl p-3 text-center">
                  <p className="text-xs text-gray-500">Last reason:</p>
                  <p className="text-sm text-gray-300 mt-0.5 italic">"{history[0].breakReason}"</p>
                </div>
              )}
              <div className="flex gap-3 w-full">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setShowStart(true)}
                  className="flex-1 py-3 rounded-2xl font-bold text-white text-sm"
                  style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', boxShadow: '0 8px 20px rgba(59,130,246,0.3)' }}>
                  🔄 Restart Streak
                </motion.button>
                <button onClick={() => setShowHistory(true)}
                  className="px-4 py-3 rounded-2xl text-xs text-gray-400 border border-white/10 hover:bg-white/5 transition-all">
                  📜 History
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
