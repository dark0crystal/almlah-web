# Google OAuth Configuration for almlah.com

## Update Required OAuth Settings

You need to update your Google OAuth configuration to work with your custom domain.

### 1. Google Cloud Console Settings

Go to [Google Cloud Console](https://console.cloud.google.com/) and update:

#### Authorized JavaScript Origins
Add these domains to your OAuth 2.0 client:
```
https://almlah.com
https://www.almlah.com
http://localhost:3000 (keep for development)
```

#### Authorized Redirect URIs
Add these redirect URIs:
```
https://api.almlah.com/api/v1/auth/google/callback
http://localhost:9000/api/v1/auth/google/callback (keep for development)
```

### 2. Current Configuration
Based on your environment files, your current Google Client ID is:
```
767910488274-5gh55igkgvi21uarbd461dubq7l8l262.apps.googleusercontent.com
```

### 3. Steps to Update

1. **Access Google Cloud Console**
   - Go to https://console.cloud.google.com/
   - Select your project
   - Navigate to "APIs & Services" → "Credentials"

2. **Find Your OAuth 2.0 Client**
   - Look for the client ID: `767910488274-5gh55igkgvi21uarbd461dubq7l8l262`
   - Click the edit button (pencil icon)

3. **Update Authorized JavaScript Origins**
   - Add: `https://almlah.com`
   - Add: `https://www.almlah.com`
   - Keep: `http://localhost:3000` (for development)

4. **Update Authorized Redirect URIs**
   - Add: `https://api.almlah.com/api/v1/auth/google/callback`
   - Keep: `http://localhost:9000/api/v1/auth/google/callback` (for development)

5. **Save Changes**
   - Click "Save" button
   - Changes may take a few minutes to propagate

### 4. Testing OAuth Flow

After updating:

1. **Development Testing**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:9000
   - OAuth should work as before

2. **Production Testing**
   - Frontend: https://almlah.com
   - Backend: https://api.almlah.com
   - OAuth should redirect properly

### 5. Common OAuth Issues & Solutions

#### Issue: "redirect_uri_mismatch"
**Solution:** Verify the redirect URI exactly matches what's in Google Cloud Console

#### Issue: "origin_mismatch"  
**Solution:** Ensure JavaScript origins include your domain without trailing slash

#### Issue: OAuth popup blocked
**Solution:** Test in different browsers and ensure popup blockers are disabled

### 6. Environment Variables Summary

Your final production environment variables should be:

**Backend (.env.production):**
```
GOOGLE_CLIENT_ID=767910488274-5gh55igkgvi21uarbd461dubq7l8l262.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URL=https://api.almlah.com/api/v1/auth/google/callback
FRONTEND_URL=https://almlah.com
```

**Frontend (.env.production):**
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=767910488274-5gh55igkgvi21uarbd461dubq7l8l262.apps.googleusercontent.com
NEXT_PUBLIC_API_HOST=https://api.almlah.com
```

### 7. Verification Checklist

- [ ] DNS records configured for api.almlah.com
- [ ] DNS records configured for almlah.com  
- [ ] Google OAuth origins updated
- [ ] Google OAuth redirect URIs updated
- [ ] Backend deployed with custom domain
- [ ] Frontend deployed with custom domain
- [ ] Environment variables updated
- [ ] OAuth flow tested end-to-end