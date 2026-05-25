import mongoose, { Document, Schema } from 'mongoose';

// ── Comment sub-document ──────────────────────────────────────────────────────
export interface IComment {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;     // FK → User._id
  authorName: string;                // Denormalised for display speed
  text: string;
  createdAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    user:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true, maxlength: 50 },
    text:       { type: String, required: true, maxlength: 500 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// ── Community post ────────────────────────────────────────────────────────────
export interface ICommunityPost extends Document {
  author:     mongoose.Types.ObjectId;  // FK → User._id
  authorName: string;                   // Denormalised for display speed
  title:      string;
  content:    string;
  tag:        string;
  likes:      mongoose.Types.ObjectId[];
  comments:   IComment[];
  createdAt:  Date;
  updatedAt:  Date;
}

const CommunityPostSchema = new Schema<ICommunityPost>(
  {
    // ── Foreign Key: post is owned by one user ────────────────
    author:     { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    authorName: { type: String, required: true, maxlength: 50 },

    title:   { type: String, required: true, maxlength: 150 },
    content: { type: String, required: true, maxlength: 2000 },
    tag:     { type: String, default: 'General', maxlength: 50 },

    // Users who liked this post
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],

    comments: [CommentSchema],
  },
  { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
CommunityPostSchema.index({ createdAt: -1 });             // global feed, newest first
CommunityPostSchema.index({ tag: 1, createdAt: -1 });     // tag-filtered feed
CommunityPostSchema.index({ author: 1, createdAt: -1 });  // user's own posts (admin view)

export default mongoose.model<ICommunityPost>('CommunityPost', CommunityPostSchema);
