import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/layout/Layout';
import { toast } from '../components/ui/Toast';

interface SleepSchedule {
  bedtime: string;
  wakeTime: string;
  goal: number;
  reminderEnabled: boolean;
  reminderMinutes: number;
}

interface SleepLog {
  date: string;
  bedtime: string;
  wakeTime: string;
  duration: number;
  quality: number;
  notes: string;
}

const DEFAULT_SCHEDULE: SleepSchedule = {
  bedtime: '23:00', wakeTime: '06:30',
  goal: 7.5, reminderEnabled: true, reminderMinutes: 30,
};

function calcDuration(bed: string, wake: string): number {
  const [bh, bm] = bed.split(':').map(Number);
  const [wh, wm] = wake.split(':').map(Number);
  let mins = (wh * 60 + wm) - (bh * 60 + bm);
  if (mins < 0) mins += 1440;
  return +(mins / 60).toFixed(1);
}

function getOptimalWake(bedtime: string, cycles = 5): string[] {
  const [bh, bm] = bedtime.split(':').map(Number);
  const cycleMinutes = 90;
  const fallAsleep   = 14; // avg minutes to fall asleep
  return [3, 4, 5, 6].map(c => {
    let total = bm + fallAsleep + c * cycleMinutes;
    const hours = (bh + Math.floor(total / 60)) % 24;
    const mins  = total % 60;
    return `${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}`;
  });
}

const QUALITY_LABELS = ['','Terrible','Poor','Fair','Good','Excellent'];
const QUALITY_COLORS = ['','#f87171','#fb923c','#fbbf24','#60a5fa','#34d399'];

