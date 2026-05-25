import { Router, Request, Response } from 'express';
import { protect, restrictTo } from '../middleware/auth';
import User from '../models/User';
import HealthLog from '../models/HealthLog';
import Notification from '../models/Notification';
import Streak from '../models/Streak';
import CommunityPost from '../models/CommunityPost';
import ActivityLog from '../models/ActivityLog';
import SymptomLog from '../models/SymptomLog';

const router = Router();
router.use(protect, restrictTo('admin'));

// ════════════════════════════════════════════════════════════════════════════════
//  DASHBOARD STATS
// ════════════════════════════════════════════════════════════════════════════════
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const today   = new Date(); today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalUsers, activeUsers, totalLogs, totalPosts, totalStreaks,
           activeToday, loginsToday, newUsersThisWeek, scoreAgg] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      HealthLog.countDocuments(),
      CommunityPost.countDocuments(),
      Streak.countDocuments(),
      HealthLog.distinct('userId', { createdAt: { $gte: today } }),
      ActivityLog.countDocuments({ action: 'LOGIN', createdAt: { $gte: today } }),
      User.countDocuments({ createdAt: { $gte: weekAgo } }),
      HealthLog.aggregate([{ $group: { _id: null, avg: { $avg: '$wellnessScore' } } }]),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers, activeUsers, totalLogs, totalPosts, totalStreaks,
        activeToday: activeToday.length, loginsToday, newUsersThisWeek,
        avgScore: Math.round(scoreAgg[0]?.avg || 0),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
//  USER MANAGEMENT  — search, filter, paginate
// ════════════════════════════════════════════════════════════════════════════════
router.get('/users', async (req: Request, res: Response) => {
  try {
    const page     = Number(req.query.page)  || 1;
    const limit    = Number(req.query.limit) || 50;
    const search   = req.query.search   as string | undefined;
    const role     = req.query.role     as string | undefined;
    const isActive = req.query.isActive as string | undefined;
    const sortBy   = (req.query.sortBy  as string) || 'createdAt';
    const order    = req.query.order === 'asc' ? 1 : -1;

    const filter: any = {};
    if (search) filter.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
    if (role)              filter.role     = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ [sortBy]: order }).limit(limit).skip((page - 1) * limit),
      User.countDocuments(filter),
    ]);
    res.json({ success: true, total, page, pages: Math.ceil(total / limit), data: users });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/admin/users/:id  — full profile + ALL data summary
