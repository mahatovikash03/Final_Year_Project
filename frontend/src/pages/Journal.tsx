import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/layout/Layout';
import { toast } from '../components/ui/Toast';

interface JournalEntry {
  id: string;
  date: string;
  time: string;
  title: string;
  content: string;
  mood: number;
  tags: string[];
  wordCount: number;
  isPrivate: boolean;
}

const MOODS = [
  { v: 5, e: '😄', l: 'Amazing',  c: '#34d399' },
  { v: 4, e: '🙂', l: 'Good',     c: '#60a5fa' },
  { v: 3, e: '😐', l: 'Neutral',  c: '#fbbf24' },
  { v: 2, e: '😔', l: 'Low',      c: '#fb923c' },
  { v: 1, e: '😢', l: 'Terrible', c: '#f87171' },
];

const TAGS = ['#gratitude','#anxiety','#growth','#fitness','#relationships','#work','#health','#goals','#stress','#sleep','#meditation','#nutrition'];

const PROMPTS = [
  'What are 3 things you are grateful for today?',
  'What challenge did you face today and how did you handle it?',
  'What made you smile today?',
  'What is one thing you want to improve tomorrow?',
  'Describe how your body feels right now.',
  'What emotions came up for you today and why?',
  'What is one healthy habit you practiced today?',
  'Write about something that stressed you out and how you can manage it.',
  'What did you eat today and how did it make you feel?',
  'Describe your energy levels throughout the day.',
];

import { useAuthStore } from '../hooks/useAuth';
function jKey(uid: string) { return `${uid}:journal-entries`; }
function loadEntries(uid: string): JournalEntry[] {
  try { return JSON.parse(localStorage.getItem(jKey(uid)) || '[]'); } catch { return []; }
}
function saveEntries(uid: string, e: JournalEntry[]) { localStorage.setItem(jKey(uid), JSON.stringify(e)); }

