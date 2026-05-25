import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../hooks/useAuth';
import api from '../../services/api';

const links = [
  { to: '/dashboard',     icon: '🏠', label: 'Dashboard',       group: 'main'     },
  { to: '/log',           icon: '📝', label: 'Log Today',        group: 'main'     },
  { to: '/ai-chat',       icon: '🤖', label: 'AI Assistant',     group: 'main'     },
  { to: '/analytics',     icon: '📊', label: 'Analytics',        group: 'track'    },
  { to: '/habits',        icon: '🎯', label: 'Habits',           group: 'track'    },
  { to: '/sleep',         icon: '😴', label: 'Sleep Schedule',   group: 'track'    },
  { to: '/mood',          icon: '😊', label: 'Mood Tracker',     group: 'track'    },
  { to: '/nutrition',     icon: '🥗', label: 'Nutrition',        group: 'track'    },
  { to: '/journal',       icon: '📓', label: 'Journal',          group: 'track'    },
  { to: '/symptoms',      icon: '🩺', label: 'Symptoms',         group: 'health'   },
  { to: '/reports',       icon: '📄', label: 'Reports',          group: 'health'   },
  { to: '/community',     icon: '👥', label: 'Community',        group: 'social'   },
  { to: '/wearables',     icon: '⌚', label: 'Wearables',        group: 'social'   },
  { to: '/notifications', icon: '🔔', label: 'Notifications',    group: 'social'   },
  { to: '/profile',       icon: '👤', label: 'Profile',          group: 'account'  },
];

const groups = [
  { key: 'main',    label: 'Main'       },
  { key: 'track',   label: 'Track'      },
  { key: 'health',  label: 'Health'     },
  { key: 'social',  label: 'Social'     },
  { key: 'account', label: 'Account'    },
];

export default function Sidebar({ open, onClose, collapsed, onCollapsedChange }: {
  open?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onCollapsedChange?: (v: boolean) => void;
}) {
  const navigate  = useNavigate();
  const { user, logout } = useAuthStore();
  const [unread, setUnread] = useState(0);
  const isCollapsed = collapsed ?? false;

  useEffect(() => {
    api.get('/notifications')
      .then(r => setUnread(r.data.unread || 0))
      .catch(() => {});
  }, []);

  const initials = (user?.name || 'U')
    .split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <aside
      className={`fixed top-0 left-0 h-screen flex flex-col z-40 border-r border-white/5 transition-all duration-300
        ${ open ? 'translate-x-0' : '-translate-x-full' } md:translate-x-0`}
      style={{ width: isCollapsed ? 68 : 236, background: 'rgba(2,8,23,0.98)', backdropFilter: 'blur(24px)' }}
    >
      {/* Logo + collapse */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/5 shrink-0">
        {!isCollapsed && (
          <span className="text-base font-black text-white truncate" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
            Health<span className="gradient-text-blue">Track360</span>
          </span>
        )}
        {/* Close button on mobile */}
        <button
          onClick={onClose}
          className="md:hidden w-8 h-8 rounded-xl flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all shrink-0"
        >✕</button>
        <button
          onClick={() => onCollapsedChange?.(!isCollapsed)}
          className="hidden md:flex w-8 h-8 rounded-xl items-center justify-center text-gray-600 hover:text-white hover:bg-white/10 transition-all shrink-0 ml-auto"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Scrollable nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2">
        {groups.map(group => {
          const groupLinks = links.filter(l => l.group === group.key);
          return (
            <div key={group.key} className="mb-1">
              {!isCollapsed && (
                <p className="text-xs text-gray-700 uppercase tracking-widest font-semibold px-2 py-1.5 mt-1">
                  {group.label}
                </p>
              )}
              {groupLinks.map(l => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  onClick={onClose}
                  title={isCollapsed ? l.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 relative
                     ${isActive
                       ? 'bg-gradient-to-r from-blue-600/25 to-blue-500/10 text-blue-300 border border-blue-500/20'
                       : 'text-gray-500 hover:text-white hover:bg-white/[0.06]'
                     }`
                  }
                >
                  <span className="text-base shrink-0 w-5 text-center">{l.icon}</span>
                  {!isCollapsed && <span className="truncate flex-1">{l.label}</span>}
                  {l.to === '/notifications' && unread > 0 && (
                    <span
                      className="text-xs font-bold bg-red-500 text-white rounded-full shrink-0"
                      style={{ minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, marginLeft: 'auto' }}
                    >
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          );
        })}

        {/* Admin link */}
        {user?.role === 'admin' && (
          <div className="mt-1">
            {!isCollapsed && <p className="text-xs text-gray-700 uppercase tracking-widest font-semibold px-2 py-1.5">Admin</p>}
            <NavLink to="/admin" title={isCollapsed ? 'Admin Panel' : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                 ${isActive ? 'bg-red-500/15 text-red-300 border border-red-500/20' : 'text-gray-500 hover:text-white hover:bg-white/[0.06]'}`
              }>
              <span className="text-base shrink-0 w-5 text-center">⚙️</span>
              {!isCollapsed && <span>Admin Panel</span>}
            </NavLink>
          </div>
        )}
      </nav>

      {/* User footer */}
      <div className="px-2 py-2 border-t border-white/5 shrink-0">
        <div className="flex items-center gap-2 px-2 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-black text-white shrink-0">
            {initials}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-gray-600 text-xs capitalize truncate">{user?.role}</p>
            </div>
          )}
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="text-gray-600 hover:text-red-400 transition-colors text-sm shrink-0"
            title="Logout"
          >🚪</button>
        </div>
      </div>
    </aside>
  );
}
