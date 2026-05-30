import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import Layout            from '../components/layout/Layout';
import HealthStreakWidget from '../components/dashboard/HealthStreakWidget';
import StatModal, { ModalType } from '../components/dashboard/StatModal';
import { WaterModal, MoodLoggerModal, BMIModal, AITipsModal, WeeklySummaryModal, LogStreakModal } from '../components/dashboard/AllModals';
import { WellnessRingModal, TrendChartModal, HeroBannerModal, QuickActionsModal } from '../components/dashboard/AdvancedModals';
import { useAuthStore }    from '../hooks/useAuth';
import { useWeeklyAnalytics, useStreakData } from '../hooks/useHealthData';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

/* ── Particles ─────────────────────────────────────────────────────────── */
function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!; const ctx = c.getContext('2d')!;
    c.width = c.offsetWidth; c.height = c.offsetHeight;
    const pts = Array.from({ length: 70 }, () => ({
      x: Math.random() * c.width, y: Math.random() * c.height,
      r: Math.random() * 1.8 + 0.4,
      dx: (Math.random() - 0.5) * 0.35, dy: (Math.random() - 0.5) * 0.35,
      a: Math.random() * 0.55 + 0.15,
      col: ['#60a5fa','#a78bfa','#34d399','#f472b6'][Math.floor(Math.random()*4)],
    }));
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      pts.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = p.col; ctx.globalAlpha = p.a; ctx.fill();
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0 || p.x > c.width)  p.dx *= -1;
        if (p.y < 0 || p.y > c.height) p.dy *= -1;
      });
      pts.forEach((a, i) => pts.slice(i+1).forEach(b => {
        const d = Math.hypot(a.x-b.x, a.y-b.y);
        if (d < 100) { ctx.globalAlpha=0.04*(1-d/100); ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.strokeStyle='#60a5fa'; ctx.lineWidth=0.5; ctx.stroke(); }
      }));
      raf = requestAnimationFrame(draw);
    };
    draw(); return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none opacity-60" />;
}

/* ── Wellness Ring ─────────────────────────────────────────────────────── */
function WellnessRing({ score }: { score: number }) {
  const S=180, sw=14, r=(S-sw)/2, circ=2*Math.PI*r;
  const col=score>=70?'#34d399':score>=50?'#fbbf24':'#f87171';
  const lbl=score>=70?'Excellent':score>=50?'Good':'Improve';
  return (
    <div className="relative flex items-center justify-center">
      <motion.svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} style={{filter:`drop-shadow(0 0 24px ${col}66)`,display:'block',flexShrink:0}}>
        <defs><linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={col}/><stop offset="100%" stopColor={col} stopOpacity="0.3"/></linearGradient></defs>
        <circle cx={S/2} cy={S/2} r={r+8} fill="none" stroke={`${col}0a`} strokeWidth={22}/>
        <circle cx={S/2} cy={S/2} r={r}   fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={sw}/>
        <motion.circle cx={S/2} cy={S/2} r={r} fill="none" stroke="url(#rg)" strokeWidth={sw}
          strokeLinecap="round" strokeDasharray={circ}
          initial={{strokeDashoffset:circ}} animate={{strokeDashoffset:circ-(score/100)*circ}}
          transition={{duration:2,ease:'easeOut'}}
          style={{transformOrigin:`${S/2}px ${S/2}px`,transform:'rotate(-90deg)',filter:`drop-shadow(0 0 10px ${col})`}}/>
        <circle cx={S/2} cy={S/2} r={r-20} fill="rgba(2,8,23,0.65)"/>
        <motion.text x={S/2} y={S/2-10} textAnchor="middle" fill="white" fontSize="44" fontWeight="900"
          initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1}}>{score}</motion.text>
        <text x={S/2} y={S/2+14} textAnchor="middle" fill={col} fontSize="12" fontWeight="700" letterSpacing="2">{lbl.toUpperCase()}</text>
        <text x={S/2} y={S/2+32} textAnchor="middle" fill="rgba(148,163,184,0.45)" fontSize="9" letterSpacing="1">WELLNESS SCORE</text>
      </motion.svg>
      {[1,2,3].map(i=>(
        <motion.div key={i} className="absolute rounded-full border"
          style={{width:S+i*22,height:S+i*22,borderColor:`${col}${18-i*4}`}}
          animate={{scale:[1,1.06+i*0.02,1],opacity:[0.4,0.05,0.4]}}
          transition={{repeat:Infinity,duration:2.5+i*0.5,delay:i*0.3}}/>
      ))}
    </div>
  );
}

