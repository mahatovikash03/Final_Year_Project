import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/layout/Layout';
import { toast } from '../components/ui/Toast';

interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  target: number;
  unit: string;
  category: string;
  streak: number;
  bestStreak: number;
  completedDays: string[];
  createdAt: string;
}

const PRESET_HABITS = [
  { name: 'Drink Water',        icon: '💧', color: '#34d399', target: 8,  unit: 'glasses',  category: 'Health'    },
  { name: 'Morning Walk',       icon: '🚶', color: '#60a5fa', target: 30, unit: 'minutes',  category: 'Fitness'   },
  { name: 'Read Books',         icon: '📚', color: '#a78bfa', target: 20, unit: 'minutes',  category: 'Growth'    },
  { name: 'Meditate',           icon: '🧘', color: '#f472b6', target: 10, unit: 'minutes',  category: 'Mental'    },
  { name: 'No Junk Food',       icon: '🥗', color: '#fbbf24', target: 1,  unit: 'day',      category: 'Nutrition' },
  { name: 'Sleep Early',        icon: '😴', color: '#818cf8', target: 1,  unit: 'night',    category: 'Health'    },
  { name: 'Exercise',           icon: '🏋️', color: '#fb923c', target: 45, unit: 'minutes',  category: 'Fitness'   },
  { name: 'Gratitude Journal',  icon: '📓', color: '#34d399', target: 3,  unit: 'entries',  category: 'Mental'    },
  { name: 'No Screen After 9',  icon: '📵', color: '#f87171', target: 1,  unit: 'day',      category: 'Health'    },
  { name: 'Cold Shower',        icon: '🚿', color: '#38bdf8', target: 1,  unit: 'shower',   category: 'Health'    },
  { name: 'Eat Vegetables',     icon: '🥦', color: '#22c55e', target: 3,  unit: 'servings', category: 'Nutrition' },
  { name: 'Stretch / Yoga',     icon: '🤸', color: '#e879f9', target: 15, unit: 'minutes',  category: 'Fitness'   },
];

const CATEGORIES = ['All', 'Health', 'Fitness', 'Nutrition', 'Mental', 'Growth'];

function todayStr() { return new Date().toISOString().split('T')[0]; }

// ── User-scoped helpers so habits never bleed between accounts ──
import { useAuthStore } from '../hooks/useAuth';
function hKey(uid: string) { return `${uid}:habits`; }
function loadHabits(uid: string): Habit[] {
  try { return JSON.parse(localStorage.getItem(hKey(uid)) || '[]'); } catch { return []; }
}
function saveHabits(uid: string, h: Habit[]) { localStorage.setItem(hKey(uid), JSON.stringify(h)); }

function calcStreak(completedDays: string[]): number {
  if (!completedDays.length) return 0;
  const sorted = [...completedDays].sort().reverse();
  const today  = todayStr();
  let streak   = 0;
  let current  = today;
  for (const day of sorted) {
    if (day === current) {
      streak++;
      const d = new Date(current);
      d.setDate(d.getDate() - 1);
      current = d.toISOString().split('T')[0];
    } else break;
  }
  return streak;
}

