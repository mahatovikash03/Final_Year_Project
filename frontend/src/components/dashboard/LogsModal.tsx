import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Modal from '../ui/Modal';
import { toast } from '../ui/Toast';
import api from '../../services/api';

export default function LogsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [logs, setLogs]     = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/health-log?limit=50');
      setLogs(r.data.data);
      setFiltered(r.data.data);
    } catch { toast('Failed to load logs', 'error'); }
    setLoading(false);
  };

  useEffect(() => { if (open) load(); }, [open]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q ? logs.filter(l =>
      new Date(l.date).toLocaleDateString().includes(q) ||
      String(l.wellnessScore).includes(q) ||
      l.mentalWellness?.notes?.toLowerCase().includes(q)
    ) : logs);
  }, [search, logs]);

  const del = async (id: string) => {
    try {
      await api.delete(`/health-log/${id}`);
      const updated = logs.filter(x => x._id !== id);
      setLogs(updated); setFiltered(updated);
      toast('Log deleted', 'info');
    } catch { toast('Failed to delete', 'error'); }
    setDeleting(null);
  };

  const scoreColor = (s: number) => s >= 70 ? '#34d399' : s >= 50 ? '#fbbf24' : '#f87171';

  return (
    <Modal open={open} onClose={onClose} title="All Health Logs" icon="📋" color="#f472b6" wide>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total Logs', value: logs.length, color: '#f472b6' },
          { label: 'Best Score', value: logs.length ? Math.max(...logs.map(l => l.wellnessScore || 0)) : '—', color: '#34d399' },
          { label: 'Avg Score',  value: logs.length ? Math.round(logs.reduce((s, l) => s + (l.wellnessScore || 0), 0) / logs.length) : '—', color: '#60a5fa' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 text-center border border-white/5" style={{ background: `${s.color}11` }}>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
        <input type="text" placeholder="Search by date, score, notes..."
          className="input-field pl-9 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-semibold">{filtered.length} Log{filtered.length !== 1 ? 's' : ''}</h3>
        <a href="/log" className="btn-primary py-2 px-4 text-sm">+ New Log</a>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-2xl shimmer" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500"><p className="text-4xl mb-3">📋</p><p>{search ? 'No results found' : 'No logs yet'}</p></div>
      ) : (
        <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1" style={{WebkitOverflowScrolling:'touch'}}>
          {filtered.map((log, i) => (
            <motion.div key={log._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="p-4 rounded-2xl border border-white/5 hover:border-pink-500/20 transition-all"
              style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-white font-bold text-sm">
                      {new Date(log.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    {log.wellnessScore != null && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ background: `${scoreColor(log.wellnessScore)}22`, color: scoreColor(log.wellnessScore) }}>
                        Score: {log.wellnessScore}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3 flex-wrap text-xs text-gray-500">
                    {log.sleep?.duration && <span>😴 {log.sleep.duration}h sleep</span>}
                    {log.diet?.hydration && <span>💧 {log.diet.hydration}L water</span>}
                    {log.fitness?.length > 0 && <span>🏋️ {log.fitness.length} workout{log.fitness.length > 1 ? 's' : ''}</span>}
                    {log.mentalWellness?.moodRating && <span>😊 Mood {log.mentalWellness.moodRating}/5</span>}
                  </div>
                  {log.mentalWellness?.notes && (
                    <p className="text-xs text-gray-600 mt-1 italic truncate">"{log.mentalWellness.notes}"</p>
                  )}
                </div>
                {deleting === log._id ? (
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => del(log._id)} className="text-xs text-red-400 px-2 py-1 rounded-lg bg-red-500/10">Delete</button>
                    <button onClick={() => setDeleting(null)} className="text-xs text-gray-500 px-2 py-1">No</button>
                  </div>
                ) : (
                  <button onClick={() => setDeleting(log._id)} className="text-xs text-gray-600 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-all shrink-0">🗑</button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </Modal>
  );
}
