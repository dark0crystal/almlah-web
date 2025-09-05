// Auth types for the authentication module
import { ChangeEvent, FormEvent } from 'react';

// API Response Types
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Authentication Data Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface AuthResult {
  token: string;
  user: User;
  expires_in?: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  profile?: UserProfile;
}

export interface UserProfile {
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
}

// Re-export Google types from existing component types
export type { GoogleCredentialResponse } from '@/components/auth/types';

export interface GoogleSignInProps {
  onSuccess: (result: AuthResult) => void;
  onError: (error: string) => void;
  disabled: boolean;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  first_name: string;
  last_name: string;
}

// Component Props Types
export interface AuthFormProps {
  loading?: boolean;
  error?: string;
  success?: string;
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void;
}

export interface FormInputProps {
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}

// Event Handler Types
export type InputChangeHandler = (e: ChangeEvent<HTMLInputElement>) => void;
export type FormSubmitHandler = (e: FormEvent<HTMLFormElement>) => void;
export type ButtonClickHandler = () => void;

// Validation Types
export interface FormErrors {
  [key: string]: string;
}

export type ValidationRule = (value: string) => string | null;

export interface ValidationRules {
  [fieldName: string]: ValidationRule[];
}

// Auth API Service Types
export interface AuthAPI {
  login?: (credentials: LoginCredentials) => Promise<AuthResult>;
  register?: (userData: RegisterData) => Promise<AuthResult>;
  googleAuth: (token: string) => Promise<AuthResult>;
  logout?: () => Promise<void>;
  refreshToken?: (token: string) => Promise<AuthResult>;
}

export interface LoginAuthAPI {
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  googleAuth: (token: string) => Promise<AuthResult>;
}

export interface SignupAuthAPI {
  register: (userData: RegisterData) => Promise<AuthResult>;
  googleAuth: (token: string) => Promise<AuthResult>;
}

// Auth Store Types (for Zustand integration)
export interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: () => boolean;
  isLoading: boolean;
  isInitialized: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  initialize: () => void;
}

// Environment Configuration Types
export interface AuthConfig {
  API_HOST: string;
  GOOGLE_CLIENT_ID?: string;
}

// Route Types
export interface AuthPageParams {
  locale: string;
}

export interface AuthSearchParams {
  redirect?: string;
  error?: string;
  message?: string;
}

// Translation Types
export interface AuthTranslations {
  title: string;
  subtitle: string;
  signIn: string;
  signUp: string;
  signupLink: string;
  loginLink: string;
  emailLabel: string;
  emailPlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  forgotPassword: string;
  orContinueWith: string;
  continueWithGoogle: string;
  signingIn: string;
  loginSuccess: string;
  googleLoginSuccess: string;
  checkingAuth: string;
  alreadyLoggedIn: string;
  errors: {
    emailRequired: string;
    emailInvalid: string;
    passwordRequired: string;
    googleLoadFailed: string;
    googleNotConfigured: string;
    googleNotLoaded: string;
  };
}

// Error Types
export interface AuthError {
  code: string;
  message: string;
  details?: unknown;
}

export type AuthErrorCode = 
  | 'INVALID_CREDENTIALS'
  | 'USER_NOT_FOUND'
  | 'EMAIL_ALREADY_EXISTS'
  | 'WEAK_PASSWORD'
  | 'NETWORK_ERROR'
  | 'GOOGLE_AUTH_FAILED'
  | 'TOKEN_EXPIRED'
  | 'UNAUTHORIZED';

// Loading States
export type AuthLoadingState = 
  | 'idle'
  | 'submitting'
  | 'redirecting'
  | 'initializing';

// Success States
export type AuthSuccessState =
  | 'login_success'
  | 'registration_success'
  | 'google_auth_success'
  | 'logout_success';