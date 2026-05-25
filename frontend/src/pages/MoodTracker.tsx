import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/layout/Layout';
import { toast } from '../components/ui/Toast';

interface MoodEntry {
  id: string;
  date: string;
  time: string;
  mood: number;
  energy: number;
  emotions: string[];
  note: string;
  weather: string;
}

const MOOD_DATA = [
  { score: 5, emoji: '😄', label: 'Amazing',  color: '#34d399' },
  { score: 4, emoji: '🙂', label: 'Good',     color: '#60a5fa' },
  { score: 3, emoji: '😐', label: 'Neutral',  color: '#fbbf24' },
  { score: 2, emoji: '😔', label: 'Low',      color: '#fb923c' },
  { score: 1, emoji: '😢', label: 'Terrible', color: '#f87171' },
];

const EMOTIONS = [
  'Happy 😊', 'Anxious 😰', 'Calm 😌', 'Excited 🤩', 'Sad 😢',
  'Angry 😤', 'Grateful 🙏', 'Stressed 😫', 'Motivated 💪',
  'Lonely 😞', 'Proud 🏆', 'Confused 🤔', 'Hopeful 🌟', 'Tired 😩',
];

const WEATHER_OPTIONS = ['☀️ Sunny', '🌤 Partly Cloudy', '☁️ Cloudy', '🌧 Rainy', '⛈ Stormy', '❄️ Cold', '🌈 After Rain'];

// ── User-scoped helpers so moods are never shared between accounts ──
import { useAuthStore } from '../hooks/useAuth';
function moodKey(uid: string) { return `${uid}:mood-tracker`; }
function loadMoods(uid: string): MoodEntry[] {
  try { return JSON.parse(localStorage.getItem(moodKey(uid)) || '[]'); } catch { return []; }
}
function saveMoods(uid: string, m: MoodEntry[]) { localStorage.setItem(moodKey(uid), JSON.stringify(m)); }

