import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../hooks/useAuth';

const strengths = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
const strengthColors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-400', 'bg-green-500'];

const COUNTRIES = ['India','United States','United Kingdom','Canada','Australia','Germany','France','Japan','China','Brazil','Singapore','UAE','South Africa','Other'];
const GENDERS = [
  { value: 'male',              label: '👦 Male'              },
  { value: 'female',            label: '👧 Female'            },
  { value: 'other',             label: '⚧️ Other'             },
  { value: 'prefer_not_to_say', label: '🔒 Prefer not to say' },
];

function getStrength(pw: string): number {
  let score = 0;
  if (pw.length >= 8)           score++;
  if (/[A-Z]/.test(pw))        score++;
  if (/[0-9]/.test(pw))        score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length >= 12)          score++;
  return score;
}

export default function Register() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: '',
    gender: '', age: '', city: '', state: '', country: '',
  });
  const [error, setError] = useState('');
  const [show, setShow]   = useState(false);
  const pwStrength        = getStrength(form.password);

  const step1Valid = !!(
    form.name.trim() &&
    form.email.trim() &&
    form.password.length >= 8 &&
    form.password === form.confirm
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    if (form.password.length < 8)       return setError('Password must be at least 8 characters.');
    try {
      await register(
        form.name, form.email, form.password,
        form.gender  || undefined,
        form.age     ? Number(form.age) : undefined,
        form.city    || undefined,
        form.state   || undefined,
        form.country || undefined,
      );
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-animated flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-72 h-72 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card p-8">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 glow-green">
              ✨
            </div>
            <h1 className="text-3xl font-black text-white font-['Space_Grotesk']">
              Health<span className="gradient-text-blue">Track360</span>
            </h1>
            <p className="text-gray-400 mt-1 text-sm">Create your free wellness account</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center mb-6">
            {[1, 2].map((s, idx) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-black transition-all shrink-0"
                  style={step >= s
                    ? { background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', color: 'white' }
                    : { background: 'rgba(255,255,255,0.08)', color: '#6b7280' }}>
                  {step > s ? '✓' : s}
                </div>
                <span className="text-xs font-medium ml-1.5" style={{ color: step >= s ? '#60a5fa' : '#4b5563' }}>
                  {s === 1 ? 'Account' : 'Profile'}
                </span>
                {idx < 1 && (
                  <div className="flex-1 h-px mx-3 transition-all"
                    style={{ background: step > s ? '#3b82f6' : 'rgba(255,255,255,0.08)' }} />
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">

              {/* ── STEP 1: Account ── */}
              {step === 1 && (
                <motion.div key="step1"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="space-y-4">

                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Full Name</label>
                    <input type="text" required className="input-field" placeholder="Your full name"
                      value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Email</label>
                    <input type="email" required className="input-field" placeholder="you@example.com"
                      value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Password</label>
                    <div className="relative">
                      <input type={show ? 'text' : 'password'} required className="input-field pr-10"
                        placeholder="Min. 8 characters"
                        value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                      <button type="button" onClick={() => setShow(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-sm">
                        {show ? '🙈' : '👁️'}
                      </button>
                    </div>
                    {form.password && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          {[1,2,3,4,5].map(i => (
                            <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                              i <= pwStrength ? strengthColors[pwStrength] : 'bg-white/10'
                            }`} />
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">{strengths[pwStrength]} password</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Confirm Password</label>
                    <input type="password" required
                      className={`input-field ${form.confirm && form.password !== form.confirm ? 'border-red-500/50' : ''}`}
                      placeholder="Repeat your password"
                      value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} />
                    {form.confirm && form.password !== form.confirm && (
                      <p className="text-red-400 text-xs mt-1">Passwords don't match</p>
                    )}
                  </div>

                  <button type="button" disabled={!step1Valid}
                    onClick={() => { setError(''); setStep(2); }}
                    className="btn-primary w-full justify-center mt-2 disabled:opacity-40 disabled:cursor-not-allowed">
                    Next → Profile Info
                  </button>
                </motion.div>
              )}

              {/* ── STEP 2: Profile ── */}
              {step === 2 && (
                <motion.div key="step2"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="space-y-4">

                  <p className="text-xs text-gray-500">These fields are optional but help personalise your experience.</p>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Gender</label>
                    <div className="grid grid-cols-2 gap-2">
                      {GENDERS.map(g => (
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
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Age</label>
                    <input type="number" min={1} max={120} className="input-field" placeholder="Your age (optional)"
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
                      <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">City</label>
                      <input type="text" className="input-field" placeholder="e.g. Kolkata"
                        value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">State</label>
                      <input type="text" className="input-field" placeholder="e.g. West Bengal"
                        value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
                    </div>
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Country</label>
                    <select className="input-field" value={form.country}
                      onChange={e => setForm(f => ({ ...f, country: e.target.value }))}>
                      <option value="">Select country (optional)</option>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {error && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3">
                      <span className="text-red-400 text-sm">⚠️ {error}</span>
                    </motion.div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">← Back</button>
                    <button type="submit" disabled={isLoading} className="btn-primary flex-1 justify-center">
                      {isLoading ? '⟳ Creating...' : '🚀 Create Account'}
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-gray-500 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Sign in →
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center mt-4">
          <Link to="/" className="text-gray-600 hover:text-gray-400 text-xs transition-colors">
            ← Back to home
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
