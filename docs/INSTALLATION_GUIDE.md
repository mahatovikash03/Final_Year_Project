# HealthTrack360 AI — Installation Guide

## Prerequisites

Make sure the following are installed on your system:

| Tool       | Version   | Download                        |
|------------|-----------|---------------------------------|
| Node.js    | v18+      | https://nodejs.org              |
| npm        | v9+       | Comes with Node.js              |
| Git        | Latest    | https://git-scm.com             |
| VS Code    | Latest    | https://code.visualstudio.com   |

You will also need a free **MongoDB Atlas** account:
https://www.mongodb.com/cloud/atlas/register

---

## Step 1 — MongoDB Atlas Setup

1. Sign up at https://cloud.mongodb.com
2. Create a new free cluster (M0)
3. Under **Database Access** → Add a new database user with a password
4. Under **Network Access** → Add IP Address → Allow Access from Anywhere (0.0.0.0/0)
5. Go to **Clusters** → Connect → Connect your application
6. Copy the connection string, it looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/healthtrack360
   ```

---

## Step 2 — Backend Setup

```bash
# Navigate to backend folder
cd backend

# Copy environment file
copy .env.example .env

# Open .env and fill in your values:
# MONGODB_URI=mongodb+srv://...
# JWT_SECRET=any_long_random_string_here

# Install dependencies
npm install

# Start development server
npm run dev
```

The backend will start at: **http://localhost:5000**

Test it: open your browser and go to `http://localhost:5000/health`
You should see: `{ "status": "OK", "version": "1.0.0" }`

---

## Step 3 — Frontend Setup

Open a **new terminal window**, then:

```bash
# Navigate to frontend folder
cd frontend

# Copy environment file
copy .env.example .env

# The default .env already has:
# VITE_API_URL=http://localhost:5000/api/v1
# No changes needed for local development

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will start at: **http://localhost:3000**

---

## Step 4 — Using the App

1. Open http://localhost:3000 in your browser
2. Click **Create one** to register a new account
3. After login you will see the **Dashboard**
4. Use the navbar to:
   - **Log Today** — Enter your daily health data (5-step form)
   - **Symptoms** — Check wellness tips for your concerns
   - **Analytics** — View charts and trends
   - **Profile** — Edit your name and avatar

---

## Folder Structure

```
Final_Year_Project/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/     StatCard, WellnessChart, ScoreBarChart
│   │   │   └── layout/        Navbar, Layout
│   │   ├── hooks/             useAuth, useHealthData
│   │   ├── pages/             Dashboard, Login, Register, LogHealth,
│   │   │                      Symptoms, Analytics, Profile, NotFound
│   │   ├── services/          api.ts (Axios instance)
│   │   ├── types/             index.ts (TypeScript interfaces)
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.ts
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── controllers/       authController, healthLogController
│   │   ├── middleware/        auth.ts (JWT protect)
│   │   ├── models/            User.ts, HealthLog.ts
│   │   ├── routes/            auth, healthLog, symptom, user, analytics
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
│
└── docs/
    ├── API_DOCUMENTATION.md
    ├── DATABASE_SCHEMA.md
    ├── INSTALLATION_GUIDE.md
    └── ARCHITECTURE.md
```

---

## Common Issues

**Port already in use:**
```bash
# Kill process on port 5000 (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**MongoDB connection error:**
- Double-check your MONGODB_URI in `.env`
- Make sure your IP is whitelisted in MongoDB Atlas Network Access

**npm install fails:**
```bash
npm cache clean --force
npm install
```
