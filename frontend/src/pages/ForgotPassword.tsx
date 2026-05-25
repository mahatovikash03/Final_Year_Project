import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function ForgotPassword() {
  const [email,     setEmail]     = useState('');
  const [sent,      setSent]      = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email.'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg,#020817,#0f172a,#020817)' }}>

      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle,#3b82f6,transparent)' }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10">

        {/* Card */}
        <div className="rounded-3xl border border-white/10 overflow-hidden"
          style={{ background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(24px)' }}>

          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center border-b border-white/5">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}>
              🔐
            </motion.div>
            <h1 className="text-2xl font-black text-white">Forgot Password?</h1>
            <p className="text-gray-400 text-sm mt-2">Enter your email and we'll send you a reset link.</p>
          </div>

          <div className="px-8 py-6">
            {sent ? (
              /* Success state */
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4">
                <div className="text-6xl mb-4">📧</div>
                <h2 className="text-white font-bold text-xl mb-2">Check your inbox!</h2>
                <p className="text-gray-400 text-sm mb-6">
                  If <strong className="text-white">{email}</strong> is registered, you'll receive a reset link shortly.
                  The link expires in <strong className="text-white">10 minutes</strong>.
                </p>
                <div className="rounded-2xl p-4 border border-blue-500/20 mb-6"
                  style={{ background: 'rgba(59,130,246,0.06)' }}>
                  <p className="text-blue-300 text-xs">
                    💡 Don't see the email? Check your spam folder. Also make sure you used the correct email address.
                  </p>
                </div>
                <button onClick={() => { setSent(false); setEmail(''); }}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                  ← Try a different email
                </button>
              </motion.div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block font-medium">Email Address</label>
                  <input type="email" placeholder="your@email.com"
                    className="input-field text-sm"
                    value={email} onChange={e => setEmail(e.target.value)}
                    autoFocus autoComplete="email" />
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
                  style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', boxShadow: '0 8px 25px rgba(59,130,246,0.3)' }}>
                  {loading ? '⟳ Sending...' : '📧 Send Reset Link'}
                </motion.button>
              </form>
            )}

            {/* Footer links */}
            <div className="flex justify-center gap-4 mt-6 text-sm">
              <Link to="/login" className="text-gray-500 hover:text-white transition-colors">← Back to Login</Link>
              <span className="text-gray-700">·</span>
              <Link to="/register" className="text-gray-500 hover:text-white transition-colors">Create Account</Link>
            </div>
          </div>
        </div>

        {/* Logo */}
        <p className="text-center text-gray-700 text-xs mt-6">💚 HealthTrack360 · Your Wellness Companion</p>
      </motion.div>
    </div>
  );
}
