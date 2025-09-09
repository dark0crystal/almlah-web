// app/auth/login/page.tsx - Updated to work with new auth store
"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff, Mail, Lock, User, AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import { env, validateEnv } from '@/config/env';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useTranslations } from 'next-intl';
import {
  LoginAuthAPI,
  GoogleCredentialResponse,
  GoogleSignInProps,
  LoginCredentials,
  AuthResult,
  LoginFormData,
  InputChangeHandler,
  FormSubmitHandler
} from '../types';

// Validate environment variables on component mount
if (typeof window !== 'undefined') {
  validateEnv();
}

// API Service
const authAPI: LoginAuthAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResult> => {
    const response = await fetch(`${env.API_HOST}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    if (!data.success) {
      throw new Error(data.error || 'Authentication failed');
    }
    
    return data.data;
  },

  googleAuth: async (token: string): Promise<AuthResult> => {
    console.log('Sending Google auth request with token:', token.substring(0, 50) + '...');
    const response = await fetch(`${env.API_HOST}/api/v1/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    
    console.log('Google auth response status:', response.status);
    const data = await response.json();
    console.log('Google auth response data:', data);
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    if (!data.success) {
      throw new Error(data.error || 'Authentication failed');
    }
    
    return data.data;
  },
};

// Google Sign-In Component
const GoogleSignIn: React.FC<GoogleSignInProps> = ({ onSuccess, onError, disabled }) => {
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prompting, setPrompting] = useState(false);
  const t = useTranslations('auth.login');

  const handleCredentialResponse = useCallback(async (response: GoogleCredentialResponse) => {
    console.log('Google credential response received:', response);
    setLoading(true);
    setPrompting(false);
    try {
      const result = await authAPI.googleAuth(response.credential);
      console.log('Google auth successful:', result);
      onSuccess(result);
    } catch (error) {
      console.error('Google auth failed:', error);
      onError((error as Error).message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  const initializeGoogleSignIn = useCallback(() => {
    if (typeof window !== 'undefined' && window.google?.accounts) {
      console.log('Initializing Google Sign-In...');
      
      if (!env.GOOGLE_CLIENT_ID) {
        console.error('Google Client ID not configured');
        onError(t('errors.googleNotConfigured'));
        return;
      }
      
      window.google.accounts.id.initialize({
        client_id: env.GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      console.log('Google Sign-In initialized');
    } else {
      console.error('Google Identity Services not available');
    }
  }, [onError, t, handleCredentialResponse]);

  useEffect(() => {
    // Check if script already exists
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      if (window.google?.accounts) {
        setGoogleLoaded(true);
        initializeGoogleSignIn();
      }
      return;
    }

    // Load Google Identity Services
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('Google Identity Services loaded');
      setGoogleLoaded(true);
      initializeGoogleSignIn();
    };
    script.onerror = (error) => {
      console.error('Failed to load Google Identity Services:', error);
      onError(t('errors.googleLoadFailed'));
    };
    document.head.appendChild(script);

    return () => {
      // Don't remove script on cleanup as it's shared
    };
  }, [onError, t, initializeGoogleSignIn]);

  const handleGoogleSignIn = useCallback(() => {
    if (prompting || loading) {
      console.log('Google Sign-In already in progress, ignoring click');
      return;
    }

    if (googleLoaded && typeof window !== 'undefined' && window.google?.accounts) {
      console.log('Prompting Google Sign-In...');
      setPrompting(true);
      try {
        window.google.accounts.id.prompt();
        // Set a timeout to reset prompting state in case prompt doesn't trigger callback
        setTimeout(() => {
          setPrompting(false);
        }, 3000);
      } catch (error) {
        setPrompting(false);
        console.error('Failed to show Google prompt:', error);
        onError(t('errors.googlePromptFailed'));
      }
    } else {
      console.error('Google Sign-In not loaded');
      onError(t('errors.googleNotLoaded'));
    }
  }, [googleLoaded, prompting, loading, onError, t]);

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={disabled || !googleLoaded || loading || prompting}
      className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
    >
      {(loading || prompting) ? (
        <Loader className="animate-spin mr-2" size={16} />
      ) : (
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      )}
      {loading 
        ? t('signingIn') 
        : prompting 
          ? 'Opening Google...' 
          : t('continueWithGoogle')
      }
    </button>
  );
};

// Login Form Component
const LoginForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });

  // Zustand store hooks
  const { login } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('auth.login');

  // Get redirect path from URL params (set by PageGuard)
  const redirectTo = searchParams?.get('redirect') || '/dashboard';

  const handleInputChange: InputChangeHandler = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.email.trim()) return t('errors.emailRequired');
    if (!/\S+@\S+\.\S+/.test(formData.email)) return t('errors.emailInvalid');
    if (!formData.password.trim()) return t('errors.passwordRequired');
    return null;
  };

  const handleSubmit: FormSubmitHandler = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Call your API
      const result = await authAPI.login({
        email: formData.email,
        password: formData.password
      });
      
      console.log('Login successful:', result);
      
      // Use Zustand store to handle authentication
      await login(result.token);
      
      setSuccess(t('loginSuccess'));
      
      // Redirect to original page or dashboard
      setTimeout(() => {
        router.push(redirectTo);
      }, 1000);
      
    } catch (error) {
      console.error('Login error:', error);
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (result: AuthResult) => {
    try {
      setLoading(true);
      setError('');
      
      // Use Zustand store for Google auth too
      await login(result.token);
      
      setSuccess(t('googleLoginSuccess'));
      
      // Redirect to original page or dashboard
      setTimeout(() => {
        router.push(redirectTo);
      }, 1000);
      
    } catch (error) {
      console.error('Google auth error:', error);
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <User className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {t('title')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('subtitle')}{' '}
            <Link
              href="/auth/signup"
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              {t('signupLink')}
            </Link>
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-lg border border-gray-100">
          {/* Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <AlertTriangle className="text-red-500 mr-2 flex-shrink-0" size={16} />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center">
                <CheckCircle className="text-green-500 mr-2 flex-shrink-0" size={16} />
                <span className="text-green-700 text-sm">{success}</span>
              </div>
            </div>
          )}

          {/* Google Sign-In */}
          <div className="mb-6">
            <GoogleSignIn 
              disabled={loading} 
              onSuccess={handleGoogleSuccess}
              onError={(error) => setError(error)}
            />
            
            <div className="mt-4 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">{t('orContinueWith')}</span>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('emailLabel')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder={t('emailPlaceholder')}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('passwordLabel')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 pr-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder={t('passwordPlaceholder')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
              >
                {t('forgotPassword')}
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <Loader className="animate-spin" size={16} />
              ) : (
                t('signIn')
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Main Login Page Component
const LoginPage = () => {
  const { isAuthenticated, isLoading, isInitialized } = useAuthStore();
  const router = useRouter();
  const t = useTranslations('auth.login');

  // Initialize the auth store on first load
  useEffect(() => {
    if (!isInitialized) {
      useAuthStore.getState().initialize();
    }
  }, [isInitialized]);

  // Check if user is already authenticated
  useEffect(() => {
    if (isInitialized && !isLoading && isAuthenticated()) {
      // User is already logged in, redirect to dashboard
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, isInitialized, router]);

  // Show loading while checking auth status
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin text-blue-600 mx-auto mb-4" size={32} />
          <p className="text-gray-600">{t('checkingAuth')}</p>
        </div>
      </div>
    );
  }

  // Don't render login form if user is already authenticated
  if (isAuthenticated()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="text-green-500 mx-auto mb-4" size={32} />
          <p className="text-gray-600">{t('alreadyLoggedIn')}</p>
        </div>
      </div>
    );
  }

  return <LoginForm />;
};

export default LoginPage;