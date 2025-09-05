"use client";
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import React from 'react';
import RestaurantImagesContainer from "./RestaurantImagesContainer";
import RestaurantAboutAndLocation from "./RestaurantAboutAndLocation";
import { fetchPlaceById } from '@/services/placesApi';
import { Place } from '@/types';
import Footer from '@/components/Footer';

interface RestaurantDetailsProps {
  params?: Promise<{
    'restaurant-id': string;
    locale?: string;
  }>;
}

export default function RestaurantDetails({ params }: RestaurantDetailsProps) {
  const [restaurant, setRestaurant] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations('restaurants.details');
  const locale = useLocale();
  const language = locale as 'ar' | 'en';
  
  // Get restaurant ID from params or URL
  const urlParams = useParams();
  const router = useRouter();
  
  // Unwrap the params promise with React.use()
  const unwrappedParams = params ? React.use(params) : null;
  
  // Extract restaurant ID - handle both cases
  const restaurantId = unwrappedParams?.['restaurant-id'] || urlParams?.['restaurant-id'] as string;
  
  console.log('RestaurantDetails - restaurantId:', restaurantId);
  console.log('RestaurantDetails - unwrappedParams:', unwrappedParams);
  console.log('RestaurantDetails - urlParams:', urlParams);

  // Load restaurant function - fetches complete data in both languages
  const loadRestaurant = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading complete restaurant data for ID:', restaurantId);
      
      // Use the complete endpoint to get both languages at once
      const restaurantData = await fetchPlaceById(restaurantId);
      
      if (!restaurantData) {
        setError(t('error.notFound'));
        return;
      }
      
      setRestaurant(restaurantData);
      console.log('Complete restaurant loaded successfully:', restaurantData);
      console.log('Restaurant has both languages:', {
        ar: { name: restaurantData.name_ar, description: restaurantData.description_ar },
        en: { name: restaurantData.name_en, description: restaurantData.description_en }
      });
      
    } catch (err) {
      console.error('Error loading restaurant:', err);
      setError(err instanceof Error ? err.message : t('error.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [restaurantId, t]);

  // Load restaurant data when component mounts
  useEffect(() => {
    if (!restaurantId) {
      console.error('No restaurant ID found in params');
      setError(t('error.notFound'));
      setLoading(false);
      return;
    }

    loadRestaurant();
  }, [restaurantId, loadRestaurant, t]);

  // Update page title
  useEffect(() => {
    if (restaurant) {
      const restaurantName = language === 'ar' ? restaurant.name_ar : restaurant.name_en;
      document.title = `${restaurantName} - ${t('title')}`;
    }
  }, [restaurant, language, t]);

  if (loading) {
    return (
      <div style={{backgroundColor: '#f3f3eb'}} className="text-black min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-10">
          {/* Loading skeleton */}
          <div className="animate-pulse">
            {/* Title skeleton */}
            <div className="mb-8">
              <div className="h-12 bg-gray-200 rounded-lg mb-4 w-2/3"></div>
              <div className="h-6 bg-gray-200 rounded w-full"></div>
            </div>
            
            {/* Image gallery skeleton */}
            <div className="mt-6">
              <div className="hidden lg:block">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <div className="w-full h-[33rem] bg-gray-200 rounded-2xl"></div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="w-full h-64 bg-gray-200 rounded-2xl"></div>
                    <div className="w-full h-64 bg-gray-200 rounded-2xl"></div>
                  </div>
                </div>
              </div>
              <div className="block lg:hidden">
                <div className="w-full h-64 bg-gray-200 rounded-2xl"></div>
              </div>
            </div>
            
            {/* Content skeleton */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-gray-200 rounded-2xl h-48"></div>
                <div className="bg-gray-200 rounded-2xl h-32"></div>
                <div className="bg-gray-200 rounded-2xl h-64"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{backgroundColor: '#f3f3eb'}} className="text-black min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-10">
          <div className="text-center py-20">
            <div className="text-red-600 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {t('error.title')}
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                {t('error.tryAgain')}
              </button>
              <button
                onClick={() => router.back()}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition-colors"
              >
                {t('error.goBack')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div style={{backgroundColor: '#f3f3eb'}} className="text-black min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-10">
          <div className="text-center py-20">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {t('error.notFound')}
            </h2>
            <p className="text-gray-600 mb-6">
              {t('error.notFoundMessage')}
            </p>
            <button
              onClick={() => router.back()}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              {t('error.goBack')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Now we have complete restaurant data with both languages
  const restaurantName = language === 'ar' ? restaurant.name_ar : restaurant.name_en;

  console.log('Rendering restaurant with complete data:', {
    id: restaurant.id,
    names: { ar: restaurant.name_ar, en: restaurant.name_en },
    descriptions: { ar: restaurant.description_ar, en: restaurant.description_en },
    imagesCount: restaurant.images?.length || 0
  });

  return (
    <div style={{backgroundColor: '#f3f3eb'}} className="text-black">
      {/* Page Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-10">
        
        {/* Navigation breadcrumb */}
        <nav className="mb-6">
          <div className="flex items-center text-sm text-gray-600">
            <button 
              onClick={() => router.back()}
              className="hover:text-gray-900 transition-colors"
            >
              {t('breadcrumbs.restaurants')}
            </button>
            <span className="mx-2">/</span>
            {restaurant.governate && (
              <>
                <span>{language === 'ar' ? restaurant.governate.name_ar : restaurant.governate.name_en}</span>
                <span className="mx-2">/</span>
              </>
            )}
            <span className="text-gray-900 font-medium">{restaurantName}</span>
          </div>
        </nav>
        
        {/* Title Only */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{restaurantName}</h1>
        </div>

        {/* Image Gallery */}
        <RestaurantImagesContainer 
          images={restaurant.images || []} 
          restaurantName={restaurantName}
        />

        {/* About and Location */}
        <RestaurantAboutAndLocation 
          restaurant={restaurant} 
          language={language} 
        />
        
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}