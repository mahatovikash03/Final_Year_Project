import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Modal from '../ui/Modal';
import { toast } from '../ui/Toast';
import api from '../../services/api';

const intensityColor = { low: '#34d399', moderate: '#fbbf24', high: '#f87171' };

export default function WorkoutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [logs, setLogs]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]       = useState({ type: '', duration: '30', intensity: 'moderate', notes: '' });
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/health-log?limit=30');
      const wLogs: any[] = [];
      r.data.data.forEach((l: any) => {
        if (l.fitness?.length) {
          l.fitness.forEach((f: any) => wLogs.push({ ...f, _id: l._id, date: l.date, logId: l._id }));
        }
      });
      setLogs(wLogs);
    } catch { toast('Failed to load workouts', 'error'); }
    setLoading(false);
  };

  useEffect(() => { if (open) load(); }, [open]);

  const save = async () => {
    if (!form.type) { toast('Enter exercise type', 'error'); return; }
    try {
      await api.post('/health-log', {
        fitness: [{ type: form.type, duration: Math.max(1, parseInt(form.duration) || 1), intensity: form.intensity }],
        sleep: { duration: 7, quality: 3, bedtime: '23:00', wakeTime: '06:30' },
        mentalWellness: { moodRating: 3, stressLevel: 'low', notes: form.notes },
        diet: { meals: [], hydration: 2 }, skincare: { productsUsed: [], skinIssues: [] },
      });
      toast('Workout logged ✓', 'success');
      setShowForm(false); setForm({ type: '', duration: '30', intensity: 'moderate', notes: '' }); load();
    } catch { toast('Failed to save', 'error'); }
  };

  const del = async (id: string) => {
    try {
      await api.delete(`/health-log/${id}`);
      setLogs(l => l.filter(x => x.logId !== id));
      toast('Deleted', 'info');
    } catch { toast('Failed to delete', 'error'); }
    setDeleting(null);
  };

  const totalMins  = logs.reduce((s, l) => s + (l.duration || 0), 0);
  const avgDur     = logs.length ? (totalMins / logs.length).toFixed(0) : '—';
  const categories = [...new Set(logs.map(l => l.type))];

  return (
    <Modal open={open} onClose={onClose} title="Workout Tracker" icon="🏋️" color="#fb923c" wide>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Sessions', value: logs.length,    color: '#fb923c' },
          { label: 'Total Minutes',  value: `${totalMins}`, color: '#f97316' },
          { label: 'Avg Duration',   value: `${avgDur}m`,   color: '#fbbf24' },
          { label: 'Exercise Types', value: categories.length, color: '#34d399' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-3 text-center border border-white/5" style={{ background: `${s.color}11` }}>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Category chips */}
      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-5">
          {categories.map(c => (
            <span key={c} className="badge badge-yellow text-xs">{c}</span>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-semibold">Workout History</h3>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary py-2 px-4 text-sm">
          {showForm ? '✕ Cancel' : '+ Log Workout'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="rounded-2xl p-4 border border-orange-500/20 mb-5"
          style={{ background: 'rgba(251,146,60,0.06)' }}>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Exercise Type</label>
              <input type="text" placeholder="Running, Yoga, Gym..." className="input-field text-sm"
                value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Duration (minutes)</label>
              <input type="number" min={1} max={300} className="input-field text-sm"
                value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                onBlur={e => {
                  const v = parseInt(e.target.value);
                  setForm(f => ({ ...f, duration: String(isNaN(v) || v < 1 ? 1 : v) }));
                }} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Intensity</label>
              <select className="input-field text-sm" value={form.intensity}
                onChange={e => setForm(f => ({ ...f, intensity: e.target.value }))}>
                <option value="low">Low 🟢</option>
                <option value="moderate">Moderate 🟡</option>
                <option value="high">High 🔴</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Notes</label>
              <input type="text" placeholder="Optional notes..." className="input-field text-sm"
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <button onClick={save} className="btn-primary w-full text-sm py-2.5">💾 Save Workout</button>
        </motion.div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-2xl shimmer" />)}</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-gray-500"><p className="text-4xl mb-3">🏋️</p><p>No workouts logged yet!</p></div>
      ) : (
        <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1" style={{WebkitOverflowScrolling:'touch'}}>
          {logs.map((log, i) => (
            <motion.div key={`${log.logId}-${i}`} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 hover:border-orange-500/20 transition-all"
              style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl"
                style={{ background: `${(intensityColor as any)[log.intensity] || '#fb923c'}22` }}>🏃</div>
              <div className="flex-1">
                <p className="text-white font-bold">{log.type || 'Workout'}</p>
                <p className="text-xs text-gray-500">{log.duration} mins · {new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full font-semibold"
                style={{ background: `${(intensityColor as any)[log.intensity] || '#fb923c'}22`, color: (intensityColor as any)[log.intensity] || '#fb923c' }}>
                {log.intensity}
              </span>
              {deleting === log.logId ? (
                <div className="flex gap-1">
                  <button onClick={() => del(log.logId)} className="text-xs text-red-400 px-2 py-1 rounded-lg bg-red-500/10">Delete</button>
                  <button onClick={() => setDeleting(null)} className="text-xs text-gray-500 px-2 py-1">No</button>
                </div>
              ) : (
                <button onClick={() => setDeleting(log.logId)} className="text-xs text-gray-600 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-all">🗑</button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </Modal>
  );
}
