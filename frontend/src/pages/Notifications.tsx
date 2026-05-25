import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/layout/Layout';
import api from '../services/api';
import { toast } from '../components/ui/Toast';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'reminder' | 'achievement' | 'tip' | 'alert';
  read: boolean;
  createdAt: string;
}

const TYPE_CONFIG = {
  reminder:    { icon: '⏰', color: '#60a5fa',  badge: 'badge-blue'   },
  achievement: { icon: '🏆', color: '#fbbf24',  badge: 'badge-yellow' },
  tip:         { icon: '💡', color: '#34d399',  badge: 'badge-green'  },
  alert:       { icon: '🚨', color: '#f87171',  badge: 'badge-red'    },
};

const DEMO: Notification[] = [
  { _id:'1', title:'👋 Welcome to HealthTrack360!', message:'Start by logging your first health entry today. Your wellness journey begins now!', type:'tip', read:false, createdAt: new Date().toISOString() },
  { _id:'2', title:'🏆 First Login Achievement!', message:"You've earned the 'Early Adopter' badge. Keep going — more achievements await!", type:'achievement', read:false, createdAt: new Date().toISOString() },
  { _id:'3', title:'⏰ Daily Log Reminder', message:"Don't forget to log today's health data. Consistency is the key to better insights!", type:'reminder', read:false, createdAt: new Date(Date.now()-3600000).toISOString() },
  { _id:'4', title:'💡 Wellness Tip', message:'Drinking 2 glasses of water first thing in the morning boosts your metabolism by up to 30%.', type:'tip', read:true, createdAt: new Date(Date.now()-86400000).toISOString() },
  { _id:'5', title:'🤖 AI Assistant Ready', message:'Your personal AI health assistant is available 24/7. Ask anything about wellness, sleep, nutrition or fitness.', type:'tip', read:true, createdAt: new Date(Date.now()-172800000).toISOString() },
  { _id:'6', title:'🚨 Sleep Alert', message:'Your average sleep this week is below 6 hours. Aim for 7–9 hours for optimal health.', type:'alert', read:false, createdAt: new Date(Date.now()-7200000).toISOString() },
];

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>(DEMO);
  const [filter, setFilter]     = useState<'all'|'unread'|'reminder'|'achievement'|'tip'|'alert'>('all');
  const [loading, setLoading]   = useState(false);
  const [selected, setSelected] = useState<Notification | null>(null);

  useEffect(() => {
    api.get('/notifications')
      .then(r => { if (r.data.data?.length) setNotifications(r.data.data); })
      .catch(() => {});
  }, []);

  const markRead = async (id: string) => {
    setNotifications(ns => ns.map(n => n._id === id ? { ...n, read: true } : n));
    api.patch(`/notifications/${id}/read`).catch(() => {});
  };

  const markAllRead = async () => {
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
    api.patch('/notifications/read-all').catch(() => {});
    toast('All notifications marked as read ✓', 'success');
  };

  const deleteNotification = (id: string) => {
    setNotifications(ns => ns.filter(n => n._id !== id));
    toast('Notification removed', 'info');
  };

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'all') return true;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const filterBtns = [
    { key: 'all',         label: `All (${notifications.length})` },
    { key: 'unread',      label: `Unread (${unreadCount})` },
    { key: 'reminder',    label: '⏰ Reminders' },
    { key: 'achievement', label: '🏆 Achievements' },
    { key: 'tip',         label: '💡 Tips' },
    { key: 'alert',       label: '🚨 Alerts' },
  ];

  return (
    <Layout>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              🔔 Notifications
              {unreadCount > 0 && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="badge badge-red text-sm">
                  {unreadCount}
                </motion.span>
              )}
            </h1>
            <p className="text-gray-400 mt-1">Stay updated on your wellness journey.</p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="btn-secondary text-sm py-2">
              ✓ Mark all read
            </button>
          )}
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total',        value: notifications.length, icon: '🔔', color: '#60a5fa' },
          { label: 'Unread',       value: unreadCount,          icon: '🔴', color: '#f87171' },
          { label: 'Achievements', value: notifications.filter(n=>n.type==='achievement').length, icon: '🏆', color: '#fbbf24' },
          { label: 'Tips',         value: notifications.filter(n=>n.type==='tip').length,         icon: '💡', color: '#34d399' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-3 text-center border border-white/5"
            style={{ background: `${s.color}11` }}>
            <span className="text-xl block mb-1">{s.icon}</span>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {filterBtns.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key as any)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={filter === f.key
              ? { background: '#3b82f6', color: 'white' }
              : { background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-16 rounded-2xl border border-white/5"
              style={{ background: 'rgba(255,255,255,0.02)' }}>
              <p className="text-4xl mb-3">🎉</p>
              <p className="text-white font-semibold">All caught up!</p>
              <p className="text-gray-500 text-sm mt-1">No {filter !== 'all' ? filter : ''} notifications.</p>
            </motion.div>
          ) : filtered.map((n, i) => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.tip;
            return (
              <motion.div key={n._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => { if (!n.read) markRead(n._id); setSelected(selected?._id === n._id ? null : n); }}
                className="group rounded-2xl border transition-all cursor-pointer"
                style={n.read
                  ? { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)', opacity: 0.7 }
                  : { background: 'rgba(96,165,250,0.06)', borderColor: 'rgba(96,165,250,0.15)', boxShadow: '0 0 20px rgba(96,165,250,0.05)' }}>
                <div className="flex gap-4 p-4">
                  {/* Icon */}
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 border"
                    style={{ background: `${cfg.color}15`, borderColor: `${cfg.color}33` }}>
                    {cfg.icon}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`font-semibold text-sm ${n.read ? 'text-gray-300' : 'text-white'}`}>
                        {n.title}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`badge ${cfg.badge} text-xs`}>{n.type}</span>
                        {!n.read && (
                          <motion.span className="w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0"
                            animate={{ scale: [1,1.3,1] }} transition={{ repeat: Infinity, duration: 2 }} />
                        )}
                      </div>
                    </div>
                    <p className={`text-xs mt-1 leading-relaxed ${selected?._id === n._id ? '' : 'truncate'} ${n.read ? 'text-gray-500' : 'text-gray-400'}`}>
                      {n.message}
                    </p>
                    <p className="text-xs text-gray-700 mt-1.5">
                      {new Date(n.createdAt).toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                    </p>
                  </div>
                  {/* Delete */}
                  <button
                    onClick={e => { e.stopPropagation(); deleteNotification(n._id); }}
                    className="opacity-0 group-hover:opacity-100 text-xs text-gray-600 hover:text-red-400 transition-all px-1 shrink-0">
                    🗑
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
