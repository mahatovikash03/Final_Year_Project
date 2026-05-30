import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const features = [
  { icon: '🤖', title: 'AI Health Assistant',    desc: 'Chat with your personal AI wellness coach 24/7',               color: 'from-purple-500 to-purple-700' },
  { icon: '😴', title: 'Sleep Schedule',          desc: 'Optimise sleep with cycle-based wake times and history',       color: 'from-blue-500 to-blue-700'   },
  { icon: '🫃', title: 'Gut Health Monitor',      desc: 'Track digestion and get personalised diet tips',               color: 'from-green-500 to-green-700'  },
  { icon: '✨', title: 'Skin Analysis',            desc: 'AI-powered skin symptom checker and care routine tracker',    color: 'from-pink-500 to-pink-700'   },
  { icon: '😊', title: 'Mood Tracker',            desc: 'Daily emotional check-ins with insights and trends',           color: 'from-yellow-500 to-orange-600' },
  { icon: '📊', title: 'Smart Analytics',         desc: 'Visual dashboards showing all your health trends',            color: 'from-cyan-500 to-cyan-700'   },
  { icon: '🎯', title: 'Habit Tracker',           desc: 'Build powerful daily habits with streaks and milestones',     color: 'from-red-500 to-red-700'     },
  { icon: '📓', title: 'Wellness Journal',        desc: 'Guided journaling with prompts, tags and mood tracking',      color: 'from-indigo-500 to-indigo-700' },
  { icon: '🩺', title: 'Symptom Checker',         desc: 'Get personalised wellness suggestions for your symptoms',     color: 'from-teal-500 to-teal-700'   },
  { icon: '🏆', title: 'Gamification',            desc: 'Earn streaks, badges and rewards for healthy habits',         color: 'from-yellow-500 to-yellow-700' },
  { icon: '👥', title: 'Community',               desc: 'Share your wellness journey and inspire others',              color: 'from-violet-500 to-violet-700' },
  { icon: '⌚', title: 'Wearables Ready',         desc: 'Connect fitness trackers for automatic health data sync',    color: 'from-slate-500 to-slate-700'  },
];

const stats = [
  { value: '50K+', label: 'Active Users'  },
  { value: '98%',  label: 'Satisfaction'  },
  { value: '14+',  label: 'AI Features'   },
  { value: '24/7', label: 'AI Support'    },
];

const testimonials = [
  { name: 'Aryan S.',  role: 'Engineering Student',  text: 'HealthTrack360 completely changed how I manage stress during exams. The AI chatbot feels like talking to a real health coach!',           avatar: '👨‍💻' },
  { name: 'Priya M.',  role: 'IT Professional',      text: 'The sleep schedule feature helped me fix my sleep in just 2 weeks. My productivity has gone through the roof.',                          avatar: '👩‍💼' },
  { name: 'Rohan K.',  role: 'Fitness Enthusiast',   text: 'Love the habit tracker and gamification! I have maintained a 45-day streak and never felt healthier.',                                    avatar: '🧑‍🏋️' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-animated overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/20 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-2xl font-black text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Health<span className="gradient-text-blue">Track360</span>
          </span>
          <div className="flex items-center gap-2">
            <Link to="/login"
              className="text-sm font-semibold px-4 py-2 rounded-xl border border-white/15 text-gray-300 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all whitespace-nowrap">
              Sign In
            </Link>
            <Link to="/register"
              className="text-sm font-semibold px-4 py-2 rounded-xl text-white whitespace-nowrap"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', boxShadow: '0 4px 15px rgba(59,130,246,0.35)' }}>
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="badge badge-blue mb-6 inline-block text-sm px-4 py-1.5">✨ AI-Powered Wellness Platform</span>
            <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Your Personal
              <span className="block gradient-text">AI Wellness</span>
              Ecosystem
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Track sleep, habits, mood, gut health, skin and mental wellness — all in one
              beautiful AI-powered platform built for students and young professionals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn-primary text-base py-3.5 px-8 glow-blue">🚀 Start For Free</Link>
              <Link to="/login"    className="btn-secondary text-base py-3.5 px-8">👁️ Sign In</Link>
            </div>
          </motion.div>

          {/* Dashboard preview */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-20 relative"
          >
            <div className="glass-card p-6 max-w-4xl mx-auto neon-border-blue">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Wellness Score', val: '87',  color: 'text-green-400',  icon: '💚' },
                  { label: 'Sleep',          val: '7.5h', color: 'text-blue-400',  icon: '😴' },
                  { label: 'Mood',           val: '4.2/5',color: 'text-purple-400',icon: '😊' },
                  { label: 'Workouts',       val: '5',    color: 'text-orange-400', icon: '🏋️' },
                ].map(s => (
                  <div key={s.label} className="glass rounded-xl p-3 text-left">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs text-gray-500">{s.label}</span>
                      <span>{s.icon}</span>
                    </div>
                    <span className={`text-2xl font-black ${s.color}`}>{s.val}</span>
                  </div>
                ))}
              </div>
              <div className="glass rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-3">Weekly Wellness Trend</p>
                <div className="flex items-end gap-2 h-20">
                  {[65, 72, 68, 80, 75, 87, 83].map((h, i) => (
                    <motion.div key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: 0.5 + i * 0.08, duration: 0.5 }}
                      className="flex-1 rounded-t-md"
                      style={{ background: `rgba(96,165,250,${0.3 + h / 300})` }}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-2">
                  {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <span key={d}>{d}</span>)}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-white/5">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="text-center">
              <p className="text-4xl font-black gradient-text-blue mb-1">{s.value}</p>
              <p className="text-gray-500 text-sm">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Everything You Need
            </h2>
            <p className="text-gray-400 text-lg sm:text-xl">14+ AI-powered features in one beautiful platform</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.04 }}
                className="glass-card-hover p-6">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center text-2xl mb-4`}>
                  {f.icon}
                </div>
                <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Loved by Users</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={t.name}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="glass-card p-6">
                <p className="text-gray-300 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{t.avatar}</span>
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-gray-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 pointer-events-none" />
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} className="relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Start Your Wellness Journey
          </h2>
          <p className="text-gray-400 text-lg sm:text-xl mb-10">Free forever. No credit card required.</p>
          <Link to="/register" className="btn-primary text-lg py-4 px-10 glow-blue">🚀 Create Free Account</Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6 text-center text-gray-600 text-sm">
        <p>© 2025 HealthTrack360 AI — B.Tech CSE & IT Project, Techno Bengal Institute of Technology, Kolkata</p>
      </footer>
    </div>
  );
}
