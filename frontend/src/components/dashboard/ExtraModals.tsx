import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Modal from '../ui/Modal';
import { toast } from '../ui/Toast';
import { useAuthStore } from '../../hooks/useAuth';

// ── User-scoped localStorage helpers ─────────────────────────────────────────
// All keys are prefixed with userId so data is never shared between accounts.
function sGet<T>(uid: string, key: string, fallback: T): T {
  try { const v = localStorage.getItem(`${uid}:${key}`); return v !== null ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function sSet(uid: string, key: string, val: any) {
  localStorage.setItem(`${uid}:${key}`, JSON.stringify(val));
}

// ── Water Intake Modal ────────────────────────────────────────────────────────
export function WaterModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const uid  = useAuthStore(s => s.user?.id || 'guest');
  const GOAL = 8;

  const [glasses,    setGlasses]    = useState(0);
  const [history,    setHistory]    = useState<{ date: string; glasses: number }[]>([]);
  const [customAmt,  setCustomAmt]  = useState(1);

  // Load scoped data when modal opens or user changes
  useEffect(() => {
    setGlasses(sGet(uid, 'water-today', 0));
    setHistory(sGet(uid, 'water-history', []));
  }, [open, uid]);

  const saveToday = (n: number) => {
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const h     = sGet<{date:string;glasses:number}[]>(uid, 'water-history', []);
    const idx   = h.findIndex((x: any) => x.date === today);
    if (idx >= 0) h[idx].glasses = n; else h.unshift({ date: today, glasses: n });
    const updated = h.slice(0, 30);
    setGlasses(n);
    setHistory(updated);
    sSet(uid, 'water-today', n);
    sSet(uid, 'water-history', updated);
  };

  const add    = () => saveToday(Math.min(glasses + 1, GOAL));
  const remove = () => saveToday(Math.max(glasses - 1, 0));
  const reset  = () => { saveToday(0); toast('Water tracker reset', 'info'); };
  const addCustom = () => { saveToday(Math.min(glasses + customAmt, GOAL)); toast(`Added ${customAmt} glass${customAmt > 1 ? 'es' : ''} ✓`, 'success'); };
  const deleteHistory = (date: string) => {
    const updated = history.filter(x => x.date !== date);
    setHistory(updated); sSet(uid, 'water-history', updated);
    toast('Entry deleted', 'info');
  };

  const pct = (glasses / GOAL) * 100;
  const col = pct >= 100 ? '#34d399' : pct >= 50 ? '#60a5fa' : '#a78bfa';
  const avgGlasses = history.length ? (history.reduce((s, h) => s + h.glasses, 0) / history.length).toFixed(1) : '0';

  return (
    <Modal open={open} onClose={onClose} title="Water Intake Tracker" icon="💧" color="#34d399" wide>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Today's Glasses", value: `${glasses}/${GOAL}`, color: col },
          { label: 'Daily Average',   value: `${avgGlasses}`,      color: '#60a5fa' },
          { label: 'Days Tracked',    value: history.length,        color: '#a78bfa' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 text-center border border-white/5" style={{ background: `${s.color}11` }}>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-col items-center mb-6">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="65" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
            <motion.circle cx="80" cy="80" r="65" fill="none" stroke={col} strokeWidth="12"
              strokeLinecap="round" strokeDasharray={2 * Math.PI * 65}
              animate={{ strokeDashoffset: 2 * Math.PI * 65 * (1 - Math.min(pct, 100) / 100) }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{ transformOrigin: '80px 80px', transform: 'rotate(-90deg)', filter: `drop-shadow(0 0 8px ${col})` }} />
            <text x="80" y="72" textAnchor="middle" fill="white" fontSize="32" fontWeight="900">{glasses}</text>
            <text x="80" y="90" textAnchor="middle" fill={col} fontSize="10" fontWeight="600">of {GOAL} glasses</text>
            <text x="80" y="106" textAnchor="middle" fill="rgba(148,163,184,0.5)" fontSize="9">{pct.toFixed(0)}% of goal</text>
          </svg>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {pct >= 100 ? '🎉 Daily goal reached!' : `${GOAL - glasses} more glasses to reach your goal`}
        </p>
      </div>
      <div className="grid grid-cols-8 gap-2 mb-5">
        {Array.from({ length: GOAL }).map((_, i) => (
          <motion.div key={i} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
            className="aspect-square rounded-xl flex items-center justify-center text-xl cursor-pointer border transition-all"
            onClick={i < glasses ? remove : add}
            style={i < glasses
              ? { background: `${col}22`, borderColor: `${col}55` }
              : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
            {i < glasses ? '🥤' : '○'}
          </motion.div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="flex gap-2">
          <button onClick={remove} className="flex-1 py-3 rounded-xl text-white font-bold text-lg border border-white/10 hover:bg-white/10 transition-all">−</button>
          <button onClick={add} className="flex-1 py-3 rounded-xl font-bold text-lg border border-green-500/30 hover:bg-green-500/10 transition-all" style={{ color: col }}>+</button>
        </div>
        <div className="flex gap-2">
          <input type="number" min={1} max={8} className="input-field text-sm text-center w-20"
            value={customAmt} onChange={e => setCustomAmt(+e.target.value)} />
          <button onClick={addCustom} className="flex-1 btn-primary text-sm py-2">Add {customAmt}</button>
        </div>
      </div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-white font-semibold">History (Last 30 Days)</h3>
        <button onClick={reset} className="text-xs text-red-400 hover:text-red-300 transition-colors">Reset Today</button>
      </div>
      {history.length === 0 ? (
        <p className="text-center text-gray-600 py-8">No history yet — start drinking! 💧</p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {history.map((h, i) => {
            const p = Math.min((h.glasses / GOAL) * 100, 100);
            const c = h.glasses >= GOAL ? '#34d399' : h.glasses >= 4 ? '#60a5fa' : '#f87171';
            return (
              <motion.div key={h.date} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 p-3 rounded-xl border border-white/5"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="text-sm text-gray-400 w-24 shrink-0">{h.date}</span>
                <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${p}%`, backgroundColor: c }} />
                </div>
                <span className="text-sm font-bold w-12 text-right" style={{ color: c }}>{h.glasses}/{GOAL}</span>
                <button onClick={() => deleteHistory(h.date)} className="text-xs text-gray-600 hover:text-red-400 transition-colors px-1">🗑</button>
              </motion.div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

// ── Mood Logger Modal ─────────────────────────────────────────────────────────
const MOODS = [
  { e: '😄', l: 'Great', c: '#34d399', v: 5 },
  { e: '🙂', l: 'Good',  c: '#60a5fa', v: 4 },
  { e: '😐', l: 'Okay',  c: '#fbbf24', v: 3 },
  { e: '😔', l: 'Low',   c: '#f97316', v: 2 },
  { e: '😢', l: 'Bad',   c: '#f87171', v: 1 },
];

export function MoodLoggerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const uid = useAuthStore(s => s.user?.id || 'guest');
  const [selected, setSelected] = useState<number | null>(null);
  const [note,     setNote]     = useState('');
  const [history,  setHistory]  = useState<{ date: string; mood: number; note: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    const h    = sGet<{date:string;mood:number;note:string}[]>(uid, 'mood-history', []);
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const todayEntry = h.find(x => x.date === today);
    setHistory(h);
    setSelected(todayEntry?.mood ?? null);
    setNote(todayEntry?.note ?? '');
  }, [open, uid]);

  const saveMood = () => {
    if (selected === null) { toast('Select a mood first', 'error'); return; }
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const h     = sGet<{date:string;mood:number;note:string}[]>(uid, 'mood-history', []);
    const idx   = h.findIndex(x => x.date === today);
    const entry = { date: today, mood: selected, note };
    if (idx >= 0) h[idx] = entry; else h.unshift(entry);
    const updated = h.slice(0, 30);
    setHistory(updated);
    sSet(uid, 'mood-history', updated);
    sSet(uid, 'mood-today', selected);
    toast(`Mood logged: ${MOODS.find(m => m.v === selected)?.l} ✓`, 'success');
    setNote('');
  };

  const deleteHistory = (date: string) => {
    const updated = history.filter(x => x.date !== date);
    setHistory(updated); sSet(uid, 'mood-history', updated); toast('Deleted', 'info');
  };

  const avg  = history.length ? (history.reduce((s, h) => s + h.mood, 0) / history.length).toFixed(1) : '—';
  const best = history.length ? Math.max(...history.map(h => h.mood)) : 0;
  const dist = MOODS.map(m => ({ ...m, count: history.filter(h => h.mood === m.v).length }));

  return (
    <Modal open={open} onClose={onClose} title="Mood Tracker" icon="😊" color="#a78bfa" wide>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Avg Mood',     value: avg,            color: '#a78bfa' },
          { label: 'Best Mood',    value: best ? `${MOODS.find(m => m.v === best)?.e} ${best}/5` : '—', color: '#34d399' },
          { label: 'Days Tracked', value: history.length, color: '#60a5fa' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 text-center border border-white/5" style={{ background: `${s.color}11` }}>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl p-4 border border-white/5 mb-5" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">Mood Distribution</p>
        <div className="flex gap-3 items-end h-20">
          {dist.map(d => (
            <div key={d.v} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-gray-600 font-bold">{d.count}</span>
              <motion.div className="w-full rounded-t-lg" style={{ backgroundColor: d.c, minHeight: 4, opacity: 0.8 }}
                initial={{ height: 0 }}
                animate={{ height: history.length ? `${(d.count / Math.max(history.length, 1)) * 70}px` : '4px' }}
                transition={{ delay: 0.3, duration: 0.8 }} />
              <span className="text-xl">{d.e}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl p-4 border border-purple-500/20 mb-5" style={{ background: 'rgba(167,139,250,0.06)' }}>
        <p className="text-sm text-white font-semibold mb-3">Log Today's Mood</p>
        <div className="flex gap-2 mb-3">
          {MOODS.map((m, i) => (
            <motion.button key={i} whileHover={{ scale: 1.15, y: -4 }} whileTap={{ scale: 0.95 }}
              onClick={() => setSelected(m.v)}
              className="flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border transition-all"
              style={selected === m.v
                ? { background: `${m.c}22`, borderColor: `${m.c}55`, boxShadow: `0 0 16px ${m.c}33` }
                : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)' }}>
              <span className="text-2xl">{m.e}</span>
              <span className="text-xs font-medium" style={{ color: selected === m.v ? m.c : '#4b5563' }}>{m.l}</span>
            </motion.button>
          ))}
        </div>
        <textarea rows={2} placeholder="How are you feeling? Add a note..." className="input-field text-sm resize-none mb-3"
          value={note} onChange={e => setNote(e.target.value)} />
        <button onClick={saveMood} className="btn-primary w-full text-sm py-2.5">💾 Save Mood</button>
      </div>
      <h3 className="text-white font-semibold mb-3">Mood History</h3>
      {history.length === 0 ? (
        <p className="text-center text-gray-600 py-8">No mood history yet!</p>
      ) : (
        <div className="space-y-2 max-h-52 overflow-y-auto">
          {history.map((h, i) => {
            const m = MOODS.find(x => x.v === h.mood) || MOODS[2];
            return (
              <motion.div key={h.date} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 p-3 rounded-xl border border-white/5"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="text-2xl">{m.e}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium">{m.l}</span>
                    <span className="text-xs text-gray-500">{h.date}</span>
                  </div>
                  {h.note && <p className="text-xs text-gray-500 mt-0.5 truncate italic">"{h.note}"</p>}
                </div>
                <span className="text-sm font-black" style={{ color: m.c }}>{h.mood}/5</span>
                <button onClick={() => deleteHistory(h.date)} className="text-xs text-gray-600 hover:text-red-400 transition-colors px-1">🗑</button>
              </motion.div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

// ── BMI Modal ─────────────────────────────────────────────────────────────────
export function BMIModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const uid = useAuthStore(s => s.user?.id || 'guest');
  const [h, setH] = useState('');
  const [w, setW] = useState('');
  const [history, setHistory] = useState<{ date: string; bmi: number; cat: string; h: number; w: number }[]>([]);

  useEffect(() => {
    if (!open) return;
    const saved = sGet<{date:string;bmi:number;cat:string;h:number;w:number}[]>(uid, 'bmi-history', []);
    setHistory(saved);
    if (saved[0]) { setH(String(saved[0].h)); setW(String(saved[0].w)); }
    else { setH(''); setW(''); }
  }, [open, uid]);

  const bmi = h && w ? +(+w / ((+h / 100) ** 2)).toFixed(1) : null;
  const cat = bmi == null ? '' : bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';
  const col = bmi == null ? '#94a3b8' : bmi < 18.5 ? '#60a5fa' : bmi < 25 ? '#34d399' : bmi < 30 ? '#fbbf24' : '#f87171';

  const save = () => {
    if (!bmi) { toast('Enter height and weight first', 'error'); return; }
    const today   = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const entry   = { date: today, bmi, cat, h: +h, w: +w };
    const updated = [entry, ...history.filter(x => x.date !== today)].slice(0, 20);
    setHistory(updated);
    sSet(uid, 'bmi-history', updated);
    toast(`BMI ${bmi} saved ✓`, 'success');
  };

  const deleteHistory = (idx: number) => {
    const updated = history.filter((_, i) => i !== idx);
    setHistory(updated); sSet(uid, 'bmi-history', updated); toast('Deleted', 'info');
  };

  return (
    <Modal open={open} onClose={onClose} title="BMI Calculator & Tracker" icon="⚖️" color="#34d399" wide>
      <div className="rounded-2xl p-5 border border-green-500/20 mb-5" style={{ background: 'rgba(52,211,153,0.06)' }}>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Height (cm)</label>
            <input type="number" placeholder="170" className="input-field" value={h} onChange={e => setH(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Weight (kg)</label>
            <input type="number" placeholder="65" className="input-field" value={w} onChange={e => setW(e.target.value)} />
          </div>
        </div>
        {bmi != null ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="rounded-2xl p-5 text-center border mb-4"
            style={{ background: `${col}11`, borderColor: `${col}33` }}>
            <p className="text-6xl font-black mb-1" style={{ color: col }}>{bmi}</p>
            <p className="text-lg font-bold" style={{ color: col }}>{cat}</p>
            <p className="text-xs text-gray-500 mt-1">Body Mass Index</p>
          </motion.div>
        ) : (
          <div className="rounded-2xl p-6 text-center bg-white/[0.02] border border-white/5 mb-4">
            <p className="text-gray-600">Enter height & weight to calculate BMI</p>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={save} disabled={!bmi} className="btn-primary flex-1 text-sm py-2.5">💾 Save Result</button>
          <button onClick={() => { setH(''); setW(''); }} className="btn-secondary text-sm py-2.5 px-4">Clear</button>
        </div>
      </div>
      <h3 className="text-white font-semibold mb-3">BMI History</h3>
      {history.length === 0 ? (
        <p className="text-center text-gray-600 py-8">No BMI records yet. Calculate and save!</p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {history.map((r, i) => {
            const c = r.bmi < 18.5 ? '#60a5fa' : r.bmi < 25 ? '#34d399' : r.bmi < 30 ? '#fbbf24' : '#f87171';
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 p-3 rounded-xl border border-white/5"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm border"
                  style={{ background: `${c}11`, borderColor: `${c}33`, color: c }}>{r.bmi}</div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{r.cat}</p>
                  <p className="text-xs text-gray-500">{r.h}cm · {r.w}kg · {r.date}</p>
                </div>
                <button onClick={() => deleteHistory(i)} className="text-xs text-gray-600 hover:text-red-400 transition-colors px-1">🗑</button>
              </motion.div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

// ── AI Tips Modal ─────────────────────────────────────────────────────────────
const ALL_TIPS = [
  { icon: '💧', cat: 'Hydration', text: 'Drink a glass of water right now. Even mild dehydration reduces brain performance by 14%.' },
  { icon: '🧘', cat: 'Mental',    text: 'Try box breathing: inhale 4s → hold 4s → exhale 4s → hold 4s. Reduces anxiety in minutes.' },
  { icon: '🌙', cat: 'Sleep',     text: 'Going to bed at the same time each night improves sleep quality by up to 40%.' },
  { icon: '🥗', cat: 'Nutrition', text: 'Eating one extra serving of vegetables daily reduces disease risk by 20% over time.' },
  { icon: '🏃', cat: 'Fitness',   text: 'A 10-minute walk after every meal lowers blood sugar and boosts metabolism significantly.' },
  { icon: '📵', cat: 'Sleep',     text: 'No screens 1 hour before bed. Blue light blocks melatonin production by 50%.' },
  { icon: '🎵', cat: 'Mental',    text: 'Listening to calm music 20 minutes daily reduces cortisol and lowers heart rate.' },
  { icon: '🌞', cat: 'Vitamin D', text: '10–15 minutes of morning sunlight daily regulates circadian rhythm and boosts vitamin D.' },
  { icon: '🥜', cat: 'Nutrition', text: 'A handful of nuts daily reduces cardiovascular disease risk by up to 30%.' },
  { icon: '🚶', cat: 'Fitness',   text: '8,000 steps a day is linked to 51% lower risk of death from all causes.' },
  { icon: '🧠', cat: 'Mental',    text: 'Journaling for just 5 minutes a day reduces stress and improves emotional clarity.' },
  { icon: '🍎', cat: 'Nutrition', text: 'Eating the rainbow — 5+ different coloured foods daily — provides all essential micronutrients.' },
  { icon: '💤', cat: 'Sleep',     text: 'The ideal sleep temperature is 18–20°C. Cooler rooms lead to deeper, more restorative sleep.' },
  { icon: '🫁', cat: 'Mental',    text: 'Deep belly breathing for 2 minutes activates the parasympathetic nervous system instantly.' },
];

export function AITipsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const uid = useAuthStore(s => s.user?.id || 'guest');
  const [filter, setFilter] = useState('All');
  const [saved, setSaved]   = useState<string[]>([]);

  useEffect(() => { setSaved(sGet(uid, 'saved-tips', [])); }, [open, uid]);

  const cats  = ['All', 'Hydration', 'Mental', 'Sleep', 'Nutrition', 'Fitness', 'Vitamin D'];
  const shown = filter === 'All' ? ALL_TIPS : ALL_TIPS.filter(t => t.cat === filter);

  const toggleSave = (text: string) => {
    const updated = saved.includes(text) ? saved.filter(s => s !== text) : [...saved, text];
    setSaved(updated); sSet(uid, 'saved-tips', updated);
    toast(saved.includes(text) ? 'Tip unsaved' : 'Tip saved ✓', 'success');
  };

  return (
    <Modal open={open} onClose={onClose} title="AI Wellness Tips Library" icon="🤖" color="#60a5fa" wide>
      <div className="flex gap-2 flex-wrap mb-5">
        {cats.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={filter === c ? { background: '#3b82f6', color: 'white' } : { background: 'rgba(255,255,255,0.06)', color: '#9ca3af' }}>
            {c}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
        {shown.map((tip, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="p-4 rounded-2xl border border-white/5 flex gap-3 hover:border-blue-500/20 transition-all"
            style={{ background: 'rgba(255,255,255,0.03)' }}>
            <span className="text-3xl shrink-0">{tip.icon}</span>
            <div className="flex-1">
              <span className="text-xs font-bold text-blue-400">{tip.cat}</span>
              <p className="text-gray-300 text-sm leading-relaxed mt-1">{tip.text}</p>
            </div>
            <button onClick={() => toggleSave(tip.text)} className="shrink-0 text-lg transition-colors"
              style={{ color: saved.includes(tip.text) ? '#fbbf24' : '#374151' }}>
              {saved.includes(tip.text) ? '★' : '☆'}
            </button>
          </motion.div>
        ))}
      </div>
    </Modal>
  );
}

// ── Weekly Summary Modal ──────────────────────────────────────────────────────
export function WeeklySummaryModal({ open, onClose, analytics }: { open: boolean; onClose: () => void; analytics: any }) {
  const metrics = [
    { label: 'Sleep',       val: analytics?.avgSleepDuration ?? 0,                            color: '#60a5fa', icon: '😴', unit: 'h',  desc: 'Recommended: 7–9 hours/night' },
    { label: 'Mood',        val: (analytics?.avgMoodRating ?? 0) * 20,                        color: '#a78bfa', icon: '😊', unit: '%',  desc: 'Based on your mood ratings 1–5' },
    { label: 'Hydration',   val: Math.min(((analytics?.avgHydration ?? 0) / 2.5) * 100, 100), color: '#34d399', icon: '💧', unit: '%',  desc: 'Goal: 2.5 litres/day' },
    { label: 'Fitness',     val: Math.min((analytics?.totalWorkouts ?? 0) * 14, 100),         color: '#fb923c', icon: '🏋️', unit: '%', desc: 'Goal: 7 workout sessions/week' },
    { label: 'Consistency', val: Math.min((analytics?.logsThisWeek ?? 0) * 14, 100),         color: '#f472b6', icon: '📋', unit: '%',  desc: 'Based on daily logging habit' },
  ];
  const overall = Math.round(metrics.reduce((s, m) => s + Math.min(m.val, 100), 0) / metrics.length);
  const col = overall >= 70 ? '#34d399' : overall >= 50 ? '#fbbf24' : '#f87171';

  return (
    <Modal open={open} onClose={onClose} title="Weekly Health Summary" icon="📋" color="#f472b6" wide>
      <div className="text-center py-5 mb-6 rounded-2xl border border-white/5" style={{ background: `${col}08` }}>
        <p className="text-7xl font-black mb-1" style={{ color: col }}>{overall}</p>
        <p className="text-gray-400 text-sm">Overall Weekly Score</p>
        <p className="text-xs mt-1" style={{ color: col }}>
          {overall >= 70 ? '🔥 Excellent week!' : overall >= 50 ? '👍 Good progress!' : '💪 Keep going!'}
        </p>
      </div>
      <div className="space-y-4 mb-5">
        {metrics.map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            className="p-4 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{m.icon}</span>
                <span className="text-white font-semibold text-sm">{m.label}</span>
              </div>
              <span className="font-black text-sm" style={{ color: m.color }}>
                {m.val.toFixed(m.val % 1 === 0 ? 0 : 1)}{m.unit}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-white/5 overflow-hidden mb-1">
              <motion.div className="h-full rounded-full"
                style={{ backgroundColor: m.color }}
                initial={{ width: 0 }} animate={{ width: `${Math.min(m.val, 100)}%` }}
                transition={{ delay: 0.3 + i * 0.1, duration: 1 }} />
            </div>
            <p className="text-xs text-gray-600">{m.desc}</p>
          </motion.div>
        ))}
      </div>
    </Modal>
  );
}

// ── Log Streak Modal ──────────────────────────────────────────────────────────
// ✅ FIXED: accepts real data props — no hardcoded values, no shared state
interface LogStreakModalProps {
  open: boolean;
  onClose: () => void;
  streakDays?: number;
  bestStreak?: number;
  loggedDays?: boolean[];
  totalLogged?: number;
}

export function LogStreakModal({
  open, onClose,
  streakDays  = 0,
  bestStreak  = 0,
  loggedDays  = [false, false, false, false, false, false, false],
  totalLogged = 0,
}: LogStreakModalProps) {
  const labels     = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const fullLabels = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const daysLogged = loggedDays.filter(Boolean).length;

  const milestones = [
    { d: 3,  icon: '🥉', label: '3 Days',   color: '#cd7f32' },
    { d: 7,  icon: '🥈', label: '1 Week',   color: '#c0c0c0' },
    { d: 14, icon: '🥇', label: '2 Weeks',  color: '#ffd700' },
    { d: 30, icon: '🏆', label: '1 Month',  color: '#ffd700' },
    { d: 60, icon: '👑', label: '2 Months', color: '#a78bfa' },
    { d: 90, icon: '🌟', label: '3 Months', color: '#f472b6' },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Daily Log Streak" icon="🗓️" color="#fbbf24" wide>
      <div className="text-center py-5 mb-5 rounded-2xl border border-yellow-500/20"
        style={{ background: 'linear-gradient(135deg,rgba(251,191,36,0.1),rgba(245,158,11,0.05))' }}>
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="text-5xl mb-2">🔥</motion.div>
        <p className="text-7xl font-black text-yellow-400">{streakDays}</p>
        <p className="text-gray-400 text-sm mt-1">day logging streak</p>
        <p className="text-xs text-yellow-600 mt-1">Best: {bestStreak} days</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Current Streak', value: `${streakDays}d`,  color: '#fbbf24' },
          { label: 'Best Ever',      value: `${bestStreak}d`,  color: '#f59e0b' },
          { label: 'Total Logged',   value: totalLogged,        color: '#34d399' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 text-center border border-white/5" style={{ background: `${s.color}11` }}>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-4 border border-white/5 mb-5" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <p className="text-xs text-gray-500 mb-3 font-medium uppercase">This Week ({daysLogged}/7 days logged)</p>
        <div className="grid grid-cols-7 gap-2">
          {loggedDays.map((d, i) => (
            <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.06 }}
              className="flex flex-col items-center gap-1.5">
              <div className={`w-full aspect-square rounded-xl flex items-center justify-center font-bold text-sm border ${
                d ? 'border-green-500/50 text-green-400' : 'border-white/5 text-gray-700'
              }`} style={d ? {
                background: 'linear-gradient(135deg,rgba(52,211,153,0.2),rgba(16,185,129,0.1))',
                boxShadow: '0 0 10px rgba(52,211,153,0.2)'
              } : { background: 'rgba(255,255,255,0.02)' }}>
                {d ? '✓' : '·'}
              </div>
              <span className="text-xs text-gray-600">{labels[i]}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <p className="text-white font-semibold mb-3">🏆 Milestones</p>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-5">
        {milestones.map(m => {
          const done = bestStreak >= m.d;
          return (
            <div key={m.d} className="flex flex-col items-center gap-1 p-3 rounded-xl border text-center"
              style={done ? { background: `${m.color}15`, borderColor: `${m.color}33` } : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>
              <span className="text-2xl">{done ? m.icon : '🔒'}</span>
              <span className="text-xs font-bold" style={{ color: done ? m.color : '#374151' }}>{m.label}</span>
            </div>
          );
        })}
      </div>

      <div className="p-3 rounded-xl border border-blue-500/15" style={{ background: 'rgba(59,130,246,0.06)' }}>
        <p className="text-xs text-gray-400">💡 <span className="text-blue-300 font-medium">Tip:</span> Log your health data every day — consistency is what builds healthy habits over time.</p>
      </div>
    </Modal>
  );
}
