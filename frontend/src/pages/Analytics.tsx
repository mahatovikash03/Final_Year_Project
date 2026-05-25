import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, RadialLinearScale, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import Layout from '../components/layout/Layout';
import api from '../services/api';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, RadialLinearScale, Title, Tooltip, Legend, Filler
);

const chartDefaults = {
  responsive: true,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(2,8,23,0.95)',
      borderColor: 'rgba(96,165,250,0.3)',
      borderWidth: 1,
      titleColor: '#94a3b8',
      bodyColor: '#ffffff',
      padding: 12,
    },
  },
  scales: {
    y: { ticks: { color: '#475569', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
    x: { ticks: { color: '#475569', font: { size: 10 } }, grid: { display: false } },
  },
};

function SummaryCard({ label, value, icon, color, delay }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="rounded-2xl p-4 border border-white/5" style={{ background: `${color}11` }}>
      <div className="flex justify-between items-start mb-3">
        <span className="text-2xl">{icon}</span>
        <motion.div className="w-2 h-2 rounded-full mt-1" style={{ backgroundColor: color }}
          animate={{ scale: [1, 1.6, 1] }} transition={{ repeat: Infinity, duration: 2 }} />
      </div>
      <p className="text-2xl font-black mb-0.5" style={{ color }}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </motion.div>
  );
}

