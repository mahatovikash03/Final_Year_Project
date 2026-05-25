// AllModals.tsx — all modal components re-exported from ExtraModals (which has the real, fixed versions)
// Dashboard.tsx imports from AllModals.ts (the .ts barrel), which points here via ExtraModals.tsx.
// This file is kept for any component that directly imports from AllModals.tsx.
export {
  WaterModal,
  MoodLoggerModal,
  BMIModal,
  AITipsModal,
  WeeklySummaryModal,
  LogStreakModal,
} from './ExtraModals';
