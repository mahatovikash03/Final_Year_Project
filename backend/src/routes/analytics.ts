import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth';
import HealthLog from '../models/HealthLog';
import Streak from '../models/Streak';
import SymptomLog from '../models/SymptomLog';

const router = Router();
router.use(protect);

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/v1/analytics/monthly
//  User dashboard — ALWAYS last 30 days only, always scoped to req.user._id.
//  Users can NEVER see another user's data.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/monthly', async (req: Request, res: Response) => {
  try {
    const userId        = (req as any).user._id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Scope: userId + last 30 days. Period.
    const logs = await HealthLog.find({
      userId,
      date: { $gte: thirtyDaysAgo },
    }).sort({ date: 1 }).limit(90); // cap at 90 documents max for performance

    const count = logs.length || 1;

    res.json({
      success: true,
      data: {
        avgWellnessScore: Math.round(logs.reduce((s, l) => s + (l.wellnessScore || 0), 0) / count),
        avgSleepDuration: +(logs.reduce((s, l) => s + (l.sleep?.duration || 0), 0) / count).toFixed(1),
        avgMoodRating:    +(logs.reduce((s, l) => s + (l.mentalWellness?.moodRating || 0), 0) / count).toFixed(1),
        avgHydration:     +(logs.reduce((s, l) => s + (l.diet?.hydration || 0), 0) / count).toFixed(1),
        totalWorkouts:    logs.reduce((s, l) => s + (l.fitness?.length || 0), 0),
        totalLogs:        logs.length,
        monthlyTrend:     logs.map(l => ({ date: l.date, score: l.wellnessScore || 0 })),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/v1/analytics/summary
//  Quick summary card for user dashboard home screen.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const userId        = (req as any).user._id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const today         = new Date(); today.setHours(0, 0, 0, 0);

    const [recentLogs, todayLog, activeStreak, symptomCount] = await Promise.all([
      HealthLog.find({ userId, date: { $gte: thirtyDaysAgo } }).sort({ date: -1 }).limit(30),
      HealthLog.findOne({ userId, date: { $gte: today } }),
      Streak.findOne({ userId, active: true }),
      SymptomLog.countDocuments({ userId, createdAt: { $gte: thirtyDaysAgo } }),
    ]);

    const count = recentLogs.length || 1;
    let streakDays = 0;
    if (activeStreak?.startDate) {
      streakDays = Math.floor((Date.now() - new Date(activeStreak.startDate).getTime()) / 86400000);
    }

    res.json({
      success: true,
      data: {
        loggedToday:      !!todayLog,
        logsThisMonth:    recentLogs.length,
        streakDays,
        symptomCount,
        avgWellnessScore: Math.round(recentLogs.reduce((s, l) => s + (l.wellnessScore || 0), 0) / count),
        lastLogDate:      recentLogs[0]?.date || null,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
