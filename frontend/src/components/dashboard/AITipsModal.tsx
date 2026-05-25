import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../ui/Modal';
import { toast } from '../ui/Toast';

interface Props { open: boolean; onClose: () => void; }

const tips = [
  {icon:'💧',text:'Drink a glass of water right now. Even mild dehydration reduces brain performance by 14%.',category:'Hydration'},
  {icon:'🧘',text:'Try box breathing: inhale 4s → hold 4s → exhale 4s → hold 4s. Reduces anxiety in minutes.',category:'Mental'},
  {icon:'🌙',text:'Going to bed at the same time each night improves sleep quality by up to 40%.',category:'Sleep'},
  {icon:'🥗',text:'Eating one extra serving of vegetables daily reduces disease risk by 20% over time.',category:'Nutrition'},
  {icon:'🏃',text:'A 10-minute walk after every meal lowers blood sugar and boosts metabolism significantly.',category:'Fitness'},
  {icon:'📵',text:'No screens 1 hour before bed. Blue light blocks melatonin production by 50%.',category:'Sleep'},
  {icon:'🎵',text:'Listening to calm music 20 minutes daily reduces cortisol and lowers heart rate.',category:'Mental'},
  {icon:'🌿',text:'Adding more fibre to your diet feeds good gut bacteria and improves digestion within days.',category:'Nutrition'},
  {icon:'☀️',text:'Getting 10–15 minutes of morning sunlight resets your circadian rhythm and boosts serotonin.',category:'Mental'},
  {icon:'💪',text:'Strength training twice a week increases metabolism by up to 9% and improves bone density.',category:'Fitness'},
  {icon:'🍵',text:'Green tea contains L-theanine which promotes calm focus without the jitters of coffee.',category:'Nutrition'},
  {icon:'🛁',text:'A warm bath 1–2 hours before bed lowers core body temperature and signals sleep onset.',category:'Sleep'},
];

const categories = ['All','Sleep','Mental','Nutrition','Fitness','Hydration'];

export default function AITipsModal({ open, onClose }: Props) {
  const [filter, setFilter] = useState('All');
  const [saved, setSaved]   = useState<number[]>([]);
  const [custom, setCustom] = useState('');
  const [customList, setCustomList] = useState<string[]>([]);

  const filtered = filter === 'All' ? tips : tips.filter(t => t.category === filter);

  const toggleSave = (i: number) => {
    setSaved(s => s.includes(i) ? s.filter(x => x !== i) : [...s, i]);
    toast(saved.includes(i) ? 'Removed from saved' : 'Tip saved! ⭐', 'success');
  };

  const addCustom = () => {
    if (!custom.trim()) return;
    setCustomList(l => [...l, custom.trim()]);
    setCustom('');
    toast('Custom tip added ✓', 'success');
  };

  const deleteCustom = (i: number) => {
    setCustomList(l => l.filter((_, idx) => idx !== i));
    toast('Tip deleted', 'info');
  };

  return (
    <Modal open={open} onClose={onClose} title="AI Wellness Tips" icon="🤖" color="#60a5fa" wide>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total Tips',   value: tips.length + customList.length, color: '#60a5fa' },
          { label: 'Saved',        value: saved.length,                     color: '#fbbf24' },
          { label: 'Custom Added', value: customList.length,                color: '#34d399' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 text-center border border-white/5" style={{ background: `${s.color}11` }}>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-5">
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filter === c ? 'bg-blue-600 text-white' : 'glass text-gray-400 hover:text-white'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Add custom tip */}
      <div className="flex gap-2 mb-5">
        <input type="text" placeholder="Add your own wellness tip..."
          className="input-field text-sm flex-1" value={custom}
          onChange={e => setCustom(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addCustom()} />
        <button onClick={addCustom} className="btn-primary py-2 px-4 text-sm">+ Add</button>
      </div>

      {/* Custom tips */}
      {customList.length > 0 && (
        <div className="mb-5">
          <p className="text-xs text-gray-500 font-medium mb-2">YOUR CUSTOM TIPS</p>
          <div className="space-y-2">
            {customList.map((tip, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-3 rounded-xl border border-green-500/20"
                style={{ background: 'rgba(52,211,153,0.06)' }}>
                <span className="text-lg">✍️</span>
                <p className="text-sm text-gray-300 flex-1">{tip}</p>
                <button onClick={() => deleteCustom(i)} className="text-xs text-gray-600 hover:text-red-400 transition-colors">🗑</button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Tips grid */}
      <p className="text-xs text-gray-500 font-medium mb-3">AI WELLNESS TIPS ({filtered.length})</p>
      <div className="space-y-3">
        {filtered.map((tip, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-start gap-4 p-4 rounded-2xl border border-white/5 hover:border-blue-500/20 transition-all"
            style={{ background: 'rgba(255,255,255,0.03)' }}>
            <span className="text-2xl shrink-0">{tip.icon}</span>
            <div className="flex-1">
              <p className="text-sm text-gray-300 leading-relaxed">{tip.text}</p>
              <span className="text-xs text-blue-400 mt-1 inline-block">{tip.category}</span>
            </div>
            <button onClick={() => toggleSave(i)}
              className={`text-xl shrink-0 transition-all hover:scale-125 ${saved.includes(i) ? 'text-yellow-400' : 'text-gray-700 hover:text-yellow-400'}`}>
              {saved.includes(i) ? '⭐' : '☆'}
            </button>
          </motion.div>
        ))}
      </div>
    </Modal>
  );
}