export default function Analytics() {
  const [weekly,  setWeekly]  = useState<any>(null);
  const [monthly, setMonthly] = useState<any>(null);
  const [logs,    setLogs]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [range,   setRange]   = useState<'week' | 'month'>('week');
  const [activeChart, setActiveChart] = useState<'score'|'sleep'|'mood'|'hydration'>('score');

  useEffect(() => {
    Promise.all([
      api.get('/health-log/analytics/weekly'),
      api.get('/analytics/monthly'),
      api.get('/health-log?limit=30'),
    ]).then(([w, m, l]) => {
      setWeekly(w.data.data);
      setMonthly(m.data.data);
      setLogs(l.data.data || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const data     = range === 'week' ? weekly : monthly;
  const trendKey = range === 'week' ? 'weeklyTrend' : 'monthlyTrend';
  const trend    = data?.[trendKey] || [];

  const reversed   = [...logs].reverse();
  const mLabels    = reversed.map(l => new Date(l.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));
  const mScores    = reversed.map(l => l.wellnessScore || 0);
  const mSleep     = reversed.map(l => l.sleep?.duration || 0);
  const mMood      = reversed.map(l => l.mentalWellness?.moodRating || 0);
  const mHydration = reversed.map(l => l.diet?.hydration || 0);

  const wLabels = trend.map((t: any) => new Date(t.date).toLocaleDateString('en-IN', { weekday: 'short' }));
  const wScores = trend.map((t: any) => t.score);

  const goodDays = mScores.filter(s => s >= 70).length;
  const fairDays = mScores.filter(s => s >= 50 && s < 70).length;
  const lowDays  = mScores.filter(s => s > 0 && s < 50).length;

  const chartData: Record<string, any> = {
    score: {
      labels: mLabels,
      datasets: [{
        data: mScores,
        borderColor: '#60a5fa',
        backgroundColor: (ctx: any) => {
          const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 200);
          g.addColorStop(0, 'rgba(96,165,250,0.3)');
          g.addColorStop(1, 'rgba(96,165,250,0)');
          return g;
        },
        fill: true, tension: 0.5, borderWidth: 2,
        pointBackgroundColor: mScores.map(s => s >= 70 ? '#34d399' : s >= 50 ? '#fbbf24' : '#f87171'),
        pointRadius: 5, pointHoverRadius: 8,
      }]
    },
    sleep: {
      labels: mLabels,
      datasets: [{
        data: mSleep,
        borderColor: '#a78bfa',
        backgroundColor: 'rgba(167,139,250,0.1)',
        fill: true, tension: 0.4, borderWidth: 2,
        pointBackgroundColor: '#a78bfa', pointRadius: 4,
      }, {
        data: Array(mSleep.length).fill(7),
        borderColor: 'rgba(52,211,153,0.4)',
        borderDash: [5, 5], pointRadius: 0, borderWidth: 1,
      }]
    },
    mood: {
      labels: mLabels,
      datasets: [{
        data: mMood,
        borderColor: '#f472b6',
        backgroundColor: 'rgba(244,114,182,0.1)',
        fill: true, tension: 0.4, borderWidth: 2,
        pointBackgroundColor: '#f472b6', pointRadius: 4,
      }]
    },
    hydration: {
      labels: mLabels,
      datasets: [{
        data: mHydration,
        borderColor: '#34d399',
        backgroundColor: 'rgba(52,211,153,0.1)',
        fill: true, tension: 0.4, borderWidth: 2,
        pointBackgroundColor: '#34d399', pointRadius: 4,
      }, {
        data: Array(mHydration.length).fill(2.5),
        borderColor: 'rgba(251,191,36,0.4)',
        borderDash: [5, 5], pointRadius: 0, borderWidth: 1,
      }]
    },
  };

  const chartOptions: Record<string, any> = {
    score:     { ...chartDefaults, scales: { ...chartDefaults.scales, y: { ...chartDefaults.scales.y, min: 0, max: 100 } } },
    sleep:     { ...chartDefaults, scales: { ...chartDefaults.scales, y: { ...chartDefaults.scales.y, min: 0, max: 12 } } },
    mood:      { ...chartDefaults, scales: { ...chartDefaults.scales, y: { ...chartDefaults.scales.y, min: 0, max: 5 } } },
    hydration: { ...chartDefaults, scales: { ...chartDefaults.scales, y: { ...chartDefaults.scales.y, min: 0, max: 5 } } },
  };

  const summaryCards = [
    { label: 'Avg Score',      value: data?.avgWellnessScore  ?? '—',            icon: '💚', color: '#34d399', delay: 0.05 },
    { label: 'Avg Sleep',      value: `${data?.avgSleepDuration ?? 0}h`,          icon: '😴', color: '#60a5fa', delay: 0.08 },
    { label: 'Avg Mood',       value: `${data?.avgMoodRating ?? 0}/5`,            icon: '😊', color: '#a78bfa', delay: 0.11 },
    { label: 'Avg Hydration',  value: `${data?.avgHydration ?? 0}L`,              icon: '💧', color: '#34d399', delay: 0.14 },
    { label: 'Total Workouts', value: data?.totalWorkouts    ?? 0,                icon: '🏋️', color: '#fb923c', delay: 0.17 },
    { label: 'Days Logged',    value: data?.logsThisWeek ?? data?.totalLogs ?? 0, icon: '📋', color: '#f472b6', delay: 0.20 },
  ];

  const radarData = {
    labels: ['Sleep', 'Hydration', 'Fitness', 'Mood', 'Consistency'],
    datasets: [{
      label: 'This Week',
      data: [
        Math.min(((data?.avgSleepDuration ?? 0) / 9) * 100, 100),
        Math.min(((data?.avgHydration ?? 0) / 2.5) * 100, 100),
        Math.min((data?.totalWorkouts ?? 0) * 14, 100),
        ((data?.avgMoodRating ?? 0) / 5) * 100,
        Math.min((data?.logsThisWeek ?? 0) * 14, 100),
      ],
      backgroundColor: 'rgba(96,165,250,0.15)',
      borderColor: '#60a5fa',
      borderWidth: 2,
      pointBackgroundColor: '#60a5fa',
      pointRadius: 4,
    }],
  };

  if (loading) {
    return (
      <Layout>
        <div className="mb-6"><div className="h-8 w-48 shimmer rounded-xl mb-2" /><div className="h-4 w-64 shimmer rounded-xl" /></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">{[...Array(6)].map((_,i)=><div key={i} className="h-24 shimmer rounded-2xl"/>)}</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{[...Array(4)].map((_,i)=><div key={i} className="h-56 shimmer rounded-2xl"/>)}</div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-white">📊 Analytics</h1>
            <p className="text-gray-400 mt-1">Deep insights into your wellness patterns.</p>
          </div>
          <div className="flex gap-2">
            {(['week','month'] as const).map(r => (
              <button key={r} onClick={() => setRange(r)}
                className="px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all"
                style={range === r
                  ? { background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: 'white' }
                  : { background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)' }}>
                This {r}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {summaryCards.map(c => <SummaryCard key={c.label} {...c} />)}
      </div>

      {/* Chart Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-hide">
        {[
          { key: 'score',     label: '💚 Wellness Score' },
          { key: 'sleep',     label: '😴 Sleep'          },
          { key: 'mood',      label: '😊 Mood'           },
          { key: 'hydration', label: '💧 Hydration'      },
        ].map(c => (
          <button key={c.key} onClick={() => setActiveChart(c.key as any)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all shrink-0"
            style={activeChart === c.key
              ? { background: 'rgba(96,165,250,0.2)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.4)' }
              : { background: 'rgba(255,255,255,0.04)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.08)' }}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Main Line Chart */}
      <motion.div key={activeChart} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-5 border border-white/5 mb-4"
        style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-white font-semibold text-sm sm:text-base">
            {activeChart === 'score' ? 'Wellness Score' : activeChart === 'sleep' ? 'Sleep Duration (hrs)' : activeChart === 'mood' ? 'Mood Rating (/5)' : 'Hydration (Litres)'}
            {' — Last 30 Days'}
          </h2>
          {activeChart === 'sleep' && <span className="text-xs text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">--- Goal: 7h</span>}
          {activeChart === 'hydration' && <span className="text-xs text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full">--- Goal: 2.5L</span>}
        </div>
        {mScores.some(s => s > 0) ? (
          <Line data={chartData[activeChart]} options={chartOptions[activeChart] as any} />
        ) : (
          <div className="h-40 flex flex-col items-center justify-center text-gray-600">
            <p className="text-3xl mb-2">📊</p>
            <p className="text-sm">No data yet — start logging your health!</p>
          </div>
        )}
      </motion.div>

      {/* Bottom row — Bar + Doughnut + Radar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="rounded-2xl p-5 border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <h3 className="text-white font-semibold text-sm mb-3">Score Bars (Weekly)</h3>
          {wScores.length > 0 ? (
            <Bar
              data={{
                labels: wLabels,
                datasets: [{
                  data: wScores,
                  backgroundColor: wScores.map((s: number) => s >= 70 ? 'rgba(52,211,153,0.7)' : s >= 50 ? 'rgba(251,191,36,0.7)' : 'rgba(248,113,113,0.7)'),
                  borderRadius: 8, borderSkipped: false,
                }]
              }}
              options={{ ...chartDefaults, scales: { ...chartDefaults.scales, y: { ...chartDefaults.scales.y, min: 0, max: 100 } } } as any}
            />
          ) : <p className="text-gray-600 text-sm text-center py-8">No weekly data yet</p>}
        </div>

        <div className="rounded-2xl p-5 border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <h3 className="text-white font-semibold text-sm mb-3">Score Distribution</h3>
          {goodDays + fairDays + lowDays > 0 ? (
            <>
              <Doughnut
                data={{
                  labels: ['Good (70+)', 'Fair (50–70)', 'Low (<50)'],
                  datasets: [{
                    data: [goodDays, fairDays, lowDays],
                    backgroundColor: ['rgba(52,211,153,0.8)', 'rgba(251,191,36,0.8)', 'rgba(248,113,113,0.8)'],
                    borderWidth: 0, hoverOffset: 4,
                  }]
                }}
                options={{ plugins: { legend: { labels: { color: '#94a3b8', font: { size: 10 } } } }, cutout: '60%' }}
              />
              <div className="space-y-1 mt-3">
                {[{ l: 'Good days', c: goodDays, col: '#34d399' }, { l: 'Fair days', c: fairDays, col: '#fbbf24' }, { l: 'Low days', c: lowDays, col: '#f87171' }].map(x => (
                  <div key={x.l} className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">{x.l}</span>
                    <span className="font-bold" style={{ color: x.col }}>{x.c}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-gray-600 text-sm text-center py-8">No data yet</p>}
        </div>

        <div className="rounded-2xl p-5 border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <h3 className="text-white font-semibold text-sm mb-3">Wellness Areas</h3>
          <Radar
            data={radarData}
            options={{
              responsive: true,
              scales: {
                r: {
                  min: 0, max: 100,
                  ticks: { display: false },
                  grid: { color: 'rgba(255,255,255,0.06)' },
                  angleLines: { color: 'rgba(255,255,255,0.06)' },
                  pointLabels: { color: '#94a3b8', font: { size: 10 } },
                }
              },
              plugins: { legend: { display: false } },
            }}
          />
        </div>
      </div>

      {/* Insights row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl p-5 border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <h3 className="text-white font-semibold text-sm mb-3">📅 Recent Log Entries</h3>
          {logs.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-6">No logs yet — start from Log Health</p>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {logs.slice(0, 8).map((log: any) => {
                const s = log.wellnessScore || 0;
                const c = s >= 70 ? '#34d399' : s >= 50 ? '#fbbf24' : '#f87171';
                return (
                  <div key={log._id} className="flex items-center gap-3 p-2 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center border text-center shrink-0"
                      style={{ borderColor: `${c}33`, background: `${c}11` }}>
                      <span className="text-xs font-black" style={{ color: c }}>{s}</span>
                    </div>
                    <div className="flex-1 text-xs text-gray-400">
                      <p className="text-white">{new Date(log.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                      <p>😴{log.sleep?.duration || 0}h · 💧{log.diet?.hydration || 0}L · 🏋️{log.fitness?.length || 0}</p>
                    </div>
                    <span className="text-xs font-bold">{s >= 70 ? '🟢' : s >= 50 ? '🟡' : '🔴'}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl p-5 border border-blue-500/15" style={{ background: 'rgba(59,130,246,0.05)' }}>
          <h3 className="text-blue-300 font-semibold text-sm mb-3">🤖 AI Insights for You</h3>
          <div className="space-y-2">
            {([
              (data?.avgSleepDuration ?? 0) > 0 && (data?.avgSleepDuration ?? 0) < 7 && { icon: '😴', tip: 'Average sleep is below 7 hours. Try sleeping 30 minutes earlier tonight.' },
              (data?.avgHydration ?? 0) > 0 && (data?.avgHydration ?? 0) < 2 && { icon: '💧', tip: 'Hydration is low. Set a reminder to drink water every hour.' },
              (data?.totalWorkouts ?? 0) < 3 && (data?.logsThisWeek ?? 0) > 0 && { icon: '🏋️', tip: 'Add at least 3 workout sessions per week for better fitness scores.' },
              (data?.avgMoodRating ?? 0) > 0 && (data?.avgMoodRating ?? 0) < 3 && { icon: '😊', tip: 'Mood has been low. Try 5 minutes of box breathing each morning.' },
              (data?.logsThisWeek ?? 0) > 0 && (data?.logsThisWeek ?? 0) < 5 && { icon: '📋', tip: 'Log your health every day for more accurate insights.' },
              (data?.avgWellnessScore ?? 0) >= 70 && { icon: '🔥', tip: 'Excellent! You are performing above average this week. Keep it up!' },
            ] as any[]).filter(Boolean).slice(0, 5).map((item: any, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex gap-2 p-2.5 rounded-xl text-xs text-gray-400"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                <span className="text-base shrink-0">{item.icon}</span>
                <span>{item.tip}</span>
              </motion.div>
            ))}
            {!(data?.logsThisWeek ?? 0) && (
              <p className="text-gray-600 text-xs text-center py-4">Log some health data to get personalised AI insights!</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
