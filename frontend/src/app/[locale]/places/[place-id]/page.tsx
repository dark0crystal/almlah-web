"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from "@/components/Header";
import ImagesContainer from "./ImagesContainer";
import AboutAndLocation from "./AboutAndLocation";
import { fetchPlaceById } from '@/services/placesApi';
import { Place } from '@/types';

interface PlaceDetailsProps {
  params?: {
    'place-id': string; // Match your file structure
  };
}

export default function PlaceDetails({ params }: PlaceDetailsProps) {
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [language] = useState<'ar' | 'en'>('ar'); // You can make this dynamic
  
  // Get place ID from params or URL
  const urlParams = useParams();
  const router = useRouter();
  
  // Extract place ID - handle both cases
  const placeId = params?.['place-id'] || urlParams?.['place-id'] as string;
  
  console.log('PlaceDetails - placeId:', placeId);
  console.log('PlaceDetails - params:', params);
  console.log('PlaceDetails - urlParams:', urlParams);

  // Updated loadPlace function - now fetches complete data in both languages
  const loadPlace = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading complete place data for ID:', placeId);
      
      // NEW: Use the complete endpoint to get both languages at once
      const placeData = await fetchPlaceById(placeId);
      
      if (!placeData) {
        setError('المكان غير موجود');
        return;
      }
      
      setPlace(placeData);
      console.log('Complete place loaded successfully:', placeData);
      console.log('Place has both languages:', {
        ar: { name: placeData.name_ar, description: placeData.description_ar },
        en: { name: placeData.name_en, description: placeData.description_en }
      });
      
    } catch (err) {
      console.error('Error loading place:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحميل بيانات المكان');
    } finally {
      setLoading(false);
    }
  };

  // Updated useEffect - removed language dependency since we get both languages
  useEffect(() => {
    if (!placeId) {
      console.error('No place ID found in params');
      setError('معرف المكان غير موجود');
      setLoading(false);
      return;
    }

    loadPlace();
  }, [placeId]); // Removed language from dependency array

  // Update page title
  useEffect(() => {
    if (place) {
      const placeName = language === 'ar' ? place.name_ar : place.name_en;
      document.title = `${placeName} - دليل الأماكن`;
    }
  }, [place, language]);

  if (loading) {
    return (
      <div className="bg-white text-black min-h-screen">
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
      <div className="bg-white text-black min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-10">
          <div className="text-center py-20">
            <div className="text-red-600 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {language === 'ar' ? 'عذراً، لم نتمكن من تحميل بيانات المكان' : 'Sorry, we could not load the place data'}
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                {language === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
              </button>
              <button
                onClick={() => router.back()}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition-colors"
              >
                {language === 'ar' ? 'العودة' : 'Go Back'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="bg-white text-black min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-10">
          <div className="text-center py-20">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {language === 'ar' ? 'المكان غير موجود' : 'Place not found'}
            </h2>
            <p className="text-gray-600 mb-6">
              {language === 'ar' 
                ? 'لم يتم العثور على المكان المطلوب أو قد يكون غير متاح حالياً'
                : 'The requested place was not found or may be currently unavailable'
              }
            </p>
            <button
              onClick={() => router.back()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              {language === 'ar' ? 'العودة' : 'Go Back'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Now we have complete place data with both languages
  const placeName = language === 'ar' ? place.name_ar : place.name_en;
  const placeDescription = language === 'ar' ? place.description_ar : place.description_en;
  const placeSubtitle = language === 'ar' ? place.subtitle_ar : place.subtitle_en;

  console.log('Rendering place with complete data:', {
    id: place.id,
    names: { ar: place.name_ar, en: place.name_en },
    descriptions: { ar: place.description_ar, en: place.description_en },
    imagesCount: place.images?.length || 0
  });

  return (
    <div className="bg-white text-black">
      {/* Page Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-10">
        
        {/* Navigation breadcrumb */}
        <nav className="mb-6">
          <div className="flex items-center text-sm text-gray-600">
            <button 
              onClick={() => router.back()}
              className="hover:text-gray-900 transition-colors"
            >
              {language === 'ar' ? 'الأماكن' : 'Places'}
            </button>
            <span className="mx-2">/</span>
            {place.governate && (
              <>
                <span>{language === 'ar' ? place.governate.name_ar : place.governate.name_en}</span>
                <span className="mx-2">/</span>
              </>
            )}
            <span className="text-gray-900 font-medium">{placeName}</span>
          </div>
        </nav>
        
        {/* Title & Description */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{placeName}</h1>
          <p className="text-lg text-gray-700">
            {placeDescription || placeSubtitle || (language === 'ar' 
              ? 'استكشف هذا المكان الرائع' 
              : 'Explore this amazing place'
            )}
          </p>
          
          {/* Additional metadata */}
          <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-600">
            {place.governate && (
              <span className="flex items-center gap-1">
                📍 {language === 'ar' ? place.governate.name_ar : place.governate.name_en}
              </span>
            )}
            
            {place.rating && place.rating > 0 && (
              <span className="flex items-center gap-1">
                ⭐ {place.rating.toFixed(1)}
                {place.review_count && place.review_count > 0 && (
                  <span className="text-gray-400">({place.review_count})</span>
                )}
              </span>
            )}
            
            {place.categories && place.categories.length > 0 && (
              <span className="flex items-center gap-1">
                🏷️ {language === 'ar' ? place.categories[0].name_ar : place.categories[0].name_en}
              </span>
            )}
          </div>
        </div>

        {/* Image Gallery */}
        <ImagesContainer 
          images={place.images || []} 
          placeName={placeName}
        />

        {/* About and Location */}
        <AboutAndLocation 
          place={place} 
          language={language} 
        />
        
        {/* Extra spacing */}
        <div className="h-20" />
      </div>
    </div>
  );
}