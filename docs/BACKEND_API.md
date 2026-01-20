# Lumis Backend API Documentation

This document describes the API endpoints required for the Lumis backend.

## Base URL

Set via environment variable: `EXPO_PUBLIC_API_URL`

Example: `https://api.lumis.app`

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Endpoints

### Authentication

#### POST /auth/signup

Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "user_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "avatarUrl": null,
    "createdAt": "2024-01-20T10:00:00Z",
    "isPremium": false
  },
  "tokens": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 3600
  }
}
```

#### POST /auth/login

Authenticate an existing user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "user_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "avatarUrl": null,
    "createdAt": "2024-01-20T10:00:00Z",
    "isPremium": false
  },
  "tokens": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 3600
  }
}
```

#### POST /auth/logout

Invalidate the current session.

**Headers:** Authorization required

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

#### POST /auth/refresh

Refresh an expired access token.

**Request:**
```json
{
  "refreshToken": "eyJ..."
}
```

**Response (200):**
```json
{
  "tokens": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 3600
  }
}
```

#### POST /auth/reset-password

Request a password reset email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "Password reset email sent"
}
```

#### POST /auth/reset-password/verify

Complete the password reset with the token from email.

**Request:**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "newsecurepassword123"
}
```

**Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

---

### User Profile

#### GET /user/profile

Get the current user's profile.

**Headers:** Authorization required

**Response (200):**
```json
{
  "id": "user_abc123",
  "email": "user@example.com",
  "name": "John Doe",
  "avatarUrl": "https://...",
  "createdAt": "2024-01-20T10:00:00Z",
  "isPremium": false,
  "premiumExpiresAt": null
}
```

#### PATCH /user/profile

Update the current user's profile.

**Headers:** Authorization required

**Request:**
```json
{
  "name": "Jane Doe",
  "avatarUrl": "https://..."
}
```

**Response (200):**
```json
{
  "id": "user_abc123",
  "email": "user@example.com",
  "name": "Jane Doe",
  "avatarUrl": "https://...",
  "createdAt": "2024-01-20T10:00:00Z",
  "isPremium": false
}
```

#### DELETE /user/account

Delete the current user's account and all associated data.

**Headers:** Authorization required

**Response (200):**
```json
{
  "message": "Account deleted successfully"
}
```

---

### Data Sync

#### POST /user/sync

Sync user data to the server.

**Headers:** Authorization required

**Request:**
```json
{
  "settings": {
    "dailyGoalMinutes": 10,
    "wakeWindowStart": "06:00",
    "wakeWindowEnd": "10:00",
    "blockedApps": ["instagram", "tiktok"],
    "calibration": {
      "indoorLux": 150,
      "outdoorLux": 20000
    }
  },
  "currentStreak": 5,
  "longestStreak": 12,
  "totalDaysCompleted": 45,
  "progressHistory": [
    {
      "date": "2024-01-20",
      "lightMinutes": 10.5,
      "steps": 1200,
      "completed": true,
      "unlockTime": "2024-01-20T07:30:00Z"
    }
  ]
}
```

**Response (200):**
```json
{
  "settings": { ... },
  "currentStreak": 5,
  "longestStreak": 12,
  "totalDaysCompleted": 45,
  "progressHistory": [ ... ]
}
```

#### GET /user/sync

Get user data from the server.

**Headers:** Authorization required

**Response (200):**
```json
{
  "settings": {
    "dailyGoalMinutes": 10,
    "wakeWindowStart": "06:00",
    "wakeWindowEnd": "10:00",
    "blockedApps": ["instagram", "tiktok"],
    "calibration": {
      "indoorLux": 150,
      "outdoorLux": 20000
    }
  },
  "currentStreak": 5,
  "longestStreak": 12,
  "totalDaysCompleted": 45,
  "progressHistory": [ ... ]
}
```

---

### Progress Tracking

#### POST /progress

Save today's progress.

**Headers:** Authorization required

**Request:**
```json
{
  "date": "2024-01-20",
  "lightMinutes": 10.5,
  "steps": 1200,
  "completed": true,
  "unlockTime": "2024-01-20T07:30:00Z"
}
```

**Response (201):**
```json
{
  "date": "2024-01-20",
  "lightMinutes": 10.5,
  "steps": 1200,
  "completed": true,
  "unlockTime": "2024-01-20T07:30:00Z"
}
```

#### GET /progress/history

Get progress history.

**Headers:** Authorization required

**Query Parameters:**
- `days` (optional): Number of days to fetch (default: 30)

**Response (200):**
```json
[
  {
    "date": "2024-01-20",
    "lightMinutes": 10.5,
    "steps": 1200,
    "completed": true,
    "unlockTime": "2024-01-20T07:30:00Z"
  },
  {
    "date": "2024-01-19",
    "lightMinutes": 8.2,
    "steps": 950,
    "completed": false
  }
]
```

#### GET /progress/streak

Get streak information.

**Headers:** Authorization required

**Response (200):**
```json
{
  "current": 5,
  "longest": 12,
  "total": 45
}
```

---

### Subscriptions (Premium)

#### GET /subscription/status

Check premium subscription status.

**Headers:** Authorization required

**Response (200):**
```json
{
  "isPremium": true,
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

#### POST /subscription/validate

Validate an in-app purchase receipt.

**Headers:** Authorization required

**Request:**
```json
{
  "receipt": "base64_encoded_receipt_data",
  "platform": "ios"
}
```

**Response (200):**
```json
{
  "isPremium": true,
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_CREDENTIALS` | 401 | Email or password is incorrect |
| `USER_NOT_FOUND` | 404 | User does not exist |
| `EMAIL_ALREADY_EXISTS` | 409 | Email is already registered |
| `INVALID_TOKEN` | 401 | Access or refresh token is invalid |
| `TOKEN_EXPIRED` | 401 | Access token has expired |
| `VALIDATION_ERROR` | 400 | Request body validation failed |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Database Schema (Suggested)

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  premium_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### User Settings Table
```sql
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  daily_goal_minutes INTEGER DEFAULT 10,
  wake_window_start TIME DEFAULT '06:00',
  wake_window_end TIME DEFAULT '10:00',
  blocked_apps TEXT[] DEFAULT '{}',
  indoor_lux INTEGER DEFAULT 100,
  outdoor_lux INTEGER DEFAULT 10000,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Progress Table
```sql
CREATE TABLE progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  light_minutes DECIMAL(5,2) DEFAULT 0,
  steps INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  unlock_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);
```

### Streaks Table
```sql
CREATE TABLE streaks (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_days_completed INTEGER DEFAULT 0,
  last_completed_date DATE,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Implementation Notes

1. **Token Management**: Use JWT with short-lived access tokens (1 hour) and longer-lived refresh tokens (7 days)

2. **Password Hashing**: Use bcrypt with a cost factor of 12

3. **Rate Limiting**: Implement rate limiting on auth endpoints (10 requests per minute)

4. **Data Validation**: Validate all input with Zod or similar

5. **CORS**: Enable CORS for the mobile app domain

6. **HTTPS**: Always use HTTPS in production
