# MongoDB Authentication Migration Guide

This guide will help you migrate from Supabase to MongoDB with custom JWT authentication.

## Prerequisites

1. **MongoDB Setup**
   - Install MongoDB locally or use MongoDB Atlas
   - Update the connection string in your environment variables

2. **Environment Variables**
   Copy `.env.example` to `.env.local` and update the values:
   ```bash
   cp .env.example .env.local
   ```

   **Required Environment Variables:**
   - `MONGODB_URI`: Your MongoDB connection string
   - `MONGODB_DB`: Database name (default: cosmos-admin)
   - `JWT_SECRET`: Secret key for access tokens (make it long and random)
   - `JWT_REFRESH_SECRET`: Secret key for refresh tokens (different from JWT_SECRET)
   - `ACCESS_TOKEN_EXPIRY`: Access token expiry (default: 15m)
   - `REFRESH_TOKEN_EXPIRY`: Refresh token expiry (default: 7d)

## Migration Steps

### 1. Install Dependencies

The following packages have been added:
- `mongodb`: MongoDB driver
- `bcryptjs`: Password hashing
- `jsonwebtoken`: JWT token handling
- `uuid`: Generate unique IDs

### 2. Database Collections

The system will create the following MongoDB collections:

**accounts** - User accounts
```json
{
  "_id": ObjectId,
  "id": "uuid-string",
  "email": "user@example.com",
  "password": "hashed-password",
  "role": "admin" | "user",
  "created_at": Date,
  "updated_at": Date
}
```

**refresh_tokens** - JWT refresh tokens
```json
{
  "_id": ObjectId,
  "userId": "user-uuid",
  "token": "jwt-refresh-token",
  "created_at": Date,
  "expires_at": Date,
  "is_revoked": boolean
}
```

**profiles** - User profiles (optional, existing structure)
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "full_name": "User Name",
  "role": "admin" | "student",
  // ... other profile fields
}
```

### 3. Create Initial Admin Account

Run the admin creation script:
```bash
node scripts/create-admin.js
```

Or create manually through the API:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cosmos.com","password":"admin123456","role":"admin"}'
```

### 4. Authentication Flow

**Login Process:**
1. POST `/api/auth/login` with email/password
2. Server verifies credentials and generates JWT tokens
3. Access token (15min) and refresh token (7 days) set as HTTP-only cookies
4. User redirected to dashboard

**Token Refresh:**
- Access tokens auto-refresh using refresh tokens
- Refresh tokens are rotated on each use
- Invalid tokens redirect to login

**Logout Process:**
- POST `/api/auth/logout` revokes refresh token
- All cookies cleared
- User redirected to login page

### 5. API Route Protection

Use the middleware helpers for protected routes:

```typescript
import { withAuth } from '@/lib/api-middleware';

export const GET = withAuth(async (req) => {
  // req.user is available here
  const user = req.user;
  
  return NextResponse.json({ user });
});
```

### 6. Client-Side Changes

The auth store has been updated to work with the new API endpoints:
- Login calls `/api/auth/login`
- Logout calls `/api/auth/logout`
- Auth initialization calls `/api/auth/me`
- Automatic token refresh on 401 responses

## Security Features

1. **Password Hashing**: bcrypt with 12 salt rounds
2. **JWT Tokens**: Separate secrets for access/refresh tokens
3. **HTTP-Only Cookies**: Prevent XSS attacks
4. **Token Rotation**: Refresh tokens are rotated on use
5. **Role-Based Access**: Only admin users can access the system
6. **Token Expiry**: Short-lived access tokens with refresh mechanism

## API Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/register` - Create new account

## Troubleshooting

1. **JWT Secret Errors**: Ensure JWT_SECRET and JWT_REFRESH_SECRET are set
2. **MongoDB Connection**: Verify MONGODB_URI is correct
3. **Token Issues**: Check browser cookies and clear if necessary
4. **Admin Access**: Ensure user role is "admin" in database

## Next Steps

1. Update your environment variables
2. Start MongoDB service
3. Create initial admin account
4. Test login/logout functionality
5. Remove Supabase dependencies when ready