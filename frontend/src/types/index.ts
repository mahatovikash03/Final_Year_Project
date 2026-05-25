export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatarUrl?: string;
}

export interface SleepData {
  duration: number;
  quality: 1 | 2 | 3 | 4 | 5;
  bedtime: string;
  wakeTime: string;
}

export interface MealEntry {
  type: string;
  nutritionRating: number;
  calories: number;
}

export interface FitnessEntry {
  type: string;
  duration: number;
  intensity: 'low' | 'moderate' | 'high';
}

export interface HealthLog {
  _id: string;
  userId: string;
  date: string;
  sleep: SleepData;
  diet: { meals: MealEntry[]; hydration: number };
  fitness: FitnessEntry[];
  skincare: { productsUsed: string[]; skinIssues: string[] };
  mentalWellness: { moodRating: number; stressLevel: string; notes?: string };
  wellnessScore: number;
}

export interface WeeklyAnalytics {
  avgWellnessScore: number;
  avgSleepDuration: number;
  avgMoodRating: number;
  avgHydration: number;
  totalWorkouts: number;
  logsThisWeek: number;
  weeklyTrend: { date: string; score: number }[];
}
