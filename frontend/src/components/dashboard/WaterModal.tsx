import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Modal from '../ui/Modal';
import { toast } from '../ui/Toast';

interface Props { open: boolean; onClose: () => void; }

const GOAL = 8;
const KEY  = 'water-today';
const HIST = 'water-history';

function todayStr() { return new Date().toISOString().split('T')[0]; }

interface DayLog { date: string; glasses: number; }

export default function WaterModal({ open, onClose }: Props) {
  const [glasses, setGlasses] = useState(() => {
    try { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : 0; } catch { return 0; }
  });
  const [history, setHistory] = useState<DayLog[]>(() => {
    try { const s = localStorage.getItem(HIST); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [goal, setGoal]     = useState(GOAL);
  const [editing, setEditing] = useState(false);
  const [newGoal, setNewGoal] = useState(String(GOAL));

  const save = (n: number) => {
    setGlasses(n);
    localStorage.setItem(KEY, JSON.stringify(n));
    // Update history
    const today = todayStr();
    const hist  = history.filter(h => h.date !== today);
    const updated = [{ date: today, glasses: n }, ...hist].slice(0, 30);
    setHistory(updated);
    localStorage.setItem(HIST, JSON.stringify(updated));
  };

  const add = () => {
    if (glasses >= goal) { toast('Daily goal already reached! 🎉', 'info'); return; }
    save(glasses + 1);
    toast(`Glass ${glasses + 1}/${goal} logged 💧`, 'success');
  };

  const remove = () => {
    if (glasses <= 0) return;
    save(glasses - 1);
    toast('Removed one glass', 'info');
  };

  const reset = () => {
    save(0);
    toast('Water intake reset', 'info');
  };

  const updateGoal = () => {
    const g = Math.max(1, Math.min(20, +newGoal));
    setGoal(g);
    setEditing(false);
    toast(`Goal updated to ${g} glasses ✓`, 'success');
  };

  const pct = Math.min((glasses / goal) * 100, 100);
  const col = pct >= 100 ? '#34d399' : pct >= 50 ? '#60a5fa' : '#a78bfa';
  const litres = (glasses * 0.25).toFixed(2);
  const avgWeek = history.length
    ? (history.slice(0, 7).reduce((s, h) => s + h.glasses, 0) / Math.min(history.length, 7)).toFixed(1)
    : '0';

  return (
    <Modal open={open} onClose={onClose} title="Water Intake Tracker" icon="💧" color="#60a5fa" wide>
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Today's Glasses", value: `${glasses}/${goal}`, color: col },
          { label: 'Litres Today',    value: `${litres}L`,         color: '#60a5fa' },
          { label: '7-Day Avg',       value: `${avgWeek} gl`,      color: '#a78bfa' },
          { label: 'Progress',        value: `${pct.toFixed(0)}%`, color: '#34d399' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-3 text-center border border-white/5" style={{ background: `${s.color}11` }}>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Big progress ring */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative">
          {(() => {
            const S=160, sw=12, r=(S-sw)/2, circ=2*Math.PI*r, offset=circ-(pct/100)*circ;
            return (
              <svg width={S} height={S} style={{ filter: `drop-shadow(0 0 20px ${col}55)` }}>
                <circle cx={S/2} cy={S/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={sw}/>
                <motion.circle cx={S/2} cy={S/2} r={r} fill="none" stroke={col} strokeWidth={sw}
                  strokeLinecap="round" strokeDasharray={circ}
                  initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  style={{ transformOrigin: `${S/2}px ${S/2}px`, transform: 'rotate(-90deg)' }}/>
                <text x={S/2} y={S/2-8} textAnchor="middle" fill="white" fontSize="28" fontWeight="900">{glasses}</text>
                <text x={S/2} y={S/2+12} textAnchor="middle" fill={col} fontSize="10" fontWeight="700">OF {goal} GLASSES</text>
                <text x={S/2} y={S/2+26} textAnchor="middle" fill="rgba(148,163,184,0.5)" fontSize="8">{litres} LITRES</text>
              </svg>
            );
          })()}
        </div>
        {glasses >= goal && (
          <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="text-green-400 font-bold text-sm mt-2">
            🎉 Daily goal reached! Amazing!
          </motion.p>
        )}
      </div>

      {/* Glasses grid */}
      <div className="grid grid-cols-8 gap-2 mb-5">
        {Array.from({ length: goal }).map((_, i) => (
          <motion.div key={i} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            className="flex flex-col items-center gap-1 p-2 rounded-xl border cursor-pointer transition-all"
            style={i < glasses
              ? { background: `${col}22`, borderColor: `${col}55`, boxShadow: `0 0 10px ${col}33` }
              : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}
            onClick={add}>
            <span className="text-2xl">{i < glasses ? '🥤' : '⬜'}</span>
            <span className="text-xs" style={{ color: i < glasses ? col : '#374151' }}>{i + 1}</span>
          </motion.div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mb-6">
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={add} className="flex-1 py-3 rounded-2xl font-bold text-white text-sm"
          style={{ background: `linear-gradient(135deg,${col},#0ea5e9)`, boxShadow: `0 8px 20px ${col}33` }}>
          + Add Glass 💧
        </motion.button>
        <button onClick={remove} className="btn-secondary py-3 px-4 text-sm">− Remove</button>
        <button onClick={reset}  className="btn-secondary py-3 px-4 text-sm text-red-400">Reset</button>
      </div>

      {/* Goal editor */}
      <div className="rounded-2xl p-4 border border-white/5 mb-5" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-semibold text-sm">Daily Goal</p>
            <p className="text-gray-500 text-xs">Currently set to {goal} glasses ({(goal * 0.25).toFixed(1)}L)</p>
          </div>
          {editing ? (
            <div className="flex gap-2 items-center">
              <input type="number" min={1} max={20} value={newGoal}
                onChange={e => setNewGoal(e.target.value)}
                className="input-field w-20 text-sm py-2 text-center" />
              <button onClick={updateGoal} className="btn-primary py-2 px-3 text-xs">Save</button>
              <button onClick={() => setEditing(false)} className="btn-secondary py-2 px-3 text-xs">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="btn-secondary py-2 px-4 text-xs">Edit Goal</button>
          )}
        </div>
      </div>

      {/* 7-day history */}
      {history.length > 0 && (
        <>
          <p className="text-xs text-gray-500 font-medium mb-3">LAST 7 DAYS</p>
          <div className="space-y-2">
            {history.slice(0, 7).map((h, i) => {
              const p = Math.min((h.glasses / goal) * 100, 100);
              const c = p >= 100 ? '#34d399' : p >= 50 ? '#60a5fa' : '#a78bfa';
              return (
                <motion.div key={h.date} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-white/5"
                  style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <span className="text-xs text-gray-500 w-20 shrink-0">
                    {i === 0 ? 'Today' : new Date(h.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: c, width: `${p}%` }}
                      initial={{ width: 0 }} animate={{ width: `${p}%` }} transition={{ delay: 0.3 + i * 0.05 }} />
                  </div>
                  <span className="text-xs font-bold shrink-0" style={{ color: c }}>{h.glasses}/{goal}</span>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </Modal>
  );
}
