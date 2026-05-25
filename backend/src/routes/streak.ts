import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth';
import Streak from '../models/Streak';
import ActivityLog from '../models/ActivityLog';

const router = Router();
router.use(protect);

// ── Core helper: always compute live elapsed from startDate ───────────────────
function calcElapsed(startDate: Date, endDate?: Date) {
  const end  = endDate ? new Date(endDate).getTime() : Date.now();
  const diff = Math.max(0, Math.floor((end - new Date(startDate).getTime()) / 1000));
  return {
    days:         Math.floor(diff / 86400),
    hours:        Math.floor((diff % 86400) / 3600),
    minutes:      Math.floor((diff % 3600) / 60),
    seconds:      diff % 60,
    totalSeconds: diff,
  };
}

// ── Helper: how many full calendar days since startDate ───────────────────────
function daysSince(startDate: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((Date.now() - new Date(startDate).getTime()) / msPerDay);
}

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/v1/streak/current
//  Returns the active streak with LIVE elapsed time + last 30 broken streaks.
//  Also syncs currentStreak field in DB so Atlas always shows correct days.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/current', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;

    const current = await Streak.findOne({ userId, active: true }).sort({ createdAt: -1 });
    // Last 30 broken streaks only — user doesn't need older history in dashboard
    const history = await Streak.find({ userId, active: false })
      .sort({ createdAt: -1 })
      .limit(30);

    let elapsed = null;
    if (current?.startDate) {
      elapsed = calcElapsed(current.startDate);

      // ── KEY FIX: sync currentStreak + longestStreak into DB so Atlas shows real days
      const liveDays = elapsed.days;
      const newBest  = Math.max(current.longestStreak || 0, liveDays);
      await Streak.findByIdAndUpdate(current._id, {
        currentStreak: liveDays,
        longestStreak: newBest,
        bestDays:      newBest,
        days:          liveDays,   // also write days so old frontend fields still work
        hours:         elapsed.hours,
        minutes:       elapsed.minutes,
        seconds:       elapsed.seconds,
      });
    }

    // Attach live elapsed to the response object without re-querying
    const responseData = current ? current.toObject() : null;
    if (responseData && elapsed) {
      responseData.days    = elapsed.days;
      responseData.hours   = elapsed.hours;
      responseData.minutes = elapsed.minutes;
      responseData.seconds = elapsed.seconds;
      responseData.currentStreak = elapsed.days;
    }

    res.json({ success: true, data: { current: responseData, elapsed, history } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/v1/streak/start
// ─────────────────────────────────────────────────────────────────────────────
router.post('/start', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { title, type } = req.body;

    // Snapshot and deactivate any existing active streak first
    const existing = await Streak.findOne({ userId, active: true });
    if (existing && existing.startDate) {
      const snap = calcElapsed(existing.startDate);
      await Streak.findByIdAndUpdate(existing._id, {
        active:        false,
        broken:        true,
        isActive:      false,
        endDate:       new Date(),
        days:          snap.days,
        hours:         snap.hours,
        minutes:       snap.minutes,
        seconds:       snap.seconds,
        currentStreak: snap.days,
        bestDays:      Math.max(existing.bestDays || 0, snap.days),
        longestStreak: Math.max(existing.longestStreak || 0, snap.days),
      });
    }

    const streak = await Streak.create({
      userId,
      title:         title || 'Healthy Eating Streak',
      type:          type  || 'healthy-eating',
      active:        true,
      isActive:      true,
      broken:        false,
      startDate:     new Date(),
      currentStreak: 0,
      longestStreak: existing ? Math.max(existing.longestStreak || 0, existing.bestDays || 0) : 0,
      bestDays:      existing ? Math.max(existing.longestStreak || 0, existing.bestDays || 0) : 0,
      checkIns:      [new Date()],
      lastCheckedIn: new Date(),
      history:       [{ date: new Date(), note: 'Streak started' }],
    });

    ActivityLog.create({
      userId, action: 'STREAK_STARTED', category: 'streak',
      metadata: { streakId: streak._id, title: streak.title },
    }).catch(() => {});

    res.status(201).json({ success: true, data: streak });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/v1/streak/checkin  — daily check-in (keeps streak alive)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/checkin', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const current = await Streak.findOne({ userId, active: true });
    if (!current) return res.status(404).json({ success: false, message: 'No active streak. Start one first.' });

    const elapsed  = calcElapsed(current.startDate);
    const liveDays = elapsed.days;
    const newBest  = Math.max(current.longestStreak || 0, liveDays);
    const now      = new Date();

    current.checkIns.push(now);
    current.lastCheckedIn = now;
    current.currentStreak = liveDays;
    current.longestStreak = newBest;
    current.bestDays      = newBest;
    current.days          = liveDays;
    current.hours         = elapsed.hours;
    current.minutes       = elapsed.minutes;
    current.seconds       = elapsed.seconds;
    current.history.push({ date: now, note: req.body.note || 'Daily check-in' });
    await current.save();

    res.json({ success: true, data: { days: liveDays, elapsed, message: `Day ${liveDays} streak — keep going!` } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/v1/streak/break
// ─────────────────────────────────────────────────────────────────────────────
router.post('/break', async (req: Request, res: Response) => {
  try {
    const userId  = (req as any).user._id;
    const { reason } = req.body;

    const current = await Streak.findOne({ userId, active: true });
    if (!current) return res.status(404).json({ success: false, message: 'No active streak found.' });

    const elapsed = calcElapsed(current.startDate);

    current.active        = false;
    current.isActive      = false;
    current.broken        = true;
    current.endDate       = new Date();
    current.days          = elapsed.days;
    current.hours         = elapsed.hours;
    current.minutes       = elapsed.minutes;
    current.seconds       = elapsed.seconds;
    current.currentStreak = elapsed.days;
    current.bestDays      = Math.max(current.bestDays || 0, elapsed.days);
    current.longestStreak = Math.max(current.longestStreak || 0, elapsed.days);
    current.breakReason   = reason || 'No reason given';
    current.history.push({ date: new Date(), note: `Streak broken after ${elapsed.days} days` });
    await current.save();

    ActivityLog.create({
      userId, action: 'STREAK_BROKEN', category: 'streak',
      metadata: { days: elapsed.days, reason },
    }).catch(() => {});

    res.json({ success: true, data: current });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/v1/streak/history  — last 30 completed streaks
// ─────────────────────────────────────────────────────────────────────────────
router.get('/history', async (req: Request, res: Response) => {
  try {
    const userId  = (req as any).user._id;
    const history = await Streak.find({ userId }).sort({ createdAt: -1 }).limit(30);
    const best    = history.reduce((b, s) => Math.max(b, s.bestDays || s.days || 0), 0);
    res.json({ success: true, data: { history, best, total: history.length } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  PATCH /api/v1/streak/:id/reason
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/reason', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const streak = await Streak.findOneAndUpdate(
      { _id: req.params.id, userId },
      { breakReason: req.body.reason },
      { new: true }
    );
    if (!streak) return res.status(404).json({ success: false, message: 'Streak not found.' });
    res.json({ success: true, data: streak });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  DELETE /api/v1/streak/:id
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    await Streak.findOneAndDelete({ _id: req.params.id, userId });
    res.json({ success: true, message: 'Streak deleted.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
