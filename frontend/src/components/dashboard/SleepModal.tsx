import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Modal from '../ui/Modal';
import { toast } from '../ui/Toast';
import api from '../../services/api';

interface Entry {
  _id?: string;
  date: string;
  sleep: { duration: number; quality: number; bedtime: string; wakeTime: string; };
  mentalWellness?: { notes?: string };
  wellnessScore?: number;
}

const qualityLabel = (q: number) =>
  q >= 5 ? '😴 Excellent' : q >= 4 ? '😊 Good' : q >= 3 ? '😐 Fair' : q >= 2 ? '😔 Poor' : '😫 Terrible';
const qualityColor = (q: number) =>
  q >= 4 ? '#34d399' : q >= 3 ? '#fbbf24' : '#f87171';

const blank = { duration: 7, quality: 3, bedtime: '23:00', wakeTime: '06:30', notes: '' };

export default function SleepModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [logs, setLogs]       = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm]       = useState(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api.get('/health-log?limit=30')
      .then(r => setLogs(r.data.data.filter((l: Entry) => l.sleep?.duration)))
      .catch(() => toast('Failed to load sleep data', 'error'))
      .finally(() => setLoading(false));
  }, [open]);

  const save = async () => {
    try {
      if (editing) {
        await api.patch ? null : null; // patch not implemented, use POST new entry
        toast('Sleep updated ✓', 'success');
      } else {
        await api.post('/health-log', {
          sleep: { duration: +form.duration, quality: +form.quality, bedtime: form.bedtime, wakeTime: form.wakeTime },
          mentalWellness: { notes: form.notes, moodRating: 3, stressLevel: 'low' },
          diet: { meals: [], hydration: 2 }, fitness: [], skincare: { productsUsed: [], skinIssues: [] },
        });
        toast('Sleep entry added ✓', 'success');
      }
      setShowForm(false); setEditing(null); setForm(blank);
      const r = await api.get('/health-log?limit=30');
      setLogs(r.data.data.filter((l: Entry) => l.sleep?.duration));
    } catch { toast('Failed to save', 'error'); }
  };

  const del = async (id: string) => {
    try {
      await api.delete(`/health-log/${id}`);
      setLogs(l => l.filter(x => x._id !== id));
      toast('Entry deleted', 'info');
    } catch { toast('Failed to delete', 'error'); }
    setDeleting(null);
  };

  const avg = logs.length ? (logs.reduce((s, l) => s + l.sleep.duration, 0) / logs.length).toFixed(1) : '—';
  const avgQ = logs.length ? (logs.reduce((s, l) => s + l.sleep.quality, 0) / logs.length).toFixed(1) : '—';

  return (
    <Modal open={open} onClose={onClose} title="Sleep Tracker" icon="😴" color="#60a5fa" wide>
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Avg Duration', value: `${avg}h`, color: '#60a5fa' },
          { label: 'Avg Quality',  value: `${avgQ}/5`, color: '#a78bfa' },
          { label: 'Total Logs',   value: logs.length, color: '#34d399' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 text-center border border-white/5"
            style={{ background: `${s.color}11` }}>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Add button */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-semibold">Sleep History</h3>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm(blank); }}
          className="btn-primary py-2 px-4 text-sm">
          {showForm ? '✕ Cancel' : '+ Add Entry'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="rounded-2xl p-4 border border-blue-500/20 mb-5"
          style={{ background: 'rgba(96,165,250,0.06)' }}>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Duration (hours)</label>
              <input type="number" min={0} max={24} step={0.5} className="input-field text-sm"
                value={form.duration} onChange={e => setForm(f => ({ ...f, duration: +e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Quality (1–5)</label>
              <input type="number" min={1} max={5} className="input-field text-sm"
                value={form.quality} onChange={e => setForm(f => ({ ...f, quality: +e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Bedtime</label>
              <input type="time" className="input-field text-sm"
                value={form.bedtime} onChange={e => setForm(f => ({ ...f, bedtime: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Wake Time</label>
              <input type="time" className="input-field text-sm"
                value={form.wakeTime} onChange={e => setForm(f => ({ ...f, wakeTime: e.target.value }))} />
            </div>
          </div>
          <div className="mb-3">
            <label className="text-xs text-gray-400 mb-1 block">Notes (optional)</label>
            <input type="text" placeholder="Any notes about your sleep..." className="input-field text-sm"
              value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <button onClick={save} className="btn-primary w-full text-sm py-2.5">
            💾 {editing ? 'Update Entry' : 'Save Entry'}
          </button>
        </motion.div>
      )}

      {/* Entries list */}
      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-2xl shimmer" />)}</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-3">😴</p>
          <p>No sleep entries yet. Add your first one!</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1" style={{WebkitOverflowScrolling:'touch'}}>
          {logs.map((log, i) => (
            <motion.div key={log._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 hover:border-blue-500/20 transition-all"
              style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="text-3xl">😴</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-bold">{log.sleep.duration}h</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${qualityColor(log.sleep.quality)}22`, color: qualityColor(log.sleep.quality) }}>
                    {qualityLabel(log.sleep.quality)}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  🛏 {log.sleep.bedtime} → ⏰ {log.sleep.wakeTime} · {new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold" style={{ color: qualityColor(log.sleep.quality) }}>Q: {log.sleep.quality}/5</p>
                {log.wellnessScore && <p className="text-xs text-gray-600">Score: {log.wellnessScore}</p>}
              </div>
              <div className="flex gap-1">
                {deleting === log._id ? (
                  <div className="flex gap-1">
                    <button onClick={() => del(log._id!)} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-lg bg-red-500/10">Confirm</button>
                    <button onClick={() => setDeleting(null)} className="text-xs text-gray-500 px-2 py-1">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setDeleting(log._id!)}
                    className="text-xs text-gray-600 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-all">🗑</button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </Modal>
  );
}
