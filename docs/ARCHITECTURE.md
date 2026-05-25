# HealthTrack360 AI — Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│   React.js + TypeScript + Tailwind CSS + Framer Motion      │
│   Vite Dev Server → http://localhost:3000                    │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP (Axios)
                            │ JWT Bearer Token
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        API LAYER                             │
│   Express.js + Node.js + TypeScript                          │
│   http://localhost:5000/api/v1                               │
│                                                              │
│   Middleware Stack:                                          │
│   Helmet → CORS → Rate Limit → Morgan → JWT Auth            │
│                                                              │
│   Routes:                                                    │
│   /auth  /health-log  /symptoms  /user  /analytics          │
└───────────────────────────┬─────────────────────────────────┘
                            │ Mongoose ODM
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                          │
│   MongoDB Atlas (Cloud NoSQL)                                │
│                                                              │
│   Collections:                                               │
│   users          healthlogs                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

```
App.tsx (Router)
│
├── Public Routes
│   ├── /login     → Login.tsx
│   └── /register  → Register.tsx
│
└── Protected Routes (require JWT)
    ├── /dashboard  → Dashboard.tsx
    │   ├── StatCard (×4)
    │   ├── WellnessChart (Line)
    │   └── ScoreBarChart (Bar)
    ├── /log        → LogHealth.tsx (5-step form)
    ├── /symptoms   → Symptoms.tsx
    ├── /analytics  → Analytics.tsx (Line + Bar + Doughnut)
    └── /profile    → Profile.tsx

State Management:
  useAuthStore (Zustand + localStorage persist)
  useWeeklyAnalytics / useHealthLogs (custom hooks)

API Layer:
  src/services/api.ts (Axios instance with interceptors)
```

---

## Backend Architecture

```
server.ts
│
├── Middleware (applied globally)
│   ├── helmet()          — Security headers
│   ├── cors()            — Cross-origin requests
│   ├── express.json()    — Body parsing
│   ├── morgan()          — Request logging
│   └── rateLimit()       — 100 req/15min per IP
│
├── Routes
│   ├── /auth             → authController
│   │   ├── POST /register
│   │   ├── POST /login
│   │   └── GET  /me
│   ├── /health-log       → healthLogController
│   │   ├── POST /
│   │   ├── GET  /
│   │   ├── GET  /analytics/weekly
│   │   ├── GET  /:id
│   │   └── DELETE /:id
│   ├── /symptoms         → inline handler
│   ├── /user             → inline handlers
│   └── /analytics        → inline handlers
│
└── MongoDB via Mongoose
    ├── User model   (bcrypt, JWT)
    └── HealthLog model (wellness score algorithm)
```

---

## Security Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│  JWT Token   │────▶│   Backend    │
│   (Browser)  │     │  (7-day exp) │     │  (Express)   │
└──────────────┘     └──────────────┘     └──────────────┘
                                                  │
                              ┌───────────────────┼──────────────────┐
                              │                   │                  │
                         Helmet.js           Rate Limit         Bcrypt.js
                       (HTTP Headers)     (100/15min/IP)    (Password Hash)
```

---

## Data Flow — Logging Health

```
User fills LogHealth form (5 steps)
        │
        ▼
Frontend validates inputs
        │
        ▼
POST /api/v1/health-log (with JWT)
        │
        ▼
auth middleware verifies JWT
        │
        ▼
healthLogController.createLog()
        │
        ▼
calcWellnessScore() → Score 0–100
        │
        ▼
HealthLog.create() → MongoDB Atlas
        │
        ▼
Response: { success: true, data: log }
        │
        ▼
Frontend redirects → Dashboard
        │
        ▼
Dashboard fetches /analytics/weekly
        │
        ▼
Charts render with updated data
```

---

## Technology Stack Summary

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 18, TypeScript, Vite        |
| Styling    | Tailwind CSS, Framer Motion       |
| Charts     | Chart.js, react-chartjs-2         |
| State      | Zustand (persist middleware)      |
| HTTP       | Axios                             |
| Router     | React Router v6                   |
| Backend    | Node.js, Express.js, TypeScript   |
| Auth       | JWT, Bcrypt.js                    |
| Database   | MongoDB Atlas, Mongoose ODM       |
| Security   | Helmet, CORS, Rate Limiting       |
| Dev Tools  | VS Code, Postman, Git             |
