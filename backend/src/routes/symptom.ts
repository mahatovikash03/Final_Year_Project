import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth';
import SymptomLog from '../models/SymptomLog';
import ActivityLog from '../models/ActivityLog';

const router = Router();
router.use(protect);

const suggestions: Record<string, string[]> = {
  sleep: [
    'Maintain a consistent sleep and wake schedule every day, even on weekends.',
    'Avoid screens (phone, TV, laptop) at least 1 hour before bedtime — blue light disrupts melatonin.',
    'Limit caffeine intake after 2 PM, as it can stay active in your system for 6–8 hours.',
    'Keep your bedroom cool (18–20°C), dark and quiet for optimal sleep quality.',
    'Try 4-7-8 breathing: inhale 4s, hold 7s, exhale 8s — activates the parasympathetic nervous system.',
    'Avoid large meals and alcohol within 2–3 hours of bedtime.',
    'Consider a 10-minute evening wind-down routine: light stretching, reading, or journaling.',
  ],
  gut: [
    'Increase dietary fibre through fruits, vegetables, legumes and whole grains.',
    'Drink at least 2.5 litres of water daily to support healthy bowel movements.',
    'Add probiotic-rich foods like curd, yoghurt, kefir or fermented vegetables to your diet.',
    'Eat slowly, chew thoroughly and avoid rushing meals — digestion begins in the mouth.',
    'Reduce intake of processed foods, fried items and refined sugar which disrupt gut flora.',
    'Avoid lying down immediately after eating — wait at least 30 minutes.',
    'Consider tracking trigger foods that worsen your symptoms.',
  ],
  stress: [
    'Practice box breathing: inhale 4s → hold 4s → exhale 4s → hold 4s. Repeat 4–5 times.',
    'Take short 5-minute breaks every hour during work or study sessions.',
    'Write a daily gratitude journal — list 3 things you are grateful for each morning.',
    'Engage in at least 20–30 minutes of light physical activity such as walking.',
    'Limit news and social media consumption, especially in the morning and before bed.',
    'Try progressive muscle relaxation — tense and release each muscle group from toes to head.',
    'Reach out to a trusted friend, family member or mental health professional if needed.',
  ],
  skin: [
    'Cleanse your face gently with a mild cleanser twice daily — morning and night.',
    'Apply SPF 30+ broad-spectrum sunscreen every morning, even on cloudy or indoor days.',
    'Avoid touching your face with unwashed hands — this transfers bacteria and oils.',
    'Change your pillowcase at least twice a week to reduce bacterial buildup.',
    'Stay well hydrated — drink 2.5L of water daily, as dehydration directly affects skin health.',
    'Eat antioxidant-rich foods: berries, leafy greens, nuts and seeds for skin repair.',
    'If you experience persistent acne, rashes or unusual changes, consult a dermatologist.',
  ],
};

// POST /api/v1/symptoms/check  — log a symptom (saved to MongoDB)
router.post('/check', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { category, severity, duration, notes } = req.body;

    if (!category)
      return res.status(400).json({ success: false, message: 'Category is required.' });

    const tips = suggestions[category.toLowerCase()] || [
      'Maintain a balanced diet, regular exercise and adequate sleep.',
      'Monitor your symptoms — if they worsen or persist beyond 2 weeks, see a healthcare professional.',
      'Stay hydrated and manage stress through relaxation techniques.',
    ];

    const entry = await SymptomLog.create({
      userId,
      category:    category.toLowerCase(),
      severity:    severity || 3,
      duration:    duration || 'not specified',
      notes:       notes   || '',
      suggestions: tips,
    });

    ActivityLog.create({
      userId, action: 'SYMPTOM_LOGGED', category: 'health',
      metadata: { category: entry.category, severity: entry.severity },
    }).catch(() => {});

    res.json({
      success: true,
      data: {
        ...entry.toObject(),
        disclaimer: 'These are general wellness suggestions only and do not constitute medical advice. Please consult a healthcare professional if symptoms persist or worsen.',
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/symptoms/history  — last 30 days only (user's own data)
router.get('/history', async (req: Request, res: Response) => {
  try {
    const userId      = (req as any).user._id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const history = await SymptomLog.find({
      userId,
      createdAt: { $gte: thirtyDaysAgo },
    }).sort({ createdAt: -1 }).limit(50);

    res.json({ success: true, count: history.length, data: history });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/v1/symptoms/history  — clear user's own history
router.delete('/history', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    await SymptomLog.deleteMany({ userId });
    res.json({ success: true, message: 'Symptom history cleared.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
