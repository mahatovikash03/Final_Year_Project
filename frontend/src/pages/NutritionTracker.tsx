import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/layout/Layout';
import { toast } from '../components/ui/Toast';
import { useAuthStore } from '../hooks/useAuth';

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meal: string;
  date: string;
  time: string;
}

interface WaterEntry {
  id: string;
  amount: number;
  date: string;
  time: string;
}

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-workout', 'Post-workout'];

const QUICK_FOODS = [
  { name: 'Dal Rice',        calories: 350, protein: 12, carbs: 58, fat: 6  },
  { name: 'Roti with Sabzi', calories: 280, protein: 8,  carbs: 45, fat: 5  },
  { name: 'Idli Sambar',     calories: 200, protein: 7,  carbs: 38, fat: 2  },
  { name: 'Paneer Tikka',    calories: 290, protein: 18, carbs: 8,  fat: 20 },
  { name: 'Chicken Curry',   calories: 320, protein: 28, carbs: 12, fat: 18 },
  { name: 'Banana',          calories: 89,  protein: 1,  carbs: 23, fat: 0  },
  { name: 'Boiled Eggs (2)', calories: 154, protein: 13, carbs: 1,  fat: 11 },
  { name: 'Oats Bowl',       calories: 250, protein: 9,  carbs: 40, fat: 5  },
  { name: 'Curd (200g)',     calories: 120, protein: 6,  carbs: 10, fat: 5  },
  { name: 'Mixed Salad',     calories: 80,  protein: 3,  carbs: 14, fat: 1  },
  { name: 'Upma',            calories: 220, protein: 5,  carbs: 38, fat: 6  },
  { name: 'Poha',            calories: 200, protein: 4,  carbs: 40, fat: 3  },
];

const CALORIE_GOAL = 2000;
const WATER_GOAL   = 8;
const PROTEIN_GOAL = 60;

function todayStr() { return new Date().toISOString().split('T')[0]; }

function nKey(uid: string, key: string) { return `${uid}:${key}`; }
function load<T>(uid: string, key: string): T[] {
  try { return JSON.parse(localStorage.getItem(nKey(uid, key)) || '[]'); } catch { return []; }
}
function save<T>(uid: string, key: string, data: T[]) { localStorage.setItem(nKey(uid, key), JSON.stringify(data)); }

function MacroBar({ label, val, goal, color }: { label: string; val: number; goal: number; color: string }) {
  const pct = Math.min((val / goal) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span style={{ color }}>{val}g / {goal}g</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ backgroundColor: color }}
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }} />
      </div>
    </div>
  );
}

