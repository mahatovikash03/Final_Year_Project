import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/layout/Layout';
import { toast } from '../components/ui/Toast';

const devices = [
  { name: 'Apple Watch',          icon: '⌚', status: 'Beta',        color: '#60a5fa', desc: 'Heart rate, sleep stages, activity rings and SpO2.' },
  { name: 'Fitbit',               icon: '📟', status: 'Coming Q3',   color: '#34d399', desc: 'Steps, calories, sleep score and stress tracking.' },
  { name: 'Samsung Galaxy Watch', icon: '🟦', status: 'Coming Q3',   color: '#a78bfa', desc: 'Body composition, blood pressure and workout tracking.' },
  { name: 'Garmin',               icon: '🏃', status: 'Coming Q4',   color: '#fb923c', desc: 'VO2 max, training load, GPS and recovery data.' },
  { name: 'Oura Ring',            icon: '💍', status: 'Coming Q4',   color: '#f472b6', desc: 'HRV, readiness score, sleep stages and temperature.' },
  { name: 'Google Fit',           icon: '🏥', status: 'Coming Q4',   color: '#fbbf24', desc: 'Daily activity, heart points and wellness goals.' },
  { name: 'Whoop',                icon: '💪', status: 'Coming 2026', color: '#34d399', desc: 'Strain, recovery and sleep performance tracking.' },
  { name: 'Polar',                icon: '❄️', status: 'Coming 2026', color: '#60a5fa', desc: 'Training zones, nightly recharge and running metrics.' },
];

const roadmap = [
  {
    phase: 'Q3 2025 — Beta Release',
    color: '#60a5fa',
    items: ['Apple Watch heart rate & steps sync', 'Fitbit sleep and calorie import', 'Real-time dashboard updates from wearables'],
  },
  {
    phase: 'Q4 2025 — Full Integration',
    color: '#a78bfa',
    items: ['Samsung Galaxy Watch body composition', 'Garmin VO2 max and training load', 'Oura Ring readiness and HRV scores', 'Google Fit daily activity sync'],
  },
  {
    phase: '2026 — Advanced AI',
    color: '#34d399',
    items: ['AI health predictions from wearable data', 'Anomaly detection and early warnings', 'Personalised recovery recommendations', 'Whoop and Polar device support'],
  },
];

const metrics = [
  { icon: '❤️', label: 'Heart Rate',    value: '— bpm',  color: '#f87171' },
  { icon: '🩸', label: 'SpO2',          value: '— %',    color: '#60a5fa' },
  { icon: '👟', label: 'Steps Today',   value: '—',      color: '#34d399' },
  { icon: '🔥', label: 'Calories',      value: '— kcal', color: '#fb923c' },
  { icon: '😴', label: 'Sleep Score',   value: '—',      color: '#a78bfa' },
  { icon: '💪', label: 'Recovery',      value: '— %',    color: '#fbbf24' },
];

