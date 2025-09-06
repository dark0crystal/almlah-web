# Supabase Database Setup for Production

## 🗄️ Getting Your Supabase Database Connection

Since you're already using Supabase for storage, using it for your database is perfect!

### Step 1: Get Database Connection String

1. **Go to Supabase Dashboard**
   - Visit [supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project (the one with URL: `https://jeyypngrycucoystlmft.supabase.co`)

2. **Get Connection Details**
   - Go to **Settings** → **Database**
   - Find **"Connection string"** section
   - Choose **"Pooler"** for production (recommended)

3. **Your Connection String Will Look Like:**
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```

### Step 2: Database Connection String Format

You'll get something like:
```
postgresql://postgres.jeyypngrycucoystlmft:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Replace `[YOUR-PASSWORD]` with your actual database password**

### Step 3: Environment Variables Setup

**For Render Deployment:**
Add this to your Render service environment variables:

```bash
DATABASE_URL=postgresql://postgres.jeyypngrycucoystlmft:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**For Local Development:**
Update your `backend/.env` file:

```bash
DATABASE_URL=postgresql://postgres.jeyypngrycucoystlmft:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### Step 4: Database Migration/Setup

Your Go backend will automatically:
1. **Connect** to Supabase PostgreSQL
2. **Create tables** using GORM auto-migration
3. **Run migrations** if configured

### Step 5: Verify Connection

Test your connection with this Go code (already in your backend):
```go
// This is in your config/database.go
db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{})
if err != nil {
    log.Fatal("Failed to connect to database:", err)
}
```

## 🔧 Production Configuration Benefits

### Why Supabase Database is Great:
- ✅ **Same provider** as your storage (consistent)
- ✅ **Built-in connection pooling**
- ✅ **Automatic backups**
- ✅ **Real-time capabilities** (if needed later)
- ✅ **Dashboard for database management**
- ✅ **Generous free tier**: 2 databases, 500MB storage

### Connection Pooling
Supabase provides connection pooling which is perfect for production:
- **Direct connection**: Port 5432 (for local development)
- **Pooled connection**: Port 6543 (for production - recommended)

## 🚀 Updated Deployment Configuration

Your `render.yaml` now uses Supabase:
- ✅ Removed PostgreSQL service from Render
- ✅ Database connection via environment variable
- ✅ Only backend web service + Redis (optional)

## 📋 Environment Variables Checklist

Make sure these are set in Render:

```bash
# Database
DATABASE_URL=postgresql://postgres.jeyypngrycucoystlmft:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Supabase (for storage)
SUPABASE_URL=https://jeyypngrycucoystlmft.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_STORAGE_BUCKET=media-bucket

# Other configs
FRONTEND_URL=https://almlah.com
GOOGLE_MAPS_API_KEY=AIzaSyBUxLKRFGzQm6LisWYqDby-H-YsacK47j0
```

## 🔍 Finding Your Database Password

If you don't know your Supabase database password:

1. **Go to Supabase Dashboard**
2. **Settings** → **Database**
3. **Reset Database Password** if needed
4. **Copy the new password** immediately

## 🧪 Testing Connection

Test locally first:
```bash
cd backend
APP_ENV=dev go run main.go
```

Check logs for "Database connected successfully" or similar message.

## 💡 Pro Tips

1. **Use pooled connection** (port 6543) for production
2. **Keep direct connection** (port 5432) for development
3. **Enable SSL mode** for production security
4. **Monitor database usage** in Supabase dashboard
5. **Set up regular backups** (Supabase does this automatically)