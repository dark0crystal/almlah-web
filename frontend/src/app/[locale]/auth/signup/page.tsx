// Simple Signup Page (Coming Soon)
'use client';
import React from 'react';
import Link from 'next/link';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Sign Up</h2>
          <p className="mt-2 text-sm text-gray-600">
            Create your account
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-lg border">
          <div className="text-center">
            <p className="text-gray-600 mb-6">
              Signup functionality coming soon!
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}