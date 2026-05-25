import mongoose, { Document, Schema } from 'mongoose';

/**
 * Streak model — completely rebuilt.
 *
 * KEY FIX: days are now always calculated live from startDate → now (or endDate).
 * The old model stored days/hours/minutes/seconds as static numbers which never
 * updated unless the user explicitly broke the streak. Now:
 *   - active streak  → compute elapsed on every GET (no stale days in DB)
 *   - broken streak  → snapshot saved at break time (so history is accurate)
 *
 * Every streak is scoped to one user via userId (FK → User._id).
 */
export interface IStreak extends Document {
  userId:      mongoose.Types.ObjectId;
  title:       string;
  type:        string;
  active:      boolean;
  broken:      boolean;
  startDate:   Date;
  endDate?:    Date;
  // Snapshot fields (only written when streak is broken — never for active)
  days:        number;
  hours:       number;
  minutes:     number;
  seconds:     number;
  bestDays:    number;
  currentStreak: number;   // running day count (updated on check-in)
  longestStreak: number;   // personal best across all streaks
  breakReason?: string;
  lastCheckedIn?: Date;
  checkIns:    Date[];
  isActive:    boolean;    // alias kept for backward compat with Atlas documents
  history:     { date: Date; note?: string }[];
  createdAt:   Date;
  updatedAt:   Date;
}

const StreakSchema = new Schema<IStreak>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required — every streak belongs to a user'],
      index: true,
    },

    title:  { type: String, default: 'Healthy Eating Streak' },
    type:   { type: String, default: 'healthy-eating' },
    active: { type: Boolean, default: true },
    broken: { type: Boolean, default: false },

    startDate: { type: Date, required: true, default: Date.now },
    endDate:   { type: Date },

    // Snapshot — only meaningful after streak is broken
    days:    { type: Number, default: 0 },
    hours:   { type: Number, default: 0 },
    minutes: { type: Number, default: 0 },
    seconds: { type: Number, default: 0 },

    // Running counters — updated on each check-in / sync
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    bestDays:      { type: Number, default: 0 },

    breakReason:   { type: String, maxlength: 500 },
    lastCheckedIn: { type: Date },

    checkIns: [{ type: Date }],
    isActive: { type: Boolean, default: true }, // backward compat

    history: [{
      date: { type: Date },
      note: { type: String, maxlength: 200 },
    }],
  },
  { timestamps: true }
);

// ── Compound indexes ───────────────────────────────────────────────────────────
StreakSchema.index({ userId: 1, active: 1 });
StreakSchema.index({ userId: 1, createdAt: -1 });
StreakSchema.index({ userId: 1, bestDays: -1 });

export default mongoose.model<IStreak>('Streak', StreakSchema);
