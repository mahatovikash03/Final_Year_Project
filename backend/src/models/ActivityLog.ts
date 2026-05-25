import mongoose, { Document, Schema } from 'mongoose';

/**
 * ActivityLog — Admin audit trail
 * Every time a user does something important (login, create log, break streak, etc.)
 * a record is written here. The admin can view all user activity from one place.
 */
export interface IActivityLog extends Document {
  userId:    mongoose.Types.ObjectId;  // FK → User._id
  action:    string;                   // e.g. 'LOGIN', 'HEALTH_LOG_CREATED', 'STREAK_BROKEN'
  category:  'auth' | 'health' | 'streak' | 'community' | 'profile' | 'admin';
  metadata?: Record<string, any>;      // Extra context (IP, device, score, etc.)
  ip?:       string;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    // ── Foreign Key ────────────────────────────────────────────
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    action:   { type: String, required: true, maxlength: 100 },
    category: {
      type: String,
      enum: ['auth', 'health', 'streak', 'community', 'profile', 'admin'],
      required: true,
    },
    metadata: { type: Schema.Types.Mixed },
    ip:       { type: String, maxlength: 45 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // logs are immutable
  }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
ActivityLogSchema.index({ userId: 1, createdAt: -1 });      // per-user log history
ActivityLogSchema.index({ category: 1, createdAt: -1 });    // filter by category
ActivityLogSchema.index({ action: 1, createdAt: -1 });      // filter by action type
ActivityLogSchema.index({ createdAt: -1 });                 // global admin feed
// Auto-delete activity logs after 1 year (optional, remove if you want forever)
ActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 3600 });

export default mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
