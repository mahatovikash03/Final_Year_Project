import { useState, useEffect } from 'react';
import SleepModal     from './SleepModal';
import MoodModal      from './MoodModal';
import WorkoutModal   from './WorkoutModal';
import HydrationModal from './HydrationModal';
import LogsModal      from './LogsModal';
import StreakModal     from './StreakModal';
import api from '../../services/api';

export type ModalType = 'sleep'|'mood'|'workout'|'hydration'|'logs'|'streak'|null;

interface Props {
  type: ModalType;
  onClose: () => void;
  onRefresh?: () => void;
}

export default function StatModal({ type, onClose, onRefresh }: Props) {
  const [streakData, setStreakData] = useState<any>(null);

  // Load real streak data from API (scoped to logged-in user via JWT)
  useEffect(() => {
    if (type !== 'streak') return;
    api.get('/streak/current').then(r => {
      const current = r.data.data.current;
      const history = r.data.data.history || [];
      if (current) {
        // Compute live days
        const liveDays = current.active && current.startDate
          ? Math.floor((Date.now() - new Date(current.startDate).getTime()) / 86400000)
          : current.days || 0;
        const bestStreak = [...history, current].reduce(
          (b: number, s: any) => s ? Math.max(b, s.bestDays || s.days || 0) : b, 0
        );
        setStreakData({
          ...current,
          days:      liveDays,
          bestStreak,
          startDate: current.startDate,
          active:    current.active,
          broken:    current.broken,
          lastCheckin: current.lastCheckedIn,
        });
      }
    }).catch(() => {});
  }, [type]);

  const handleStreakReset = async () => {
    try {
      await api.post('/streak/break', { reason: 'Manual reset from dashboard' });
      setStreakData((prev: any) => prev ? { ...prev, active: false, broken: true, days: 0 } : prev);
    } catch {}
  };

  return (
    <>
      <SleepModal     open={type === 'sleep'}     onClose={onClose} />
      <MoodModal      open={type === 'mood'}      onClose={onClose} />
      <WorkoutModal   open={type === 'workout'}   onClose={onClose} />
      <HydrationModal open={type === 'hydration'} onClose={onClose} />
      <LogsModal      open={type === 'logs'}      onClose={onClose} />
      <StreakModal
        open={type === 'streak'}
        onClose={onClose}
        streak={streakData}
        onReset={handleStreakReset}
      />
    </>
  );
}
