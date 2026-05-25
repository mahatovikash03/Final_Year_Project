import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import authRoutes         from './routes/auth';
import healthLogRoutes    from './routes/healthLog';
import symptomRoutes      from './routes/symptom';
import userRoutes         from './routes/user';
import analyticsRoutes    from './routes/analytics';
import aiRoutes           from './routes/ai';
import adminRoutes        from './routes/admin';
import communityRoutes    from './routes/community';
import notificationRoutes from './routes/notifications';
import streakRoutes       from './routes/streak';

// Register all models so their indexes are created in MongoDB on startup
import './models/User';
import './models/HealthLog';
import './models/Streak';
import './models/Notification';
import './models/CommunityPost';
import './models/ActivityLog';
import './models/SymptomLog';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_URL
    : true, // allow all origins in development
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.options('*', cors());
app.use(express.json({ limit: '10kb' }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));

app.use('/api/v1/auth',          authRoutes);
app.use('/api/v1/health-log',    healthLogRoutes);
app.use('/api/v1/symptoms',      symptomRoutes);
app.use('/api/v1/user',          userRoutes);
app.use('/api/v1/analytics',     analyticsRoutes);
app.use('/api/v1/ai',            aiRoutes);
app.use('/api/v1/admin',         adminRoutes);
app.use('/api/v1/community',     communityRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/streak',        streakRoutes);

app.get('/health', (_req: Request, res: Response) => res.json({ status: 'OK', version: '2.3.0', timestamp: new Date().toISOString() }));
app.use('*', (_req: Request, res: Response) => res.status(404).json({ success: false, message: 'Route not found.' }));
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error.' });
});

const connect = (retries = 5) => {
  console.log(`🔄 Connecting to MongoDB... (attempt ${6 - retries}/5)`);
  mongoose.connect(process.env.MONGODB_URI!, { serverSelectionTimeoutMS: 10000 })
    .then(() => {
      console.log('✅ MongoDB connected');
      app.listen(PORT, () => {
        console.log(`🚀 Server → http://localhost:${PORT}`);
        console.log('Collections: users | healthlogs | streaks | notifications | communityposts | activitylogs | symptomlogs');
      });
    })
    .catch(err => {
      console.error(`❌ MongoDB failed: ${err.message}`);
      if (retries > 0) { console.log(`⏳ Retrying in 5s...`); setTimeout(() => connect(retries - 1), 5000); }
      else { console.error('💀 Could not connect. Check MongoDB Atlas → Network Access → 0.0.0.0/0'); process.exit(1); }
    });
};

connect();
