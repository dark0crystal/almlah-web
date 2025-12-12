# Vercel Backend Deployment Guide

## 🚀 Deploying Your Go Backend to Vercel

### **Benefits of Using Vercel:**
- ✅ **Same platform** as your frontend (unified deployment)
- ✅ **Automatic scaling** and serverless functions
- ✅ **Built-in CDN** and edge locations
- ✅ **Easy custom domain** setup with SSL
- ✅ **Environment variables** management
- ✅ **Git integration** with auto-deployment

## 📁 Files Created for Vercel

### 1. **vercel.json** - Configuration
- Uses `@vercel/go` runtime (latest official runtime)
- Defines single serverless function at `api/index.go`
- Sets up URL rewrites to route all requests to main handler
- Configures CORS headers

### 2. **api/index.go** - Serverless Entry Point
- Converts your Fiber app to serverless function
- Handles database initialization on cold starts
- Manages middleware and route setup

### 3. **internals/api/rest/routes.go** - Route Setup
- Centralized route configuration
- Compatible with both server and serverless modes

## 🌐 Domain Configuration

### **URL Structure:**
- **Frontend**: `https://almlah.com` (main website)
- **Backend API**: `https://api.almlah.com` (API endpoints)

### **DNS Setup (same as before):**
```
Type: CNAME | Name: api | Value: cname.vercel-dns.com
Type: A    | Name: @   | Value: 76.76.19.61
Type: CNAME| Name: www | Value: cname.vercel-dns.com
```

## 🚀 Deployment Steps

### **Step 1: Push to GitHub**
```bash
git add .
git commit -m "Add Vercel serverless configuration"
git push origin main
```

### **Step 2: Import Project to Vercel**

#### **For Backend:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Import Project"**
3. Select your GitHub repository
4. **Root Directory**: `backend`
5. **Framework Preset**: Other
6. Click **"Deploy"**

#### **For Frontend (separate deployment):**
1. Import the same repository again
2. **Root Directory**: `frontend`
3. **Framework Preset**: Next.js
4. Click **"Deploy"**

### **Step 3: Configure Environment Variables**

#### **Backend Environment Variables:**
In Vercel Dashboard → Backend Project → Settings → Environment Variables:

```bash
DATABASE_URL=postgresql://postgres.jeyypngrycucoystlmft:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
JWT_SECRET=your-jwt-secret-here
GOOGLE_CLIENT_ID=767910488274-5gh55igkgvi21uarbd461dubq7l8l262.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URL=https://api.almlah.com/api/v1/auth/google/callback
FRONTEND_URL=https://almlah.com
GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
SUPABASE_URL=https://jeyypngrycucoystlmft.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_STORAGE_BUCKET=media-bucket
APP_ENV=production
```

#### **Frontend Environment Variables:**
In Vercel Dashboard → Frontend Project → Settings → Environment Variables:

```bash
NEXT_PUBLIC_API_HOST=https://api.almlah.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=767910488274-5gh55igkgvi21uarbd461dubq7l8l262.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
NEXT_PUBLIC_SUPABASE_URL=https://jeyypngrycucoystlmft.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
NEXT_PUBLIC_STORAGE_BUCKET=media-bucket
NEXT_PUBLIC_APP_NAME=Almlah
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_MAPBOX_ACCESS_TOCKEN=YOUR_MAPBOX_ACCESS_TOKEN
```

### **Step 4: Configure Custom Domains**

#### **For Backend (api.almlah.com):**
1. Go to Backend Project → Settings → Domains
2. Add custom domain: `api.almlah.com`
3. Follow Vercel's DNS instructions

#### **For Frontend (almlah.com):**
1. Go to Frontend Project → Settings → Domains  
2. Add custom domain: `almlah.com`
3. Add www redirect: `www.almlah.com` → `almlah.com`

### **Step 5: Update OAuth Settings**
Update your Google OAuth configuration:
- **JavaScript Origins**: Add `https://almlah.com`
- **Redirect URIs**: Add `https://api.almlah.com/api/v1/auth/google/callback`

## 🧪 Testing Your Deployment

### **API Endpoints:**
- Health check: `https://api.almlah.com/api/v1/health`
- Auth: `https://api.almlah.com/api/v1/auth/login`
- Places: `https://api.almlah.com/api/v1/places`

### **Frontend:**
- Main site: `https://almlah.com`

## 💡 Serverless Considerations

### **Cold Starts:**
- First request after inactivity may be slower
- Database connections are initialized on demand
- Consider using connection pooling (already configured with Supabase)

### **Timeouts:**
- Vercel serverless functions timeout after 10-60 seconds (plan dependent)
- Most API operations should complete well within limits

### **Pricing:**
- **Hobby Plan**: Free (100GB bandwidth, 1000 serverless function invocations)
- **Pro Plan**: $20/month (1TB bandwidth, unlimited functions)

## 🔧 Alternative: Single Project Deployment

Instead of two separate projects, you can deploy both frontend and backend in one:

### **Project Structure:**
```
almlah/
├── frontend/          # Next.js app
├── backend/api/       # Serverless functions
├── vercel.json        # Config at root
```

### **Root vercel.json:**
```json
{
  "functions": {
    "backend/api/*.go": {
      "runtime": "vercel-go@3.0.0"
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/backend/api/$1"
    }
  ]
}
```

## 🎯 Recommendation

**Two separate Vercel projects** (recommended):
- ✅ Cleaner separation of concerns
- ✅ Independent scaling and configuration
- ✅ Easier to manage domains
- ✅ Better for team development

**Single project**:
- ✅ Simpler deployment
- ❌ More complex configuration
- ❌ Harder to scale independently

## 🚀 Ready to Deploy?

1. **Push your code** to GitHub
2. **Import two projects** to Vercel (backend + frontend)
3. **Set environment variables**
4. **Configure custom domains**
5. **Test API endpoints**

Your backend will be serverless and scale automatically! 🎉