"use client";
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface GovernateLoadingSkeletonProps {
  language?: 'ar' | 'en';
  showProgress?: boolean;
  loadingText?: string;
}

export default function GovernateLoadingSkeleton({ 
  language = 'ar', 
  showProgress = true,
  loadingText 
}: GovernateLoadingSkeletonProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  
  const t = useTranslations('governate.loading');

  // Loading steps for progress indication
  const loadingSteps = [
    t('governateData'),
    t('images'),
    t('wilayahs'),
    t('finalizing')
  ];

  useEffect(() => {
    if (!showProgress) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 15;
        if (newProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        return newProgress;
      });
    }, 200);

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % loadingSteps.length);
    }, 1500);

    return () => {
      clearInterval(interval);
      clearInterval(stepInterval);
    };
  }, [showProgress, loadingSteps.length]);

  const getCurrentStepText = () => {
    if (loadingText) return loadingText;
    return loadingSteps[currentStep] || t('general');
  };

  return (
    <div className="bg-white text-black min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-10">
        
        {/* Progress indicator */}
        {showProgress && (
          <div className="mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                {/* Spinner */}
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                {/* Pulse effect */}
                <div className="absolute inset-0 w-8 h-8 border-4 border-blue-300 rounded-full animate-ping opacity-20"></div>
              </div>
              <span className="ml-3 text-gray-600 font-medium">
                {getCurrentStepText()}
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(progress, 100)}%` }}
              >
                {/* Shimmer effect */}
                <div className="h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        <div className="animate-pulse">
          
          {/* Header skeleton */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full animate-pulse"></div>
              <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-32 animate-pulse"></div>
            </div>
            <div className="flex gap-2">
              <div className="w-10 h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full animate-pulse"></div>
              <div className="w-10 h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full animate-pulse"></div>
            </div>
          </div>
          
          {/* Title skeleton */}
          <div className="mb-8">
            <div className="h-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg mb-4 w-2/3 animate-pulse bg-[length:200%_100%]"></div>
            <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-full mb-2 animate-pulse bg-[length:200%_100%]"></div>
            <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-3/4 mb-4 animate-pulse bg-[length:200%_100%]"></div>
            
            {/* Stats skeleton */}
            <div className="flex flex-wrap items-center gap-6 mt-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-5 h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse`} 
                       style={{ animationDelay: `${i * 0.2}s` }}></div>
                  <div className={`h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse`}
                       style={{ 
                         width: `${60 + i * 20}px`,
                         animationDelay: `${i * 0.2}s` 
                       }}></div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Content skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Main content skeleton */}
            <div className="lg:col-span-3">
              {/* Image gallery skeleton */}
              <div className="mt-6">
                {/* Desktop layout skeleton */}
                <div className="hidden lg:block">
                  <div className="grid grid-cols-3 gap-4">
                    {/* Main large image */}
                    <div className="col-span-2">
                      <div className="w-full h-[33rem] bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 rounded-2xl animate-pulse bg-[length:200%_200%]">
                        {/* Fake image placeholder */}
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-20 h-20 text-gray-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    {/* Side images */}
                    <div className="flex flex-col gap-4">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="w-full h-64 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 rounded-2xl animate-pulse bg-[length:200%_200%]"
                             style={{ animationDelay: `${(i + 1) * 0.3}s` }}>
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-12 h-12 text-gray-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Mobile layout skeleton */}
                <div className="block lg:hidden">
                  <div className="relative w-full max-w-md mx-auto bg-white overflow-hidden shadow-lg rounded-2xl border border-gray-100">
                    <div className="w-full h-64 sm:h-80 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 animate-pulse bg-[length:200%_200%]">
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-16 h-16 text-gray-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 p-2">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="h-32 sm:h-40 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 rounded-2xl animate-pulse bg-[length:200%_200%]"
                             style={{ animationDelay: `${i * 0.2}s` }}>
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* About section skeleton */}
              <div className="mt-12">
                <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-1/3 mb-6 animate-pulse bg-[length:200%_100%]"></div>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} 
                         className={`h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-pulse bg-[length:200%_100%]`}
                         style={{ 
                           width: i === 2 ? '66.67%' : '100%',
                           animationDelay: `${i * 0.1}s`
                         }}></div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Sidebar skeleton */}
            <div className="space-y-6">
              {/* Quick info card skeleton */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 border border-blue-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-5 h-5 bg-blue-300 rounded animate-pulse"></div>
                  <div className="h-6 bg-blue-300 rounded w-24 animate-pulse"></div>
                </div>
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-300 rounded animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}></div>
                        <div className={`h-4 bg-blue-300 rounded animate-pulse`} 
                             style={{ 
                               width: i === 0 ? '64px' : '80px',
                               animationDelay: `${i * 0.1}s`
                             }}></div>
                      </div>
                      <div className="h-4 bg-blue-300 rounded w-8 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}></div>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-blue-200">
                    <div className="h-3 bg-blue-300 rounded w-16 mb-1 animate-pulse"></div>
                    <div className="h-4 bg-blue-300 rounded w-32 animate-pulse"></div>
                  </div>
                </div>
                <div className="w-full h-12 bg-blue-400 rounded-xl mt-4 animate-pulse"></div>
              </div>
              
              {/* Wilayahs card skeleton */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-5 h-5 bg-gray-300 rounded animate-pulse"></div>
                  <div className="h-6 bg-gray-300 rounded w-20 animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div>
                        <div className="h-4 bg-gray-300 rounded w-24 mb-1 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}></div>
                        <div className="h-3 bg-gray-300 rounded w-16 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}></div>
                      </div>
                      <div className="w-4 h-4 bg-gray-300 rounded animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}></div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Additional info card skeleton */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-5 h-5 bg-gray-300 rounded animate-pulse"></div>
                  <div className="h-6 bg-gray-300 rounded w-28 animate-pulse"></div>
                </div>
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="h-4 bg-gray-300 rounded w-20 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}></div>
                      <div className="h-4 bg-gray-300 rounded w-16 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Help & Support card skeleton */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                <div className="h-6 bg-gray-300 rounded w-32 mb-3 animate-pulse"></div>
                <div className="space-y-2 mb-4">
                  <div className="h-4 bg-gray-300 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4 animate-pulse"></div>
                </div>
                <div className="w-full h-10 bg-gray-300 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
          
          {/* Extra spacing */}
          <div className="h-20" />
        </div>
      </div>
    </div>
  );
}