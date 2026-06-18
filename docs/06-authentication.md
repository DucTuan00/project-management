# Authentication

## Purpose
Define the complete authentication system including registration, login, email verification, password reset, and JWT token management.

## Auth Flow Overview

```
Register -> Email Verification -> Login -> Access Token + Refresh Token
                                             |
                                        +----+----+
                                        |         |
                                 Authenticated  Token Expired
                                   Requests        |
                                        |      Refresh Token
                                        |         |
                                        |    New Access Token
                                        |         |
                                        +---------+
```

## Registration

**Endpoint**: POST /api/v1/auth/register

**Flow**:
1. Client sends { email, password, displayName }
2. Server validates with Zod schema:
   - Email: valid format, max 255 chars, lowercase
   - Password: min 8 chars, at least 1 uppercase, 1 lowercase, 1 number
   - Display name: 2-100 chars, trimmed
3. Check if email already exists - return 409 CONFLICT with code EMAIL_ALREADY_EXISTS
4. Hash password with bcrypt (12 salt rounds)
5. Create user with is_email_verified = false
6. Generate email verification token (crypto.randomBytes(32) to hex)
7. Store token hash and expiry (24h) in user record
8. Enqueue email job with verification link
9. Return 201 { user, message: "Verification email sent" }

Never return "user already exists" to unauthenticated email checks - always return the same response to prevent email enumeration. The actual conflict error is safe because the user is authenticated by their existing session.

## Email Verification

**Endpoint**: POST /api/v1/auth/verify-email

**Flow**:
1. Client sends { token }
2. Find user by password_reset_token hash match with non-expired token
3. If invalid/expired - return 400 BAD_REQUEST with code INVALID_VERIFICATION_TOKEN
4. Set is_email_verified = true, email_verified_at = now()
5. Clear verification token fields
6. Return 200 { message: "Email verified" }

**Resend verification**: POST /api/v1/auth/resend-verification - rate limited to 1 per 60 seconds per email.

## Login

**Endpoint**: POST /api/v1/auth/login

**Flow**:
1. Client sends { email, password }
2. Validate with Zod schema
3. Find user by email
4. If not found - return 401 UNAUTHORIZED with code INVALID_CREDENTIALS
5. Compare password with bcrypt
6. If mismatch - return 401 UNAUTHORIZED with code INVALID_CREDENTIALS
7. Update last_login_at = now()
8. Generate token pair (Access + Refresh)
9. Return 200 { user, accessToken, refreshToken }

Login response uses a generic message. Never disclose which field is wrong (email vs password).
