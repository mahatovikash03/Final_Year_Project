import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../hooks/useAuth';

export default function ResetPassword() {
  const [params]    = useSearchParams();
  const navigate    = useNavigate();
  const { setUser } = useAuthStore();

  const token = params.get('token') || '';
  const email = params.get('email') || '';

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState(false);

  const strength = password.length === 0 ? 0 : password.length < 8 ? 1 : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 3 : 2;
  const strengthLabel = ['', 'Weak', 'Good', 'Strong'];
  const strengthColor = ['', '#f87171', '#fbbf24', '#34d399'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirm) { setError('Please fill in all fields.'); return; }
    if (password.length < 8)   { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm)  { setError('Passwords do not match.'); return; }
    if (!token || !email)      { setError('Invalid reset link. Please request a new one.'); return; }

    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/reset-password', { token, email, password });
      // Auto-login
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        await api.get('/auth/me').then(r => setUser(r.data.user)).catch(() => {});
      }
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg,#020817,#0f172a)' }}>
        <div className="text-center">
          <p className="text-5xl mb-4">❌</p>
          <h2 className="text-white font-bold text-xl mb-2">Invalid Reset Link</h2>
          <p className="text-gray-400 text-sm mb-6">This reset link is invalid or missing required information.</p>
          <Link to="/forgot-password" className="btn-primary py-2.5 px-6 text-sm">Request New Link →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg,#020817,#0f172a,#020817)' }}>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle,#10b981,transparent)' }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10">

        <div className="rounded-3xl border border-white/10 overflow-hidden"
          style={{ background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(24px)' }}>

          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center border-b border-white/5">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl"
              style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
              🔑
            </motion.div>
            <h1 className="text-2xl font-black text-white">Create New Password</h1>
            <p className="text-gray-500 text-xs mt-1.5 break-all">Resetting for: {email}</p>
          </div>

          <div className="px-8 py-6">
            {success ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4">
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: 2, duration: 0.4 }}
                  className="text-6xl mb-4">✅</motion.div>
                <h2 className="text-white font-bold text-xl mb-2">Password Reset!</h2>
                <p className="text-gray-400 text-sm mb-2">Your password has been updated successfully.</p>
                <p className="text-green-400 text-xs">Redirecting to dashboard...</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New password */}
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block font-medium">New Password</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters"
                      className="input-field text-sm pr-10"
                      value={password} onChange={e => setPassword(e.target.value)} autoFocus />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors text-sm">
                      {showPw ? '🙈' : '👁'}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {password.length > 0 && (
                    <div className="mt-2">
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <motion.div className="h-full rounded-full transition-all"
                          style={{ width: `${(strength / 3) * 100}%`, backgroundColor: strengthColor[strength] }}
                          initial={{ width: 0 }} animate={{ width: `${(strength / 3) * 100}%` }} />
                      </div>
                      <p className="text-xs mt-1" style={{ color: strengthColor[strength] }}>
                        {strengthLabel[strength]} password
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block font-medium">Confirm Password</label>
                  <input type={showPw ? 'text' : 'password'} placeholder="Re-enter new password"
                    className="input-field text-sm"
                    value={confirm} onChange={e => setConfirm(e.target.value)} />
                  {confirm.length > 0 && (
                    <p className="text-xs mt-1.5" style={{ color: confirm === password ? '#34d399' : '#f87171' }}>
                      {confirm === password ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </p>
                  )}
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="rounded-xl p-3 border border-red-500/20 text-red-400 text-sm"
                    style={{ background: 'rgba(239,68,68,0.08)' }}>
                    ⚠️ {error}
                  </motion.div>
                )}

                <motion.button type="submit" disabled={loading}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 rounded-2xl font-bold text-white text-base disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 8px 25px rgba(16,185,129,0.3)' }}>
                  {loading ? '⟳ Resetting...' : '🔑 Reset Password'}
                </motion.button>

                <div className="text-center mt-4">
                  <Link to="/forgot-password" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
                    ← Request a new link
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-gray-700 text-xs mt-6">💚 HealthTrack360 · Your Wellness Companion</p>
      </motion.div>
    </div>
  );
}
