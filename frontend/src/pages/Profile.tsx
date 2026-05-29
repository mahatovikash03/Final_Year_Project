import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/layout/Layout';
import { useAuthStore } from '../hooks/useAuth';
import { useWeeklyAnalytics } from '../hooks/useHealthData';
import { toast } from '../components/ui/Toast';
import api from '../services/api';

const avatarColors = [
  'from-blue-500 to-purple-600',
  'from-green-500 to-teal-600',
  'from-orange-500 to-red-600',
  'from-pink-500 to-rose-600',
  'from-cyan-500 to-blue-600',
  'from-yellow-500 to-orange-600',
];

const achievements = [
  { icon: '🔥', label: 'First Streak',    desc: 'Log 3 days in a row',     done: true  },
  { icon: '💧', label: 'Hydrated',        desc: 'Hit water goal 5 days',   done: true  },
  { icon: '😴', label: 'Sleep Champion',  desc: 'Sleep 8h for 7 days',     done: false },
  { icon: '🏋️', label: 'Fitness Freak',   desc: 'Complete 10 workouts',    done: false },
  { icon: '🥗', label: 'Clean Eater',     desc: 'Healthy eating 14 days',  done: false },
  { icon: '🧠', label: 'Mind Master',     desc: 'Log mood 30 days',        done: false },
  { icon: '📋', label: 'Consistent',      desc: 'Log health 7 days',       done: true  },
  { icon: '🌟', label: 'Wellness Pro',    desc: 'Score 80+ for 5 days',    done: false },
];

