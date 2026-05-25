import mongoose, { Document, Schema } from 'mongoose';

/**
 * SymptomLog — persisted to MongoDB (replaces in-memory Map).
 * Every entry is scoped to one user via userId (FK → User._id).
 * Admin can query all; user can only see their own.
 */
export interface ISymptomLog extends Document {
  userId:      mongoose.Types.ObjectId;
  category:    string;
  severity:    number;
  duration:    string;
  notes:       string;
  suggestions: string[];
  createdAt:   Date;
}

const SymptomLogSchema = new Schema<ISymptomLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category:    { type: String, required: true, maxlength: 100 },
    severity:    { type: Number, min: 1, max: 5, default: 3 },
    duration:    { type: String, default: 'not specified', maxlength: 100 },
    notes:       { type: String, default: '', maxlength: 1000 },
    suggestions: [{ type: String }],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

SymptomLogSchema.index({ userId: 1, createdAt: -1 });
SymptomLogSchema.index({ category: 1, createdAt: -1 });

export default mongoose.model<ISymptomLog>('SymptomLog', SymptomLogSchema);
