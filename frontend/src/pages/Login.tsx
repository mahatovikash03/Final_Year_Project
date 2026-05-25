import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../hooks/useAuth';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [form, setForm]   = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [show, setShow]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-animated flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Card */}
        <div className="glass-card p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 glow-blue">
              🩺
            </div>
            <h1 className="text-3xl font-black text-white font-['Space_Grotesk']">
              Health<span className="gradient-text-blue">Track360</span>
            </h1>
            <p className="text-gray-400 mt-2 text-sm">Sign in to your wellness dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                className="input-field"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs text-gray-400 font-medium uppercase tracking-wide">Password</label>
                <Link to="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Forgot password?</Link>
              </div>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  className="input-field pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShow(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors text-sm"
                >
                  {show ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3 flex items-center gap-2"
              >
                <span className="text-red-400 text-sm">⚠️ {error}</span>
              </motion.div>
            )}

            <button type="submit" disabled={isLoading} className="btn-primary w-full justify-center mt-2">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                    className="inline-block"
                  >⟳</motion.span>
                  Signing in...
                </span>
              ) : '🚀 Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-gray-500 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Create one free →
              </Link>
            </p>
          </div>
        </div>

        {/* Back to landing */}
        <p className="text-center mt-4">
          <Link to="/" className="text-gray-600 hover:text-gray-400 text-xs transition-colors">
            ← Back to home
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
