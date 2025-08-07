"use client"
import React from 'react';
import { usePlaceStore } from '../../../stores/usePlaceStore';
import { CheckCircleIcon, HomeIcon, PlusIcon } from '@heroicons/react/24/solid';

export const SuccessStep: React.FC = () => {
  const { resetForm } = usePlaceStore();

  const handleAddAnother = () => {
    resetForm();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="text-center space-y-8 py-12">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center">
          <CheckCircleIcon className="w-16 h-16 text-white" />
        </div>
      </div>

      {/* Success Message */}
      <div className="space-y-4">
        <h2 className="text-3xl font-bold text-gray-900">
          🎉 Success! Your place has been added!
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Thank you for adding your place to our platform. It will be reviewed by our team and published soon. 
          You will receive a notification once it is live.
        </p>
      </div>

      {/* What's Next */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 mx-auto max-w-2xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">What happens next?</h3>
        <div className="text-left space-y-2 text-sm text-gray-700">
          <div className="flex items-start space-x-3">
            <span className="text-green-500 font-bold">1.</span>
            <span>Our team will review your submission within 24-48 hours</span>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-green-500 font-bold">2.</span>
            <span>You will receive an email notification once approved</span>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-green-500 font-bold">3.</span>
            <span>Your place will be visible to visitors and can receive reviews</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
        <button
          onClick={handleAddAnother}
          className="px-8 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add Another Place</span>
        </button>
        
        <button
          onClick={handleGoHome}
          className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          <HomeIcon className="w-5 h-5" />
          <span>Go to Homepage</span>
        </button>
      </div>

      {/* Support */}
      <div className="pt-8 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          Need help or have questions? Contact our support team at{' '}
          <a href="mailto:support@example.com" className="text-blue-500 hover:underline">
            support@example.com
          </a>
        </p>
      </div>
    </div>
  );
};