/* ── Clickable Box Wrapper ─────────────────────────────────────────────── */
function ClickBox({ children, onClick, className = '', style = {} }: any) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div onHoverStart={() => setHov(true)} onHoverEnd={() => setHov(false)}
      onClick={onClick} className={`cursor-pointer relative ${className}`} style={style}>
      {children}
      <motion.div className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full border z-20"
        style={{ background: 'rgba(96,165,250,0.1)', borderColor: 'rgba(96,165,250,0.3)', color: '#60a5fa' }}
        animate={{ opacity: hov ? 1 : 0, scale: hov ? 1 : 0.8 }} transition={{ duration: 0.2 }}>
        tap ↗
      </motion.div>
    </motion.div>
  );
}

/* ── Stat Card ─────────────────────────────────────────────────────────── */
function StatCard({ icon,label,value,unit,color,grad,delay,onClick }: any) {
  const [hov,setHov]=useState(false);
  return (
    <motion.div initial={{opacity:0,y:40}} animate={{opacity:1,y:0}} transition={{delay,duration:0.5}}
      onHoverStart={()=>setHov(true)} onHoverEnd={()=>setHov(false)} style={{perspective:800}}>
      <motion.div animate={{rotateY:hov?8:0,rotateX:hov?-5:0,scale:hov?1.06:1}} transition={{duration:0.3}}
        onClick={onClick}
        className="relative overflow-hidden rounded-2xl p-5 border border-white/10 cursor-pointer h-full select-none"
        style={{background:'linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))',backdropFilter:'blur(20px)'}}>
        <motion.div className="absolute inset-0 rounded-2xl" style={{background:grad}} animate={{opacity:hov?0.22:0}}/>
        <div className="absolute top-0 left-0 right-0 h-px" style={{background:`linear-gradient(90deg,transparent,${color}66,transparent)`}}/>
        <motion.div className="absolute top-2 right-2 text-xs px-1.5 py-0.5 rounded-full border"
          style={{background:`${color}15`,borderColor:`${color}33`,color}} animate={{opacity:hov?1:0}}>tap ↗</motion.div>
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <motion.span className="text-4xl" animate={{scale:hov?1.25:1,rotate:hov?12:0}} transition={{duration:0.3}}>{icon}</motion.span>
            <motion.div className="w-2.5 h-2.5 rounded-full mt-1" style={{backgroundColor:color}}
              animate={{scale:[1,1.6,1],opacity:[1,0.4,1]}} transition={{repeat:Infinity,duration:2}}/>
          </div>
          <motion.p className="text-4xl font-black mb-1" style={{color}} animate={{scale:hov?1.06:1}}>
            {typeof value==='number'?value.toFixed(value%1===0?0:1):value}
          </motion.p>
          {unit&&<p className="text-xs text-gray-500 mb-1.5">{unit}</p>}
          <p className="text-sm text-gray-400 font-semibold">{label}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Holo Button ───────────────────────────────────────────────────────── */
function HoloBtn({ icon,label,to,c1,c2,delay }: any) {
  const [hov,setHov]=useState(false);
  return (
    <motion.div initial={{opacity:0,scale:0.7}} animate={{opacity:1,scale:1}} transition={{delay,type:'spring',stiffness:200}}>
      <Link to={to} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
        className="relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-white/10 overflow-hidden block"
        style={{background:'rgba(255,255,255,0.03)',backdropFilter:'blur(12px)',minHeight:100}}>
        <motion.div className="absolute inset-0 rounded-2xl" style={{background:`linear-gradient(135deg,${c1},${c2})`}} animate={{opacity:hov?0.28:0.07}}/>
        <div className="absolute top-0 left-0 right-0 h-px" style={{background:`linear-gradient(90deg,transparent,${c1}99,transparent)`}}/>
        <motion.span className="text-3xl relative z-10" animate={{scale:hov?1.35:1,y:hov?-4:0}} transition={{duration:0.2}}>{icon}</motion.span>
        <span className="text-xs font-bold text-gray-300 relative z-10 text-center leading-tight">{label}</span>
        <motion.div className="absolute bottom-0 left-6 right-6 h-0.5 rounded-full"
          style={{background:`linear-gradient(90deg,${c1},${c2})`}}
          animate={{scaleX:hov?1:0,opacity:hov?1:0}}/>
      </Link>
    </motion.div>
  );
}

/* ── Day Dot ───────────────────────────────────────────────────────────── */
function DayDot({ done,label,delay }: any) {
  return (
    <motion.div initial={{opacity:0,scale:0}} animate={{opacity:1,scale:1}} transition={{delay,type:'spring'}} className="flex flex-col items-center gap-1.5">
      <motion.div animate={done?{scale:[1,1.15,1]}:{}} transition={{delay:delay+0.3,duration:0.4}}
        className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold border ${done?'border-green-500/50 text-green-400':'border-white/5 text-gray-700'}`}
        style={done?{background:'linear-gradient(135deg,rgba(52,211,153,0.25),rgba(16,185,129,0.1))',boxShadow:'0 0 14px rgba(52,211,153,0.25)'}:{background:'rgba(255,255,255,0.02)'}}>
        {done?'✓':'·'}
      </motion.div>
      <span className="text-xs text-gray-600 font-medium">{label}</span>
    </motion.div>
  );
}

/* ── Live Clock ────────────────────────────────────────────────────────── */
function LiveClock() {
  const [t,setT]=useState(new Date());
  useEffect(()=>{const id=setInterval(()=>setT(new Date()),1000);return()=>clearInterval(id);},[]);
  return (
    <div className="text-right">
      <p className="text-3xl font-black text-white font-mono tabular-nums">{t.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</p>
      <p className="text-xs text-gray-500 mt-0.5">{t.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p>
    </div>
  );
}

const tips = [
  {icon:'💧',text:'Drink a glass of water right now. Even mild dehydration reduces brain performance by 14%.'},
  {icon:'🧘',text:'Try box breathing: inhale 4s → hold 4s → exhale 4s → hold 4s. Reduces anxiety in minutes.'},
  {icon:'🌙',text:'Going to bed at the same time each night improves sleep quality by up to 40%.'},
  {icon:'🥗',text:'Eating one extra serving of vegetables daily reduces disease risk by 20% over time.'},
  {icon:'🏃',text:'A 10-minute walk after every meal lowers blood sugar and boosts metabolism significantly.'},
  {icon:'📵',text:'No screens 1 hour before bed. Blue light blocks melatonin production by 50%.'},
  {icon:'🎵',text:'Listening to calm music 20 minutes daily reduces cortisol and lowers heart rate.'},
];

const dayLabels=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

type AllModal = ModalType | 'water' | 'moodlog' | 'bmi' | 'aitips' | 'weeklysummary' | 'logstreak' | 'wellnessring' | 'trendchart' | 'herobanner' | 'quickactions';

/* ═══════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { user }                        = useAuthStore();
  const { analytics, loading, refetch } = useWeeklyAnalytics();
  // ── REAL streak data from backend, scoped to logged-in user ──────────
  const { streakDays, bestStreak, loggedDays, totalLogged, refetch: refetchStreak } = useStreakData();
  const [tipIdx, setTipIdx]             = useState(0);
  const [modal, setModal]               = useState<AllModal>(null);

  // User-scoped localStorage helper
  const uid = user?.id || 'guest';
  const getLocal = (key: string, fallback: any) => {
    try { const v = localStorage.getItem(`${uid}:${key}`); return v !== null ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  };

  const [bmiLast,    setBmiLast]    = useState<any>(null);
  const [waterToday, setWaterToday] = useState<number>(0);
  const [moodToday,  setMoodToday]  = useState<number | null>(null);

  const refreshWidgets = () => {
    setBmiLast(getLocal('bmi-history', [])[0] || null);
    setWaterToday(getLocal('water-today', 0));
    setMoodToday(getLocal('mood-today', null));
  };

  useEffect(() => { refreshWidgets(); }, [uid]);

  const open  = (m: AllModal) => setModal(m);
  const close = () => { setModal(null); refreshWidgets(); refetchStreak(); };

  useEffect(()=>{const id=setInterval(()=>setTipIdx(i=>(i+1)%tips.length),6000);return()=>clearInterval(id);},[]);

  const avg    = analytics?.avgWellnessScore ?? 0;
  const trend  = analytics?.weeklyTrend || [];
  const labels = trend.map((t:any)=>new Date(t.date).toLocaleDateString('en-IN',{weekday:'short'}));
  const scores = trend.map((t:any)=>t.score);
  const hr     = new Date().getHours();
  const greet  = hr<12?'🌅 Good Morning':hr<17?'☀️ Good Afternoon':'🌙 Good Evening';

  return (
    <Layout>

      {/* ── ALL MODALS ─────────────────────────────────────────────── */}
      <StatModal type={modal as ModalType} onClose={close} onRefresh={refetch}/>
      <WaterModal          open={modal==='water'}        onClose={close}/>
      <MoodLoggerModal     open={modal==='moodlog'}      onClose={close}/>
      <BMIModal            open={modal==='bmi'}          onClose={close}/>
      <AITipsModal         open={modal==='aitips'}       onClose={close}/>
      <WeeklySummaryModal  open={modal==='weeklysummary'} onClose={close} analytics={analytics}/>
      {/* Pass real streak data to LogStreakModal */}
      <LogStreakModal
        open={modal==='logstreak'}
        onClose={close}
        streakDays={streakDays}
        bestStreak={bestStreak}
        loggedDays={loggedDays}
        totalLogged={totalLogged}
      />
      <WellnessRingModal   open={modal==='wellnessring'} onClose={close} analytics={analytics}/>
      <TrendChartModal     open={modal==='trendchart'}   onClose={close} analytics={analytics}/>
      <HeroBannerModal     open={modal==='herobanner'}   onClose={close} user={user} analytics={analytics}/>
      <QuickActionsModal   open={modal==='quickactions'} onClose={close}/>

      {/* ── ROW 1: HERO ───────────────────────────────────────────── */}
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}}
        className="relative overflow-hidden rounded-3xl mb-5 p-7"
        style={{background:'linear-gradient(135deg,rgba(59,130,246,0.18),rgba(139,92,246,0.12),rgba(52,211,153,0.08))',border:'1px solid rgba(255,255,255,0.09)',backdropFilter:'blur(24px)',minHeight:200}}>
        <ParticleCanvas/>
        <div className="absolute top-0 left-0 right-0 h-px" style={{background:'linear-gradient(90deg,transparent,rgba(96,165,250,0.6),rgba(167,139,250,0.6),transparent)'}}/>
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0 overflow-hidden">
            <motion.p initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} className="text-gray-400 text-sm mb-1">{greet}</motion.p>
            <motion.h1 initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:0.1}}
              className="font-black text-white mb-2"
              style={{fontFamily:"'Space Grotesk',sans-serif",fontSize:'clamp(1.1rem,4vw,2.2rem)',letterSpacing:'-0.5px',lineHeight:1.2,wordBreak:'break-word',overflowWrap:'break-word',whiteSpace:'normal'}}>
              {user?.name}
            </motion.h1>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.2}} className="flex flex-wrap gap-2">
              <span className="badge badge-green">🟢 Online</span>
              <span className="badge badge-blue">🤖 AI Active</span>
              {avg>=70&&<span className="badge badge-yellow">🔥 On Fire!</span>}
            </motion.div>
          </div>
          <div className="flex items-center gap-2 sm:gap-6 shrink-0">
            <div className="wellness-ring-container" style={{width:180,height:180,flexShrink:0}}>
              {!loading?<WellnessRing score={avg}/>:<div className="w-32 h-32 rounded-full shimmer"/>}
            </div>
            <div className="hidden lg:block"><LiveClock/></div>
          </div>
        </div>
      </motion.div>

      {/* ── ROW 2: STAT CARDS ─────────────────────────────────────── */}
      <p className="text-gray-600 text-xs mb-2 ml-1">💡 Click any card to view history, add entries, and delete records</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        <StatCard icon="😴" label="Sleep"     value={analytics?.avgSleepDuration??0} unit="hrs avg"    color="#60a5fa" grad="radial-gradient(circle,#3b82f633,transparent)" delay={0.10} onClick={()=>open('sleep')}/>
        <StatCard icon="😊" label="Mood"      value={analytics?.avgMoodRating??0}    unit="out of 5"   color="#a78bfa" grad="radial-gradient(circle,#8b5cf633,transparent)" delay={0.13} onClick={()=>open('mood')}/>
        <StatCard icon="🏋️" label="Workouts"  value={analytics?.totalWorkouts??0}    unit="this week"  color="#fb923c" grad="radial-gradient(circle,#f9731633,transparent)" delay={0.16} onClick={()=>open('workout')}/>
        <StatCard icon="💧" label="Hydration" value={analytics?.avgHydration??0}     unit="litres/day" color="#34d399" grad="radial-gradient(circle,#10b98133,transparent)" delay={0.19} onClick={()=>open('hydration')}/>
        <StatCard icon="📋" label="Logs"      value={analytics?.logsThisWeek??0}     unit="this week"  color="#f472b6" grad="radial-gradient(circle,#ec489933,transparent)" delay={0.22} onClick={()=>open('logs')}/>
        {/* ✅ FIXED: streakDays comes from real API, not hardcoded 6 */}
        <StatCard icon="⚡" label="Streak"    value={streakDays}                     unit="day streak" color="#fbbf24" grad="radial-gradient(circle,#f59e0b33,transparent)" delay={0.25} onClick={()=>open('streak')}/>
      </div>

      {/* ── ROW 3: CHART + HEALTHY EATING ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{delay:0.3}}
          className="lg:col-span-2 rounded-2xl p-6 border border-white/8"
          style={{background:'linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))',backdropFilter:'blur(20px)'}}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-white font-bold text-lg">📈 Wellness Trend</h2>
              <p className="text-gray-500 text-xs mt-0.5">Click stat cards above to add or delete entries</p>
            </div>
            {scores.length>0&&(
              <div className="flex gap-3 text-xs text-gray-500">
                <span>🟢 {scores.filter((s:number)=>s>=70).length}d</span>
                <span>🟡 {scores.filter((s:number)=>s>=50&&s<70).length}d</span>
                <span>🔴 {scores.filter((s:number)=>s<50).length}d</span>
              </div>
            )}
          </div>
          {scores.length>0?(
            <Line
              data={{labels,datasets:[{data:scores,borderColor:'#60a5fa',
                backgroundColor:(ctx:any)=>{const g=ctx.chart.ctx.createLinearGradient(0,0,0,220);g.addColorStop(0,'rgba(96,165,250,0.35)');g.addColorStop(1,'rgba(96,165,250,0)');return g;},
                fill:true,tension:0.5,
                pointBackgroundColor:scores.map((s:number)=>s>=70?'#34d399':s>=50?'#fbbf24':'#f87171'),
                pointRadius:7,pointHoverRadius:10,pointBorderColor:'#020817',pointBorderWidth:2,borderWidth:3}]}}
              options={{responsive:true,
                plugins:{legend:{display:false},tooltip:{backgroundColor:'rgba(2,8,23,0.95)',borderColor:'rgba(96,165,250,0.4)',borderWidth:1,titleColor:'#94a3b8',bodyColor:'#fff',padding:14}},
                scales:{y:{min:0,max:100,ticks:{color:'#334155',font:{size:11}},grid:{color:'rgba(255,255,255,0.03)'}},x:{ticks:{color:'#334155',font:{size:11}},grid:{display:false}}}}}
            />
          ):(
            <div className="h-48 flex flex-col items-center justify-center gap-3">
              <p className="text-5xl">📊</p>
              <p className="text-gray-500 text-sm">No data logged yet</p>
              <Link to="/log" className="btn-primary text-sm py-2 px-5">📝 Log First Entry</Link>
            </div>
          )}
        </motion.div>
        <HealthStreakWidget/>
      </div>

      {/* ── ROW 4: QUICK ACTIONS ──────────────────────────────────── */}
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.35}} className="mb-5">
        <h2 className="text-white font-bold text-base mb-3">⚡ Quick Actions</h2>
        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2 sm:gap-3">
          <HoloBtn icon="📝" label="Log Today"   to="/log"           c1="#3b82f6" c2="#1d4ed8" delay={0.36}/>
          <HoloBtn icon="🤖" label="AI Chat"     to="/ai-chat"       c1="#8b5cf6" c2="#6d28d9" delay={0.38}/>
          <HoloBtn icon="🩺" label="Symptoms"    to="/symptoms"      c1="#10b981" c2="#047857" delay={0.40}/>
          <HoloBtn icon="📊" label="Analytics"   to="/analytics"     c1="#f97316" c2="#c2410c" delay={0.42}/>
          <HoloBtn icon="👥" label="Community"   to="/community"     c1="#06b6d4" c2="#0e7490" delay={0.44}/>
          <HoloBtn icon="⌚" label="Wearables"   to="/wearables"     c1="#ec4899" c2="#be185d" delay={0.46}/>
          <HoloBtn icon="🔔" label="Alerts"      to="/notifications" c1="#fbbf24" c2="#d97706" delay={0.48}/>
          <HoloBtn icon="👤" label="Profile"     to="/profile"       c1="#a78bfa" c2="#7c3aed" delay={0.50}/>
        </div>
      </motion.div>

      {/* ── ROW 5: LOG STREAK + SUMMARY + AI TIP ──────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">

        {/* Log streak → LogStreakModal (real data) */}
        <ClickBox onClick={()=>open('logstreak')}>
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.52}}
            className="rounded-2xl p-5 border border-white/8 h-full"
            style={{background:'linear-gradient(135deg,rgba(251,191,36,0.07),rgba(245,158,11,0.03))',backdropFilter:'blur(20px)'}}>
            <h3 className="text-white font-bold text-sm mb-1">🗓️ Log Streak</h3>
            <p className="text-gray-600 text-xs mb-4">Tap to view full streak details</p>
            {/* ✅ FIXED: loggedDays from real API, not static array */}
            <div className="grid grid-cols-7 gap-1.5 mb-4">
              {loggedDays.map((d,i)=><DayDot key={i} done={d} label={dayLabels[i].slice(0,1)} delay={0.54+i*0.04}/>)}
            </div>
            <motion.div className="rounded-2xl p-4 text-center border border-yellow-500/20"
              style={{background:'linear-gradient(135deg,rgba(251,191,36,0.1),rgba(245,158,11,0.05))'}}>
              <motion.span animate={{scale:[1,1.2,1]}} transition={{repeat:Infinity,duration:1.8}} className="text-4xl block mb-1">🔥</motion.span>
              {/* ✅ FIXED: streakDays from real API */}
              <p className="text-5xl font-black text-yellow-400">{streakDays}</p>
              <p className="text-gray-500 text-xs mt-1">day streak</p>
            </motion.div>
          </motion.div>
        </ClickBox>

        {/* Summary bars */}
        <ClickBox onClick={()=>open('weeklysummary')}>
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.55}}
            className="rounded-2xl p-5 border border-white/8 h-full"
            style={{background:'linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))',backdropFilter:'blur(20px)'}}>
            <h3 className="text-white font-bold text-sm mb-4">📋 Weekly Summary <span className="text-gray-600 text-xs font-normal">(tap for details)</span></h3>
            <div className="space-y-3.5">
              {[
                {label:'Sleep',     val:analytics?.avgSleepDuration??0,                         max:9,   color:'#60a5fa',icon:'😴',unit:'h'},
                {label:'Mood',      val:(analytics?.avgMoodRating??0)*20,                        max:100, color:'#a78bfa',icon:'😊',unit:'%'},
                {label:'Hydration', val:Math.min(((analytics?.avgHydration??0)/2.5)*100,100),    max:100, color:'#34d399',icon:'💧',unit:'%'},
                {label:'Fitness',   val:Math.min((analytics?.totalWorkouts??0)*14,100),          max:100, color:'#fb923c',icon:'🏋️',unit:'%'},
                {label:'Logs',      val:Math.min((analytics?.logsThisWeek??0)*14,100),           max:100, color:'#f472b6',icon:'📋',unit:'%'},
              ].map(m=>(
                <div key={m.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400 flex items-center gap-1.5"><span>{m.icon}</span>{m.label}</span>
                    <span className="text-xs font-bold" style={{color:m.color}}>{m.val.toFixed(m.unit==='h'?1:0)}{m.unit}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{backgroundColor:m.color,boxShadow:`0 0 10px ${m.color}66`}}
                      initial={{width:0}} animate={{width:`${Math.min(m.val,100)}%`}} transition={{delay:0.8,duration:1.2}}/>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </ClickBox>

        {/* AI Tips */}
        <ClickBox onClick={()=>open('aitips')}>
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.58}}
            className="rounded-2xl p-5 border border-blue-500/15 relative overflow-hidden h-full"
            style={{background:'linear-gradient(135deg,rgba(59,130,246,0.08),rgba(139,92,246,0.05))',backdropFilter:'blur(20px)'}}>
            <div className="flex items-center gap-2 mb-4">
              <motion.span animate={{rotate:[0,15,-15,0]}} transition={{repeat:Infinity,duration:4}} className="text-2xl">🤖</motion.span>
              <span className="text-blue-300 font-bold text-sm">AI Wellness Tips</span>
              <span className="text-gray-600 text-xs ml-1">(tap to see all)</span>
              <motion.div className="w-2 h-2 rounded-full bg-green-400 ml-auto" animate={{opacity:[1,0,1]}} transition={{repeat:Infinity,duration:1.5}}/>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={tipIdx} initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-15}} transition={{duration:0.4}}>
                <span className="text-4xl block mb-3">{tips[tipIdx].icon}</span>
                <p className="text-gray-300 text-sm leading-relaxed">{tips[tipIdx].text}</p>
              </motion.div>
            </AnimatePresence>
            <div className="flex gap-1.5 mt-4">
              {tips.map((_,i)=>(
                <motion.button key={i} onClick={e=>{e.stopPropagation();setTipIdx(i);}} className="h-1 rounded-full"
                  animate={{width:i===tipIdx?24:6,backgroundColor:i===tipIdx?'#60a5fa':'rgba(255,255,255,0.1)'}}/>
              ))}
            </div>
          </motion.div>
        </ClickBox>

      </div>

      {/* ── ROW 6: WATER + MOOD + BMI ─────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <ClickBox onClick={()=>open('water')}>
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.65}}
            className="rounded-2xl p-5 border border-white/8"
            style={{background:'linear-gradient(135deg,rgba(96,165,250,0.06),rgba(59,130,246,0.02))',backdropFilter:'blur(20px)'}}>
            <h3 className="text-white font-bold text-sm mb-3 flex items-center justify-between">
              <span>💧 Water Intake</span>
              <span className="text-xs text-gray-600">tap to manage</span>
            </h3>
            {(() => {
              const g   = waterToday;
              const goal = 8;
              const pct = (g / goal) * 100;
              const col = pct >= 100 ? '#34d399' : pct >= 50 ? '#60a5fa' : '#a78bfa';
              return (
                <>
                  <div className="grid grid-cols-4 gap-2 mb-3" onClick={e => e.stopPropagation()}>
                    {Array.from({ length: goal }).map((_, i) => (
                      <div key={i} className="flex flex-col items-center gap-1 p-2 rounded-xl border"
                        style={i < g ? { background: `${col}22`, borderColor: `${col}44` } : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)' }}>
                        <span className="text-xl">{i < g ? '🥤' : '⬜'}</span>
                        <span className="text-xs" style={{ color: i < g ? col : '#374151' }}>{i + 1}</span>
                      </div>
                    ))}
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden mb-2">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: col }} />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: col }} className="font-bold">{g}/{goal} glasses</span>
                    <span className="text-gray-500">{g >= goal ? '🎉 Goal!' : 'Keep going!'}</span>
                  </div>
                </>
              );
            })()}
          </motion.div>
        </ClickBox>

        <ClickBox onClick={()=>open('moodlog')}>
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.7}}
            className="rounded-2xl p-5 border border-white/8"
            style={{background:'linear-gradient(135deg,rgba(167,139,250,0.06),rgba(139,92,246,0.02))',backdropFilter:'blur(20px)'}}>
            <h3 className="text-white font-bold text-sm mb-4 flex items-center justify-between">
              <span>😊 How are you feeling?</span>
              <span className="text-xs text-gray-600">tap to log</span>
            </h3>
            {(() => {
              const sel   = moodToday;
              const moods = [{e:'😄',l:'Great',c:'#34d399'},{e:'🙂',l:'Good',c:'#60a5fa'},{e:'😐',l:'Okay',c:'#fbbf24'},{e:'😔',l:'Low',c:'#f97316'},{e:'😢',l:'Bad',c:'#f87171'}];
              return (
                <>
                  <div className="flex justify-between gap-2 mb-3" onClick={e => e.stopPropagation()}>
                    {moods.map((m, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5 p-2 rounded-xl border"
                        style={sel === i ? { background: `${m.c}22`, borderColor: `${m.c}55` } : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)' }}>
                        <span className="text-2xl">{m.e}</span>
                        <span className="text-xs" style={{ color: sel === i ? m.c : '#4b5563' }}>{m.l}</span>
                      </div>
                    ))}
                  </div>
                  {sel !== null && <p className="text-xs text-center" style={{ color: moods[sel].c }}>Feeling {moods[sel].l.toLowerCase()} today ✓</p>}
                  {sel === null && <p className="text-xs text-center text-gray-600">Tap to log today's mood</p>}
                </>
              );
            })()}
          </motion.div>
        </ClickBox>

        <ClickBox onClick={()=>open('bmi')}>
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.75}}
            className="rounded-2xl p-5 border border-white/8"
            style={{background:'linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))',backdropFilter:'blur(20px)'}}>
            <h3 className="text-white font-bold text-sm mb-4 flex items-center justify-between">
              <span>⚖️ BMI Calculator</span>
              <span className="text-xs text-gray-600">tap to open</span>
            </h3>
            {(() => {
              const last = bmiLast;
              const catColors: Record<string, string> = { Underweight: '#60a5fa', Normal: '#34d399', Overweight: '#fbbf24', Obese: '#f87171' };
              return last ? (
                <div className="rounded-xl p-4 text-center border" style={{ background: `${catColors[last.cat] || '#fff'}11`, borderColor: `${catColors[last.cat] || '#fff'}33` }}>
                  <p className="text-4xl font-black mb-1" style={{ color: catColors[last.cat] || '#fff' }}>{last.bmi}</p>
                  <p className="text-sm font-semibold" style={{ color: catColors[last.cat] || '#fff' }}>{last.cat}</p>
                  <p className="text-xs text-gray-500 mt-1">Last saved: {last.date}</p>
                </div>
              ) : (
                <div className="rounded-xl p-6 text-center bg-white/[0.02] border border-white/5">
                  <p className="text-4xl mb-2">⚖️</p>
                  <p className="text-gray-500 text-sm">Tap to calculate your BMI</p>
                </div>
              );
            })()}
          </motion.div>
        </ClickBox>

      </div>
    </Layout>
  );
}
