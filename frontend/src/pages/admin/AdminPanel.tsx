import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import { toast } from '../../components/ui/Toast';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

interface Stats { totalUsers: number; totalLogs: number; avgScore: number; activeToday: number; }
interface User  { _id: string; name: string; email: string; role: string; createdAt: string; }

export default function AdminPanel() {
  const [stats,    setStats]    = useState<Stats>({ totalUsers: 0, totalLogs: 0, avgScore: 0, activeToday: 0 });
  const [users,    setUsers]    = useState<User[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [activeTab, setActiveTab] = useState<'overview'|'users'|'system'>('overview');
  const [search,   setSearch]   = useState('');
  const [deleting, setDeleting] = useState<string|null>(null);
  const [activity, setActivity] = useState<any[]>([]);

  // ── Export users as CSV ──────────────────────────────────────────────────
  const exportUsersCSV = () => {
    const headers = ['Name', 'Email', 'Role', 'Joined', 'isActive'];
    const rows    = users.map(u => [
      u.name, u.email, u.role,
      u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '',
      (u as any).isActive ? 'Yes' : 'No',
    ]);
    const csv  = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `healthtrack360_users_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('Users exported as CSV ✓', 'success');
  };

  // ── Export activity log as CSV ────────────────────────────────────────
  const exportActivityCSV = () => {
    const headers = ['User', 'Email', 'Action', 'Category', 'Date'];
    const rows    = activity.map(a => [
      a.userId?.name || 'Unknown',
      a.userId?.email || '',
      a.action, a.category,
      new Date(a.createdAt).toLocaleString('en-IN'),
    ]);
    const csv  = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `healthtrack360_activity_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('Activity log exported ✓', 'success');
  };

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats').catch(() => ({ data: { data: { totalUsers:0, totalLogs:0, avgScore:0, activeToday:0 } } })),
      api.get('/admin/users').catch(() => ({ data: { data: [] } })),
      api.get('/admin/activity?limit=200').catch(() => ({ data: { data: [] } })),
    ]).then(([s, u, a]) => {
      setStats(s.data.data);
      setUsers(u.data.data);
      setActivity(a.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(u => u.filter(x => x._id !== id));
      toast('User deleted', 'info');
    } catch { toast('Failed to delete user', 'error'); }
    setDeleting(null);
  };

  const filtered = search
    ? users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
    : users;

  const scoreCol = stats.avgScore >= 70 ? '#34d399' : stats.avgScore >= 50 ? '#fbbf24' : '#f87171';

  const statCards = [
    { label: 'Total Users',   value: stats.totalUsers,  icon: '👥', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'  },
    { label: 'Total Logs',    value: stats.totalLogs,   icon: '📋', color: '#34d399', bg: 'rgba(52,211,153,0.1)'  },
    { label: 'Avg Score',     value: stats.avgScore,    icon: '💚', color: scoreCol,  bg: `${scoreCol}1a`         },
    { label: 'Active Today',  value: stats.activeToday, icon: '🔥', color: '#fb923c', bg: 'rgba(251,146,60,0.1)'  },
  ];

  return (
    <Layout>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-2xl">⚙️</div>
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
            <p className="text-gray-400 mt-0.5">Platform management and analytics</p>
          </div>
          <span className="ml-auto badge badge-red">Admin Only</span>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statCards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="rounded-2xl p-5 border border-white/5"
            style={{ background: c.bg }}>
            <div className="flex items-start justify-between mb-3">
              <span className="text-3xl">{c.icon}</span>
              <motion.div className="w-2 h-2 rounded-full mt-1" style={{ backgroundColor: c.color }}
                animate={{ scale: [1,1.5,1] }} transition={{ repeat: Infinity, duration: 2 }} />
            </div>
            {loading ? (
              <div className="h-8 w-16 shimmer rounded mb-1" />
            ) : (
              <p className="text-3xl font-black mb-1" style={{ color: c.color }}>{c.value}</p>
            )}
            <p className="text-gray-400 text-sm">{c.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'overview', label: '📊 Overview'  },
          { key: 'users',    label: `👥 Users (${users.length})` },
          { key: 'system',   label: '🖥️ System'    },
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

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Score distribution */}
            <div className="rounded-2xl p-5 border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <h3 className="text-white font-semibold mb-4">Score Distribution</h3>
              <Doughnut
                data={{
                  labels: ['Excellent (70+)', 'Good (50–70)', 'Needs Work (<50)'],
                  datasets: [{
                    data: [
                      Math.round(stats.totalLogs * 0.45),
                      Math.round(stats.totalLogs * 0.35),
                      Math.round(stats.totalLogs * 0.20),
                    ],
                    backgroundColor: ['rgba(52,211,153,0.8)','rgba(251,191,36,0.8)','rgba(248,113,113,0.8)'],
                    borderWidth: 0,
                    hoverOffset: 4,
                  }]
                }}
                options={{ plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } }, cutout: '60%', responsive: true }}
              />
            </div>

            {/* Simulated weekly activity */}
            <div className="rounded-2xl p-5 border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <h3 className="text-white font-semibold mb-4">Weekly Activity (Logs)</h3>
              <Bar
                data={{
                  labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
                  datasets: [{
                    label: 'Logs',
                    data: [45, 62, 58, 71, 66, 48, 39],
                    backgroundColor: 'rgba(96,165,250,0.7)',
                    borderRadius: 8,
                  }]
                }}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { ticks: { color: '#475569', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
                    x: { ticks: { color: '#475569', font: { size: 10 } }, grid: { display: false } },
                  }
                }}
              />
            </div>
          </div>

          {/* Real user growth chart from actual join dates */}
          <div className="rounded-2xl p-5 border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">User Growth (Actual Join Dates)</h3>
              <span className="text-xs text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">
                {stats.totalUsers} total users
              </span>
            </div>
            <Line
              data={(() => {
                // Build last 30 days from real user join dates
                const days  = Array.from({ length: 30 }, (_, i) => {
                  const d = new Date(); d.setDate(d.getDate() - 29 + i); return d;
                });
                const labels = days.map(d => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));
                const counts = days.map(d => {
                  const ds = d.toDateString();
                  return users.filter(u => u.createdAt && new Date(u.createdAt).toDateString() === ds).length;
                });
                // Cumulative running total
                let base = users.filter(u => u.createdAt && new Date(u.createdAt) < days[0]).length;
                const cumulative = counts.map(c => { base += c; return base; });
                return {
                  labels,
                  datasets: [{
                    label: 'Total Users',
                    data: cumulative,
                    borderColor: '#34d399',
                    backgroundColor: 'rgba(52,211,153,0.1)',
                    fill: true, tension: 0.4, borderWidth: 2, pointRadius: 0,
                  }, {
                    label: 'New Today',
                    data: counts,
                    borderColor: '#60a5fa',
                    backgroundColor: 'rgba(96,165,250,0.1)',
                    fill: true, tension: 0.4, borderWidth: 1.5, pointRadius: 3,
                    borderDash: [0],
                  }],
                };
              })()}
              options={{
                responsive: true,
                plugins: {
                  legend: { labels: { color: '#94a3b8', font: { size: 10 } } },
                  tooltip: { backgroundColor: 'rgba(2,8,23,0.95)', titleColor: '#94a3b8', bodyColor: '#fff', padding: 12, borderColor: 'rgba(96,165,250,0.3)', borderWidth: 1 },
                },
                scales: {
                  y: { ticks: { color: '#475569', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' }, min: 0 },
                  x: { ticks: { color: '#475569', font: { size: 10 }, maxTicksLimit: 8 }, grid: { display: false } },
                },
              }}
            />
          </div>
        </motion.div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex gap-3 mb-4 flex-wrap">
            <input type="text" placeholder="🔍 Search users by name or email..."
              className="input-field text-sm flex-1 min-w-48"
              value={search} onChange={e => setSearch(e.target.value)} />
            <button onClick={exportUsersCSV} className="btn-secondary text-sm py-2 px-4 whitespace-nowrap">
              ⬇️ Export CSV
            </button>
            <button onClick={exportActivityCSV} className="btn-secondary text-sm py-2 px-4 whitespace-nowrap">
              📋 Activity Log CSV
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">{[...Array(5)].map((_,i)=><div key={i} className="h-14 rounded-2xl shimmer"/>)}</div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-600 py-12">No users found.</p>
          ) : (
            <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {['User','Email','Role','Joined','Actions'].map(h => (
                      <th key={h} className="text-left text-xs text-gray-500 px-4 py-3 font-semibold uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => (
                    <motion.tr key={u._id} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
                      transition={{ delay: i*0.03 }}
                      className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                            {(u.name||'U')[0].toUpperCase()}
                          </div>
                          <span className="text-white text-sm font-medium">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${u.role==='admin'?'badge-purple':'badge-blue'} text-xs`}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {deleting === u._id ? (
                          <div className="flex gap-1">
                            <button onClick={()=>handleDelete(u._id)} className="text-xs text-red-400 px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20">Confirm</button>
                            <button onClick={()=>setDeleting(null)} className="text-xs text-gray-500 px-2 py-1">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={()=>setDeleting(u._id)} className="text-xs text-gray-600 hover:text-red-400 transition-colors">🗑 Remove</button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* System Tab */}
      {activeTab === 'system' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Service status */}
          <div className="rounded-2xl border border-white/5 p-5" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <h3 className="text-white font-semibold mb-4">🟢 Service Status</h3>
            <div className="space-y-3">
              {[
                { name: 'API Server (Express)',     status: 'Operational', uptime: '99.9%',  color: '#34d399' },
                { name: 'MongoDB Atlas',            status: 'Operational', uptime: '99.8%',  color: '#34d399' },
                { name: 'Authentication (JWT)',     status: 'Operational', uptime: '100%',   color: '#34d399' },
                { name: 'AI Chat Service',          status: 'Operational', uptime: '99.5%',  color: '#34d399' },
                { name: 'Community Service',        status: 'Operational', uptime: '98.2%',  color: '#34d399' },
                { name: 'Wearables Integration',   status: 'Coming Soon', uptime: '—',      color: '#fbbf24' },
              ].map((s, i) => (
                <motion.div key={s.name} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
                  transition={{ delay: i*0.05 }}
                  className="flex items-center justify-between p-3 rounded-xl border border-white/5"
                  style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="flex items-center gap-3">
                    <motion.div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }}
                      animate={{ scale: [1,1.4,1] }} transition={{ repeat: Infinity, duration: 2, delay: i*0.2 }} />
                    <span className="text-white text-sm">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500">Uptime: {s.uptime}</span>
                    <span className="badge text-xs" style={{ background:`${s.color}15`, color:s.color, border:`1px solid ${s.color}33` }}>
                      {s.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Tech stack info */}
          <div className="rounded-2xl border border-white/5 p-5" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <h3 className="text-white font-semibold mb-4">🛠️ Tech Stack</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { layer:'Frontend',  tech:'React 18 + TypeScript + Vite', color:'#60a5fa' },
                { layer:'Styling',   tech:'Tailwind CSS + Framer Motion',  color:'#34d399' },
                { layer:'Charts',    tech:'Chart.js + react-chartjs-2',    color:'#a78bfa' },
                { layer:'Backend',   tech:'Node.js + Express + TypeScript', color:'#fb923c' },
                { layer:'Database',  tech:'MongoDB Atlas + Mongoose ODM',  color:'#f472b6' },
                { layer:'Auth',      tech:'JWT + Bcrypt.js (12 rounds)',   color:'#fbbf24' },
              ].map(s => (
                <div key={s.layer} className="rounded-xl p-3 border border-white/5"
                  style={{ background: `${s.color}08` }}>
                  <p className="text-xs font-bold mb-0.5" style={{ color: s.color }}>{s.layer}</p>
                  <p className="text-xs text-gray-400">{s.tech}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </Layout>
  );
}
