import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/layout/Layout';
import api from '../services/api';
import { useAuthStore } from '../hooks/useAuth';
import { toast } from '../components/ui/Toast';

const categories = [
  { key: 'sleep',  label: 'Sleep Issues',      icon: '😴', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'  },
  { key: 'gut',    label: 'Gut & Digestion',    icon: '🫃', color: '#34d399', bg: 'rgba(52,211,153,0.1)'  },
  { key: 'stress', label: 'Stress & Anxiety',   icon: '🧠', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  { key: 'skin',   label: 'Skin Concerns',      icon: '✨', color: '#f472b6', bg: 'rgba(244,114,182,0.1)' },
];

const durationOptions = ['Less than a day', '1–2 days', '3–7 days', '1–2 weeks', 'More than 2 weeks'];

export default function Symptoms() {
  const { user } = useAuthStore();
  const [selected,  setSelected]  = useState('');
  const [severity,  setSeverity]  = useState(3);
  const [duration,  setDuration]  = useState('1–2 days');
  const [notes,     setNotes]     = useState('');
  const [result,    setResult]    = useState<any>(null);
  const [loading,   setLoading]   = useState(false);
  const [history,   setHistory]   = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'check'|'history'>('check');

  useEffect(() => {
    api.get('/symptoms/history').then(r => setHistory(r.data.data || [])).catch(() => {});
  }, []);

  const handleCheck = async () => {
    if (!selected) { toast('Please select a category', 'error'); return; }
    setLoading(true); setResult(null);
    try {
      const { data } = await api.post('/symptoms/check', { category: selected, severity, duration, notes });
      setResult(data.data);
      // reload history
      api.get('/symptoms/history').then(r => setHistory(r.data.data || [])).catch(() => {});
    } catch { toast('Failed to get suggestions', 'error'); }
    setLoading(false);
  };

  const severityLabel = severity <= 1 ? 'Very Mild' : severity === 2 ? 'Mild' : severity === 3 ? 'Moderate' : severity === 4 ? 'Severe' : 'Very Severe';
  const severityColor = severity <= 2 ? '#34d399' : severity === 3 ? '#fbbf24' : '#f87171';

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-3xl font-bold text-white">🩺 Symptom Checker</h1>
        <p className="text-gray-400 mt-1">Get AI-powered wellness suggestions based on your symptoms.</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[{ key: 'check', label: '🔍 Check Symptoms' }, { key: 'history', label: `📜 History (${history.length})` }].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={activeTab === t.key
              ? { background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: 'white', boxShadow: '0 4px 15px rgba(59,130,246,0.3)' }
              : { background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'check' && (
        <div className="max-w-2xl">
          {/* Category Selection */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-medium">Step 1 — Select Category</p>
            <div className="grid grid-cols-2 gap-3">
              {categories.map(cat => (
                <motion.button key={cat.key} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => { setSelected(cat.key); setResult(null); }}
                  className="flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left"
                  style={selected === cat.key
                    ? { background: cat.bg, borderColor: cat.color, boxShadow: `0 0 20px ${cat.color}33` }
                    : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
                  <span className="text-3xl">{cat.icon}</span>
                  <div>
                    <p className="text-white font-semibold text-sm">{cat.label}</p>
                    <p className="text-gray-500 text-xs mt-0.5">Tap to select</p>
                  </div>
                  {selected === cat.key && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="ml-auto w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: cat.color, color: 'white' }}>✓</motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Severity Slider */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="rounded-2xl p-5 border border-white/8 mb-5"
            style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-medium">Step 2 — Severity Level</p>
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-semibold">Severity:</span>
              <motion.span key={severity} initial={{ scale: 1.3 }} animate={{ scale: 1 }}
                className="font-black text-lg px-3 py-1 rounded-xl"
                style={{ color: severityColor, background: `${severityColor}15` }}>
                {severity}/5 — {severityLabel}
              </motion.span>
            </div>
            <input type="range" min={1} max={5} step={1}
              className="w-full h-2 rounded-full outline-none cursor-pointer mb-3"
              style={{ accentColor: severityColor }}
              value={severity} onChange={e => setSeverity(+e.target.value)} />
            <div className="flex justify-between text-xs text-gray-600">
              {['Very Mild', 'Mild', 'Moderate', 'Severe', 'Very Severe'].map((l, i) => (
                <span key={l} className={severity === i + 1 ? 'font-bold' : ''} style={{ color: severity === i + 1 ? severityColor : '#4b5563' }}>{l}</span>
              ))}
            </div>
          </motion.div>

          {/* Duration & Notes */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
            className="rounded-2xl p-5 border border-white/8 mb-5"
            style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-medium">Step 3 — Duration & Notes</p>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">How long have you had this?</label>
                <div className="flex gap-2 flex-wrap">
                  {durationOptions.map(d => (
                    <button key={d} onClick={() => setDuration(d)}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
                      style={duration === d
                        ? { background: 'rgba(96,165,250,0.2)', borderColor: 'rgba(96,165,250,0.5)', color: '#60a5fa' }
                        : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)', color: '#6b7280' }}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Additional notes (optional)</label>
                <textarea rows={2} placeholder="Any other details about your symptoms..."
                  className="input-field resize-none text-sm"
                  value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>
          </motion.div>

          {/* Submit */}
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleCheck} disabled={loading || !selected}
            className="w-full py-4 rounded-2xl font-bold text-white text-base mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', boxShadow: '0 8px 25px rgba(59,130,246,0.3)' }}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}>⟳</motion.span>
                Analysing symptoms...
              </span>
            ) : '🔍 Get Wellness Suggestions'}
          </motion.button>

          {/* Results */}
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="rounded-3xl border border-green-500/20 overflow-hidden"
                  style={{ background: 'linear-gradient(135deg,rgba(52,211,153,0.08),rgba(16,185,129,0.04))' }}>
                  {/* Result header */}
                  <div className="px-5 py-4 border-b border-green-500/10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-xl">
                      {categories.find(c => c.key === result.category)?.icon}
                    </div>
                    <div>
                      <p className="text-white font-bold">Wellness Suggestions for {result.category}</p>
                      <p className="text-xs text-gray-500">Severity: {result.severity} · Duration: {result.duration}</p>
                    </div>
                    <span className="ml-auto badge badge-green">AI Analysed</span>
                  </div>

                  {/* Suggestions */}
                  <div className="p-5">
                    <div className="space-y-3 mb-5">
                      {result.suggestions.map((tip: string, i: number) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08 }}
                          className="flex gap-3 p-3 rounded-xl"
                          style={{ background: 'rgba(255,255,255,0.04)' }}>
                          <span className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                          <p className="text-gray-300 text-sm leading-relaxed">{tip}</p>
                        </motion.div>
                      ))}
                    </div>

                    {/* Disclaimer */}
                    <div className="rounded-xl p-3 border border-yellow-500/20 flex gap-2"
                      style={{ background: 'rgba(251,191,36,0.05)' }}>
                      <span className="text-yellow-400 shrink-0">⚠️</span>
                      <p className="text-xs text-gray-500">{result.disclaimer}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-4">
                      <button onClick={() => setResult(null)} className="btn-secondary flex-1 text-sm py-2">
                        Check Another
                      </button>
                      <a href="/ai-chat" className="btn-primary flex-1 text-sm py-2 text-center">
                        🤖 Ask AI More
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {history.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">🩺</p>
              <p className="text-white font-semibold">No symptom checks yet</p>
              <p className="text-gray-500 text-sm mt-1">Check your symptoms to see results here</p>
              <button onClick={() => setActiveTab('check')} className="btn-primary mt-4 text-sm py-2 px-5">
                Start Checking →
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-w-2xl">
              {history.map((entry: any, i: number) => {
                const cat = categories.find(c => c.key === entry.category);
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all"
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{cat?.icon || '🩺'}</span>
                      <div className="flex-1">
                        <p className="text-white font-semibold capitalize">{entry.category}</p>
                        <p className="text-xs text-gray-500">
                          Severity {entry.severity}/5 · {entry.duration} ·{' '}
                          {new Date(entry.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <span className="badge text-xs" style={{ background: `${cat?.color}15`, color: cat?.color, border: `1px solid ${cat?.color}33` }}>
                        {cat?.label}
                      </span>
                    </div>
                    {entry.suggestions && (
                      <ul className="space-y-1 mt-2">
                        {entry.suggestions.slice(0, 2).map((s: string, j: number) => (
                          <li key={j} className="text-xs text-gray-500 flex gap-2">
                            <span className="text-gray-700">•</span>{s}
                          </li>
                        ))}
                        {entry.suggestions.length > 2 && (
                          <li className="text-xs text-gray-600">+{entry.suggestions.length - 2} more suggestions</li>
                        )}
                      </ul>
                    )}
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
