import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/layout/Layout';
import { toast } from '../components/ui/Toast';

const STEPS = ['Sleep', 'Diet', 'Fitness', 'Skincare', 'Mental Wellness'];

const intensityOptions  = ['low', 'moderate', 'high'];
const stressOptions     = ['low', 'moderate', 'high'];
const mealTypes         = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const skinIssueOptions  = ['Acne', 'Dryness', 'Oiliness', 'Redness', 'Sensitivity', 'Dark Spots'];
const productOptions    = ['Moisturiser', 'Sunscreen SPF 30+', 'Cleanser', 'Toner', 'Serum', 'Eye Cream', 'Face Mask'];

import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const BLANK = {
  sleep:    { duration: 7, quality: 3, bedtime: '23:00', wakeTime: '06:30' },
  diet:     { meals: [{ type: 'Breakfast', nutritionRating: 3, calories: 400 }], hydration: 2 },
  fitness:  [{ type: 'Walking', duration: 30, intensity: 'moderate' }],
  skincare: { productsUsed: [] as string[], skinIssues: [] as string[] },
  mentalWellness: { moodRating: 3, stressLevel: 'low', notes: '' },
};

export default function LogHealth() {
  const navigate    = useNavigate();
  const [step, setStep]   = useState(1);
  const [form, setForm]   = useState(BLANK);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);

  const update = (section: string, field: string, value: any) =>
    setForm(f => ({ ...f, [section]: { ...(f as any)[section], [field]: value } }));

  const toggleSkinIssue = (issue: string) => {
    const cur = form.skincare.skinIssues;
    setForm(f => ({ ...f, skincare: { ...f.skincare, skinIssues: cur.includes(issue) ? cur.filter(x=>x!==issue) : [...cur, issue] } }));
  };

  const toggleProduct = (p: string) => {
    const cur = form.skincare.productsUsed;
    setForm(f => ({ ...f, skincare: { ...f.skincare, productsUsed: cur.includes(p) ? cur.filter(x=>x!==p) : [...cur, p] } }));
  };

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      await api.post('/health-log', form);
      setSuccess(true);
      toast('Health log saved! ✓', 'success');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save log. Please try again.');
      toast('Failed to save log', 'error');
    } finally {
      setLoading(false);
    }
  };

  const moodEmojis = ['','😢','😔','😐','🙂','😄'];
  const qualityStars = ['','⭐','⭐⭐','⭐⭐⭐','⭐⭐⭐⭐','⭐⭐⭐⭐⭐'];

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-3xl font-bold text-white">📝 Log Today's Health</h1>
        <p className="text-gray-400 mt-1">Track your daily wellness across all areas in 5 easy steps.</p>
      </motion.div>

      {/* Step Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <button key={s} onClick={() => setStep(i + 1)}
              className="flex items-center gap-2 shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={step === i + 1
                ? { background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: 'white', boxShadow: '0 4px 15px rgba(59,130,246,0.3)' }
                : step > i + 1
                ? { background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }
                : { background: 'rgba(255,255,255,0.05)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.08)' }}>
              {step > i + 1 ? '✓ ' : `${i+1}. `}{s}
            </button>
          ))}
        </div>
        {/* Overall progress */}
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <motion.div className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg,#3b82f6,#34d399)' }}
            animate={{ width: `${(step / STEPS.length) * 100}%` }}
            transition={{ duration: 0.4 }} />
        </div>
        <p className="text-xs text-gray-600 mt-1 text-right">Step {step} of {STEPS.length}</p>
      </div>

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div key={step}
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
          className="max-w-2xl rounded-3xl border border-white/8 p-6"
          style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))' }}>

          {/* ── STEP 1: SLEEP ─────────────────────────────────────── */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                <span className="text-3xl">😴</span> Sleep Tracking
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block font-medium">Duration (hours)</label>
                  <input type="number" min={0} max={24} step={0.5} className="input-field"
                    value={form.sleep.duration}
                    onChange={e => update('sleep','duration',+e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block font-medium">Bedtime</label>
                  <input type="time" className="input-field"
                    value={form.sleep.bedtime}
                    onChange={e => update('sleep','bedtime',e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block font-medium">Wake Time</label>
                  <input type="time" className="input-field"
                    value={form.sleep.wakeTime}
                    onChange={e => update('sleep','wakeTime',e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-2 block font-medium">
                  Sleep Quality: <span className="text-white">{qualityStars[form.sleep.quality]} ({form.sleep.quality}/5)</span>
                </label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(q => (
                    <button key={q} onClick={() => update('sleep','quality',q)}
                      className="flex-1 py-3 rounded-xl border-2 text-lg transition-all"
                      style={form.sleep.quality === q
                        ? { borderColor: '#60a5fa', background: 'rgba(96,165,250,0.2)', color: '#60a5fa' }
                        : { borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#6b7280' }}>
                      {'⭐'.repeat(q)}
                    </button>
                  ))}
                </div>
              </div>
              {/* Sleep tip */}
              <div className="mt-4 p-3 rounded-xl border border-blue-500/15 text-xs text-gray-400"
                style={{ background: 'rgba(59,130,246,0.05)' }}>
                💡 <strong className="text-blue-300">Tip:</strong> Adults need 7–9 hours of sleep per night for optimal health and cognitive function.
              </div>
            </div>
          )}

          {/* ── STEP 2: DIET ──────────────────────────────────────── */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                <span className="text-3xl">🥗</span> Diet & Nutrition
              </h2>
              <div className="mb-4">
                <label className="text-xs text-gray-400 mb-1.5 block font-medium">
                  Daily Hydration: <span className="text-cyan-400">{form.diet.hydration}L</span>
                </label>
                <input type="range" min={0} max={6} step={0.25} className="w-full mb-1" style={{ accentColor: '#34d399' }}
                  value={form.diet.hydration}
                  onChange={e => setForm(f => ({ ...f, diet: { ...f.diet, hydration: +e.target.value } }))} />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>0L</span><span className="text-green-400">Goal: 2.5L</span><span>6L</span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-400 font-medium">Meals Today</label>
                  <button onClick={() => setForm(f => ({ ...f, diet: { ...f.diet, meals: [...f.diet.meals, { type:'Snack', nutritionRating:3, calories:200 }] } }))}
                    className="text-xs text-blue-400 hover:text-blue-300">+ Add meal</button>
                </div>
                <div className="space-y-2">
                  {form.diet.meals.map((meal, i) => (
                    <div key={i} className="grid grid-cols-3 gap-2 p-3 rounded-xl border border-white/5"
                      style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <select className="input-field text-sm py-2" value={meal.type}
                        onChange={e => { const m=[...form.diet.meals]; m[i].type=e.target.value; setForm(f=>({...f,diet:{...f.diet,meals:m}})); }}>
                        {mealTypes.map(t=><option key={t} value={t}>{t}</option>)}
                      </select>
                      <input type="number" min={0} max={5} placeholder="Quality (1-5)" className="input-field text-sm py-2"
                        value={meal.nutritionRating}
                        onChange={e => { const m=[...form.diet.meals]; m[i].nutritionRating=+e.target.value; setForm(f=>({...f,diet:{...f.diet,meals:m}})); }} />
                      <div className="flex gap-1">
                        <input type="number" placeholder="Cal" className="input-field text-sm py-2 flex-1"
                          value={meal.calories}
                          onChange={e => { const m=[...form.diet.meals]; m[i].calories=+e.target.value; setForm(f=>({...f,diet:{...f.diet,meals:m}})); }} />
                        {form.diet.meals.length > 1 && (
                          <button onClick={() => setForm(f => ({ ...f, diet: { ...f.diet, meals: f.diet.meals.filter((_,j)=>j!==i) } }))}
                            className="text-red-400 hover:text-red-300 px-1 text-sm">✕</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: FITNESS ───────────────────────────────────── */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                <span className="text-3xl">🏋️</span> Fitness & Exercise
              </h2>
              <div className="space-y-2 mb-3">
                {form.fitness.map((ex, i) => (
                  <div key={i} className="p-3 rounded-xl border border-white/5 space-y-2"
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="Exercise type (e.g. Running)" className="input-field text-sm py-2"
                        value={ex.type}
                        onChange={e => { const f=[...form.fitness]; f[i].type=e.target.value; setForm(x=>({...x,fitness:f})); }} />
                      <input type="number" min={1} placeholder="Duration (minutes)" className="input-field text-sm py-2"
                        value={ex.duration}
                        onChange={e => { const f=[...form.fitness]; f[i].duration=+e.target.value; setForm(x=>({...x,fitness:f})); }} />
                    </div>
                    <div className="flex gap-2">
                      {intensityOptions.map(opt => (
                        <button key={opt} onClick={() => { const f=[...form.fitness]; f[i].intensity=opt; setForm(x=>({...x,fitness:f})); }}
                          className="flex-1 py-2 rounded-xl text-xs font-semibold border-2 capitalize transition-all"
                          style={ex.intensity === opt
                            ? { borderColor: opt==='low'?'#34d399':opt==='moderate'?'#fbbf24':'#f87171', background: opt==='low'?'rgba(52,211,153,0.2)':opt==='moderate'?'rgba(251,191,36,0.2)':'rgba(248,113,113,0.2)', color: opt==='low'?'#34d399':opt==='moderate'?'#fbbf24':'#f87171' }
                            : { borderColor: 'rgba(255,255,255,0.08)', color: '#6b7280' }}>
                          {opt==='low'?'🟢 ':opt==='moderate'?'🟡 ':'🔴 '}{opt}
                        </button>
                      ))}
                      {form.fitness.length > 1 && (
                        <button onClick={() => setForm(f=>({...f,fitness:f.fitness.filter((_,j)=>j!==i)}))}
                          className="text-red-400 px-2">✕</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setForm(f=>({...f,fitness:[...f.fitness,{type:'',duration:30,intensity:'moderate'}]}))}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors">+ Add exercise</button>
              <div className="mt-4 p-3 rounded-xl border border-orange-500/15 text-xs text-gray-400"
                style={{ background: 'rgba(251,146,60,0.05)' }}>
                💡 <strong className="text-orange-300">Tip:</strong> Aim for 150 minutes of moderate exercise per week. Even short walks count!
              </div>
            </div>
          )}

          {/* ── STEP 4: SKINCARE ──────────────────────────────────── */}
          {step === 4 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                <span className="text-3xl">✨</span> Skincare Routine
              </h2>
              <div className="mb-5">
                <label className="text-xs text-gray-400 mb-2 block font-medium">Products Used Today</label>
                <div className="flex flex-wrap gap-2">
                  {productOptions.map(p => (
                    <button key={p} onClick={() => toggleProduct(p)}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium border-2 transition-all"
                      style={form.skincare.productsUsed.includes(p)
                        ? { borderColor: '#f472b6', background: 'rgba(244,114,182,0.2)', color: '#f472b6' }
                        : { borderColor: 'rgba(255,255,255,0.08)', color: '#6b7280' }}>
                      {form.skincare.productsUsed.includes(p) ? '✓ ' : ''}{p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-2 block font-medium">Skin Issues Noticed</label>
                <div className="flex flex-wrap gap-2">
                  {skinIssueOptions.map(issue => (
                    <button key={issue} onClick={() => toggleSkinIssue(issue)}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium border-2 transition-all"
                      style={form.skincare.skinIssues.includes(issue)
                        ? { borderColor: '#fb923c', background: 'rgba(251,146,60,0.2)', color: '#fb923c' }
                        : { borderColor: 'rgba(255,255,255,0.08)', color: '#6b7280' }}>
                      {form.skincare.skinIssues.includes(issue) ? '✓ ' : ''}{issue}
                    </button>
                  ))}
                </div>
              </div>
              {form.skincare.productsUsed.length === 0 && (
                <div className="mt-4 p-3 rounded-xl border border-pink-500/15 text-xs text-gray-400"
                  style={{ background: 'rgba(244,114,182,0.05)' }}>
                  💡 <strong className="text-pink-300">Tip:</strong> A basic routine of cleanser, moisturiser and SPF is all you need for healthy skin.
                </div>
              )}
            </div>
          )}

          {/* ── STEP 5: MENTAL WELLNESS ───────────────────────────── */}
          {step === 5 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                <span className="text-3xl">🧠</span> Mental Wellness
              </h2>
              <div className="mb-5">
                <label className="text-xs text-gray-400 mb-2 block font-medium">
                  How are you feeling today?
                </label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(m => (
                    <button key={m} onClick={() => update('mentalWellness','moodRating',m)}
                      className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all"
                      style={form.mentalWellness.moodRating === m
                        ? { borderColor: '#a78bfa', background: 'rgba(167,139,250,0.2)' }
                        : { borderColor: 'rgba(255,255,255,0.08)', color: '#6b7280' }}>
                      <span className="text-2xl">{moodEmojis[m]}</span>
                      <span className="text-xs">{['','Terrible','Bad','Okay','Good','Great'][m]}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="text-xs text-gray-400 mb-2 block font-medium">Stress Level</label>
                <div className="flex gap-2">
                  {stressOptions.map(opt => (
                    <button key={opt} onClick={() => update('mentalWellness','stressLevel',opt)}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold border-2 capitalize transition-all"
                      style={form.mentalWellness.stressLevel === opt
                        ? { borderColor: opt==='low'?'#34d399':opt==='moderate'?'#fbbf24':'#f87171', background: opt==='low'?'rgba(52,211,153,0.2)':opt==='moderate'?'rgba(251,191,36,0.2)':'rgba(248,113,113,0.2)', color: opt==='low'?'#34d399':opt==='moderate'?'#fbbf24':'#f87171' }
                        : { borderColor: 'rgba(255,255,255,0.08)', color: '#6b7280' }}>
                      {opt==='low'?'😌':opt==='moderate'?'😐':'😰'} {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block font-medium">Journal Notes (optional)</label>
                <textarea rows={3} placeholder="How was your day? Any thoughts you'd like to capture..."
                  className="input-field resize-none text-sm"
                  value={form.mentalWellness.notes}
                  onChange={e => update('mentalWellness','notes',e.target.value)} />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
              className="mt-4 p-3 rounded-xl border border-red-500/25 bg-red-500/10 text-red-400 text-sm">
              ⚠️ {error}
            </motion.div>
          )}

          {/* Success */}
          {success && (
            <motion.div initial={{ opacity:0,scale:0.95 }} animate={{ opacity:1,scale:1 }}
              className="mt-4 p-4 rounded-xl border border-green-500/25 bg-green-500/10 text-green-400 text-sm text-center">
              ✅ Health log saved successfully! Redirecting to dashboard...
            </motion.div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6 pt-4 border-t border-white/5">
            <button
              onClick={() => setStep(s => Math.max(1,s-1))}
              disabled={step === 1}
              className="btn-secondary disabled:opacity-30">
              ← Back
            </button>
            {step < 5 ? (
              <button onClick={() => setStep(s => s+1)} className="btn-primary">
                Next → {STEPS[step]}
              </button>
            ) : (
              <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                onClick={handleSubmit} disabled={loading || success}
                className="btn-primary disabled:opacity-50">
                {loading ? '⟳ Saving...' : '💾 Save Log'}
              </motion.button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Summary preview */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}
        className="max-w-2xl mt-4 rounded-2xl border border-white/5 p-4"
        style={{ background:'rgba(255,255,255,0.02)' }}>
        <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">Today's Log Summary</p>
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="badge badge-blue">😴 Sleep: {form.sleep.duration}h</span>
          <span className="badge badge-green">💧 Water: {form.diet.hydration}L</span>
          <span className="badge badge-yellow">🏋️ Exercises: {form.fitness.length}</span>
          <span className="badge badge-purple">😊 Mood: {moodEmojis[form.mentalWellness.moodRating]} {form.mentalWellness.moodRating}/5</span>
          <span className="badge badge-red">🧴 Products: {form.skincare.productsUsed.length}</span>
          <span className="badge" style={{ background:'rgba(251,191,36,0.15)', color:'#fbbf24', border:'1px solid rgba(251,191,36,0.25)' }}>
            🍽️ Meals: {form.diet.meals.length}
          </span>
        </div>
      </motion.div>
    </Layout>
  );
}
