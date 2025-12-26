# Security Audit Report - API Leak Investigation

**Date:** $(date)  
**Status:** ⚠️ **CRITICAL ISSUES FOUND**

---

## Executive Summary

This audit identified **6 security issues** ranging from critical to informational. The most severe issues involve hardcoded credentials and default secrets that could allow unauthorized access to the application.

---

## 🔴 CRITICAL ISSUES

### 1. Hardcoded Admin Credentials in Frontend Code

**Severity:** CRITICAL  
**Risk:** Unauthorized admin access

**Locations:**
- `frontend/src/app/[locale]/dashboard/admin/manage-rbac/page.tsx` (Line 350)
- `frontend/src/app/[locale]/dashboard/admin/manage-governorate/LoginModal.tsx` (Line 23)

**Issue:**
```typescript
// Hardcoded credentials found:
if (credentials.username === 'admin' && credentials.password === 'password') {
  const mockToken = 'mock-jwt-token-12345';
  // ...
}
```

**Impact:**
- Anyone can access admin panels using `admin/password`
- Mock JWT token `mock-jwt-token-12345` is hardcoded
- These credentials are visible in the client-side code

**Recommendation:**
- **IMMEDIATELY REMOVE** all hardcoded credentials
- Replace with proper authentication that calls the backend API
- Remove mock tokens and use real JWT tokens from the backend
- Ensure all admin routes require proper authentication

---

### 2. Default JWT Secret Fallback

**Severity:** CRITICAL  
**Risk:** Weak JWT signing in production

**Location:** `backend/config/appConfig.go` (Line 75)

**Issue:**
```go
jwtSecret := os.Getenv("JWT_SECRET")
if len(jwtSecret) < 1 {
    jwtSecret = "default-secret-key" // fallback
    log.Println("Warning: Using default JWT secret...")
}
```

**Impact:**
- If `JWT_SECRET` is not set, the app uses a predictable default secret
- This makes all JWT tokens easily forgeable
- Production deployments could be vulnerable

**Recommendation:**
- **REMOVE** the default fallback
- Make `JWT_SECRET` a required environment variable
- Fail fast if `JWT_SECRET` is not set in production
- Use strong, randomly generated secrets

---

## 🟠 HIGH PRIORITY ISSUES

### 3. Partial API Key Logging

**Severity:** HIGH  
**Risk:** API key exposure in logs

**Location:** `backend/internals/services/image_service.go` (Lines 37-40)

**Issue:**
```go
fmt.Printf("   - API Key: %s...%s (length: %d)\n", 
    func() string { if len(apiKey) > 8 { return apiKey[:8] } else { return apiKey } }(),
    func() string { if len(apiKey) > 8 { return apiKey[len(apiKey)-8:] } else { return "" } }(),
    len(apiKey))
```

**Impact:**
- First 8 and last 8 characters of Supabase API key are logged
- Logs could be exposed or accessible to unauthorized users
- Partial key information could aid in key enumeration attacks

**Recommendation:**
- Remove or mask API key logging in production
- Only log that the key is "Set" or "Not Set"
- Use environment-based logging (debug mode only)

---

### 4. Database URL Partial Logging

**Severity:** HIGH  
**Risk:** Database credentials exposure

**Location:** `backend/config/appConfig.go` (Lines 66-71)

**Issue:**
```go
// Debug: Print first 50 characters of DATABASE_URL (hide password)
if len(databaseURL) > 50 {
    log.Printf("DATABASE_URL loaded: %s...", databaseURL[:50])
} else {
    log.Printf("DATABASE_URL loaded: %s", databaseURL)
}
```

**Impact:**
- First 50 characters of database connection string are logged
- Could expose database host, port, username, or partial password
- Logs might be accessible to unauthorized users

**Recommendation:**
- Remove database URL logging entirely
- Only log that database connection was successful
- Mask all sensitive connection string parts

---

## 🟡 MEDIUM PRIORITY ISSUES

### 5. Google Maps API Key Exposed in Frontend

**Severity:** MEDIUM (Expected behavior, but needs verification)  
**Risk:** API key abuse if not properly restricted

**Locations:**
- `frontend/src/components/destination/DestinationsMap.tsx` (Line 24)
- `frontend/src/app/[locale]/places/PlacesMap.tsx` (Line 40)
- `frontend/src/app/[locale]/restaurants/RestaurantsMap.tsx` (Line 53)

**Issue:**
```typescript
googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
```

**Impact:**
- Google Maps API keys are exposed in client-side code (this is normal)
- **However**, if the key is not properly restricted in Google Cloud Console, it could be abused
- Unrestricted keys could lead to unexpected API usage and costs

**Recommendation:**
- Verify that Google Maps API key has proper restrictions:
  - HTTP referrer restrictions (domain whitelist)
  - API restrictions (only Maps JavaScript API, Places API, etc.)
  - Usage quotas and billing alerts
- Consider using a backend proxy for sensitive operations

---

### 6. Console Logging of Sensitive Information

**Severity:** MEDIUM  
**Risk:** Token/credential exposure in browser console

**Locations:**
- Multiple files log token information to console
- `frontend/src/lib/auth-server.ts`
- `frontend/src/stores/authStore.ts`
- `frontend/src/components/guards/AuthGuards.tsx`

**Issue:**
```typescript
console.log('🍪 Server token:', token ? 'Found' : 'Not found');
console.log('Token stored:', token);
```

**Impact:**
- Tokens and sensitive data visible in browser console
- Could be captured by browser extensions or debugging tools
- Production builds should not expose this information

**Recommendation:**
- Remove or conditionally disable console.log statements in production
- Use environment-based logging (only in development)
- Never log actual token values, only status indicators

---

## ✅ GOOD PRACTICES FOUND

1. ✅ Environment variables properly used for sensitive data
2. ✅ `.gitignore` files properly exclude `.env` files
3. ✅ Backend API keys stored server-side only
4. ✅ JWT tokens properly used for authentication
5. ✅ Password hashing with bcrypt implemented

---

## 📋 RECOMMENDED ACTIONS (Priority Order)

### Immediate Actions (Do Now):
1. **Remove hardcoded admin credentials** from frontend
2. **Remove default JWT secret fallback** - make it required
3. **Remove API key logging** from production code
4. **Remove database URL logging** from production code

### Short-term Actions (This Week):
5. **Review Google Maps API key restrictions** in Google Cloud Console
6. **Remove/disable console.log statements** in production builds
7. **Add environment validation** on application startup
8. **Implement proper error handling** without exposing sensitive data

### Long-term Actions (This Month):
9. **Set up security monitoring** and alerting
10. **Implement rate limiting** on API endpoints
11. **Add security headers** (CSP, HSTS, etc.)
12. **Regular security audits** and dependency updates

---

## 🔒 Security Best Practices to Implement

1. **Never commit secrets** - Use environment variables or secret management
2. **Fail fast** - Don't use default secrets in production
3. **Minimal logging** - Don't log sensitive data
4. **API key restrictions** - Always restrict API keys by domain/IP/usage
5. **Regular rotation** - Rotate secrets periodically
6. **Access control** - Verify all admin routes require authentication
7. **Code review** - Review all authentication-related code changes

---

## 📝 Notes

- The Google Maps API key exposure is **expected behavior** for client-side maps, but must be properly restricted
- The `NEXT_PUBLIC_` prefix in Next.js means the variable is exposed to the browser - use carefully
- All sensitive backend operations should use server-side API keys only

---

**Report Generated:** Security Audit  
**Next Review:** After implementing critical fixes

