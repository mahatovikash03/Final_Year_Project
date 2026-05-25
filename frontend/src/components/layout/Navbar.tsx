import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../hooks/useAuth';

const navLinks = [
  { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { path: '/log',       label: 'Log Today',  icon: '📝' },
  { path: '/symptoms',  label: 'Symptoms',   icon: '🩺' },
  { path: '/analytics', label: 'Analytics',  icon: '📊' },
  { path: '/profile',   label: 'Profile',    icon: '👤' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate     = useNavigate();
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-white">
            Health<span className="text-blue-400">Track360</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                pathname === link.path
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <span className="hidden md:block text-sm text-gray-400">
            Hi, <span className="text-white font-medium">{user?.name?.split(' ')[0]}</span>
          </span>
          <button
            onClick={handleLogout}
            className="hidden md:block text-sm text-gray-400 hover:text-red-400 transition-colors px-3 py-2 rounded-xl hover:bg-red-500/10"
          >
            Logout
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-gray-400 hover:text-white p-2"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-slate-900/95 border-t border-white/10 px-4 py-3 flex flex-col gap-1"
          >
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  pathname === link.path
                    ? 'bg-blue-600/30 text-blue-300'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="text-left flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all"
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
