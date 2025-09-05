# Upload System Test Guide

## Backend Setup

1. **Create `.env` file in backend directory:**
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

# Google Maps API Configuration
GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here

# Supabase Configuration (REQUIRED FOR UPLOADS)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here
SUPABASE_STORAGE_BUCKET=your-storage-bucket-name
```

2. **Start the backend server:**
```bash
cd backend
go run main.go
```

## Frontend Setup

1. **Start the frontend server:**
```bash
cd frontend
npm run dev
```

## Testing Upload Functionality

### 1. Test Single File Upload

Navigate to: `http://localhost:3000/[locale]/dashboard/admin/manage-lists/[listId]/sections`

1. Click "Add New Section"
2. Fill in the form fields
3. Click "Choose image" and select an image file
4. You should see:
   - Image preview
   - "Will upload on save" message
   - Progress bar when uploading
5. Click "Add Section"
6. The image should upload and the section should be created

### 2. Test Multiple File Upload

1. In the section form, select multiple images
2. You should see:
   - Multiple image previews
   - Individual progress tracking
   - Batch upload processing
3. Save the section to test batch upload

### 3. Test Error Handling

1. Try uploading a file larger than 10MB
2. Try uploading a non-image file
3. Try uploading without internet connection
4. You should see appropriate error messages

### 4. Test Retry Mechanism

1. Temporarily disconnect internet
2. Try uploading a file
3. Reconnect internet
4. The upload should automatically retry

## API Endpoints

### Single Upload
```bash
curl -X POST http://localhost:9000/api/v1/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@image.jpg" \
  -F "folder=lists/sections"
```

### Batch Upload
```bash
curl -X POST http://localhost:9000/api/v1/upload/batch \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@image1.jpg" \
  -F "files=@image2.jpg" \
  -F "folder=lists/sections"
```

## Expected Behavior

✅ **File Validation:**
- Only image files (JPG, PNG, WebP, SVG)
- Maximum 10MB per file
- Maximum 10 files per batch

✅ **Progress Tracking:**
- Real-time upload progress
- Individual file progress in batch uploads
- Visual progress bars

✅ **Error Handling:**
- Clear error messages
- Automatic retry on failure
- Graceful degradation

✅ **Memory Management:**
- Automatic cleanup of preview URLs
- No memory leaks

✅ **User Experience:**
- Responsive design
- RTL support
- Loading states
- Success/error feedback

## Troubleshooting

### Backend Issues
- Check Supabase credentials in `.env`
- Verify database connection
- Check server logs for errors

### Frontend Issues
- Check browser console for errors
- Verify API_HOST environment variable
- Check network tab for failed requests

### Upload Issues
- Verify Supabase storage bucket exists
- Check file permissions
- Verify network connectivity
