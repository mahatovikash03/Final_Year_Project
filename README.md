# HealthTrack360 AI 🩺
## Your Personal AI Wellness Ecosystem

A full-stack AI-powered healthcare and wellness platform built as a 7th Semester B.Tech project.

---

## 🚀 How to Run (2 terminals needed)

### Terminal 1 — Backend
```bash
cd backend
cp .env.example .env    # Mac/Linux
# copy .env.example .env  # Windows
# Fill in all values in .env
npm install
npm run dev
```
Backend starts at → http://localhost:5000

### Terminal 2 — Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend starts at → http://localhost:3000

---

## 📱 All Pages

| Route | Page |
|-------|------|
| / | Landing Page |
| /register | Register |
| /login | Login |
| /dashboard | Dashboard |
| /log | Log Health |
| /analytics | Analytics |
| /ai-chat | AI Assistant |
| /symptoms | Symptom Checker |
| /habits | Habit Tracker |
| /sleep | Sleep Schedule |
| /mood | Mood Tracker |
| /journal | Wellness Journal |
| /nutrition | Nutrition Tracker |
| /reports | Reports & Export |
| /community | Community |
| /wearables | Wearables |
| /notifications | Notifications |
| /profile | Profile |
| /admin | Admin Panel |

---

## 🛠️ Tech Stack

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Chart.js

**Backend:** Node.js, Express.js, TypeScript, MongoDB Atlas, Mongoose

**Auth:** JWT, Bcrypt.js

**Security:** Helmet, CORS, Rate Limiting

---

## 🧠 Wellness Score Formula
```
Score = (Sleep Quality/5 × 30) + (Hydration/2.5 × 25)
      + (Workouts > 0 ? 20 : 0) + (Mood/5 × 15) + (Skincare × 10)
Max = 100
```

---

## 🗄️ MongoDB Setup

1. Go to https://cloud.mongodb.com
2. Create free M0 cluster
3. Network Access → Add 0.0.0.0/0
4. Get connection string → paste in backend/.env

---

## 📋 Features

- 🤖 AI Health Assistant Chatbot
- 📊 Real-time Analytics with Charts
- 🎯 Habit Tracker with Streaks
- 😴 Sleep Schedule Optimizer
- 😊 Daily Mood Tracker
- 📓 Wellness Journal with Prompts
- 🥗 Nutrition & Calorie Tracker
- 🔥 Healthy Eating Streak Timer
- 🩺 Symptom Checker
- 👥 Community Feed
- 📄 Report Export (TXT/CSV/JSON)
- ⌚ Wearables Integration Ready
- 🔔 Smart Notifications
- ⚙️ Admin Panel

---

*B.Tech CSE & IT — 7th Semester Project 2025-26*
*Techno Bengal Institute of Technology, Kolkata*