export default function Wearables() {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connected,  setConnected]  = useState<string[]>([]);
  const [showBeta,   setShowBeta]   = useState(false);

  const handleConnect = (name: string, status: string) => {
    if (status === 'Beta') {
      setConnecting(name);
      setShowBeta(true);
    } else {
      toast(`${name} integration coming soon! We'll notify you.`, 'info');
    }
  };

  const confirmConnect = () => {
    if (connecting) {
      setConnected(c => [...c, connecting]);
      toast(`${connecting} connected! ✓ (Demo mode)`, 'success');
    }
    setShowBeta(false);
    setConnecting(null);
  };

  return (
    <Layout>
      {/* Beta modal */}
      <AnimatePresence>
        {showBeta && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              className="glass-card p-7 max-w-sm w-full text-center">
              <div className="text-5xl mb-4">⌚</div>
              <h2 className="text-white text-xl font-bold mb-2">Connect {connecting}?</h2>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                This will connect your {connecting} in <strong className="text-blue-400">demo mode</strong>.
                Real data sync requires the companion app on your device. Full release coming Q3 2025.
              </p>
              <div className="flex gap-3">
                <button onClick={() => { setShowBeta(false); setConnecting(null); }} className="btn-secondary flex-1">Cancel</button>
                <button onClick={confirmConnect} className="btn-primary flex-1">Connect Demo</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-3xl font-bold text-white">⌚ Wearables Integration</h1>
        <p className="text-gray-400 mt-1">Connect your devices for automatic health data sync.</p>
      </motion.div>

      {/* Live metrics preview */}
      <div className="rounded-3xl border border-white/8 p-5 mb-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,rgba(59,130,246,0.1),rgba(139,92,246,0.06))' }}>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(96,165,250,0.5),transparent)' }} />
        <div className="flex items-center gap-3 mb-4">
          <motion.div className="w-3 h-3 rounded-full bg-yellow-400"
            animate={{ scale: [1,1.4,1] }} transition={{ repeat: Infinity, duration: 1.5 }} />
          <p className="text-white font-semibold">Live Health Metrics</p>
          <span className="badge badge-yellow text-xs ml-auto">No device connected</span>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {metrics.map((m, i) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl p-3 text-center border border-white/5"
              style={{ background: `${m.color}08` }}>
              <span className="text-2xl block mb-1">{m.icon}</span>
              <p className="text-sm font-black" style={{ color: m.color }}>{m.value}</p>
              <p className="text-xs text-gray-600 mt-0.5">{m.label}</p>
            </motion.div>
          ))}
        </div>
        {connected.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-center">
            <span className="text-xs text-green-400">✓ {connected.join(', ')} connected in demo mode</span>
          </motion.div>
        )}
      </div>

      {/* Device Cards */}
      <h2 className="text-xl font-bold text-white mb-4">Supported Devices</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {devices.map((d, i) => {
          const isConnected = connected.includes(d.name);
          return (
            <motion.div key={d.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl p-5 border transition-all hover:scale-[1.02]"
              style={isConnected
                ? { background: `${d.color}10`, borderColor: `${d.color}33`, boxShadow: `0 0 20px ${d.color}15` }
                : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{d.icon}</span>
                <div>
                  <h3 className="text-white font-semibold text-sm">{d.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: `${d.color}15`, color: d.color, border: `1px solid ${d.color}33` }}>
                    {isConnected ? '✓ Connected' : d.status}
                  </span>
                </div>
              </div>
              <p className="text-gray-400 text-xs mb-4 leading-relaxed">{d.desc}</p>
              <button
                onClick={() => !isConnected && handleConnect(d.name, d.status)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={isConnected
                  ? { background: `${d.color}20`, color: d.color, border: `1px solid ${d.color}30` }
                  : d.status === 'Beta'
                  ? { background: `${d.color}20`, color: d.color, border: `1px solid ${d.color}30`, cursor: 'pointer' }
                  : { background: 'rgba(255,255,255,0.05)', color: '#6b7280', cursor: 'not-allowed' }}>
                {isConnected ? '✓ Connected (Demo)' : d.status === 'Beta' ? '🔗 Connect (Beta)' : `📅 ${d.status}`}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Roadmap */}
      <h2 className="text-xl font-bold text-white mb-4">🗺️ Integration Roadmap</h2>
      <div className="space-y-4">
        {roadmap.map((r, i) => (
          <motion.div key={r.phase} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl p-5 border border-white/5 flex gap-4"
            style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="flex flex-col items-center gap-1 shrink-0">
              <motion.div className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }}
                animate={{ scale: [1,1.5,1], opacity: [1,0.5,1] }}
                transition={{ repeat: Infinity, duration: 2, delay: i * 0.5 }} />
              {i < roadmap.length - 1 && <div className="flex-1 w-0.5 bg-white/5 mt-1" style={{ minHeight: 40 }} />}
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-sm" style={{ color: r.color }}>{r.phase}</h3>
              <ul className="space-y-1">
                {r.items.map(item => (
                  <li key={item} className="text-gray-400 text-xs flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>
    </Layout>
  );
}
