import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/layout/Layout';
import api from '../services/api';
import { useAuthStore } from '../hooks/useAuth';

interface Message {
  id: number;
  role: 'user' | 'ai';
  text: string;
  time: string;
}

const quickSuggestions = [
  { icon: '😴', text: 'How can I improve my sleep quality?' },
  { icon: '🧘', text: 'Tips to reduce stress and anxiety?' },
  { icon: '🥗', text: 'What foods boost energy naturally?' },
  { icon: '💧', text: 'How much water should I drink daily?' },
  { icon: '🏃', text: 'Best exercises for beginners?' },
  { icon: '✨', text: 'Daily skincare routine tips?' },
  { icon: '🫃', text: 'How do I improve gut health?' },
  { icon: '🧠', text: 'How to start meditating?' },
  { icon: '⚖️', text: 'Tips for healthy weight management?' },
];

let nextId = 0;

export default function AIChat() {
  const { user } = useAuthStore();
  const [aiEnabled, setAiEnabled] = useState<boolean | null>(null);
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [typing, setTyping]       = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  // Check if real AI is active and set welcome message
  useEffect(() => {
    api.get('/ai/status')
      .then(({ data }) => {
        setAiEnabled(data.ai_enabled);
        const firstName = user?.name?.split(' ')[0] || 'there';
        const powered   = data.ai_enabled
          ? 'I\'m powered by Claude AI and can answer any wellness question you have.'
          : 'I have built-in knowledge across sleep, nutrition, fitness, skincare and more.';
        setMessages([{
          id: nextId++, role: 'ai',
          text: `Hi ${firstName}! 👋 I'm your personal AI wellness assistant.\n\n${powered}\n\nAsk me anything about:\n• 😴 Sleep  • 🥗 Nutrition  • 💪 Fitness\n• ✨ Skincare  • 🧘 Mental wellness  • ⚡ Energy\n\nWhat's on your mind today?`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }]);
      })
      .catch(() => {
        setAiEnabled(false);
        setMessages([{
          id: nextId++, role: 'ai',
          text: `Hi ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm your wellness assistant. Ask me anything about sleep, nutrition, fitness, skincare or mental wellness!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }]);
      });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: nextId++, role: 'user', text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);
    setTyping(true);

    try {
      // Send last 10 messages as history for multi-turn context
      const history = [...messages, userMsg]
        .slice(-10)
        .map(m => ({ role: m.role, text: m.text }));

      const { data } = await api.post('/ai/chat', {
        message: text.trim(),
        history,
      });

      setTyping(false);
      setMessages(m => [...m, {
        id: nextId++, role: 'ai', text: data.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } catch {
      setTyping(false);
      setMessages(m => [...m, {
        id: nextId++, role: 'ai',
        text: '⚠️ I\'m having trouble connecting right now. Please make sure the backend server is running and try again.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    }

    setLoading(false);
    inputRef.current?.focus();
  };

  const clearChat = () => {
    setMessages([{
      id: nextId++, role: 'ai',
      text: 'Chat cleared! How can I help you today? 😊',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
  };

  const formatMessage = (text: string) => {
    return text.split('\n').map((line, i, arr) => (
      <span key={i}>
        {line.startsWith('•') ? (
          <span className="flex gap-2 mt-1">
            <span className="text-blue-400 shrink-0">•</span>
            <span>{line.slice(1).trim()}</span>
          </span>
        ) : line}
        {i < arr.length - 1 && !line.startsWith('•') && <br />}
      </span>
    ));
  };

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
              style={{ background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', boxShadow: '0 8px 20px rgba(139,92,246,0.4)' }}
              animate={{ boxShadow: ['0 8px 20px rgba(139,92,246,0.4)', '0 8px 30px rgba(139,92,246,0.7)', '0 8px 20px rgba(139,92,246,0.4)'] }}
              transition={{ repeat: Infinity, duration: 2 }}>
              🤖
            </motion.div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-white">AI Health Assistant</h1>
                {/* Real AI badge */}
                {aiEnabled === true && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)', color: 'white' }}>
                    ✦ Claude AI
                  </motion.span>
                )}
                {aiEnabled === false && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full border border-white/10 text-gray-500">
                    Built-in KB
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <motion.span className="w-2 h-2 rounded-full bg-green-400"
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }} />
                <span className="text-xs text-green-400">
                  {aiEnabled === true ? 'Powered by Claude AI · Ready' : 'Online · Ready to help'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={clearChat}
            className="text-xs text-gray-600 hover:text-red-400 transition-colors px-3 py-1.5 rounded-xl border border-white/5 hover:border-red-500/20 shrink-0">
            🗑 Clear chat
          </button>
        </motion.div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto rounded-2xl border border-white/8 p-4 flex flex-col gap-3 mb-4"
          style={{ background: 'rgba(255,255,255,0.02)' }}>
          <AnimatePresence initial={false}>
            {messages.map(msg => (
              <motion.div key={msg.id}
                initial={{ opacity: 0, y: 15, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2 items-end`}>
                {msg.role === 'ai' && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 mb-1"
                    style={{ background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)' }}>🤖</div>
                )}
                <div className="max-w-[80%]">
                  <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                    <p className="text-sm text-white leading-relaxed">{formatMessage(msg.text)}</p>
                  </div>
                  <p className={`text-xs text-gray-700 mt-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.time}
                  </p>
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0 mb-1"
                    style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}>
                    {(user?.name || 'U')[0].toUpperCase()}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {typing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 items-end">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                style={{ background: 'linear-gradient(135deg,#8b5cf6,#3b82f6)' }}>🤖</div>
              <div className="chat-bubble-ai flex items-center gap-1 px-4 py-3">
                {[0, 1, 2].map(i => (
                  <motion.span key={i} className="w-2 h-2 rounded-full bg-blue-400 inline-block"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />
                ))}
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick suggestions — show only at the start */}
        {messages.length <= 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
            {quickSuggestions.map((s, i) => (
              <motion.button key={i} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => send(s.text)}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-white/8 text-left hover:border-blue-500/30 transition-all text-xs text-gray-400 hover:text-white"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="text-base shrink-0">{s.icon}</span>
                <span className="truncate">{s.text}</span>
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Input */}
        <div className="flex gap-3">
          <input ref={inputRef} type="text" value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
            placeholder={aiEnabled ? 'Ask me anything about your health...' : 'Ask about sleep, diet, fitness, skincare...'}
            className="input-field flex-1"
            disabled={loading}
          />
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => send(input)} disabled={!input.trim() || loading}
            className="px-5 py-3 rounded-xl font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', boxShadow: '0 4px 15px rgba(59,130,246,0.3)' }}>
            {loading ? (
              <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}>⟳</motion.span>
            ) : '➤'}
          </motion.button>
        </div>

        <p className="text-xs text-gray-700 text-center mt-2">
          {aiEnabled === true
            ? '✦ Powered by Claude AI · Wellness suggestions only, not medical advice'
            : 'AI responses are wellness suggestions only, not medical advice.'}
        </p>
      </div>
    </Layout>
  );
}
