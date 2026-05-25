import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Modal from '../ui/Modal';
import { toast } from '../ui/Toast';
import api from '../../services/api';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, RadialLinearScale,
  Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, RadialLinearScale,
  Title, Tooltip, Legend, Filler
);

// ── Wellness Ring Full Modal ──────────────────────────────────────────────────
export function WellnessRingModal({ open, onClose, analytics }: { open: boolean; onClose: () => void; analytics: any }) {
  const score  = analytics?.avgWellnessScore ?? 0;
  const col    = score >= 70 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171';
  const trend  = analytics?.weeklyTrend || [];
  const labels = trend.map((t: any) => new Date(t.date).toLocaleDateString('en-IN', { weekday: 'short' }));
  const scores = trend.map((t: any) => t.score);

  const breakdown = [
    { label: 'Sleep',      val: Math.min(((analytics?.avgSleepDuration ?? 0) / 9) * 100, 100),           color: '#60a5fa' },
    { label: 'Hydration',  val: Math.min(((analytics?.avgHydration ?? 0) / 2.5) * 100, 100),             color: '#34d399' },
    { label: 'Fitness',    val: Math.min((analytics?.totalWorkouts ?? 0) * 14, 100),                      color: '#fb923c' },
    { label: 'Mood',       val: ((analytics?.avgMoodRating ?? 0) / 5) * 100,                              color: '#a78bfa' },
    { label: 'Skincare',   val: 75,                                                                        color: '#f472b6' },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Wellness Score Breakdown" icon="💚" color={col} wide>
      {/* Big score */}
      <div className="flex flex-col items-center mb-6 py-5 rounded-2xl border"
        style={{ background: `${col}08`, borderColor: `${col}22` }}>
        <motion.p className="text-8xl font-black mb-1" style={{ color: col }}
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
          {score}
        </motion.p>
        <p className="text-gray-400 text-sm">Your Weekly Wellness Score</p>
        <p style={{ color: col }} className="text-sm font-bold mt-1">
          {score >= 70 ? '🔥 Excellent!' : score >= 50 ? '👍 Good progress' : '💪 Room to improve'}
        </p>
        {/* Formula */}
        <p className="text-xs text-gray-600 mt-3 px-4 text-center">
          Score = (Sleep×30%) + (Hydration×25%) + (Fitness×20%) + (Mood×15%) + (Skincare×10%)
        </p>
      </div>

      {/* Score breakdown radar + bars side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Radar */}
        <div className="rounded-2xl p-4 border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <p className="text-xs text-gray-500 mb-3 font-medium uppercase">Radar View</p>
          <Radar
            data={{
              labels: breakdown.map(b => b.label),
              datasets: [{
                label: 'Score',
                data: breakdown.map(b => b.val),
                backgroundColor: `${col}22`,
                borderColor: col,
                borderWidth: 2,
                pointBackgroundColor: col,
              }]
            }}
            options={{
              responsive: true,
              scales: {
                r: {
                  min: 0, max: 100,
                  ticks: { display: false },
                  grid: { color: 'rgba(255,255,255,0.06)' },
                  angleLines: { color: 'rgba(255,255,255,0.06)' },
                  pointLabels: { color: '#94a3b8', font: { size: 11 } },
                }
              },
              plugins: { legend: { display: false } },
            }}
          />
        </div>

        {/* Breakdown bars */}
        <div className="rounded-2xl p-4 border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <p className="text-xs text-gray-500 mb-3 font-medium uppercase">Component Scores</p>
          <div className="space-y-3">
            {breakdown.map((b, i) => (
              <div key={b.label}>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{b.label}</span>
                  <span style={{ color: b.color }}>{b.val.toFixed(0)}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                  <motion.div className="h-full rounded-full"
                    style={{ backgroundColor: b.color, boxShadow: `0 0 8px ${b.color}55` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${b.val}%` }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 1 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Score history chart */}
      {scores.length > 0 && (
        <div className="rounded-2xl p-4 border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <p className="text-xs text-gray-500 mb-3 font-medium uppercase">Score History This Week</p>
          <Line
            data={{
              labels,
              datasets: [{
                data: scores,
                borderColor: col,
                backgroundColor: `${col}15`,
                fill: true, tension: 0.5,
                pointBackgroundColor: scores.map((s: number) => s >= 70 ? '#34d399' : s >= 50 ? '#fbbf24' : '#f87171'),
                pointRadius: 6, borderWidth: 2,
              }]
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: {
                y: { min: 0, max: 100, ticks: { color: '#475569', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
                x: { ticks: { color: '#475569', font: { size: 10 } }, grid: { display: false } },
              },
            }}
          />
        </div>
      )}

      {/* Tips to improve */}
      <div className="mt-4 rounded-2xl p-4 border border-blue-500/15" style={{ background: 'rgba(59,130,246,0.06)' }}>
        <p className="text-blue-300 font-semibold text-sm mb-2">🤖 How to improve your score</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
          {[
            { tip: 'Sleep 7–9 hours every night', icon: '😴' },
            { tip: 'Drink 2.5L of water daily', icon: '💧' },
            { tip: 'Exercise at least 3x per week', icon: '🏋️' },
            { tip: 'Log your health data daily', icon: '📋' },
            { tip: 'Maintain a skincare routine', icon: '✨' },
            { tip: 'Practice stress management', icon: '🧘' },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
              <span>{t.icon}</span><span>{t.tip}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

// ── Trend Chart Full Modal ────────────────────────────────────────────────────
export function TrendChartModal({ open, onClose, analytics }: { open: boolean; onClose: () => void; analytics: any }) {
  const [logs, setLogs]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    api.get('/health-log?limit=30')
      .then(r => setLogs(r.data.data))
      .catch(() => toast('Failed to load', 'error'))
      .finally(() => setLoading(false));
  }, [open]);

  const monthly = logs.slice().reverse();
  const mLabels = monthly.map(l => new Date(l.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));
  const mScores = monthly.map(l => l.wellnessScore || 0);
  const mSleep  = monthly.map(l => l.sleep?.duration || 0);
  const mHydra  = monthly.map(l => l.diet?.hydration || 0);

  const weekly  = analytics?.weeklyTrend || [];
  const wLabels = weekly.map((t: any) => new Date(t.date).toLocaleDateString('en-IN', { weekday: 'short' }));
  const wScores = weekly.map((t: any) => t.score);

  const goodDays = mScores.filter(s => s >= 70).length;
  const fairDays = mScores.filter(s => s >= 50 && s < 70).length;
  const lowDays  = mScores.filter(s => s < 50 && s > 0).length;

  return (
    <Modal open={open} onClose={onClose} title="Wellness Trend Analytics" icon="📈" color="#60a5fa" wide>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Avg Score',  value: analytics?.avgWellnessScore ?? '—', color: '#60a5fa' },
          { label: 'Good Days',  value: goodDays,  color: '#34d399' },
          { label: 'Fair Days',  value: fairDays,  color: '#fbbf24' },
          { label: 'Low Days',   value: lowDays,   color: '#f87171' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-3 text-center border border-white/5" style={{ background: `${s.color}11` }}>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-40 rounded-2xl shimmer" />)}</div>
      ) : (
        <div className="space-y-4">
          {/* Monthly wellness score */}
          <div className="rounded-2xl p-4 border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-sm text-white font-semibold mb-3">📊 Wellness Score — Last 30 Days</p>
            {mScores.length > 0 ? (
              <Bar
                data={{
                  labels: mLabels,
                  datasets: [{
                    data: mScores,
                    backgroundColor: mScores.map(s => s >= 70 ? 'rgba(52,211,153,0.7)' : s >= 50 ? 'rgba(251,191,36,0.7)' : 'rgba(248,113,113,0.7)'),
                    borderRadius: 6,
                  }]
                }}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { min: 0, max: 100, ticks: { color: '#475569', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
                    x: { ticks: { color: '#475569', font: { size: 9 }, maxRotation: 45 }, grid: { display: false } },
                  },
                }}
              />
            ) : <p className="text-gray-600 text-sm text-center py-8">No data yet</p>}
          </div>

          {/* Sleep trend */}
          <div className="rounded-2xl p-4 border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-sm text-white font-semibold mb-3">😴 Sleep Duration Trend</p>
            {mSleep.some(s => s > 0) ? (
              <Line
                data={{
                  labels: mLabels,
                  datasets: [{
                    data: mSleep,
                    borderColor: '#60a5fa',
                    backgroundColor: 'rgba(96,165,250,0.1)',
                    fill: true, tension: 0.4,
                    pointBackgroundColor: '#60a5fa',
                    pointRadius: 4, borderWidth: 2,
                  }, {
                    data: Array(mSleep.length).fill(7),
                    borderColor: 'rgba(52,211,153,0.4)',
                    borderDash: [5, 5],
                    pointRadius: 0, borderWidth: 1,
                    label: 'Goal (7h)',
                  }]
                }}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { min: 0, max: 12, ticks: { color: '#475569', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
                    x: { ticks: { color: '#475569', font: { size: 9 }, maxRotation: 45 }, grid: { display: false } },
                  },
                }}
              />
            ) : <p className="text-gray-600 text-sm text-center py-8">No sleep data yet</p>}
          </div>

          {/* Hydration trend */}
          <div className="rounded-2xl p-4 border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-sm text-white font-semibold mb-3">💧 Hydration Trend</p>
            {mHydra.some(h => h > 0) ? (
              <Line
                data={{
                  labels: mLabels,
                  datasets: [{
                    data: mHydra,
                    borderColor: '#34d399',
                    backgroundColor: 'rgba(52,211,153,0.1)',
                    fill: true, tension: 0.4,
                    pointBackgroundColor: '#34d399',
                    pointRadius: 4, borderWidth: 2,
                  }, {
                    data: Array(mHydra.length).fill(2.5),
                    borderColor: 'rgba(251,191,36,0.4)',
                    borderDash: [5, 5],
                    pointRadius: 0, borderWidth: 1,
                  }]
                }}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { min: 0, max: 5, ticks: { color: '#475569', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
                    x: { ticks: { color: '#475569', font: { size: 9 }, maxRotation: 45 }, grid: { display: false } },
                  },
                }}
              />
            ) : <p className="text-gray-600 text-sm text-center py-8">No hydration data yet</p>}
          </div>

          {/* Doughnut distribution */}
          <div className="rounded-2xl p-4 border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-sm text-white font-semibold mb-3">🎯 Score Distribution</p>
            <div className="flex items-center gap-6">
              <div className="w-36 h-36 shrink-0">
                <Doughnut
                  data={{
                    labels: ['Good', 'Fair', 'Low', 'None'],
                    datasets: [{
                      data: [goodDays, fairDays, lowDays, Math.max(0, logs.length - goodDays - fairDays - lowDays)],
                      backgroundColor: ['rgba(52,211,153,0.8)', 'rgba(251,191,36,0.8)', 'rgba(248,113,113,0.8)', 'rgba(255,255,255,0.05)'],
                      borderWidth: 0,
                      hoverOffset: 4,
                    }]
                  }}
                  options={{ plugins: { legend: { display: false } }, cutout: '60%' }}
                />
              </div>
              <div className="space-y-2 flex-1">
                {[
                  { label: 'Good days (70+)',  count: goodDays, color: '#34d399', dot: 'bg-green-400' },
                  { label: 'Fair days (50–69)', count: fairDays, color: '#fbbf24', dot: 'bg-yellow-400' },
                  { label: 'Low days (<50)',    count: lowDays,  color: '#f87171', dot: 'bg-red-400' },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${l.dot}`} />
                    <span className="text-gray-400 text-xs">{l.label}</span>
                    <span className="font-bold ml-auto text-sm" style={{ color: l.color }}>{l.count}</span>
                  </div>
                ))}
                <p className="text-xs text-gray-600 mt-2">Total: {logs.length} logged days</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── Hero Banner Modal (clicking the whole hero) ───────────────────────────────
export function HeroBannerModal({ open, onClose, user, analytics }: { open: boolean; onClose: () => void; user: any; analytics: any }) {
  const score = analytics?.avgWellnessScore ?? 0;
  const col   = score >= 70 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171';

  const quickStats = [
    { label: 'Avg Sleep',    value: `${analytics?.avgSleepDuration ?? 0}h`,  icon: '😴', color: '#60a5fa' },
    { label: 'Avg Mood',     value: `${analytics?.avgMoodRating ?? 0}/5`,     icon: '😊', color: '#a78bfa' },
    { label: 'Workouts',     value: `${analytics?.totalWorkouts ?? 0}`,       icon: '🏋️', color: '#fb923c' },
    { label: 'Hydration',    value: `${analytics?.avgHydration ?? 0}L`,       icon: '💧', color: '#34d399' },
    { label: 'Logs',         value: `${analytics?.logsThisWeek ?? 0}`,        icon: '📋', color: '#f472b6' },
    { label: 'Wellness',     value: `${score}`,                               icon: '💚', color: col },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Your Profile Overview" icon="👤" color="#60a5fa" wide>
      {/* Profile card */}
      <div className="flex items-center gap-5 p-5 rounded-2xl border border-blue-500/20 mb-5"
        style={{ background: 'linear-gradient(135deg,rgba(59,130,246,0.1),rgba(139,92,246,0.05))' }}>
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-black text-white shrink-0">
          {(user?.name || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">{user?.name}</h2>
          <p className="text-gray-400 text-sm">{user?.email}</p>
          <div className="flex gap-2 mt-2">
            <span className="badge badge-blue">{user?.role}</span>
            <span className="badge badge-green">🟢 Active</span>
            {score >= 70 && <span className="badge badge-yellow">🔥 On Fire</span>}
          </div>
        </div>
        <div className="ml-auto text-right">
          <p className="text-4xl font-black" style={{ color: col }}>{score}</p>
          <p className="text-xs text-gray-500">wellness score</p>
        </div>
      </div>

      {/* Quick stats grid */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {quickStats.map(s => (
          <div key={s.label} className="rounded-2xl p-4 text-center border border-white/5" style={{ background: `${s.color}11` }}>
            <span className="text-2xl block mb-1">{s.icon}</span>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Today's date & time */}
      <div className="rounded-2xl p-4 border border-white/5 mb-4 text-center"
        style={{ background: 'rgba(255,255,255,0.03)' }}>
        <p className="text-white font-bold">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p className="text-gray-500 text-sm mt-1">{new Date().toLocaleTimeString('en-IN')}</p>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <a href="/log" className="btn-primary text-center py-3 text-sm">📝 Log Today's Health</a>
        <a href="/profile" className="btn-secondary text-center py-3 text-sm">👤 Edit Profile</a>
      </div>
    </Modal>
  );
}

// ── Quick Actions Info Modal ──────────────────────────────────────────────────
export function QuickActionsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const features = [
    { icon: '📝', label: 'Log Today',   to: '/log',        desc: 'Record sleep, diet, fitness, skincare and mental wellness in a 5-step form', color: '#3b82f6' },
    { icon: '🤖', label: 'AI Chat',     to: '/ai-chat',    desc: 'Chat with your personal AI wellness assistant for health advice 24/7', color: '#8b5cf6' },
    { icon: '🩺', label: 'Symptoms',    to: '/symptoms',   desc: 'Check symptoms and get personalised wellness tips for sleep, gut, stress or skin', color: '#10b981' },
    { icon: '📊', label: 'Analytics',   to: '/analytics',  desc: 'View detailed charts, trends and insights for all your health metrics', color: '#f97316' },
    { icon: '👥', label: 'Community',   to: '/community',  desc: 'Share your wellness journey, get inspired and support others', color: '#06b6d4' },
    { icon: '⌚', label: 'Wearables',   to: '/wearables',  desc: 'Connect fitness trackers and smartwatches for automatic health data sync', color: '#ec4899' },
    { icon: '🔔', label: 'Alerts',      to: '/notifications', desc: 'View reminders, achievement badges and wellness tips', color: '#fbbf24' },
    { icon: '👤', label: 'Profile',     to: '/profile',    desc: 'Edit your profile, view stats and manage your account settings', color: '#a78bfa' },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Quick Actions" icon="⚡" color="#60a5fa" wide>
      <p className="text-gray-400 text-sm mb-5">All features of HealthTrack360 at a glance. Click any to navigate.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {features.map((f, i) => (
          <motion.a key={i} href={f.to} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-4 p-4 rounded-2xl border border-white/5 hover:border-white/20 transition-all"
            style={{ background: 'rgba(255,255,255,0.03)' }}
            onClick={onClose}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 border border-white/10"
              style={{ background: `${f.color}15` }}>
              {f.icon}
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{f.label}</p>
              <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{f.desc}</p>
            </div>
          </motion.a>
        ))}
      </div>
    </Modal>
  );
}