export default function Journal() {
  const userId = useAuthStore(s => s.user?.id || 'guest');
  const [entries, setEntries] = useState<JournalEntry[]>(() => loadEntries(userId));

  useEffect(() => { setEntries(loadEntries(userId)); }, [userId]);
  const [activeTab, setActiveTab]   = useState<'write'|'history'|'insights'>('write');
  const [editing, setEditing]       = useState<string | null>(null);
  const [search, setSearch]         = useState('');
  const [tagFilter, setTagFilter]   = useState('');
  const [showPrivate, setShowPrivate] = useState(true);
  const [prompt, setPrompt]         = useState(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  const [form, setForm]             = useState({
    title: '', content: '', mood: 3, tags: [] as string[], isPrivate: false,
  });
  const [preview, setPreview]       = useState(false);

  const wordCount = form.content.trim().split(/\s+/).filter(Boolean).length;

  const toggleTag = (t: string) =>
    setForm(f => ({ ...f, tags: f.tags.includes(t) ? f.tags.filter(x => x !== t) : [...f.tags, t] }));

  const handleSave = () => {
    if (!form.title.trim() || !form.content.trim()) { toast('Add a title and content', 'error'); return; }
    if (editing) {
      const updated = entries.map(e => e.id === editing
        ? { ...e, title: form.title, content: form.content, mood: form.mood, tags: form.tags, isPrivate: form.isPrivate, wordCount }
        : e
      );
      setEntries(updated); saveEntries(userId, updated);
      toast('Entry updated ✓', 'success');
    } else {
      const entry: JournalEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        title: form.title, content: form.content, mood: form.mood,
        tags: form.tags, wordCount, isPrivate: form.isPrivate,
      };
      const updated = [entry, ...entries];
      setEntries(updated); saveEntries(userId, updated);
      toast('Journal entry saved ✓', 'success');
    }
    setForm({ title: '', content: '', mood: 3, tags: [], isPrivate: false });
    setEditing(null);
    setActiveTab('history');
  };

  const handleEdit = (entry: JournalEntry) => {
    setForm({ title: entry.title, content: entry.content, mood: entry.mood, tags: entry.tags, isPrivate: entry.isPrivate });
    setEditing(entry.id);
    setActiveTab('write');
  };

  const handleDelete = (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated); saveEntries(userId, updated);
    toast('Entry deleted', 'info');
  };

  const handleNewPrompt = () => {
    const p = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
    setPrompt(p);
    setForm(f => ({ ...f, content: f.content ? f.content : `${p}\n\n` }));
  };

  const filtered = entries.filter(e => {
    if (!showPrivate && e.isPrivate) return false;
    if (tagFilter && !e.tags.includes(tagFilter)) return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase()) && !e.content.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalWords = entries.reduce((s, e) => s + e.wordCount, 0);
  const avgMood    = entries.length ? (entries.reduce((s, e) => s + e.mood, 0) / entries.length).toFixed(1) : '—';
  const thisWeek   = entries.filter(e => {
    const d = new Date(e.date); const now = new Date();
    return (now.getTime() - d.getTime()) < 7 * 86400000;
  }).length;

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-3xl font-bold text-white">📓 Wellness Journal</h1>
        <p className="text-gray-400 mt-1">Write freely. Reflect deeply. Grow daily.</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total Entries', value: entries.length, icon: '📓', color: '#60a5fa' },
          { label: 'This Week',     value: thisWeek,        icon: '📅', color: '#34d399' },
          { label: 'Total Words',   value: totalWords,      icon: '✍️', color: '#a78bfa' },
          { label: 'Avg Mood',      value: avgMood,         icon: '😊', color: '#fbbf24' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-3 text-center border border-white/5"
            style={{ background: `${s.color}11` }}>
            <span className="text-xl block mb-1">{s.icon}</span>
            <p className="text-lg font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-600 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {[
          { key: 'write',    label: editing ? '✏️ Editing'   : '📝 Write'     },
          { key: 'history',  label: `📜 All Entries (${entries.length})`       },
          { key: 'insights', label: '💡 Insights'                               },
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

      {/* Write Tab */}
      {activeTab === 'write' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl">
          {/* Prompt */}
          <div className="rounded-2xl p-4 border border-purple-500/20 mb-4 flex items-start gap-3"
            style={{ background: 'rgba(139,92,246,0.06)' }}>
            <span className="text-2xl shrink-0">💡</span>
            <div className="flex-1">
              <p className="text-xs text-purple-400 font-semibold mb-1 uppercase tracking-wide">Writing Prompt</p>
              <p className="text-gray-300 text-sm">{prompt}</p>
            </div>
            <button onClick={handleNewPrompt}
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors shrink-0 px-3 py-1.5 rounded-xl border border-purple-500/20 hover:bg-purple-500/10">
              New Prompt
            </button>
          </div>

          <div className="rounded-2xl border border-white/8 overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)' }}>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">{wordCount} words</span>
                <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                  <input type="checkbox" checked={form.isPrivate}
                    onChange={e => setForm(f => ({ ...f, isPrivate: e.target.checked }))}
                    className="accent-blue-500" />
                  🔒 Private
                </label>
              </div>
              <button onClick={() => setPreview(!preview)}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                {preview ? '✏️ Edit' : '👁 Preview'}
              </button>
            </div>

            <div className="p-5 space-y-4">
              <input className="input-field text-lg font-semibold" placeholder="Entry title..."
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />

              {!preview ? (
                <textarea rows={12} placeholder={`Start writing...\n\n${prompt}`}
                  className="input-field resize-none text-sm leading-relaxed"
                  value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
              ) : (
                <div className="min-h-[200px] rounded-xl p-4 border border-white/5 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap"
                  style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {form.content || <span className="text-gray-600">Nothing written yet...</span>}
                </div>
              )}

              {/* Mood */}
              <div>
                <p className="text-xs text-gray-400 mb-2 font-medium">How are you feeling while writing?</p>
                <div className="flex gap-2">
                  {MOODS.map(m => (
                    <button key={m.v} onClick={() => setForm(f => ({ ...f, mood: m.v }))}
                      className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border-2 transition-all"
                      style={form.mood === m.v
                        ? { borderColor: m.c, background: `${m.c}22`, color: m.c }
                        : { borderColor: 'rgba(255,255,255,0.08)', color: '#6b7280' }}>
                      <span className="text-xl">{m.e}</span>
                      <span className="text-xs">{m.l}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <p className="text-xs text-gray-400 mb-2 font-medium">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {TAGS.map(t => (
                    <button key={t} onClick={() => toggleTag(t)}
                      className="px-3 py-1 rounded-full text-xs border transition-all"
                      style={form.tags.includes(t)
                        ? { background: 'rgba(96,165,250,0.2)', borderColor: 'rgba(96,165,250,0.4)', color: '#60a5fa' }
                        : { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: '#6b7280' }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                {editing && (
                  <button onClick={() => { setEditing(null); setForm({ title:'',content:'',mood:3,tags:[],isPrivate:false }); setActiveTab('history'); }}
                    className="btn-secondary flex-1">Cancel</button>
                )}
                <button onClick={handleSave} className="btn-primary flex-1 py-3 text-base">
                  {editing ? '💾 Update Entry' : '💾 Save Entry'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl">
          {/* Filters */}
          <div className="flex flex-col gap-3 mb-5">
            <input type="text" placeholder="🔍 Search entries..."
              className="input-field text-sm max-w-md"
              value={search} onChange={e => setSearch(e.target.value)} />
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setTagFilter('')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${!tagFilter ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 border border-white/8'}`}>
                All Tags
              </button>
              {TAGS.map(t => (
                <button key={t} onClick={() => setTagFilter(tagFilter === t ? '' : t)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={tagFilter === t
                    ? { background: '#3b82f6', color: 'white' }
                    : { background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {t}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
              <input type="checkbox" checked={showPrivate} onChange={e => setShowPrivate(e.target.checked)} className="accent-blue-500" />
              Show private entries
            </label>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <p className="text-4xl mb-3">📓</p>
              <p className="text-white font-semibold">No entries found</p>
              <button onClick={() => setActiveTab('write')} className="btn-primary mt-4 text-sm py-2 px-5">Start Writing →</button>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((entry, i) => {
                const mood = MOODS.find(m => m.v === entry.mood) || MOODS[2];
                return (
                  <motion.div key={entry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-2xl border border-white/5 hover:border-white/10 transition-all overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xl">{mood.e}</span>
                          <h3 className="text-white font-bold">{entry.title}</h3>
                          {entry.isPrivate && <span className="text-xs text-gray-500">🔒 Private</span>}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => handleEdit(entry)}
                            className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded-lg hover:bg-blue-500/10 transition-all">✏️</button>
                          <button onClick={() => handleDelete(entry.id)}
                            className="text-xs text-gray-600 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-all">🗑</button>
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 mb-3">{entry.content}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-gray-600">
                          {new Date(entry.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · {entry.time}
                        </span>
                        <span className="text-xs text-gray-600">{entry.wordCount} words</span>
                        <div className="flex gap-1 flex-wrap">
                          {entry.tags.map(t => (
                            <span key={t} className="text-xs px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa' }}>{t}</span>
                          ))}
                        </div>
                      </div>
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
          {/* Writing streak */}
          <div className="rounded-2xl p-5 border border-yellow-500/20" style={{ background: 'rgba(251,191,36,0.06)' }}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">🔥</span>
              <div>
                <p className="text-white font-bold">{thisWeek} entries this week</p>
                <p className="text-gray-500 text-xs">Keep writing every day for better self-awareness</p>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 7 }, (_, i) => {
                const d = new Date(); d.setDate(d.getDate() - (6 - i));
                const dateStr = d.toISOString().split('T')[0];
                const has = entries.some(e => e.date === dateStr);
                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="w-full h-6 rounded-lg" style={{ background: has ? '#fbbf24' : 'rgba(255,255,255,0.05)' }} />
                    <span className="text-xs text-gray-600">{d.toLocaleDateString('en', { weekday: 'narrow' })}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mood while writing */}
          <div className="rounded-2xl p-5 border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <h3 className="text-white font-semibold mb-4">😊 Mood While Journaling</h3>
            <div className="space-y-2">
              {MOODS.map(m => {
                const count = entries.filter(e => e.mood === m.v).length;
                const pct   = entries.length ? (count / entries.length) * 100 : 0;
                return (
                  <div key={m.v}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="flex items-center gap-1"><span>{m.e}</span><span style={{ color: m.c }}>{m.l}</span></span>
                      <span className="text-gray-500">{count} entries</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <motion.div className="h-full rounded-full" style={{ backgroundColor: m.c }}
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.3, duration: 0.8 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tag cloud */}
          <div className="rounded-2xl p-5 border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <h3 className="text-white font-semibold mb-4">🏷️ Most Used Tags</h3>
            {entries.length === 0 ? (
              <p className="text-gray-600 text-sm">No entries yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const freq: Record<string, number> = {};
                  entries.forEach(e => e.tags.forEach(t => { freq[t] = (freq[t] || 0) + 1; }));
                  return Object.entries(freq).sort((a,b)=>b[1]-a[1]).map(([tag, count]) => (
                    <span key={tag} className="px-3 py-1.5 rounded-full text-xs font-medium border"
                      style={{ background: 'rgba(96,165,250,0.1)', borderColor: 'rgba(96,165,250,0.25)', color: '#60a5fa', fontSize: `${Math.min(0.75 + count * 0.05, 1)}rem` }}>
                      {tag} ({count})
                    </span>
                  ));
                })()}
              </div>
            )}
          </div>

          {/* AI prompt */}
          <div className="rounded-2xl p-5 border border-blue-500/15" style={{ background: 'rgba(59,130,246,0.05)' }}>
            <h3 className="text-blue-300 font-semibold mb-3">🤖 Today's Reflection Prompt</h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-3">"{prompt}"</p>
            <button onClick={() => { setActiveTab('write'); setForm(f => ({ ...f, content: `${prompt}\n\n` })); }}
              className="btn-primary text-sm py-2 px-5">
              Start Writing →
            </button>
          </div>
        </motion.div>
      )}
    </Layout>
  );
}
