"use client"
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, User, AlertTriangle, CheckCircle, Loader } from 'lucide-react';

// API service for authentication
const API_HOST = 'http://127.0.0.1:9000';

const authAPI = {
  register: async (userData) => {
    const response = await fetch(`${API_HOST}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  login: async (credentials) => {
    const response = await fetch(`${API_HOST}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  googleAuth: async (token) => {
    const response = await fetch(`${API_HOST}/api/v1/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  forgotPassword: async (email) => {
    const response = await fetch(`${API_HOST}/api/v1/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  },

  getProfile: async (token) => {
    const response = await fetch(`${API_HOST}/api/v1/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.error);
    return data.data;
  }
};

// Google Sign-In component (you'll need to add Google SDK)
const GoogleSignIn = ({ onSuccess, onError, disabled }) => {
  const handleGoogleSignIn = async () => {
    try {
      // This is a placeholder - you'll need to implement actual Google Sign-In
      // Using Google Identity Services or similar
      console.log('Google Sign-In clicked');
      onError('Google Sign-In not implemented yet. Please use email/password.');
    } catch (error) {
      onError(error.message);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={disabled}
      className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
    >
      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Continue with Google
    </button>
  );
};

// Main Authentication Component
const AuthComponent = ({ initialMode = 'login', onAuthSuccess }) => {
  const [mode, setMode] = useState(initialMode); // 'login', 'register', 'forgot'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    firstName: '',
    lastName: ''
  });

  // Clear messages when mode changes
  useEffect(() => {
    setError('');
    setSuccess('');
  }, [mode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const validateForm = () => {
    if (mode === 'register') {
      if (!formData.username.trim()) return 'Username is required';
      if (formData.username.length < 3) return 'Username must be at least 3 characters';
      if (!formData.firstName.trim()) return 'First name is required';
      if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
    }
    
    if (mode !== 'forgot') {
      if (!formData.email.trim()) return 'Email is required';
      if (!/\S+@\S+\.\S+/.test(formData.email)) return 'Email is invalid';
      if (!formData.password.trim()) return 'Password is required';
      if (formData.password.length < 6) return 'Password must be at least 6 characters';
    } else {
      if (!formData.email.trim()) return 'Email is required';
      if (!/\S+@\S+\.\S+/.test(formData.email)) return 'Email is invalid';
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
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
      let result;
      
      if (mode === 'login') {
        result = await authAPI.login({
          email: formData.email,
          password: formData.password
        });
        
        // Store token and user data
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        
        setSuccess('Login successful!');
        onAuthSuccess && onAuthSuccess(result);
        
      } else if (mode === 'register') {
        result = await authAPI.register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName
        });
        
        // Store token and user data
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        
        setSuccess('Registration successful! Please check your email for verification.');
        onAuthSuccess && onAuthSuccess(result);
        
      } else if (mode === 'forgot') {
        await authAPI.forgotPassword(formData.email);
        setSuccess('Password reset email sent! Please check your inbox.');
      }
      
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (result) => {
    try {
      localStorage.setItem('authToken', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      setSuccess('Google authentication successful!');
      onAuthSuccess && onAuthSuccess(result);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {mode === 'login' && 'Sign in to your account'}
            {mode === 'register' && 'Create your account'}
            {mode === 'forgot' && 'Reset your password'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {mode === 'login' && (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => setMode('register')}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign up
                </button>
              </>
            )}
            {mode === 'register' && (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign in
                </button>
              </>
            )}
            {mode === 'forgot' && (
              <>
                Remember your password?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg">
          {/* Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <AlertTriangle className="text-red-500 mr-2" size={16} />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center">
                <CheckCircle className="text-green-500 mr-2" size={16} />
                <span className="text-green-700 text-sm">{success}</span>
              </div>
            </div>
          )}

          {/* Google Sign-In (only for login and register) */}
          {(mode === 'login' || mode === 'register') && (
            <div className="mb-6">
              <GoogleSignIn
                onSuccess={handleGoogleSuccess}
                onError={setError}
                disabled={loading}
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
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username (register only) */}
            {mode === 'register' && (
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
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>
            )}

            {/* First Name & Last Name (register only) */}
            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Last name"
                  />
                </div>
              </div>
            )}

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
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password (not for forgot password) */}
            {mode !== 'forgot' && (
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
                    className="pl-10 pr-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password (register only) */}
            {mode === 'register' && (
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
                    className="pl-10 pr-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Forgot Password Link (login only) */}
            {mode === 'login' && (
              <div className="flex items-center justify-between">
                <div></div>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader className="animate-spin" size={16} />
              ) : (
                <>
                  {mode === 'login' && 'Sign In'}
                  {mode === 'register' && 'Create Account'}
                  {mode === 'forgot' && 'Send Reset Email'}
                </>
              )}
            </button>
          </form>

          {/* Additional Links */}
          <div className="mt-6 text-center">
            {mode === 'forgot' && (
              <button
                onClick={() => setMode('login')}
                className="text-sm text-gray-600 hover:text-gray-500"
              >
                ← Back to Sign In
              </button>
            )}
          </div>
        </div>

        {/* Terms and Privacy (register only) */}
        {mode === 'register' && (
          <div className="text-center">
            <p className="text-xs text-gray-500">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500">
                Privacy Policy
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// User Profile Component
const UserProfile = ({ user, onLogout }) => {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    firstName: user?.first_name || '',
    lastName: user?.last_name || ''
  });

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    onLogout && onLogout();
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_HOST}/api/v1/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: formData.username,
          first_name: formData.firstName,
          last_name: formData.lastName
        })
      });
      
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      
      // Update local storage
      localStorage.setItem('user', JSON.stringify(data.data.user));
      setEditing(false);
      
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Profile</h2>
        <button
          onClick={handleLogout}
          className="text-red-600 hover:text-red-800 text-sm"
        >
          Logout
        </button>
      </div>

      {editing ? (
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Username</label>
            <p className="text-lg">{user.username}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Email</label>
            <p className="text-lg">{user.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Full Name</label>
            <p className="text-lg">{user.full_name || 'Not provided'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Account Type</label>
            <p className="text-lg capitalize">{user.user_type}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Login Method</label>
            <p className="text-lg capitalize">{user.provider}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Email Verified</label>
            <p className="text-lg">
              {user.is_verified ? (
                <span className="text-green-600">✓ Verified</span>
              ) : (
                <span className="text-red-600">✗ Not Verified</span>
              )}
            </p>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Edit Profile
          </button>
        </div>
      )}
    </div>
  );
};

// Main Auth App Component
const AuthApp = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const handleAuthSuccess = (result) => {
    setUser(result.user);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user ? (
        <div className="container mx-auto py-8 px-4">
          <UserProfile user={user} onLogout={handleLogout} />
        </div>
      ) : (
        <AuthComponent onAuthSuccess={handleAuthSuccess} />
      )}
    </div>
  );
};

export default AuthApp;