// ── User-scoped helpers ──
import { useAuthStore } from '../hooks/useAuth';
function sk(uid: string, key: string) { return `${uid}:${key}`; }
function sGet<T>(uid: string, key: string, fallback: T): T {
  try { const v = localStorage.getItem(sk(uid, key)); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function sSave(uid: string, key: string, val: any) { localStorage.setItem(sk(uid, key), JSON.stringify(val)); }

export default function SleepSchedule() {
  const userId = useAuthStore(s => s.user?.id || 'guest');
  const [schedule, setSchedule] = useState<SleepSchedule>(() => sGet(userId, 'sleep-schedule', DEFAULT_SCHEDULE));
  const [logs, setLogs]         = useState<SleepLog[]>(() => sGet(userId, 'sleep-logs', []));

  // Reload when userId changes
  useEffect(() => {
    setSchedule(sGet(userId, 'sleep-schedule', DEFAULT_SCHEDULE));
    setLogs(sGet(userId, 'sleep-logs', []));
  }, [userId]);
  const [activeTab, setActiveTab] = useState<'schedule'|'log'|'history'>('schedule');
  const [newLog, setNewLog]     = useState<SleepLog>({
    date: new Date().toISOString().split('T')[0],
    bedtime: schedule.bedtime, wakeTime: schedule.wakeTime,
    duration: calcDuration(schedule.bedtime, schedule.wakeTime),
    quality: 3, notes: '',
  });
  const [editing, setEditing]   = useState<number | null>(null);

  const saveSchedule = () => {
    sSave(userId, 'sleep-schedule', schedule);
    toast('Sleep schedule saved ✓', 'success');
  };

  const addLog = () => {
    const dur = calcDuration(newLog.bedtime, newLog.wakeTime);
    const entry = { ...newLog, duration: dur };
    let updated: SleepLog[];
    if (editing !== null) {
      updated = logs.map((l, i) => i === editing ? entry : l);
      setEditing(null);
      toast('Log updated ✓', 'success');
    } else {
      updated = [entry, ...logs];
      toast('Sleep logged ✓', 'success');
    }
    setLogs(updated);
    sSave(userId, 'sleep-logs', updated);
    setNewLog({ date: new Date().toISOString().split('T')[0], bedtime: schedule.bedtime, wakeTime: schedule.wakeTime, duration: 7, quality: 3, notes: '' });
    setActiveTab('history');
  };

  const deleteLog = (i: number) => {
    const updated = logs.filter((_, j) => j !== i);
    setLogs(updated);
    sSave(userId, 'sleep-logs', updated);
    toast('Log deleted', 'info');
  };

  const editLog = (i: number) => {
    setNewLog(logs[i]);
    setEditing(i);
    setActiveTab('log');
  };

  const duration  = calcDuration(schedule.bedtime, schedule.wakeTime);
  const optimalWake = getOptimalWake(schedule.bedtime);
  const avgSleep  = logs.length ? (logs.reduce((s, l) => s + l.duration, 0) / logs.length).toFixed(1) : '—';
  const avgQuality = logs.length ? (logs.reduce((s, l) => s + l.quality, 0) / logs.length).toFixed(1) : '—';
  const durationColor = duration >= 7 ? '#34d399' : duration >= 6 ? '#fbbf24' : '#f87171';

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-3xl font-bold text-white">😴 Sleep Schedule</h1>
        <p className="text-gray-400 mt-1">Optimise your sleep for peak health and performance.</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Duration',   value: `${duration}h`,   color: durationColor,  icon: '⏱️' },
          { label: 'Avg Sleep',  value: `${avgSleep}h`,   color: '#60a5fa',      icon: '😴' },
          { label: 'Avg Quality',value: `${avgQuality}/5`, color: '#a78bfa',     icon: '⭐' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 text-center border border-white/5" style={{ background: `${s.color}11` }}>
            <span className="text-2xl block mb-1">{s.icon}</span>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {[
          { key: 'schedule', label: '⚙️ Schedule'  },
          { key: 'log',      label: '📝 Log Sleep'  },
          { key: 'history',  label: `📜 History (${logs.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)}
            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={activeTab === t.key
              ? { background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: 'white' }
              : { background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl space-y-4">
          <div className="rounded-2xl p-5 border border-white/8" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <h3 className="text-white font-semibold mb-4">🛏 Sleep Times</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">🌙 Bedtime</label>
                <input type="time" className="input-field text-lg font-mono"
                  value={schedule.bedtime}
                  onChange={e => setSchedule(s => ({ ...s, bedtime: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">☀️ Wake Time</label>
                <input type="time" className="input-field text-lg font-mono"
                  value={schedule.wakeTime}
                  onChange={e => setSchedule(s => ({ ...s, wakeTime: e.target.value }))} />
              </div>
            </div>
            <div className="rounded-xl p-4 text-center border mb-4"
              style={{ background: `${durationColor}11`, borderColor: `${durationColor}33` }}>
              <p className="text-3xl font-black" style={{ color: durationColor }}>{duration}h</p>
              <p className="text-xs text-gray-400 mt-1">
                {duration >= 7 ? '✅ Within recommended range (7–9h)' : '⚠️ Below recommended 7 hours'}
              </p>
            </div>
            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-1 block">
                Sleep Goal: <span className="text-white font-semibold">{schedule.goal}h</span>
              </label>
              <input type="range" min={6} max={10} step={0.5} className="w-full" style={{ accentColor: '#60a5fa' }}
                value={schedule.goal}
                onChange={e => setSchedule(s => ({ ...s, goal: +e.target.value }))} />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>6h</span><span className="text-blue-400">Recommended: 7–9h</span><span>10h</span>
              </div>
            </div>
            <button onClick={saveSchedule} className="btn-primary w-full py-3">💾 Save Schedule</button>
          </div>

          {/* Optimal wake times */}
          <div className="rounded-2xl p-5 border border-purple-500/20"
            style={{ background: 'rgba(139,92,246,0.06)' }}>
            <h3 className="text-white font-semibold mb-2">💡 Optimal Wake Times</h3>
            <p className="text-gray-500 text-xs mb-4">Based on 90-min sleep cycles from {schedule.bedtime}</p>
            <div className="grid grid-cols-4 gap-2">
              {optimalWake.map((w, i) => (
                <button key={w}
                  onClick={() => { setSchedule(s => ({ ...s, wakeTime: w })); toast(`Wake time set to ${w}`, 'success'); }}
                  className="py-3 rounded-xl text-sm font-bold border transition-all hover:scale-105"
                  style={{ background: 'rgba(139,92,246,0.15)', borderColor: 'rgba(139,92,246,0.3)', color: '#a78bfa' }}>
                  {w}
                  <span className="block text-xs font-normal text-purple-300/60 mt-0.5">{3+i} cycles</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sleep tips */}
          <div className="rounded-2xl p-5 border border-blue-500/15" style={{ background: 'rgba(59,130,246,0.05)' }}>
            <h3 className="text-blue-300 font-semibold text-sm mb-3">🤖 Sleep Tips</h3>
            <div className="space-y-2">
              {[
                '📵 Stop using screens 1 hour before bedtime — blue light blocks melatonin',
                '🌡️ Keep bedroom temperature between 18–20°C for deep sleep',
                '☕ Avoid caffeine after 2 PM — it has a 6–8 hour half-life',
                '🧘 Try 4-7-8 breathing to fall asleep faster: inhale 4s, hold 7s, exhale 8s',
                '🌅 Get morning sunlight within 30 minutes of waking to regulate circadian rhythm',
              ].map((tip, i) => (
                <p key={i} className="text-xs text-gray-400 flex gap-2">
                  <span className="shrink-0">{tip.slice(0, 2)}</span>
                  <span>{tip.slice(2)}</span>
                </p>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Log Tab */}
      {activeTab === 'log' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl">
          <div className="rounded-2xl p-5 border border-white/8" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <h3 className="text-white font-semibold mb-4">
              {editing !== null ? '✏️ Edit Sleep Log' : '📝 Log Last Night\'s Sleep'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Date</label>
                <input type="date" className="input-field"
                  value={newLog.date} onChange={e => setNewLog(l => ({ ...l, date: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">🌙 Went to Bed</label>
                  <input type="time" className="input-field font-mono"
                    value={newLog.bedtime}
                    onChange={e => setNewLog(l => ({ ...l, bedtime: e.target.value, duration: calcDuration(e.target.value, l.wakeTime) }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">☀️ Woke Up</label>
                  <input type="time" className="input-field font-mono"
                    value={newLog.wakeTime}
                    onChange={e => setNewLog(l => ({ ...l, wakeTime: e.target.value, duration: calcDuration(l.bedtime, e.target.value) }))} />
                </div>
              </div>
              <div className="text-center text-sm text-gray-400">
                Duration: <span className="text-white font-bold text-lg">{calcDuration(newLog.bedtime, newLog.wakeTime)}h</span>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Sleep Quality</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(q => (
                    <button key={q} onClick={() => setNewLog(l => ({ ...l, quality: q }))}
                      className="flex-1 py-2.5 rounded-xl border-2 text-sm font-bold transition-all"
                      style={newLog.quality === q
                        ? { borderColor: QUALITY_COLORS[q], background: `${QUALITY_COLORS[q]}22`, color: QUALITY_COLORS[q] }
                        : { borderColor: 'rgba(255,255,255,0.08)', color: '#6b7280' }}>
                      {q}⭐
                    </button>
                  ))}
                </div>
                <p className="text-xs text-center mt-1" style={{ color: QUALITY_COLORS[newLog.quality] }}>
                  {QUALITY_LABELS[newLog.quality]}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Notes (optional)</label>
                <textarea rows={2} placeholder="Any dreams, interruptions, how you feel..."
                  className="input-field resize-none text-sm"
                  value={newLog.notes} onChange={e => setNewLog(l => ({ ...l, notes: e.target.value }))} />
              </div>
              <div className="flex gap-3">
                {editing !== null && (
                  <button onClick={() => { setEditing(null); setActiveTab('history'); }} className="btn-secondary flex-1">Cancel</button>
                )}
                <button onClick={addLog} className="btn-primary flex-1 py-3">
                  {editing !== null ? '💾 Update Log' : '💾 Save Log'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl">
          {logs.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <p className="text-4xl mb-3">😴</p>
              <p className="text-white font-semibold">No sleep logs yet</p>
              <p className="text-gray-500 text-sm mt-1">Start logging your sleep to see history</p>
              <button onClick={() => setActiveTab('log')} className="btn-primary mt-4 text-sm py-2 px-5">Log Last Night →</button>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log, i) => {
                const col = log.duration >= 7 ? '#34d399' : log.duration >= 6 ? '#fbbf24' : '#f87171';
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all"
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center border shrink-0"
                      style={{ background: `${col}11`, borderColor: `${col}33` }}>
                      <span className="text-lg font-black" style={{ color: col }}>{log.duration}h</span>
                      <span className="text-xs" style={{ color: col }}>sleep</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">
                        {new Date(log.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">🌙 {log.bedtime} → ☀️ {log.wakeTime}</p>
                      {log.notes && <p className="text-xs text-gray-600 mt-0.5 truncate italic">"{log.notes}"</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold" style={{ color: QUALITY_COLORS[log.quality] }}>
                        {'⭐'.repeat(log.quality)}
                      </p>
                      <p className="text-xs text-gray-600">{QUALITY_LABELS[log.quality]}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => editLog(i)}
                        className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded-lg hover:bg-blue-500/10 transition-all">✏️</button>
                      <button onClick={() => deleteLog(i)}
                        className="text-xs text-gray-600 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-all">🗑</button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </Layout>
  );
}
