import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-animated flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md relative z-10"
      >
        {/* Animated 404 */}
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="text-8xl mb-4"
        >
          🔍
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-8xl font-black mb-2"
          style={{
            background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          404
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-white text-2xl font-bold mb-2"
        >
          Page Not Found
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-500 text-sm mb-8 leading-relaxed"
        >
          The page you're looking for doesn't exist or has been moved.
          Let's get you back to your wellness journey!
        </motion.p>

        {/* Quick links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col gap-3"
        >
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary w-full py-3"
          >
            ← Go Back
          </button>
          <Link to="/dashboard" className="btn-primary w-full py-3 text-center">
            🏠 Back to Dashboard
          </Link>
        </motion.div>

        {/* Quick nav */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 flex flex-wrap gap-2 justify-center"
        >
          {[
            { to: '/log',      label: '📝 Log Health'    },
            { to: '/ai-chat',  label: '🤖 AI Chat'       },
            { to: '/habits',   label: '🎯 Habits'        },
            { to: '/journal',  label: '📓 Journal'       },
          ].map(l => (
            <Link key={l.to} to={l.to}
              className="text-xs px-3 py-1.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              {l.label}
            </Link>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
