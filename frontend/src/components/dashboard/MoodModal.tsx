import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Modal from '../ui/Modal';
import { toast } from '../ui/Toast';
import api from '../../services/api';

const moodEmojis = ['', '😢', '😔', '😐', '🙂', '😄'];
const moodLabels = ['', 'Terrible', 'Bad', 'Okay', 'Good', 'Great'];
const moodColors = ['', '#f87171', '#fb923c', '#fbbf24', '#60a5fa', '#34d399'];

export default function MoodModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [logs, setLogs]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]       = useState({ moodRating: 3, stressLevel: 'low', notes: '' });
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/health-log?limit=30');
      setLogs(r.data.data.filter((l: any) => l.mentalWellness?.moodRating));
    } catch { toast('Failed to load mood data', 'error'); }
    setLoading(false);
  };

  useEffect(() => { if (open) load(); }, [open]);

  const save = async () => {
    try {
      await api.post('/health-log', {
        mentalWellness: { moodRating: +form.moodRating, stressLevel: form.stressLevel, notes: form.notes },
        sleep: { duration: 7, quality: 3, bedtime: '23:00', wakeTime: '06:30' },
        diet: { meals: [], hydration: 2 }, fitness: [], skincare: { productsUsed: [], skinIssues: [] },
      });
      toast('Mood logged ✓', 'success');
      setShowForm(false);
      setForm({ moodRating: 3, stressLevel: 'low', notes: '' });
      load();
    } catch { toast('Failed to save', 'error'); }
  };

  const del = async (id: string) => {
    try {
      await api.delete(`/health-log/${id}`);
      setLogs(l => l.filter((x: any) => x._id !== id));
      toast('Entry deleted', 'info');
    } catch { toast('Failed to delete', 'error'); }
    setDeleting(null);
  };

  const avg = logs.length
    ? (logs.reduce((s, l) => s + l.mentalWellness.moodRating, 0) / logs.length).toFixed(1)
    : '—';

  const distribution = [1, 2, 3, 4, 5].map(m => ({
    mood: m,
    count: logs.filter(l => l.mentalWellness.moodRating === m).length,
  }));

  return (
    <Modal open={open} onClose={onClose} title="Mood Tracker" icon="😊" color="#a78bfa" wide>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Avg Mood', value: `${avg}/5`, color: '#a78bfa' },
          { label: 'Total Entries', value: logs.length, color: '#60a5fa' },
          { label: 'Best Mood', value: logs.length ? `${Math.max(...logs.map(l => l.mentalWellness.moodRating))}/5` : '—', color: '#34d399' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 text-center border border-white/5" style={{ background: `${s.color}11` }}>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Mood distribution bar */}
      <div className="rounded-2xl p-4 border border-white/5 mb-5" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <p className="text-xs text-gray-500 mb-3 font-medium">MOOD DISTRIBUTION</p>
        <div className="flex gap-2 items-end h-16">
          {distribution.map(d => (
            <div key={d.mood} className="flex-1 flex flex-col items-center gap-1">
              <motion.div className="w-full rounded-t-lg"
                style={{ backgroundColor: moodColors[d.mood], minHeight: 4 }}
                initial={{ height: 0 }}
                animate={{ height: logs.length ? `${(d.count / logs.length) * 60}px` : '4px' }}
                transition={{ delay: 0.3, duration: 0.8 }}
              />
              <span className="text-xs">{moodEmojis[d.mood]}</span>
              <span className="text-xs text-gray-600">{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-semibold">Mood History</h3>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary py-2 px-4 text-sm">
          {showForm ? '✕ Cancel' : '+ Log Mood'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="rounded-2xl p-4 border border-purple-500/20 mb-5"
          style={{ background: 'rgba(167,139,250,0.06)' }}>
          <p className="text-xs text-gray-400 mb-2">How are you feeling?</p>
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4, 5].map(m => (
              <button key={m} onClick={() => setForm(f => ({ ...f, moodRating: m }))}
                className="flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border transition-all"
                style={form.moodRating === m ? { background: `${moodColors[m]}22`, borderColor: `${moodColors[m]}55`, boxShadow: `0 0 16px ${moodColors[m]}33` } : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)' }}>
                <span className="text-2xl">{moodEmojis[m]}</span>
                <span className="text-xs" style={{ color: form.moodRating === m ? moodColors[m] : '#4b5563' }}>{moodLabels[m]}</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Stress Level</label>
              <select className="input-field text-sm" value={form.stressLevel}
                onChange={e => setForm(f => ({ ...f, stressLevel: e.target.value }))}>
                <option value="low">Low 🟢</option>
                <option value="moderate">Moderate 🟡</option>
                <option value="high">High 🔴</option>
              </select>
            </div>
          </div>
          <div className="mb-3">
            <label className="text-xs text-gray-400 mb-1 block">Journal Notes</label>
            <textarea rows={2} placeholder="What's on your mind..." className="input-field text-sm resize-none"
              value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <button onClick={save} className="btn-primary w-full text-sm py-2.5">💾 Save Mood</button>
        </motion.div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-2xl shimmer" />)}</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-gray-500"><p className="text-4xl mb-3">😊</p><p>No mood entries yet!</p></div>
      ) : (
        <div className="space-y-3">
          {logs.map((log, i) => {
            const m = log.mentalWellness.moodRating;
            return (
              <motion.div key={log._id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 hover:border-purple-500/20 transition-all"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="text-3xl">{moodEmojis[m]}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">{moodLabels[m]}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${moodColors[m]}22`, color: moodColors[m] }}>
                      {log.mentalWellness.stressLevel} stress
                    </span>
                  </div>
                  {log.mentalWellness.notes && <p className="text-xs text-gray-500 mt-0.5 truncate">{log.mentalWellness.notes}</p>}
                  <p className="text-xs text-gray-600 mt-0.5">{new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black" style={{ color: moodColors[m] }}>{m}/5</p>
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
