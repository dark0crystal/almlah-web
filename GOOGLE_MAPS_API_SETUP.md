# Google Maps API Key Setup Guide

## 🗺️ How to Get Your Google Maps API Key

### Step 1: Access Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. If you don't have a project, create a new one

### Step 2: Create or Select a Project
1. Click the project dropdown at the top
2. Either:
   - **Select existing project** (if you have one for Almlah)
   - **Create new project**: Click "New Project"
     - Project name: `Almlah Maps`
     - Organization: Leave as default
     - Click "Create"

### Step 3: Enable Google Maps APIs
1. Go to **APIs & Services** → **Library**
2. Search for and enable these APIs:
   ```
   ✅ Maps JavaScript API
   ✅ Geocoding API  
   ✅ Places API
   ✅ Maps Static API (optional)
   ✅ Directions API (if you need routing)
   ```

3. Click each API and press **"Enable"**

### Step 4: Create API Key
1. Go to **APIs & Services** → **Credentials**
2. Click **"+ Create Credentials"** → **"API Key"**
3. Your API key will be generated (copy it immediately)
4. **Important**: Click **"Restrict Key"** for security

### Step 5: Configure API Key Restrictions
1. **API restrictions** (Choose "Restrict key"):
   - Select the APIs you enabled:
     - Maps JavaScript API
     - Geocoding API
     - Places API

2. **Application restrictions** (Choose one):
   
   **Option A: HTTP referrers (websites)**
   ```
   https://almlah.com/*
   https://www.almlah.com/*
   http://localhost:3000/* (for development)
   ```
   
   **Option B: IP addresses** (for backend)
   ```
   Your server IP address (get from Render)
   0.0.0.0/0 (less secure, allows any IP)
   ```

3. Click **"Save"**

### Step 6: Billing Setup (Required)
Google Maps requires billing to be enabled:

1. Go to **Billing** in Google Cloud Console
2. Link a payment method (credit card)
3. **Don't worry**: Google provides $200 monthly free credits
4. For most small applications, you won't be charged

### Step 7: Get Your API Key
Your API key will look like:
```
YOUR_GOOGLE_MAPS_API_KEY
```

### Step 8: Update Your Environment Variables

**Backend (.env):**
```bash
GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
```

**Frontend (.env and .env.production):**
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
```

## 🔧 Usage in Your App

Based on your code, you're using:
1. **Google Maps JavaScript API** - For interactive maps
2. **Geocoding API** - For address → coordinates conversion
3. **Places API** - For place search and details

## 💰 Pricing Information

Google Maps has generous free tiers:
- **Maps JavaScript API**: 28,000 free loads per month
- **Geocoding API**: 40,000 free requests per month  
- **Places API**: Varies by request type

For a typical small-medium app, you'll likely stay within free limits.

## 🔒 Security Best Practices

1. **Restrict your API key** (don't skip this!)
2. **Use different keys** for development and production
3. **Monitor usage** in Google Cloud Console
4. **Never commit API keys** to public repositories
5. **Rotate keys regularly**

## 🐛 Troubleshooting

### "This API project is not authorized to use this API"
**Solution**: Enable the required APIs in Google Cloud Console

### "API key not valid"  
**Solution**: Check API key restrictions match your domain

### "Billing not enabled"
**Solution**: Enable billing in Google Cloud Console (required even for free tier)

### Maps not loading
**Solution**: Check browser console for specific error messages

## 📝 Notes for Your Project

Looking at your current `.env` file, you already have:
```
GOOGLE_MAP_API_KEY="YOUR_GOOGLE_MAPS_API_KEY"
```

**This might be:**
1. A test/demo key (may have restrictions)
2. An existing key you created
3. Check if this key works in Google Cloud Console

**To verify**: Go to Google Cloud Console → APIs & Services → Credentials and see if this key exists.