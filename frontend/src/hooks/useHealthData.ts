import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

// ── Health Logs (last 30, scoped to logged-in user via JWT) ──────────────────
export function useHealthLogs(limit = 30) {
  const [logs, setLogs]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const loadLogs = useCallback(() => {
    setLoading(true);
    api.get(`/health-log?limit=${limit}`)
      .then(r => { setLogs(r.data.data); setError(''); })
      .catch(() => setError('Failed to load logs.'))
      .finally(() => setLoading(false));
  }, [limit]);

  useEffect(() => { loadLogs(); }, [loadLogs]);
  return { logs, loading, error, refetch: loadLogs };
}

// ── Weekly analytics (scoped to logged-in user via JWT) ───────────────────────
export function useWeeklyAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading]     = useState(true);

  const loadAnalytics = useCallback(() => {
    setLoading(true);
    api.get('/health-log/analytics/weekly')
      .then(r => setAnalytics(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);
  return { analytics, loading, refetch: loadAnalytics };
}

// ── Monthly analytics (scoped to logged-in user via JWT) ──────────────────────
export function useMonthlyAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading]     = useState(true);

  const loadAnalytics = useCallback(() => {
    setLoading(true);
    api.get('/analytics/monthly')
      .then(r => setAnalytics(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);
  return { analytics, loading, refetch: loadAnalytics };
}

// ── Streak (scoped to logged-in user via JWT) ─────────────────────────────────
// Returns live streak days, log-streak data (which days this week were logged),
// best streak, and total logs count — all from the real backend, no hardcoding.
export function useStreakData() {
  const [streakDays, setStreakDays]     = useState(0);   // live days of active streak
  const [bestStreak, setBestStreak]     = useState(0);
  const [loggedDays, setLoggedDays]     = useState<boolean[]>([false,false,false,false,false,false,false]);
  const [totalLogged, setTotalLogged]   = useState(0);
  const [loading, setLoading]           = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch active streak from backend
      const streakRes = await api.get('/streak/current');
      const current   = streakRes.data.data.current;
      const history   = streakRes.data.data.history || [];

      // Live days calculation (same formula as backend)
      let liveDays = 0;
      if (current?.active && current?.startDate) {
        liveDays = Math.floor((Date.now() - new Date(current.startDate).getTime()) / 86400000);
      }
      setStreakDays(liveDays);

      // Best streak across all attempts
      const allBest = [...history, current].reduce(
        (b: number, s: any) => s ? Math.max(b, s.bestDays || s.days || 0) : b, 0
      );
      setBestStreak(allBest);

      // Which days this week did the user log a health entry?
      const logsRes = await api.get('/health-log?limit=30');
      const logs: any[] = logsRes.data.data || [];
      setTotalLogged(logsRes.data.total || logs.length);

      // Build a Set of logged date strings for this week (Mon–Sun)
      const loggedDates = new Set(logs.map((l: any) => new Date(l.date).toDateString()));
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
      const monday = new Date(today);
      monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7)); // go back to Monday

      const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return loggedDates.has(d.toDateString());
      });
      setLoggedDays(weekDays);
    } catch (e) {
      console.error('useStreakData error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  return { streakDays, bestStreak, loggedDays, totalLogged, loading, refetch: load };
}
