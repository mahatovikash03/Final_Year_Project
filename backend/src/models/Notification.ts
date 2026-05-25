import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;   // FK → User._id
  title: string;
  message: string;
  type: 'reminder' | 'achievement' | 'tip' | 'alert';
  read: boolean;
  expiresAt?: Date;                  // Optional: auto-delete old notifications
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    // ── Foreign Key: each notification belongs to one user ────
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
      index: true,
    },

    title:   { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 1000 },
    type:    { type: String, enum: ['reminder', 'achievement', 'tip', 'alert'], default: 'tip' },
    read:    { type: Boolean, default: false },

    // Optional TTL: notifications auto-delete after 90 days if set
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
NotificationSchema.index({ userId: 1, createdAt: -1 });    // user's inbox, newest first
NotificationSchema.index({ userId: 1, read: 1 });          // fast unread count
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL auto-delete

export default mongoose.model<INotification>('Notification', NotificationSchema);