router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const [logCount, streakCount, postCount, notifCount, symptomCount, lastLog, activeStreak, avgScoreAgg] = await Promise.all([
      HealthLog.countDocuments({ userId: user._id }),
      Streak.countDocuments({ userId: user._id }),
      CommunityPost.countDocuments({ author: user._id }),
      Notification.countDocuments({ userId: user._id }),
      SymptomLog.countDocuments({ userId: user._id }),
      HealthLog.findOne({ userId: user._id }).sort({ date: -1 }).select('date wellnessScore'),
      Streak.findOne({ userId: user._id, active: true }),
      HealthLog.aggregate([{ $match: { userId: user._id } }, { $group: { _id: null, avg: { $avg: '$wellnessScore' } } }]),
    ]);

    let currentStreakDays = 0;
    if (activeStreak?.startDate) {
      currentStreakDays = Math.floor((Date.now() - new Date(activeStreak.startDate).getTime()) / 86400000);
    }

    res.json({
      success: true,
      data: {
        user,
        summary: {
          logCount, streakCount, postCount, notifCount, symptomCount,
          avgWellnessScore: Math.round(avgScoreAgg[0]?.avg || 0),
          currentStreakDays, lastLog,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/v1/admin/users/:id  — edit any user field
router.patch('/users/:id', async (req: Request, res: Response) => {
  try {
    const ALLOWED = ['name', 'role', 'isActive', 'gender', 'age', 'city', 'state', 'country', 'avatarUrl'];
    const updates: any = {};
    for (const key of ALLOWED) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (updates.role && !['user', 'admin'].includes(updates.role))
      return res.status(400).json({ success: false, message: 'Invalid role.' });

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    ActivityLog.create({
      userId: req.params.id, action: 'ADMIN_USER_UPDATED', category: 'admin',
      metadata: { updatedBy: (req as any).user._id, fields: Object.keys(updates) },
    }).catch(() => {});

    res.json({ success: true, data: user });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/v1/admin/users/:id/role
router.patch('/users/:id/role', async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role))
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/v1/admin/users/:id/toggle-active
router.patch('/users/:id/toggle-active', async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    user.isActive = !user.isActive;
    await user.save({ validateModifiedOnly: true });
    ActivityLog.create({
      userId: user._id, action: user.isActive ? 'ADMIN_USER_ACTIVATED' : 'ADMIN_USER_DEACTIVATED',
      category: 'admin', metadata: { by: (req as any).user._id },
    }).catch(() => {});
    res.json({ success: true, isActive: user.isActive, message: `User ${user.isActive ? 'activated' : 'deactivated'}.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/v1/admin/users/:id  — delete user + ALL collections linked by userId
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'User not found.' });

    await Promise.all([
      User.findByIdAndDelete(req.params.id),
      HealthLog.deleteMany({ userId: req.params.id }),
      Notification.deleteMany({ userId: req.params.id }),
      Streak.deleteMany({ userId: req.params.id }),
      CommunityPost.deleteMany({ author: req.params.id }),
      ActivityLog.deleteMany({ userId: req.params.id }),
      SymptomLog.deleteMany({ userId: req.params.id }),
    ]);

    res.json({ success: true, message: `User "${target.name}" and all their data deleted.` });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
//  PER-USER DATA — admin reads any user's full data (no 30-day limit here)
// ════════════════════════════════════════════════════════════════════════════════

// GET /api/v1/admin/users/:id/health-logs  (all time, paginated)
router.get('/users/:id/health-logs', async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 30;
    const [logs, total] = await Promise.all([
      HealthLog.find({ userId: req.params.id }).sort({ date: -1 }).limit(limit).skip((page - 1) * limit),
      HealthLog.countDocuments({ userId: req.params.id }),
    ]);
    res.json({ success: true, total, page, data: logs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/admin/users/:id/streaks  (all time)
router.get('/users/:id/streaks', async (req: Request, res: Response) => {
  try {
    const streaks = await Streak.find({ userId: req.params.id }).sort({ createdAt: -1 });
    // Attach live elapsed to any active streak
    const result = streaks.map(s => {
      const obj: any = s.toObject();
      if (s.active && s.startDate) {
        const diff = Math.max(0, Math.floor((Date.now() - new Date(s.startDate).getTime()) / 1000));
        obj.days    = Math.floor(diff / 86400);
        obj.hours   = Math.floor((diff % 86400) / 3600);
        obj.minutes = Math.floor((diff % 3600) / 60);
        obj.seconds = diff % 60;
        obj.currentStreak = obj.days;
      }
      return obj;
    });
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/admin/users/:id/posts
router.get('/users/:id/posts', async (req: Request, res: Response) => {
  try {
    const posts = await CommunityPost.find({ author: req.params.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: posts });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/admin/users/:id/symptoms
router.get('/users/:id/symptoms', async (req: Request, res: Response) => {
  try {
    const page  = Number(req.query.page)  || 1;
    const limit = Number(req.query.limit) || 30;
    const [logs, total] = await Promise.all([
      SymptomLog.find({ userId: req.params.id }).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit),
      SymptomLog.countDocuments({ userId: req.params.id }),
    ]);
    res.json({ success: true, total, page, data: logs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/admin/users/:id/notifications
router.get('/users/:id/notifications', async (req: Request, res: Response) => {
  try {
    const notifs = await Notification.find({ userId: req.params.id }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: notifs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/admin/users/:id/activity
router.get('/users/:id/activity', async (req: Request, res: Response) => {
  try {
    const page     = Number(req.query.page)  || 1;
    const limit    = Number(req.query.limit) || 50;
    const category = req.query.category as string | undefined;
    const filter: any = { userId: req.params.id };
    if (category) filter.category = category;
    const [logs, total] = await Promise.all([
      ActivityLog.find(filter).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit),
      ActivityLog.countDocuments(filter),
    ]);
    res.json({ success: true, total, page, data: logs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════════
//  GLOBAL ACTIVITY LOG  — ALL users combined, newest first
// ════════════════════════════════════════════════════════════════════════════════
router.get('/activity', async (req: Request, res: Response) => {
  try {
    const page     = Number(req.query.page)  || 1;
    const limit    = Number(req.query.limit) || 100;
    const action   = req.query.action   as string | undefined;
    const category = req.query.category as string | undefined;
    const filter: any = {};
    if (action)   filter.action   = action;
    if (category) filter.category = category;

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .populate('userId', 'name email role avatarUrl')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit),
      ActivityLog.countDocuments(filter),
    ]);
    res.json({ success: true, total, page, data: logs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
