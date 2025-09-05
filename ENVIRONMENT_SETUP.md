# Environment Variables Setup Guide

This guide explains how to set up environment variables for both the frontend and backend applications.

## Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
# Server Configuration
HTTP_PORT=9000
APP_ENV=dev

# Database Configuration
DATABASE_URL=postgres://username:password@localhost:5432/almlah_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_REDIRECT_URL=http://localhost:9000/api/v1/auth/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Email Configuration (optional)
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Google Maps API Configuration
GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here
SUPABASE_STORAGE_BUCKET=your-storage-bucket-name
```

## Frontend Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```bash
# API Configuration
NEXT_PUBLIC_API_HOST=http://localhost:9000

# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here

# App Configuration
NEXT_PUBLIC_APP_NAME=Almlah
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## Getting Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Choose "Web application"
6. Add authorized JavaScript origins:
   - `http://localhost:3000` (for development)
   - `https://yourdomain.com` (for production)
7. Add authorized redirect URIs:
   - `http://localhost:9000/api/v1/auth/google/callback` (for development)
   - `https://yourdomain.com/api/v1/auth/google/callback` (for production)
8. Copy the Client ID and Client Secret

## Getting Supabase Credentials

1. Go to the [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or select an existing one
3. Go to "Settings" → "API"
4. Copy the following values:
   - **Project URL** (use as `SUPABASE_URL`)
   - **Service Role Key** (use as `SUPABASE_SERVICE_ROLE_KEY`)
5. Go to "Storage" → "Buckets"
6. Create a new bucket or use an existing one
7. Copy the bucket name (use as `SUPABASE_STORAGE_BUCKET`)

## Security Best Practices

1. **Never commit `.env` files to version control**
2. **Use different credentials for development and production**
3. **Rotate secrets regularly**
4. **Use strong, unique JWT secrets**
5. **Limit OAuth redirect URIs to your domains only**

## Development vs Production

### Development
- Use `localhost` URLs
- Enable debug logging
- Use development database

### Production
- Use HTTPS URLs
- Disable debug logging
- Use production database
- Use strong secrets
- Configure proper CORS origins

## Troubleshooting

### Backend Issues
- Check if `.env` file exists in `backend/` directory
- Verify all required variables are set
- Check database connection string
- Ensure Google OAuth credentials are correct

### Frontend Issues
- Check if `.env.local` file exists in `frontend/` directory
- Verify `NEXT_PUBLIC_` prefix for client-side variables
- Check browser console for environment validation errors
- Ensure API_HOST matches backend URL

### Google OAuth Issues
- Verify Client ID matches between frontend and backend
- Check authorized origins and redirect URIs
- Ensure Google+ API is enabled
- Check browser console for OAuth errors 