export default function Profile() {
  const { user, logout, updateUser } = useAuthStore();
  const { analytics }             = useWeeklyAnalytics();
  const [activeTab, setActiveTab] = useState<'profile'|'achievements'|'settings'>('profile');
  const [editing, setEditing]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [avatarColor, setAvatarColor] = useState(0);
  const [form, setForm] = useState({
    name:    user?.name    || '',
    gender:  user?.gender  || '',
    age:     user?.age     ? String(user.age) : '',
    city:    user?.city    || '',
    state:   user?.state   || '',
    country: user?.country || '',
    avatarUrl: '',
  });
  const [pwForm, setPwForm]       = useState({ current: '', newPw: '', confirm: '' });
  const [showPw, setShowPw]       = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('avatar-color');
    if (saved) setAvatarColor(+saved);
  }, []);

  // Keep form in sync with user store (e.g. after save or login)
  useEffect(() => {
    if (user) {
      setForm({
        name:    user.name    || '',
        gender:  user.gender  || '',
        age:     user.age     ? String(user.age) : '',
        city:    user.city    || '',
        state:   user.state   || '',
        country: user.country || '',
        avatarUrl: '',
      });
    }
  }, [user]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name:    form.name,
        gender:  form.gender  || undefined,
        age:     form.age     ? Number(form.age) : undefined,
        city:    form.city    || undefined,
        state:   form.state   || undefined,
        country: form.country || undefined,
      };
      const { data } = await api.patch('/user/profile', payload);
      // Update the auth store so UI reflects changes immediately
      updateUser(data.user);
      toast('Profile updated ✓', 'success');
      setEditing(false);
    } catch { toast('Failed to update', 'error'); }
    setLoading(false);
  };

  const saveAvatarColor = (i: number) => {
    setAvatarColor(i);
    localStorage.setItem('avatar-color', String(i));
    toast('Avatar colour updated ✓', 'success');
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const initials = (user?.name || 'U')
    .split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const score = analytics?.avgWellnessScore ?? 0;
  const scoreCol = score >= 70 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171';

  const tabs = [
    { key: 'profile',      label: '👤 Profile'      },
    { key: 'achievements', label: '🏆 Achievements'  },
    { key: 'settings',     label: '⚙️ Settings'      },
  ];

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-3xl font-bold text-white">👤 My Profile</h1>
        <p className="text-gray-400 mt-1">Manage your account and view your achievements.</p>
      </motion.div>

      {/* Hero Card */}
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-3xl p-6 mb-6 border border-white/8"
        style={{ background: 'linear-gradient(135deg,rgba(59,130,246,0.15),rgba(139,92,246,0.08))' }}>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(96,165,250,0.5),transparent)' }} />
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <motion.div whileHover={{ scale: 1.05 }}
            className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${avatarColors[avatarColor]} flex items-center justify-center text-2xl font-black text-white shrink-0`}
            style={{ boxShadow: '0 8px 25px rgba(0,0,0,0.3)' }}>
            {initials}
          </motion.div>
          <div className="flex-1">
            <h2 className="text-2xl font-black text-white">{user?.name}</h2>
            <p className="text-gray-400 text-sm">{user?.email}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <span className="badge badge-blue capitalize">{user?.role}</span>
              <span className="badge badge-green">🟢 Active</span>
              {score >= 70 && <span className="badge badge-yellow">🔥 On Fire</span>}
            </div>
          </div>
          {/* Wellness score + Logout */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="hidden md:flex flex-col items-center justify-center w-24 h-24 rounded-2xl border border-white/10"
              style={{ background: `${scoreCol}11` }}>
              <span className="text-3xl font-black" style={{ color: scoreCol }}>{score}</span>
              <span className="text-xs text-gray-500 mt-0.5">Wellness</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-all"
            >
              🚪 <span>Logout</span>
            </motion.button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 profile-stats-grid">
          {[
            { label: 'Avg Sleep',   value: `${analytics?.avgSleepDuration ?? 0}h`, icon: '😴', color: '#60a5fa' },
            { label: 'Avg Mood',    value: `${analytics?.avgMoodRating ?? 0}/5`,    icon: '😊', color: '#a78bfa' },
            { label: 'Workouts',    value: analytics?.totalWorkouts ?? 0,           icon: '🏋️', color: '#fb923c' },
            { label: 'Logs',        value: analytics?.logsThisWeek ?? 0,            icon: '📋', color: '#f472b6' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3 text-center border border-white/5"
              style={{ background: `${s.color}11` }}>
              <span className="text-xl block mb-1">{s.icon}</span>
              <p className="font-black text-sm" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-gray-600 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 tab-bar overflow-x-auto pb-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)}
            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all shrink-0"
            style={activeTab === t.key
              ? { background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: 'white' }
              : { background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Profile Tab ── */}
      {activeTab === 'profile' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl space-y-4">
          {/* Edit form */}
          <div className="rounded-2xl border border-white/8 overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <p className="text-white font-semibold">Personal Information</p>
              <button onClick={() => setEditing(!editing)}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium">
                {editing ? '✕ Cancel' : '✏️ Edit'}
              </button>
            </div>
            <div className="p-5">
              {editing ? (
                <form onSubmit={saveProfile} className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Full Name</label>
                    <input className="input-field" value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Email (cannot be changed)</label>
                    <input className="input-field opacity-50 cursor-not-allowed" value={user?.email || ''} disabled />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="text-xs text-gray-400 mb-2 block">Gender</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'male',              label: '👦 Male'              },
                        { value: 'female',            label: '👧 Female'            },
                        { value: 'other',             label: '⚧️ Other'             },
                        { value: 'prefer_not_to_say', label: '🔒 Prefer not to say' },
                      ].map(g => (
                        <button key={g.value} type="button"
                          onClick={() => setForm(f => ({ ...f, gender: f.gender === g.value ? '' : g.value }))}
                          className="py-2 px-3 rounded-xl text-xs font-medium border-2 transition-all text-left"
                          style={form.gender === g.value
                            ? { borderColor: '#60a5fa', background: 'rgba(96,165,250,0.15)', color: '#60a5fa' }
                            : { borderColor: 'rgba(255,255,255,0.08)', color: '#6b7280' }}>
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Age */}
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Age</label>
                    <input type="number" min={1} max={120} className="input-field" placeholder="Your age"
                      value={form.age}
                      onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                      onBlur={e => {
                        const v = parseInt(e.target.value);
                        if (e.target.value && (isNaN(v) || v < 1 || v > 120))
                          setForm(f => ({ ...f, age: '' }));
                      }} />
                  </div>

                  {/* City + State */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">City</label>
                      <input className="input-field" placeholder="e.g. Kolkata"
                        value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">State</label>
                      <input className="input-field" placeholder="e.g. West Bengal"
                        value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
                    </div>
                  </div>

                  {/* Country */}
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Country</label>
                    <select className="input-field" value={form.country}
                      onChange={e => setForm(f => ({ ...f, country: e.target.value }))}>
                      <option value="">Select country</option>
                      {['India','United States','United Kingdom','Canada','Australia','Germany','France','Japan','China','Brazil','Singapore','UAE','South Africa','Other']
                        .map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                    {loading ? '⟳ Saving...' : '💾 Save Changes'}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  {[
                    { label: 'Full Name', value: user?.name,    icon: '👤' },
                    { label: 'Email',     value: user?.email,   icon: '📧' },
                    { label: 'Role',      value: user?.role,    icon: '🎭' },
                    { label: 'Gender',    value: user?.gender?.replace(/_/g,' ') || '—', icon: '🧬' },
                    { label: 'Age',       value: user?.age ? `${user.age} yrs` : '—', icon: '🎂' },
                    { label: 'City',      value: user?.city    || '—', icon: '🏙️' },
                    { label: 'State',     value: user?.state   || '—', icon: '🗺️' },
                    { label: 'Country',   value: user?.country || '—', icon: '🌍' },
                  ].map(f => (
                    <div key={f.label} className="flex items-center gap-3">
                      <span className="text-xl">{f.icon}</span>
                      <div>
                        <p className="text-xs text-gray-500">{f.label}</p>
                        <p className="text-white font-medium capitalize">{f.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Avatar color picker */}
          <div className="rounded-2xl border border-white/8 p-5"
            style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-white font-semibold mb-3">Avatar Colour</p>
            <div className="flex gap-3 flex-wrap">
              {avatarColors.map((grad, i) => (
                <motion.button key={i} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                  onClick={() => saveAvatarColor(i)}
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grad} border-2 transition-all`}
                  style={{ borderColor: avatarColor === i ? 'white' : 'transparent',
                    boxShadow: avatarColor === i ? '0 0 15px rgba(255,255,255,0.3)' : 'none' }}>
                  {avatarColor === i && <span className="text-white text-lg">✓</span>}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Achievements Tab ── */}
      {activeTab === 'achievements' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
            {achievements.map((a, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 p-4 rounded-2xl border transition-all"
                style={a.done
                  ? { background: 'rgba(52,211,153,0.08)', borderColor: 'rgba(52,211,153,0.2)' }
                  : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)', opacity: 0.6 }}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border ${a.done ? 'border-green-500/30' : 'border-white/10'}`}
                  style={{ background: a.done ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.03)' }}>
                  {a.done ? a.icon : '🔒'}
                </div>
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${a.done ? 'text-white' : 'text-gray-500'}`}>{a.label}</p>
                  <p className="text-xs text-gray-600">{a.desc}</p>
                </div>
                {a.done && <span className="badge badge-green text-xs">Earned ✓</span>}
              </motion.div>
            ))}
          </div>
          <p className="text-gray-600 text-xs mt-4 max-w-2xl">
            {achievements.filter(a => a.done).length}/{achievements.length} achievements unlocked
          </p>
        </motion.div>
      )}

      {/* ── Settings Tab ── */}
      {activeTab === 'settings' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl space-y-4">
          {/* Notifications */}
          <div className="rounded-2xl border border-white/8 p-5" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-white font-semibold mb-4">🔔 Notifications</p>
            {[
              { label: 'Daily log reminder',       desc: 'Remind me to log my health each day' },
              { label: 'Wellness tips',             desc: 'Receive daily AI wellness tips' },
              { label: 'Streak alerts',             desc: 'Alert me before my streak breaks' },
              { label: 'Achievement notifications', desc: 'Notify me when I earn achievements' },
            ].map((setting, i) => {
              const [on, setOn] = useState(true);
              return (
                <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-white text-sm font-medium">{setting.label}</p>
                    <p className="text-gray-500 text-xs">{setting.desc}</p>
                  </div>
                  <motion.button
                    onClick={() => { setOn(!on); toast(`${setting.label} ${!on ? 'enabled' : 'disabled'}`, 'info'); }}
                    className="relative w-12 h-6 rounded-full border transition-all"
                    style={{ background: on ? '#3b82f6' : 'rgba(255,255,255,0.1)', borderColor: on ? '#3b82f6' : 'rgba(255,255,255,0.15)' }}>
                    <motion.div animate={{ x: on ? 24 : 2 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-lg" />
                  </motion.button>
                </div>
              );
            })}
          </div>

          {/* Privacy */}
          <div className="rounded-2xl border border-white/8 p-5" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-white font-semibold mb-4">🔒 Privacy & Data</p>
            <div className="space-y-3">
              <button className="w-full text-left flex items-center justify-between p-3 rounded-xl border border-white/5 hover:border-white/10 transition-all"
                onClick={() => toast('Data export feature coming soon!', 'info')}>
                <div>
                  <p className="text-white text-sm font-medium">Export My Data</p>
                  <p className="text-gray-500 text-xs">Download all your health records as JSON</p>
                </div>
                <span className="text-gray-600">→</span>
              </button>
              <button className="w-full text-left flex items-center justify-between p-3 rounded-xl border border-red-500/10 hover:border-red-500/20 transition-all"
                onClick={() => toast('Account deletion requires email confirmation', 'info')}>
                <div>
                  <p className="text-red-400 text-sm font-medium">Delete Account</p>
                  <p className="text-gray-500 text-xs">Permanently delete all your data</p>
                </div>
                <span className="text-red-600">→</span>
              </button>
            </div>
          </div>

          {/* Danger zone */}
          <div className="rounded-2xl border border-red-500/15 p-5"
            style={{ background: 'rgba(239,68,68,0.05)' }}>
            <p className="text-red-400 font-semibold mb-3">⚠️ Account</p>
            <button onClick={handleLogout}
              className="w-full py-3 rounded-xl font-bold text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-all text-sm">
              🚪 Sign Out
            </button>
          </div>
        </motion.div>
      )}
    </Layout>
  );
}
