"use client";
import { AlertTriangle, RefreshCw, ArrowLeft, Home } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { GovernateErrorComponentProps } from '../types';

export default function GovernateErrorComponent({
  error,
  onRetry,
  onGoBack,
  onGoHome,
  showRetry = true,
  showGoBack = true,
  showGoHome = false
}: GovernateErrorComponentProps) {
  
  const t = useTranslations('governate');
  
  const isNetworkError = error.toLowerCase().includes('network') || 
                        error.toLowerCase().includes('fetch') ||
                        error.toLowerCase().includes('connection');
  
  const isNotFoundError = error.toLowerCase().includes('not found') || 
                         error.toLowerCase().includes('404') ||
                         error === t('error.notFound');

  const getErrorTitle = () => {
    if (isNotFoundError) {
      return t('error.notFound');
    }
    if (isNetworkError) {
      return t('error.connectionProblem');
    }
    return t('error.general');
  };

  const getErrorDescription = () => {
    if (isNotFoundError) {
      return t('error.notFoundDescription');
    }
    if (isNetworkError) {
      return t('error.connectionDescription');
    }
    return t('error.generalDescription');
  };

  const getErrorIcon = () => {
    if (isNotFoundError) {
      return (
        <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    }
    return <AlertTriangle className="mx-auto h-16 w-16" />;
  };

  const getErrorColor = () => {
    if (isNotFoundError) return 'text-gray-500';
    if (isNetworkError) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className="bg-white text-black min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-10">
        <div className="text-center py-20">
          
          {/* Error Icon */}
          <div className={`${getErrorColor()} mb-6`}>
            {getErrorIcon()}
          </div>
          
          {/* Error Title */}
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            {getErrorTitle()}
          </h2>
          
          {/* Error Description */}
          <p className="text-gray-600 mb-2 max-w-md mx-auto leading-relaxed">
            {getErrorDescription()}
          </p>
          
          {/* Technical Error Details (if not a user-friendly error) */}
          {!isNotFoundError && !isNetworkError && (
            <details className="mt-4 max-w-md mx-auto">
              <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                {t('loading.technicalDetails')}
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded-lg text-left">
                <code className="text-xs text-gray-700 break-all">{error}</code>
              </div>
            </details>
          )}
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            
            {/* Retry Button */}
            {showRetry && onRetry && (
              <button
                onClick={onRetry}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2 font-medium min-w-[140px]"
              >
                <RefreshCw className="w-4 h-4" />
                {t('actions.tryAgain')}
              </button>
            )}
            
            {/* Go Back Button */}
            {showGoBack && onGoBack && (
              <button
                onClick={onGoBack}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition-colors flex items-center gap-2 font-medium min-w-[140px]"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('actions.goBack')}
              </button>
            )}
            
            {/* Go Home Button */}
            {showGoHome && onGoHome && (
              <button
                onClick={onGoHome}
                className="text-blue-600 hover:text-blue-700 px-6 py-3 rounded-lg transition-colors flex items-center gap-2 font-medium min-w-[140px]"
              >
                <Home className="w-4 h-4" />
                {t('actions.homePage')}
              </button>
            )}
          </div>
          
          {/* Additional Help */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">
              {t('error.persistsMessage')}
            </p>
            
            {/* Network Status Indicator */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <div className={`w-2 h-2 rounded-full ${navigator.onLine ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>
                {navigator.onLine 
                  ? t('status.online')
                  : t('status.offline')
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}