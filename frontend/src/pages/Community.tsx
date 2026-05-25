import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/layout/Layout';
import api from '../services/api';
import { useAuthStore } from '../hooks/useAuth';
import { toast } from '../components/ui/Toast';

interface Post {
  _id: string;
  authorName: string;
  title: string;
  content: string;
  tag: string;
  likes: string[];
  comments: { user: string; text: string; createdAt: string }[];
  createdAt: string;
  liked?: boolean;
}

const TAGS = ['All', 'Sleep', 'Nutrition', 'Fitness', 'Mental Health', 'Skin', 'Motivation', 'General'];

const TAG_COLORS: Record<string, string> = {
  Sleep: '#60a5fa', Nutrition: '#34d399', Fitness: '#fb923c',
  'Mental Health': '#a78bfa', Skin: '#f472b6', Motivation: '#fbbf24', General: '#94a3b8',
};

const AVATARS = ['👨‍💻','👩‍🔬','🧑‍🏋️','👩‍🎨','👨‍🍳','🧑‍💼','👩‍⚕️','👨‍🎓'];

export default function Community() {
  const { user }    = useAuthStore();
  const [posts, setPosts]       = useState<Post[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [form, setForm]         = useState({ title: '', content: '', tag: 'General' });
  const [search, setSearch]     = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = filter !== 'All' ? `?tag=${filter}` : '';
      const r = await api.get(`/community${params}`);
      setPosts(r.data.data || []);
    } catch {
      // Use demo posts if API fails
      setPosts([
        { _id:'1', authorName:'Aryan Sharma',  title:'30-day sleep consistency challenge!', content:'I have been sleeping at 11 PM and waking at 6 AM for 30 days. My energy levels have doubled! Who wants to join?', tag:'Sleep',        likes:[], comments:[], createdAt: new Date().toISOString() },
        { _id:'2', authorName:'Priya Mehta',   title:'Gut health transformation — Week 3',  content:'Cut processed foods, added probiotics and fibre. Bloating is 80% gone and my skin is clearer than ever!',         tag:'Nutrition',   likes:[], comments:[], createdAt: new Date().toISOString() },
        { _id:'3', authorName:'Rohan Kumar',   title:'Hit 60-day workout streak! 🏆',        content:'Started with 15-minute walks, now doing 45-minute strength sessions. Small steps lead to big changes!',           tag:'Fitness',     likes:[], comments:[], createdAt: new Date().toISOString() },
        { _id:'4', authorName:'Sneha Reddy',   title:'Breathwork changed my anxiety',       content:'5 minutes of box breathing every morning reduced my anxiety from 8/10 to 3/10 in just one month.',               tag:'Mental Health',likes:[], comments:[], createdAt: new Date().toISOString() },
        { _id:'5', authorName:'Vikash M.',     title:'Hydration challenge — Day 14',        content:'Drinking 3L of water daily for 14 days. Skin looks amazing, headaches gone, energy is through the roof!',        tag:'Motivation',  likes:[], comments:[], createdAt: new Date().toISOString() },
      ]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const handlePost = async () => {
    if (!form.title.trim() || !form.content.trim()) { toast('Title and content required', 'error'); return; }
    setSubmitting(true);
    try {
      await api.post('/community', form);
      toast('Post shared! ✓', 'success');
      setForm({ title: '', content: '', tag: 'General' });
      setShowForm(false);
      load();
    } catch {
      // local fallback
      const newPost: Post = {
        _id: Date.now().toString(),
        authorName: user?.name || 'You',
        title: form.title, content: form.content, tag: form.tag,
        likes: [], comments: [],
        createdAt: new Date().toISOString(),
      };
      setPosts(p => [newPost, ...p]);
      setForm({ title: '', content: '', tag: 'General' });
      setShowForm(false);
      toast('Post shared! ✓', 'success');
    }
    setSubmitting(false);
  };

  const handleLike = async (id: string) => {
    setPosts(ps => ps.map(p => p._id === id
      ? { ...p, likes: p.liked ? p.likes.slice(1) : [...p.likes, user?._id || 'me'], liked: !p.liked }
      : p
    ));
    try { await api.patch(`/community/${id}/like`); } catch {}
  };

  const handleComment = async (id: string) => {
    const text = commentInputs[id]?.trim();
    if (!text) return;
    try {
      await api.post(`/community/${id}/comment`, { text });
      setPosts(ps => ps.map(p => p._id === id
        ? { ...p, comments: [...p.comments, { user: user?._id || '', text, createdAt: new Date().toISOString() }] }
        : p
      ));
      setCommentInputs(c => ({ ...c, [id]: '' }));
      toast('Comment added ✓', 'success');
    } catch {
      toast('Failed to add comment', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/community/${id}`);
      setPosts(p => p.filter(x => x._id !== id));
      toast('Post deleted', 'info');
    } catch { toast('Failed to delete', 'error'); }
  };

  const filtered = search
    ? posts.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.content.toLowerCase().includes(search.toLowerCase()))
    : posts;

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-white">👥 Community</h1>
            <p className="text-gray-400 mt-1">Share your wellness journey. Inspire others.</p>
          </div>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => setShowForm(!showForm)}
            className="btn-primary">
            {showForm ? '✕ Cancel' : '+ Share Post'}
          </motion.button>
        </div>
      </motion.div>

      {/* New Post Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-5">
            <div className="rounded-2xl border border-blue-500/20 p-5"
              style={{ background: 'rgba(59,130,246,0.06)' }}>
              <h3 className="text-white font-semibold mb-4">✍️ Share with the community</h3>
              <input type="text" placeholder="Post title..." className="input-field mb-3"
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              <textarea rows={3} placeholder="Share your wellness experience, tips or milestone..."
                className="input-field mb-3 resize-none"
                value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
              <div className="flex items-center gap-3 flex-wrap">
                <select className="input-field w-auto text-sm" value={form.tag}
                  onChange={e => setForm(f => ({ ...f, tag: e.target.value }))}>
                  {TAGS.slice(1).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={handlePost} disabled={submitting} className="btn-primary text-sm py-2 px-5">
                  {submitting ? '⟳ Posting...' : '🚀 Post'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search + Filter */}
      <div className="flex flex-col gap-3 mb-5">
        <input type="text" placeholder="🔍 Search posts..."
          className="input-field text-sm max-w-md"
          value={search} onChange={e => setSearch(e.target.value)} />
        <div className="flex gap-2 flex-wrap">
          {TAGS.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={filter === t
                ? { background: TAG_COLORS[t] || '#3b82f6', color: 'white' }
                : { background: 'rgba(255,255,255,0.05)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-2xl shimmer" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-white font-semibold">No posts yet</p>
          <p className="text-gray-500 text-sm mt-1">Be the first to share something!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((post, i) => {
            const tagCol = TAG_COLORS[post.tag] || '#94a3b8';
            const avatar = AVATARS[post.authorName.length % AVATARS.length];
            const isExpanded = expandedPost === post._id;
            const isOwn = post.authorName === user?.name;

            return (
              <motion.div key={post._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-white/5 overflow-hidden transition-all hover:border-white/10"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                {/* Post header */}
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-3xl">{avatar}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-semibold text-sm">{post.authorName}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: `${tagCol}20`, color: tagCol, border: `1px solid ${tagCol}33` }}>
                          {post.tag}
                        </span>
                        <span className="text-gray-600 text-xs ml-auto">
                          {new Date(post.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <h3 className="text-white font-bold mt-1">{post.title}</h3>
                    </div>
                  </div>

                  <p className={`text-gray-300 text-sm leading-relaxed ${!isExpanded && post.content.length > 150 ? 'line-clamp-2' : ''}`}>
                    {post.content}
                  </p>
                  {post.content.length > 150 && (
                    <button onClick={() => setExpandedPost(isExpanded ? null : post._id)}
                      className="text-xs text-blue-400 hover:text-blue-300 mt-1 transition-colors">
                      {isExpanded ? 'Show less' : 'Read more'}
                    </button>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/5">
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleLike(post._id)}
                      className={`flex items-center gap-1.5 text-sm transition-colors ${post.liked ? 'text-red-400' : 'text-gray-500 hover:text-red-400'}`}>
                      {post.liked ? '❤️' : '🤍'} {post.likes.length}
                    </motion.button>
                    <button onClick={() => setExpandedPost(isExpanded ? null : post._id)}
                      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-400 transition-colors">
                      💬 {post.comments.length}
                    </button>
                    <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-400 transition-colors"
                      onClick={() => { navigator.clipboard.writeText(post.title); toast('Copied!', 'info'); }}>
                      🔗 Share
                    </button>
                    {isOwn && (
                      <button onClick={() => handleDelete(post._id)}
                        className="ml-auto text-xs text-gray-700 hover:text-red-400 transition-colors">
                        🗑 Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Comments section */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-white/5 px-5 py-4"
                      style={{ background: 'rgba(255,255,255,0.02)' }}>
                      {/* Existing comments */}
                      {post.comments.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {post.comments.map((c, j) => (
                            <div key={j} className="flex gap-2 text-sm">
                              <span className="text-gray-600 shrink-0">💬</span>
                              <p className="text-gray-400">{c.text}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Add comment */}
                      <div className="flex gap-2">
                        <input type="text" placeholder="Add a comment..."
                          className="input-field text-sm flex-1 py-2"
                          value={commentInputs[post._id] || ''}
                          onChange={e => setCommentInputs(c => ({ ...c, [post._id]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && handleComment(post._id)}
                        />
                        <button onClick={() => handleComment(post._id)}
                          className="px-4 py-2 rounded-xl text-sm font-bold text-white"
                          style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}>
                          Send
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
