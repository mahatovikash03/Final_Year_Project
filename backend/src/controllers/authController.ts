import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';
import Notification from '../models/Notification';
import ActivityLog from '../models/ActivityLog';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../utils/email';

const signToken = (id: string): string => {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'],
  };
  return jwt.sign({ id }, process.env.JWT_SECRET as string, options);
};

const getIp = (req: Request): string =>
  (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
  req.socket?.remoteAddress || 'unknown';

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/v1/auth/register
// ─────────────────────────────────────────────────────────────────────────────
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, gender, age, city, state, country } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    if (password.length < 8)
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ success: false, message: 'This email is already registered.' });

    const user = await User.create({
      name, email, password, gender, age, city, state, country,
      lastLoginAt: new Date(), lastSeenAt: new Date(), loginCount: 1,
    });

    const token = signToken(String(user._id));

    // Seed welcome notifications
    await Notification.insertMany([
      { userId: user._id, title: '👋 Welcome to HealthTrack360!',  message: 'Start by logging your first health entry today.',             type: 'tip'         },
      { userId: user._id, title: '🤖 AI Assistant Activated',       message: 'Your personal AI health assistant is ready to help anytime.', type: 'achievement' },
      { userId: user._id, title: '💡 Daily Wellness Tip',           message: 'Drink 2 glasses of water first thing every morning.',         type: 'tip'         },
      { userId: user._id, title: '🎯 Set Your First Habit',         message: 'Go to Habits and add a healthy daily habit to track.',        type: 'reminder'    },
    ]);

    // Activity log
    ActivityLog.create({ userId: user._id, action: 'REGISTER', category: 'auth', ip: getIp(req), metadata: { name: user.name, email: user.email } }).catch(() => {});

    // Welcome email (fire-and-forget)
    if (process.env.RESEND_API_KEY) {
      sendWelcomeEmail(user.email, user.name)
        .then(() => console.log(`✅ Welcome email sent to ${user.email}`))
        .catch(err => console.error(`❌ Welcome email FAILED for ${user.email}:`, err.message));
    } else {
      console.warn('⚠️  RESEND_API_KEY not set — skipping welcome email');
    }

    res.status(201).json({
      success: true, token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, gender: user.gender, age: user.age, city: user.city, state: user.state, country: user.country },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/v1/auth/login
// ─────────────────────────────────────────────────────────────────────────────
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required.' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    if (!user.isActive)
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact admin.' });

    user.lastLoginAt = new Date();
    user.lastSeenAt  = new Date();
    user.loginCount  = (user.loginCount || 0) + 1;
    await user.save({ validateModifiedOnly: true });

    const token = signToken(String(user._id));
    ActivityLog.create({ userId: user._id, action: 'LOGIN', category: 'auth', ip: getIp(req), metadata: { loginCount: user.loginCount } }).catch(() => {});

    res.json({
      success: true, token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, gender: user.gender, age: user.age, city: user.city, state: user.state, country: user.country },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/v1/auth/me
// ─────────────────────────────────────────────────────────────────────────────
export const getMe = async (req: Request, res: Response) => {
  const user = (req as any).user;
  res.json({
    success: true,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, gender: user.gender, age: user.age, city: user.city, state: user.state, country: user.country, createdAt: user.createdAt },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/v1/auth/forgot-password
// ─────────────────────────────────────────────────────────────────────────────
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ success: false, message: 'Email is required.' });

    const user = await User.findOne({ email });
    // Always return success even if user not found — prevents email enumeration attacks
    if (!user)
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });

    // Generate secure random token
    const rawToken  = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.passwordResetToken   = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save({ validateModifiedOnly: true });

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

    if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
      await sendPasswordResetEmail(user.email, user.name, resetUrl);
    } else {
      // Dev mode — log to console if email not configured
      console.log('\n🔐 DEV MODE — Password Reset URL:\n', resetUrl, '\n');
    }

    ActivityLog.create({ userId: user._id, action: 'PASSWORD_RESET_REQUESTED', category: 'auth', ip: getIp(req) }).catch(() => {});

    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to send reset email. Try again later.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/v1/auth/reset-password
// ─────────────────────────────────────────────────────────────────────────────
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, email, password } = req.body;

    if (!token || !email || !password)
      return res.status(400).json({ success: false, message: 'Token, email and new password are required.' });
    if (password.length < 8)
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      email,
      passwordResetToken:   hashedToken,
      passwordResetExpires: { $gt: new Date() }, // not expired
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user)
      return res.status(400).json({ success: false, message: 'Reset link is invalid or has expired. Please request a new one.' });

    // Update password and clear reset fields
    user.password             = password;
    user.passwordResetToken   = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    ActivityLog.create({ userId: user._id, action: 'PASSWORD_RESET_SUCCESS', category: 'auth', ip: getIp(req) }).catch(() => {});

    // Auto-login after reset
    const newToken = signToken(String(user._id));
    res.json({ success: true, message: 'Password reset successful!', token: newToken });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
};
