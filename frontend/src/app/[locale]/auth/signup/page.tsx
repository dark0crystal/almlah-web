// app/auth/signup/page.tsx - Updated to work with new auth store
"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff, Mail, Lock, User, AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import { env, validateEnv } from '@/config/env';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import {
  SignupAuthAPI,
  GoogleCredentialResponse,
  GoogleSignInProps,
  RegisterData,
  AuthResult,
  SignupFormData,
  InputChangeHandler,
  FormSubmitHandler
} from '../types';

// Validate environment variables on component mount
if (typeof window !== 'undefined') {
  validateEnv();
}

// API Service
const authAPI: SignupAuthAPI = {
  register: async (userData: RegisterData): Promise<AuthResult> => {
    const response = await fetch(`${env.API_HOST}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    if (!data.success) {
      throw new Error(data.error || 'Registration failed');
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

  const handleCredentialResponse = useCallback(async (response: GoogleCredentialResponse) => {
    console.log('Google credential response received:', response);
    setLoading(true);
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
        onError('Google Sign-In not configured. Please contact support.');
        return;
      }
      
      window.google.accounts.id.initialize({
        client_id: env.GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Render the button
      const buttonElement = document.getElementById('google-signup-button');
      if (buttonElement) {
        window.google.accounts.id.renderButton(
          buttonElement,
          { 
            theme: 'outline', 
            size: 'large',
            width: '100%',
            text: 'continue_with'
          }
        );
      }
      console.log('Google Sign-In button rendered');
    } else {
      console.error('Google Identity Services not available');
    }
  }, [onError, handleCredentialResponse]);

  React.useEffect(() => {
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
      onError('Failed to load Google Sign-In. Please refresh the page.');
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [initializeGoogleSignIn, onError]);

  const handleGoogleSignIn = () => {
    if (googleLoaded && typeof window !== 'undefined' && window.google?.accounts) {
      console.log('Prompting Google Sign-In...');
      window.google.accounts.id.prompt();
    } else {
      console.error('Google Sign-In not loaded');
      onError('Google Sign-In not loaded. Please refresh the page.');
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={disabled || !googleLoaded || loading}
        className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
      >
        {loading ? (
          <Loader className="animate-spin mr-2" size={16} />
        ) : (
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )}
        {loading ? 'Signing up...' : 'Continue with Google'}
      </button>
      <div id="google-signup-button" className="mt-2"></div>
    </div>
  );
};

// Signup Form Component
const SignupForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    first_name: '',
    last_name: ''
  });

  // Zustand store hooks
  const { login } = useAuthStore();
  const router = useRouter();

  const handleInputChange: InputChangeHandler = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.email.trim()) return 'Email is required';
    if (!/\S+@\S+\.\S+/.test(formData.email)) return 'Email is invalid';
    if (!formData.password.trim()) return 'Password is required';
    if (formData.password.length < 6) return 'Password must be at least 6 characters';
    if (!formData.username.trim()) return 'Username is required';
    if (formData.username.length < 3) return 'Username must be at least 3 characters';
    if (!formData.first_name.trim()) return 'First name is required';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
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
      const result = await authAPI.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name
      });
      
      console.log('Registration successful:', result);
      
      // Check if the registration response includes a token (auto-login)
      if (result.token) {
        // User is automatically logged in after registration
        await login(result.token);
        setSuccess('Registration successful! Redirecting to dashboard...');
        
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        // User needs to verify email before login
        setSuccess('Registration successful! Please check your email for verification.');
        
        // Redirect to login page after showing success message
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      }
      
    } catch (error) {
      console.error('Registration error:', error);
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (result: AuthResult) => {
    try {
      setLoading(true);
      setError('');
      
      // Use Zustand store for Google auth
      await login(result.token);
      
      setSuccess('Google signup successful! Redirecting to dashboard...');
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
      
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
            Create account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Sign in
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
                <span className="px-2 bg-white text-gray-500">Or continue with email</span>
              </div>
            </div>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="First name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Last name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 pr-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your password"
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

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="pl-10 pr-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
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
                'Create Account'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Main Signup Page Component
const SignupPage = () => {
  const { isAuthenticated, isLoading, isInitialized } = useAuthStore();
  const router = useRouter();

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
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render signup form if user is already authenticated
  if (isAuthenticated()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="text-green-500 mx-auto mb-4" size={32} />
          <p className="text-gray-600">Already logged in! Redirecting...</p>
        </div>
      </div>
    );
  }

  return <SignupForm />;
};

export default SignupPage;