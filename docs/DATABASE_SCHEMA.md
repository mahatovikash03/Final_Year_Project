# HealthTrack360 AI — Database Schema

Database: MongoDB Atlas
ODM: Mongoose

---

## Collection: users

| Field      | Type     | Required | Notes                          |
|------------|----------|----------|--------------------------------|
| _id        | ObjectId | Auto     | Primary key                    |
| name       | String   | ✅       | Max 50 chars, trimmed          |
| email      | String   | ✅       | Unique, lowercase              |
| password   | String   | ✅       | Bcrypt hashed, not returned    |
| role       | String   | ✅       | "user" or "admin", default user|
| avatarUrl  | String   | ❌       | Optional profile image URL     |
| createdAt  | Date     | Auto     | Mongoose timestamp             |
| updatedAt  | Date     | Auto     | Mongoose timestamp             |

**Indexes:** `email` (unique)

---

## Collection: healthlogs

| Field                            | Type     | Notes                        |
|----------------------------------|----------|------------------------------|
| _id                              | ObjectId | Auto                         |
| userId                           | ObjectId | Ref: users, indexed          |
| date                             | Date     | Default now, indexed         |
| sleep.duration                   | Number   | 0–24 hours                   |
| sleep.quality                    | Number   | 1–5 scale                    |
| sleep.bedtime                    | String   | HH:MM format                 |
| sleep.wakeTime                   | String   | HH:MM format                 |
| sleep.consistencyScore           | Number   | Optional, computed           |
| diet.meals[].type                | String   | Breakfast/Lunch/Dinner/Snack |
| diet.meals[].nutritionRating     | Number   | 1–5 scale                    |
| diet.meals[].calories            | Number   | kcal                         |
| diet.hydration                   | Number   | Litres                       |
| fitness[].type                   | String   | Exercise name                |
| fitness[].duration               | Number   | Minutes                      |
| fitness[].intensity              | String   | low / moderate / high        |
| skincare.productsUsed            | [String] | Array of product names       |
| skincare.skinIssues              | [String] | Array of issue labels        |
| mentalWellness.moodRating        | Number   | 1–5 scale                    |
| mentalWellness.stressLevel       | String   | low / moderate / high        |
| mentalWellness.notes             | String   | Max 1000 chars               |
| wellnessScore                    | Number   | 0–100, computed on save      |
| createdAt                        | Date     | Auto                         |
| updatedAt                        | Date     | Auto                         |

**Indexes:** `userId` (single), `date` (single), `{ userId: 1, date: -1 }` (compound)

---

## Wellness Score Formula

```
Score = (sleep.quality / 5 × 30)
      + (min(diet.hydration / 2.5, 1) × 25)
      + (fitness.length > 0 ? 20 : 0)
      + (mentalWellness.moodRating / 5 × 15)
      + (skincare.productsUsed.length > 0 ? 10 : 0)
```

Max = 100 pts
- 🟢 70–100 : Good
- 🟡 50–69  : Fair
- 🔴 0–49   : Needs improvement

---

## Relationships

```
users (1) ──────────────── (*) healthlogs
  _id          ←→         userId
```

All health logs belong to exactly one user.
Users can have many health logs (one per day recommended).