export default function MoodTracker() {
  const userId = useAuthStore(s => s.user?.id || 'guest');
  const [entries, setEntries]   = useState<MoodEntry[]>(() => loadMoods(userId));

  // Reload when userId changes (different user logs in)
  useEffect(() => { setEntries(loadMoods(userId)); }, [userId]);
  const [activeTab, setActiveTab] = useState<'log'|'history'|'insights'>('log');
  const [form, setForm]         = useState({
    mood: 3, energy: 3, emotions: [] as string[], note: '', weather: '☀️ Sunny',
  });
  const [submitted, setSubmitted] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntry = entries.find(e => e.date === todayStr);

  const handleSubmit = () => {
    if (form.emotions.length === 0) { toast('Select at least one emotion', 'error'); return; }
    const entry: MoodEntry = {
      id: Date.now().toString(),
      date: todayStr,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      mood: form.mood, energy: form.energy,
      emotions: form.emotions, note: form.note, weather: form.weather,
    };
    const updated = [entry, ...entries.filter(e => e.date !== todayStr)];
    setEntries(updated); saveMoods(userId, updated);
    setSubmitted(true);
    toast('Mood logged ✓', 'success');
    setTimeout(() => { setSubmitted(false); setActiveTab('history'); }, 1500);
  };

  const deleteEntry = (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated); saveMoods(userId, updated);
    toast('Entry deleted', 'info');
  };

  const toggleEmotion = (e: string) => {
    setForm(f => ({
      ...f,
      emotions: f.emotions.includes(e) ? f.emotions.filter(x => x !== e) : [...f.emotions, e],
    }));
  };

  // Insights
  const avg       = entries.length ? (entries.reduce((s,e) => s + e.mood, 0) / entries.length).toFixed(1) : '—';
  const best      = entries.length ? MOOD_DATA.find(m => m.score === Math.max(...entries.map(e => e.mood))) : null;
  const worst     = entries.length ? MOOD_DATA.find(m => m.score === Math.min(...entries.map(e => e.mood))) : null;
  const streak    = (() => {
    let s = 0; const today = new Date();
    while (true) {
      const d = new Date(today); d.setDate(today.getDate() - s);
      if (entries.find(e => e.date === d.toISOString().split('T')[0])) s++; else break;
    }
    return s;
  })();

  const moodDist = MOOD_DATA.map(m => ({
    ...m, count: entries.filter(e => e.mood === m.score).length,
  }));

  const topEmotion = (() => {
    const freq: Record<string, number> = {};
    entries.forEach(e => e.emotions.forEach(em => { freq[em] = (freq[em] || 0) + 1; }));
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || '—';
  })();

  // Last 7 days for mini chart
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const entry   = entries.find(e => e.date === dateStr);
    return { date: dateStr, label: d.toLocaleDateString('en', { weekday: 'narrow' }), mood: entry?.mood || 0, entry };
  });

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-3xl font-bold text-white">😊 Mood Tracker</h1>
        <p className="text-gray-400 mt-1">Track your emotional wellbeing every day.</p>
      </motion.div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Avg Mood',    value: avg,                 icon: '📊', color: '#60a5fa' },
          { label: 'Log Streak',  value: `${streak}d`,        icon: '🔥', color: '#fbbf24' },
          { label: 'Best Mood',   value: best?.emoji || '—',  icon: '⬆️', color: '#34d399' },
          { label: 'Top Emotion', value: topEmotion.slice(0, 8), icon: '❤️', color: '#f472b6' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-3 text-center border border-white/5"
            style={{ background: `${s.color}11` }}>
            <span className="text-xl block mb-1">{s.icon}</span>
            <p className="text-sm font-black truncate" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-600 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 7-day mini chart */}
      <div className="rounded-2xl p-4 border border-white/5 mb-5" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">Last 7 Days</p>
        <div className="flex items-end gap-2 h-14">
          {last7.map((d, i) => {
            const col = d.mood >= 4 ? '#34d399' : d.mood >= 3 ? '#60a5fa' : d.mood >= 2 ? '#fbbf24' : d.mood > 0 ? '#f87171' : '#ffffff0d';
            const emoji = MOOD_DATA.find(m => m.score === d.mood)?.emoji;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                {d.mood > 0 && <span className="text-base">{emoji}</span>}
                <motion.div className="w-full rounded-t-lg"
                  style={{ backgroundColor: col, minHeight: 4 }}
                  initial={{ height: 0 }}
                  animate={{ height: d.mood ? `${(d.mood / 5) * 48}px` : '4px' }}
                  transition={{ delay: i * 0.06, duration: 0.5 }} />
                <span className="text-xs text-gray-600">{d.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {[
          { key: 'log',      label: todayEntry ? '✓ Today Logged' : '📝 Log Today' },
          { key: 'history',  label: `📜 History (${entries.length})` },
          { key: 'insights', label: '📊 Insights' },
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

      {/* Log Tab */}
      {activeTab === 'log' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl">
          {submitted ? (
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="text-center py-12 rounded-2xl border border-green-500/20"
              style={{ background: 'rgba(52,211,153,0.08)' }}>
              <p className="text-5xl mb-3">🎉</p>
              <p className="text-white font-bold text-xl">Mood Logged!</p>
              <p className="text-gray-400 mt-1">Keep tracking for better insights.</p>
            </motion.div>
          ) : (
            <div className="space-y-5">
              {/* Mood selector */}
              <div className="rounded-2xl p-5 border border-white/8" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-white font-semibold mb-4">How are you feeling right now?</p>
                <div className="flex gap-2">
                  {MOOD_DATA.map(m => (
                    <motion.button key={m.score} whileHover={{ scale: 1.1, y: -4 }} whileTap={{ scale: 0.95 }}
                      onClick={() => setForm(f => ({ ...f, mood: m.score }))}
                      className="flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all"
                      style={form.mood === m.score
                        ? { borderColor: m.color, background: `${m.color}22`, boxShadow: `0 0 20px ${m.color}33` }
                        : { borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                      <span className="text-3xl">{m.emoji}</span>
                      <span className="text-xs font-semibold" style={{ color: form.mood === m.score ? m.color : '#6b7280' }}>{m.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Energy level */}
              <div className="rounded-2xl p-5 border border-white/8" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-white font-semibold mb-3">
                  ⚡ Energy Level: <span style={{ color: '#fbbf24' }}>{form.energy}/5</span>
                </p>
                <input type="range" min={1} max={5} step={1} className="w-full" style={{ accentColor: '#fbbf24' }}
                  value={form.energy} onChange={e => setForm(f => ({ ...f, energy: +e.target.value }))} />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>Exhausted</span><span>Low</span><span>Okay</span><span>Good</span><span>Energised</span>
                </div>
              </div>

              {/* Emotions */}
              <div className="rounded-2xl p-5 border border-white/8" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-white font-semibold mb-3">What are you feeling? (select all that apply)</p>
                <div className="flex flex-wrap gap-2">
                  {EMOTIONS.map(em => (
                    <button key={em} onClick={() => toggleEmotion(em)}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium border-2 transition-all"
                      style={form.emotions.includes(em)
                        ? { borderColor: '#a78bfa', background: 'rgba(167,139,250,0.2)', color: '#a78bfa' }
                        : { borderColor: 'rgba(255,255,255,0.08)', color: '#6b7280' }}>
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weather + Note */}
              <div className="rounded-2xl p-5 border border-white/8" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="mb-3">
                  <p className="text-white font-semibold mb-2">🌤 Weather Today</p>
                  <div className="flex flex-wrap gap-2">
                    {WEATHER_OPTIONS.map(w => (
                      <button key={w} onClick={() => setForm(f => ({ ...f, weather: w }))}
                        className="px-3 py-1.5 rounded-xl text-xs border-2 transition-all"
                        style={form.weather === w
                          ? { borderColor: '#60a5fa', background: 'rgba(96,165,250,0.2)', color: '#60a5fa' }
                          : { borderColor: 'rgba(255,255,255,0.08)', color: '#6b7280' }}>
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-white font-semibold mb-2">📓 Journal Note (optional)</p>
                  <textarea rows={3} placeholder="What's on your mind? Anything making you feel this way?"
                    className="input-field resize-none text-sm"
                    value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
                </div>
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleSubmit} className="btn-primary w-full py-4 text-base">
                💾 Save Today's Mood
              </motion.button>
            </div>
          )}
        </motion.div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl">
          {entries.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <p className="text-4xl mb-3">😊</p>
              <p className="text-white font-semibold">No mood entries yet</p>
              <button onClick={() => setActiveTab('log')} className="btn-primary mt-4 text-sm py-2 px-5">Log Today →</button>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry, i) => {
                const mood = MOOD_DATA.find(m => m.score === entry.mood) || MOOD_DATA[2];
                return (
                  <motion.div key={entry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all"
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{mood.emoji}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-white font-bold">{mood.label}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: `${mood.color}20`, color: mood.color }}>
                            {mood.score}/5
                          </span>
                          <span className="text-xs text-gray-500">{entry.weather}</span>
                          <span className="text-xs text-gray-600 ml-auto">
                            {new Date(entry.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · {entry.time}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-1">
                          {entry.emotions.map(em => (
                            <span key={em} className="text-xs px-2 py-0.5 rounded-full badge badge-purple">{em}</span>
                          ))}
                        </div>
                        {entry.note && <p className="text-xs text-gray-500 italic">"{entry.note}"</p>}
                        <p className="text-xs text-gray-600 mt-1">⚡ Energy: {entry.energy}/5</p>
                      </div>
                      <button onClick={() => deleteEntry(entry.id)}
                        className="text-gray-700 hover:text-red-400 transition-colors shrink-0">🗑</button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl space-y-4">
          {/* Mood distribution */}
          <div className="rounded-2xl p-5 border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <h3 className="text-white font-semibold mb-4">📊 Mood Distribution</h3>
            <div className="space-y-3">
              {moodDist.map(m => (
                <div key={m.score}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-2"><span>{m.emoji}</span><span style={{ color: m.color }}>{m.label}</span></span>
                    <span className="text-gray-400">{m.count} days</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div className="h-full rounded-full"
                      style={{ backgroundColor: m.color, boxShadow: `0 0 8px ${m.color}55` }}
                      initial={{ width: 0 }}
                      animate={{ width: entries.length ? `${(m.count / entries.length) * 100}%` : '0%' }}
                      transition={{ delay: 0.2, duration: 0.8 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top emotions */}
          <div className="rounded-2xl p-5 border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <h3 className="text-white font-semibold mb-4">❤️ Most Frequent Emotions</h3>
            {entries.length === 0 ? (
              <p className="text-gray-600 text-sm">No data yet</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const freq: Record<string, number> = {};
                  entries.forEach(e => e.emotions.forEach(em => { freq[em] = (freq[em] || 0) + 1; }));
                  return Object.entries(freq).sort((a,b) => b[1]-a[1]).slice(0, 10).map(([em, count]) => (
                    <span key={em} className="px-3 py-1.5 rounded-xl text-xs font-medium border border-purple-500/20"
                      style={{ background: 'rgba(167,139,250,0.1)', color: '#a78bfa' }}>
                      {em} <span className="text-purple-400/60">({count})</span>
                    </span>
                  ));
                })()}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="rounded-2xl p-5 border border-blue-500/15" style={{ background: 'rgba(59,130,246,0.05)' }}>
            <h3 className="text-blue-300 font-semibold mb-3">🤖 AI Mood Insights</h3>
            <div className="space-y-2">
              {entries.length < 3 ? (
                <p className="text-gray-500 text-sm">Log at least 3 days to get personalised insights.</p>
              ) : (
                <>
                  {+avg >= 4 && <p className="text-xs text-gray-400 flex gap-2"><span>🌟</span> Your mood has been consistently positive. Keep doing what you're doing!</p>}
                  {+avg < 3 && <p className="text-xs text-gray-400 flex gap-2"><span>🧘</span> Your mood has been below average. Consider breathing exercises or talking to someone you trust.</p>}
                  {streak >= 7 && <p className="text-xs text-gray-400 flex gap-2"><span>🔥</span> {streak}-day mood logging streak! Consistency helps identify patterns.</p>}
                  <p className="text-xs text-gray-400 flex gap-2"><span>📊</span> You've logged {entries.length} mood entries. Average score: {avg}/5.</p>
                  <p className="text-xs text-gray-400 flex gap-2"><span>❤️</span> Your most common emotion is: {topEmotion}</p>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </Layout>
  );
}