/* ── Habit Card ─────────────────────────────────────────────────────────── */
function HabitCard({ habit, onToggle, onDelete }: { habit: Habit; onToggle: (id: string) => void; onDelete: (id: string) => void }) {
  const today     = todayStr();
  const done      = habit.completedDays.includes(today);
  const streak    = calcStreak(habit.completedDays);
  const bestStreak = habit.bestStreak;

  // Last 7 days
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -2 }}
      className="rounded-2xl border p-4 transition-all"
      style={done
        ? { background: `${habit.color}0f`, borderColor: `${habit.color}33`, boxShadow: `0 0 20px ${habit.color}15` }
        : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <motion.span className="text-3xl"
            animate={done ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.3 }}>
            {habit.icon}
          </motion.span>
          <div>
            <p className="text-white font-semibold text-sm">{habit.name}</p>
            <p className="text-gray-500 text-xs">{habit.target} {habit.unit}/day</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {streak > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${habit.color}20`, color: habit.color }}>
              🔥 {streak}d
            </span>
          )}
          <button onClick={() => onDelete(habit.id)}
            className="text-gray-700 hover:text-red-400 transition-colors text-sm">✕</button>
        </div>
      </div>

      {/* 7-day dots */}
      <div className="flex gap-1 mb-3">
        {last7.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full h-2 rounded-full"
              style={{ background: habit.completedDays.includes(d) ? habit.color : 'rgba(255,255,255,0.08)' }} />
            <span className="text-xs text-gray-700">{new Date(d).toLocaleDateString('en',{weekday:'narrow'})}</span>
          </div>
        ))}
      </div>

      {/* Best streak + Complete button */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600">Best: {bestStreak}d</span>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onToggle(habit.id)}
          className="px-4 py-1.5 rounded-xl text-xs font-bold transition-all"
          style={done
            ? { background: `${habit.color}30`, color: habit.color, border: `1px solid ${habit.color}50` }
            : { background: 'rgba(255,255,255,0.07)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)' }}>
          {done ? '✓ Done today!' : 'Mark done'}
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────── */
export default function Habits() {
  const userId = useAuthStore(s => s.user?.id || 'guest');
  const [habits,     setHabits]     = useState<Habit[]>(() => loadHabits(userId));
  const [filter,     setFilter]     = useState('All');
  const [showAdd,    setShowAdd]    = useState(false);
  const [showPreset, setShowPreset] = useState(false);
  const [newHabit,   setNewHabit]   = useState({ name: '', icon: '⭐', color: '#60a5fa', target: 1, unit: 'time', category: 'Health' });

  useEffect(() => { setHabits(loadHabits(userId)); }, [userId]);

  const persist = (h: Habit[]) => { setHabits(h); saveHabits(userId, h); };

  const addPreset = (preset: typeof PRESET_HABITS[0]) => {
    const h: Habit = {
      id: Date.now().toString(),
      ...preset,
      streak: 0,
      bestStreak: 0,
      completedDays: [],
      createdAt: new Date().toISOString(),
    };
    persist([...habits, h]);
    toast(`${preset.name} habit added ✓`, 'success');
  };

  const addCustom = () => {
    if (!newHabit.name.trim()) { toast('Enter a habit name', 'error'); return; }
    const h: Habit = {
      id: Date.now().toString(),
      ...newHabit,
      streak: 0, bestStreak: 0,
      completedDays: [],
      createdAt: new Date().toISOString(),
    };
    persist([...habits, h]);
    setNewHabit({ name: '', icon: '⭐', color: '#60a5fa', target: 1, unit: 'time', category: 'Health' });
    setShowAdd(false);
    toast('Custom habit added ✓', 'success');
  };

  const toggleHabit = (id: string) => {
    const today  = todayStr();
    const updated = habits.map(h => {
      if (h.id !== id) return h;
      const already = h.completedDays.includes(today);
      const days    = already ? h.completedDays.filter(d => d !== today) : [...h.completedDays, today];
      const streak  = calcStreak(days);
      return { ...h, completedDays: days, streak, bestStreak: Math.max(h.bestStreak, streak) };
    });
    persist(updated);
    const hab = updated.find(h => h.id === id)!;
    if (hab.completedDays.includes(today)) toast(`${hab.name} completed! 🎉`, 'success');
  };

  const deleteHabit = (id: string) => {
    persist(habits.filter(h => h.id !== id));
    toast('Habit removed', 'info');
  };

  const filtered = filter === 'All' ? habits : habits.filter(h => h.category === filter);
  const today    = todayStr();
  const doneToday   = habits.filter(h => h.completedDays.includes(today)).length;
  const totalStreak = habits.reduce((s, h) => s + calcStreak(h.completedDays), 0);

  const ICONS = ['⭐','💪','🎯','🏆','✨','🌟','🔥','💡','🎨','🎵','📖','🌿','🧠','❤️','🚀'];
  const COLORS = ['#60a5fa','#34d399','#a78bfa','#f472b6','#fb923c','#fbbf24','#f87171','#38bdf8','#818cf8'];

  return (
    <Layout>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-white">🎯 Habit Tracker</h1>
            <p className="text-gray-400 mt-1">Build powerful daily habits, one day at a time.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowPreset(true)} className="btn-secondary text-sm py-2">
              📋 Add Preset
            </button>
            <button onClick={() => setShowAdd(true)} className="btn-primary text-sm py-2">
              + Custom Habit
            </button>
          </div>
        </div>
      </motion.div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total Habits',  value: habits.length,  icon: '🎯', color: '#60a5fa' },
          { label: 'Done Today',    value: `${doneToday}/${habits.length}`, icon: '✅', color: '#34d399' },
          { label: 'Total Streak',  value: `${totalStreak}d`, icon: '🔥', color: '#fbbf24' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 text-center border border-white/5"
            style={{ background: `${s.color}11` }}>
            <span className="text-2xl block mb-1">{s.icon}</span>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Daily progress bar */}
      {habits.length > 0 && (
        <div className="rounded-2xl p-4 border border-white/5 mb-5"
          style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-white font-semibold">Today's Progress</span>
            <span className="font-bold" style={{ color: doneToday === habits.length ? '#34d399' : '#60a5fa' }}>
              {doneToday}/{habits.length} completed
            </span>
          </div>
          <div className="h-3 rounded-full bg-white/5 overflow-hidden">
            <motion.div className="h-full rounded-full"
              style={{ background: doneToday === habits.length ? 'linear-gradient(90deg,#34d399,#10b981)' : 'linear-gradient(90deg,#3b82f6,#60a5fa)', boxShadow: '0 0 10px rgba(96,165,250,0.4)' }}
              animate={{ width: habits.length ? `${(doneToday / habits.length) * 100}%` : '0%' }}
              transition={{ duration: 0.8, ease: 'easeOut' }} />
          </div>
          {doneToday === habits.length && habits.length > 0 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center text-green-400 text-sm font-bold mt-2">
              🎉 All habits completed today! Amazing work!
            </motion.p>
          )}
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-5">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={filter === c
              ? { background: '#3b82f6', color: 'white' }
              : { background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)' }}>
            {c}
          </button>
        ))}
      </div>

      {/* Habits Grid */}
      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-20 rounded-2xl border border-white/5"
          style={{ background: 'rgba(255,255,255,0.02)' }}>
          <p className="text-5xl mb-4">🎯</p>
          <p className="text-white font-semibold text-lg">No habits yet</p>
          <p className="text-gray-500 text-sm mt-1 mb-5">Start building healthy habits today</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setShowPreset(true)} className="btn-secondary text-sm">Add Preset</button>
            <button onClick={() => setShowAdd(true)} className="btn-primary text-sm">Custom Habit</button>
          </div>
        </motion.div>
      ) : (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map(habit => (
              <HabitCard key={habit.id} habit={habit} onToggle={toggleHabit} onDelete={deleteHabit} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Preset Modal */}
      <AnimatePresence>
        {showPreset && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
            onClick={() => setShowPreset(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="glass-card p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-white text-xl font-bold">📋 Preset Habits</h2>
                <button onClick={() => setShowPreset(false)} className="text-gray-500 hover:text-white">✕</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRESET_HABITS.map((p, i) => {
                  const already = habits.some(h => h.name === p.name);
                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-3 p-3 rounded-xl border transition-all"
                      style={{ background: `${p.color}08`, borderColor: `${p.color}22` }}>
                      <span className="text-2xl">{p.icon}</span>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{p.name}</p>
                        <p className="text-gray-500 text-xs">{p.target} {p.unit}/day · {p.category}</p>
                      </div>
                      <button
                        onClick={() => { if (!already) { addPreset(p); } }}
                        disabled={already}
                        className="text-xs px-3 py-1.5 rounded-xl font-bold transition-all disabled:opacity-40"
                        style={already
                          ? { background: 'rgba(52,211,153,0.2)', color: '#34d399' }
                          : { background: `${p.color}20`, color: p.color, border: `1px solid ${p.color}33`, cursor: 'pointer' }}>
                        {already ? '✓' : '+ Add'}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Habit Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
            onClick={() => setShowAdd(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="glass-card p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-white text-xl font-bold">✨ Custom Habit</h2>
                <button onClick={() => setShowAdd(false)} className="text-gray-500 hover:text-white">✕</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Habit Name</label>
                  <input className="input-field" placeholder="e.g. Morning Pushups"
                    value={newHabit.name} onChange={e => setNewHabit(h => ({ ...h, name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Choose Icon</label>
                  <div className="flex flex-wrap gap-2">
                    {ICONS.map(ic => (
                      <button key={ic} onClick={() => setNewHabit(h => ({ ...h, icon: ic }))}
                        className="w-9 h-9 rounded-xl text-lg flex items-center justify-center border-2 transition-all"
                        style={newHabit.icon === ic
                          ? { borderColor: newHabit.color, background: `${newHabit.color}22` }
                          : { borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}>
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Colour</label>
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setNewHabit(h => ({ ...h, color: c }))}
                        className="w-8 h-8 rounded-xl border-2 transition-all"
                        style={{ background: c, borderColor: newHabit.color === c ? 'white' : 'transparent',
                          boxShadow: newHabit.color === c ? `0 0 10px ${c}77` : 'none' }} />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Daily Target</label>
                    <input type="number" min={1} className="input-field text-sm"
                      value={newHabit.target} onChange={e => setNewHabit(h => ({ ...h, target: +e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">Unit</label>
                    <input className="input-field text-sm" placeholder="times, mins, glasses..."
                      value={newHabit.unit} onChange={e => setNewHabit(h => ({ ...h, unit: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Category</label>
                  <select className="input-field text-sm" value={newHabit.category}
                    onChange={e => setNewHabit(h => ({ ...h, category: e.target.value }))}>
                    {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={addCustom} className="btn-primary flex-1">Add Habit</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
