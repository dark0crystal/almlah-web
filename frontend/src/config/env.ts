// Frontend Environment Configuration
export const env = {
  // API Configuration
  API_HOST: process.env.NEXT_PUBLIC_API_HOST || 'http://localhost:9000',
  
  // Google OAuth Configuration
  GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
  
  // App Configuration
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Almlah',
  APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
};

// Validation function to ensure required environment variables are set
export const validateEnv = () => {
  const required = ['GOOGLE_CLIENT_ID'];
  const missing = required.filter(key => !env[key as keyof typeof env]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    console.error('Please set the following environment variables:');
    missing.forEach(key => {
      console.error(`  NEXT_PUBLIC_${key}`);
    });
    return false;
  }
  
  return true;
};

// Development helper to show environment status
if (process.env.NODE_ENV === 'development') {
  console.log('Environment Configuration:', {
    API_HOST: env.API_HOST,
    GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID ? 'Set' : 'Not Set',
    APP_NAME: env.APP_NAME,
  });
} 