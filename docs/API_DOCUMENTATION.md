# HealthTrack360 AI — API Documentation

Base URL: `http://localhost:5000/api/v1`

All protected routes require the header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## Auth

### POST /auth/register
Register a new user.

**Body:**
```json
{ "name": "string", "email": "string", "password": "string (min 8 chars)" }
```
**Response:**
```json
{ "success": true, "token": "...", "user": { "id", "name", "email", "role" } }
```

---

### POST /auth/login
Login and receive JWT token.

**Body:**
```json
{ "email": "string", "password": "string" }
```
**Response:**
```json
{ "success": true, "token": "...", "user": { "id", "name", "email", "role" } }
```

---

### GET /auth/me ✅ Protected
Get the currently authenticated user.

**Response:**
```json
{ "success": true, "user": { "id", "name", "email", "role", "createdAt" } }
```

---

## Health Logs

### POST /health-log ✅ Protected
Create a new daily health log.

**Body:**
```json
{
  "sleep": { "duration": 7, "quality": 4, "bedtime": "23:00", "wakeTime": "06:00" },
  "diet": {
    "meals": [{ "type": "Breakfast", "nutritionRating": 4, "calories": 450 }],
    "hydration": 2.5
  },
  "fitness": [{ "type": "Running", "duration": 30, "intensity": "moderate" }],
  "skincare": { "productsUsed": ["Moisturiser", "SPF"], "skinIssues": [] },
  "mentalWellness": { "moodRating": 4, "stressLevel": "low", "notes": "Good day overall" }
}
```
**Response:** `{ "success": true, "data": { ...log, "wellnessScore": 82 } }`

---

### GET /health-log ✅ Protected
Fetch paginated health logs for the current user.

**Query Params:** `?limit=30&page=1`

**Response:** `{ "success": true, "count": 10, "total": 25, "page": 1, "data": [...] }`

---

### GET /health-log/analytics/weekly ✅ Protected
Get aggregated analytics for the past 7 days.

**Response:**
```json
{
  "success": true,
  "data": {
    "avgWellnessScore": 74,
    "avgSleepDuration": 6.8,
    "avgMoodRating": 3.9,
    "avgHydration": 2.1,
    "totalWorkouts": 4,
    "logsThisWeek": 5,
    "weeklyTrend": [{ "date": "...", "score": 78 }]
  }
}
```

---

### GET /health-log/:id ✅ Protected
Fetch a single health log by ID.

### DELETE /health-log/:id ✅ Protected
Delete a specific health log by ID.

---

## Symptom Checker

### POST /symptoms/check ✅ Protected
Get wellness suggestions based on symptoms.

**Body:**
```json
{ "category": "sleep | gut | stress | skin", "severity": 3, "duration": "1–2 days" }
```
**Response:**
```json
{
  "success": true,
  "data": {
    "category": "sleep",
    "severity": 3,
    "duration": "1–2 days",
    "suggestions": ["...", "..."],
    "disclaimer": "These are general wellness tips only..."
  }
}
```

---

## User

### GET /user/profile ✅ Protected
Get the authenticated user's profile details.

### PATCH /user/profile ✅ Protected
Update name or avatar URL.

**Body:** `{ "name": "string", "avatarUrl": "string" }`

---

## Analytics

### GET /analytics/monthly ✅ Protected
Get aggregated analytics for the past 30 days.

**Response:** Same structure as weekly analytics but over 30 days with `monthlyTrend`.

---

## Error Responses

All errors follow this format:
```json
{ "success": false, "message": "Descriptive error message." }
```

| Status | Meaning                        |
|--------|--------------------------------|
| 400    | Bad request / validation error |
| 401    | Not authenticated              |
| 403    | Forbidden (wrong role)         |
| 404    | Resource not found             |
| 409    | Conflict (duplicate email)     |
| 500    | Internal server error          |
