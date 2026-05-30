import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Modal from '../ui/Modal';
import { toast } from '../ui/Toast';
import api from '../../services/api';

export default function HydrationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [logs, setLogs]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [hydration, setHydration] = useState(2);
  const [goal] = useState(2.5);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/health-log?limit=30');
      setLogs(r.data.data.filter((l: any) => l.diet?.hydration));
    } catch { toast('Failed to load hydration data', 'error'); }
    setLoading(false);
  };

  useEffect(() => { if (open) load(); }, [open]);

  const save = async () => {
    try {
      await api.post('/health-log', {
        diet: { meals: [], hydration: +hydration },
        sleep: { duration: 7, quality: 3, bedtime: '23:00', wakeTime: '06:30' },
        mentalWellness: { moodRating: 3, stressLevel: 'low' },
        fitness: [], skincare: { productsUsed: [], skinIssues: [] },
      });
      toast('Hydration logged ✓', 'success');
      setShowForm(false); load();
    } catch { toast('Failed to save', 'error'); }
  };

  const del = async (id: string) => {
    try {
      await api.delete(`/health-log/${id}`);
      setLogs(l => l.filter(x => x._id !== id));
      toast('Deleted', 'info');
    } catch { toast('Failed to delete', 'error'); }
    setDeleting(null);
  };

  const avg    = logs.length ? (logs.reduce((s, l) => s + l.diet.hydration, 0) / logs.length).toFixed(1) : '0';
  const best   = logs.length ? Math.max(...logs.map(l => l.diet.hydration)).toFixed(1) : '—';
  const daysGoal = logs.filter(l => l.diet.hydration >= goal).length;

  return (
    <Modal open={open} onClose={onClose} title="Hydration Tracker" icon="💧" color="#34d399" wide>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Avg Daily', value: `${avg}L`, color: '#34d399' },
          { label: 'Best Day',  value: `${best}L`, color: '#60a5fa' },
          { label: 'Goal Hit',  value: `${daysGoal}d`, color: '#fbbf24' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 text-center border border-white/5" style={{ background: `${s.color}11` }}>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Goal progress */}
      {logs.length > 0 && (
        <div className="rounded-2xl p-4 border border-white/5 mb-5" style={{ background: 'rgba(52,211,153,0.05)' }}>
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Avg vs Daily Goal ({goal}L)</span>
            <span style={{ color: +avg >= goal ? '#34d399' : '#fbbf24' }}>{+avg >= goal ? '✅ Above Goal' : `${(goal - +avg).toFixed(1)}L to go`}</span>
          </div>
          <div className="h-3 rounded-full bg-white/5 overflow-hidden">
            <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#34d399,#60a5fa)', boxShadow: '0 0 10px rgba(52,211,153,0.4)' }}
              initial={{ width: 0 }} animate={{ width: `${Math.min((+avg / goal) * 100, 100)}%` }}
              transition={{ delay: 0.3, duration: 1.2 }} />
          </div>
          {/* Bar chart of last 7 */}
          <div className="mt-4">
            <p className="text-xs text-gray-600 mb-2">Last {Math.min(logs.length, 7)} days</p>
            <div className="flex gap-1.5 items-end h-12">
              {logs.slice(0, 7).reverse().map((l, i) => {
                const pct = Math.min((l.diet.hydration / goal) * 100, 100);
                const col = l.diet.hydration >= goal ? '#34d399' : '#60a5fa';
                return (
                  <motion.div key={i} className="flex-1 rounded-t-md" style={{ backgroundColor: col, minHeight: 4, opacity: 0.8 }}
                    initial={{ height: 0 }} animate={{ height: `${pct * 0.48}px` }}
                    transition={{ delay: 0.4 + i * 0.06, duration: 0.5 }} title={`${l.diet.hydration}L`} />
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-semibold">Hydration History</h3>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary py-2 px-4 text-sm">
          {showForm ? '✕ Cancel' : '+ Log Intake'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="rounded-2xl p-4 border border-green-500/20 mb-5"
          style={{ background: 'rgba(52,211,153,0.06)' }}>
          <label className="text-xs text-gray-400 mb-1 block">Water Consumed (litres)</label>
          <input type="number" min={0} max={10} step={0.25} className="input-field mb-3"
            value={hydration} onChange={e => setHydration(+e.target.value)} />
          {/* Quick buttons */}
          <div className="flex gap-2 mb-3">
            {[1, 1.5, 2, 2.5, 3].map(v => (
              <button key={v} onClick={() => setHydration(v)}
                className="flex-1 py-1.5 text-xs rounded-xl border transition-all"
                style={hydration === v ? { background: '#34d39922', borderColor: '#34d39955', color: '#34d399' } : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)', color: '#6b7280' }}>
                {v}L
              </button>
            ))}
          </div>
          <button onClick={save} className="btn-primary w-full text-sm py-2.5">💾 Save</button>
        </motion.div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-2xl shimmer" />)}</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-gray-500"><p className="text-4xl mb-3">💧</p><p>No hydration logs yet!</p></div>
      ) : (
        <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1" style={{WebkitOverflowScrolling:'touch'}}>
          {logs.map((log, i) => {
            const pct = Math.min((log.diet.hydration / goal) * 100, 100);
            const col = log.diet.hydration >= goal ? '#34d399' : '#60a5fa';
            return (
              <motion.div key={log._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 hover:border-green-500/20 transition-all"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="text-3xl">💧</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-bold">{log.diet.hydration}L</span>
                    <span className="text-xs" style={{ color: col }}>{pct.toFixed(0)}% of goal</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: col }} />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                {deleting === log._id ? (
                  <div className="flex gap-1">
                    <button onClick={() => del(log._id)} className="text-xs text-red-400 px-2 py-1 rounded-lg bg-red-500/10">Delete</button>
                    <button onClick={() => setDeleting(null)} className="text-xs text-gray-500 px-2 py-1">No</button>
                  </div>
                ) : (
                  <button onClick={() => setDeleting(log._id)} className="text-xs text-gray-600 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-all">🗑</button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