export default function NutritionTracker() {
  const userId = useAuthStore(s => s.user?.id || 'guest');
  const [foods,  setFoods]  = useState<FoodEntry[]>(() => load(userId, 'nutrition-log'));
  const [waters, setWaters] = useState<WaterEntry[]>(() => load(userId, 'water-log'));

  useEffect(() => {
    setFoods(load(userId, 'nutrition-log'));
    setWaters(load(userId, 'water-log'));
  }, [userId]);
  const [activeTab, setActiveTab] = useState<'log'|'today'|'history'>('today');
  const [mealType, setMealType]   = useState('Breakfast');
  const [form, setForm]           = useState({ name: '', calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [waterAmt, setWaterAmt]   = useState(250);
  const [search, setSearch]       = useState('');
  const [deleting, setDeleting]   = useState<string | null>(null);

  const today     = todayStr();
  const todayFood = foods.filter(f => f.date === today);
  const todayWater = waters.filter(w => w.date === today);

  const totalCal     = todayFood.reduce((s, f) => s + f.calories, 0);
  const totalProtein = todayFood.reduce((s, f) => s + f.protein, 0);
  const totalCarbs   = todayFood.reduce((s, f) => s + f.carbs, 0);
  const totalFat     = todayFood.reduce((s, f) => s + f.fat, 0);
  const totalWater   = todayWater.reduce((s, w) => s + w.amount, 0);
  const waterGlasses = Math.floor(totalWater / 250);

  const calPct   = Math.min((totalCal / CALORIE_GOAL) * 100, 100);
  const calColor = calPct > 110 ? '#f87171' : calPct > 80 ? '#34d399' : '#60a5fa';

  const addFood = (food?: typeof QUICK_FOODS[0]) => {
    const f = food ? { ...food, meal: mealType } : { ...form, meal: mealType };
    if (!f.name.trim()) { toast('Enter food name', 'error'); return; }
    const entry: FoodEntry = {
      id: Date.now().toString(), ...f,
      date: today, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
    const updated = [entry, ...foods];
    setFoods(updated); save(userId, 'nutrition-log', updated);
    setForm({ name: '', calories: 0, protein: 0, carbs: 0, fat: 0 });
    toast(`${f.name} added ✓`, 'success');
  };

  const deleteFood = (id: string) => {
    const updated = foods.filter(f => f.id !== id);
    setFoods(updated); save(userId, 'nutrition-log', updated);
    toast('Entry deleted', 'info');
    setDeleting(null);
  };

  const addWater = (ml: number) => {
    const entry: WaterEntry = {
      id: Date.now().toString(), amount: ml,
      date: today, time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
    const updated = [entry, ...waters];
    setWaters(updated); save(userId, 'water-log', updated);
    toast(`+${ml}ml water logged ✓`, 'success');
  };

  const mealGroups = MEAL_TYPES.map(mt => ({
    type: mt,
    items: todayFood.filter(f => f.meal === mt),
    total: todayFood.filter(f => f.meal === mt).reduce((s, f) => s + f.calories, 0),
  })).filter(g => g.items.length > 0);

  const filtered = QUICK_FOODS.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-3xl font-bold text-white">🥗 Nutrition Tracker</h1>
        <p className="text-gray-400 mt-1">Track your daily food intake, calories and macros.</p>
      </motion.div>

      {/* Calorie Ring + Macros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {/* Calorie ring */}
        <div className="rounded-2xl p-5 border border-white/8 flex items-center gap-5"
          style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="relative w-32 h-32 shrink-0">
            <svg viewBox="0 0 128 128" className="w-full h-full" style={{ filter: `drop-shadow(0 0 12px ${calColor}55)` }}>
              <circle cx="64" cy="64" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
              <motion.circle cx="64" cy="64" r="54" fill="none" stroke={calColor} strokeWidth="10"
                strokeLinecap="round" strokeDasharray={2 * Math.PI * 54}
                initial={{ strokeDashoffset: 2 * Math.PI * 54 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 54 * (1 - calPct / 100) }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                style={{ transformOrigin: '64px 64px', transform: 'rotate(-90deg)' }} />
              <text x="64" y="58" textAnchor="middle" fill="white" fontSize="20" fontWeight="900">{totalCal}</text>
              <text x="64" y="74" textAnchor="middle" fill={calColor} fontSize="9">kcal</text>
              <text x="64" y="88" textAnchor="middle" fill="rgba(148,163,184,0.5)" fontSize="8">of {CALORIE_GOAL}</text>
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-white font-bold mb-1">Calories Today</p>
            <p className="text-xs text-gray-500 mb-3">
              {CALORIE_GOAL - totalCal > 0 ? `${CALORIE_GOAL - totalCal} kcal remaining` : `${totalCal - CALORIE_GOAL} kcal over goal`}
            </p>
            <div className="space-y-2">
              <MacroBar label="Protein" val={totalProtein} goal={PROTEIN_GOAL} color="#60a5fa" />
              <MacroBar label="Carbs"   val={totalCarbs}   goal={250}          color="#fbbf24" />
              <MacroBar label="Fat"     val={totalFat}     goal={65}           color="#fb923c" />
            </div>
          </div>
        </div>

        {/* Water tracker */}
        <div className="rounded-2xl p-5 border border-white/8"
          style={{ background: 'rgba(52,211,153,0.05)' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold">💧 Water Today</h3>
            <span className="text-sm font-black text-cyan-400">{(totalWater / 1000).toFixed(1)}L</span>
          </div>
          <div className="grid grid-cols-8 gap-1.5 mb-3">
            {Array.from({ length: WATER_GOAL }).map((_, i) => (
              <motion.div key={i} whileTap={{ scale: 0.9 }}
                className="aspect-square rounded-lg flex items-center justify-center text-base cursor-pointer border"
                onClick={() => addWater(250)}
                style={i < waterGlasses
                  ? { background: 'rgba(52,211,153,0.25)', borderColor: 'rgba(52,211,153,0.5)' }
                  : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
                {i < waterGlasses ? '🥤' : '○'}
              </motion.div>
            ))}
          </div>
          <div className="flex gap-2">
            {[150, 250, 350, 500].map(ml => (
              <button key={ml} onClick={() => addWater(ml)}
                className="flex-1 py-2 rounded-xl text-xs font-bold border transition-all hover:scale-105"
                style={{ background: 'rgba(52,211,153,0.1)', borderColor: 'rgba(52,211,153,0.2)', color: '#34d399' }}>
                +{ml}ml
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {[
          { key: 'today',   label: '📋 Today\'s Log' },
          { key: 'log',     label: '➕ Add Food'      },
          { key: 'history', label: '📜 History'       },
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

      {/* Today Tab */}
      {activeTab === 'today' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl">
          {mealGroups.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <p className="text-4xl mb-3">🥗</p>
              <p className="text-white font-semibold">No food logged today</p>
              <button onClick={() => setActiveTab('log')} className="btn-primary mt-4 text-sm py-2 px-5">Add Food →</button>
            </div>
          ) : (
            <div className="space-y-4">
              {mealGroups.map(g => (
                <div key={g.type} className="rounded-2xl border border-white/5 overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                    <p className="text-white font-semibold text-sm">{g.type}</p>
                    <span className="text-xs text-gray-400">{g.total} kcal</span>
                  </div>
                  {g.items.map((item, i) => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.03] last:border-0">
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          P:{item.protein}g · C:{item.carbs}g · F:{item.fat}g · {item.time}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-orange-400">{item.calories} kcal</span>
                      {deleting === item.id ? (
                        <div className="flex gap-1">
                          <button onClick={() => deleteFood(item.id)} className="text-xs text-red-400 px-2 py-1 rounded-lg bg-red-500/10">✓</button>
                          <button onClick={() => setDeleting(null)} className="text-xs text-gray-500 px-1">✕</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleting(item.id)} className="text-gray-600 hover:text-red-400 transition-colors text-sm">🗑</button>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Add Food Tab */}
      {activeTab === 'log' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl space-y-4">
          {/* Meal type */}
          <div className="flex gap-2 flex-wrap">
            {MEAL_TYPES.map(mt => (
              <button key={mt} onClick={() => setMealType(mt)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
                style={mealType === mt
                  ? { background: 'rgba(96,165,250,0.2)', borderColor: 'rgba(96,165,250,0.4)', color: '#60a5fa' }
                  : { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', color: '#6b7280' }}>
                {mt}
              </button>
            ))}
          </div>

          {/* Custom food form */}
          <div className="rounded-2xl p-5 border border-white/8" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <h3 className="text-white font-semibold mb-4">✏️ Add Custom Food</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">Food Name</label>
                <input className="input-field text-sm" placeholder="e.g. Dal Rice"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              {[
                { key: 'calories', label: 'Calories (kcal)', placeholder: '350' },
                { key: 'protein',  label: 'Protein (g)',     placeholder: '12'  },
                { key: 'carbs',    label: 'Carbs (g)',       placeholder: '58'  },
                { key: 'fat',      label: 'Fat (g)',         placeholder: '6'   },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-xs text-gray-400 mb-1 block">{field.label}</label>
                  <input type="number" min={0} className="input-field text-sm" placeholder={field.placeholder}
                    value={(form as any)[field.key] || ''}
                    onChange={e => setForm(f => ({ ...f, [field.key]: +e.target.value }))} />
                </div>
              ))}
            </div>
            <button onClick={() => addFood()} className="btn-primary w-full py-3">➕ Add to {mealType}</button>
          </div>

          {/* Quick add */}
          <div className="rounded-2xl p-5 border border-white/8" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">⚡ Quick Add</h3>
              <input type="text" placeholder="Search food..." className="input-field text-sm py-1.5 w-40"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filtered.map((food, i) => (
                <motion.button key={i} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => addFood(food)}
                  className="flex items-center justify-between p-3 rounded-xl border border-white/5 hover:border-blue-500/20 text-left transition-all"
                  style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div>
                    <p className="text-white text-sm font-medium">{food.name}</p>
                    <p className="text-xs text-gray-500">P:{food.protein}g · C:{food.carbs}g · F:{food.fat}g</p>
                  </div>
                  <span className="text-orange-400 font-bold text-sm shrink-0">{food.calories} kcal</span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl">
          {foods.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <p className="text-4xl mb-3">📜</p>
              <p className="text-white font-semibold">No food history yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {[...new Set(foods.map(f => f.date))].slice(0, 14).map(date => {
                const dayFoods = foods.filter(f => f.date === date);
                const dayCal   = dayFoods.reduce((s, f) => s + f.calories, 0);
                return (
                  <div key={date} className="rounded-2xl border border-white/5 overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                      <p className="text-white font-semibold text-sm">
                        {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
                      </p>
                      <span className={`text-sm font-bold ${dayCal > CALORIE_GOAL ? 'text-red-400' : 'text-green-400'}`}>
                        {dayCal} / {CALORIE_GOAL} kcal
                      </span>
                    </div>
                    <div className="px-4 py-2 flex flex-wrap gap-2">
                      {dayFoods.slice(0, 5).map(f => (
                        <span key={f.id} className="text-xs px-2 py-1 rounded-lg border border-white/5 text-gray-400"
                          style={{ background: 'rgba(255,255,255,0.02)' }}>
                          {f.name} ({f.calories}cal)
                        </span>
                      ))}
                      {dayFoods.length > 5 && <span className="text-xs text-gray-600">+{dayFoods.length - 5} more</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </Layout>
  );
}
