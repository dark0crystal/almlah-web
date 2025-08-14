"use client"
import React, { useState, useEffect } from 'react';
import { MapPin, AlertCircle, Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import DestinationCardWrapper from './DestinationCardsWrapper';
import DestinationsMap from './DestinationsMap';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000';

// API function to fetch governorates
const fetchGovernoratesFromAPI = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/governates`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Handle different response structures
    if (data.success !== undefined) {
      return data.data || [];
    }
    
    if (data.data !== undefined) {
      return data.data;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching governorates:', error);
    throw error;
  }
};

// Function to get primary image from governorate images
const getPrimaryImage = (images) => {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return null;
  }
  
  // Find primary image or use first image
  const primaryImage = images.find(img => img.is_primary) || images[0];
  return primaryImage?.url || primaryImage?.image_url;
};

// Function to transform API data to component format
const transformGovernorateData = (governorates) => {
  return governorates.map((gov, index) => ({
    id: gov.id,
    name: gov.name_en, // Default to English, will be handled by locale in component
    category: gov.subtitle_en || gov.name_ar, // Default category
    image: getPrimaryImage(gov.images),
    coordinates: {
      x: gov.longitude ? ((gov.longitude + 180) * 100) / 360 : 50 + (index * 5), // Convert longitude to percentage
      y: gov.latitude ? ((90 - gov.latitude) * 100) / 180 : 50 + (index * 3) // Convert latitude to percentage
    },
    rating: 4.5, // Default rating since it's not in the API
    isFavorite: false,
    governorateData: gov // Keep original data for reference
  }));
};

export default function Destination() {
  const [destinationList, setDestinationList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const locale = useLocale(); // Get current locale
  const t = useTranslations('destinations'); // Translations

  // Fetch governorates data on component mount
  useEffect(() => {
    const loadGovernorates = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const governorates = await fetchGovernoratesFromAPI();
        const transformedData = transformGovernorateData(governorates);
        
        setDestinationList(transformedData);
      } catch (err) {
        console.error('Failed to load governorates:', err);
        setError(locale === 'ar' ? 'فشل في تحميل المحافظات. يرجى المحاولة مرة أخرى.' : 'Failed to load governorates. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadGovernorates();
  }, [locale]);

  // Retry function
  const handleRetry = () => {
    setDestinationList([]);
    setError(null);
    
    // Re-trigger the useEffect
    const loadGovernorates = async () => {
      try {
        setLoading(true);
        const governorates = await fetchGovernoratesFromAPI();
        const transformedData = transformGovernorateData(governorates);
        setDestinationList(transformedData);
      } catch (err) {
        setError(locale === 'ar' ? 'فشل في تحميل المحافظات. يرجى المحاولة مرة أخرى.' : 'Failed to load governorates. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadGovernorates();
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-[88vw]">
        <div className="flex flex-col md:flex-row h-[80vh]">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className={`text-gray-600 ${locale === 'ar' ? 'font-arabic' : ''}`}>
                {locale === 'ar' ? 'جاري تحميل المحافظات...' : 'Loading governorates...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-[88vw]">
        <div className="flex flex-col md:flex-row h-[80vh]">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h3 className={`text-lg font-semibold text-red-800 mb-2 ${locale === 'ar' ? 'font-arabic' : ''}`}>
                {locale === 'ar' ? 'خطأ في تحميل البيانات' : 'Error Loading Data'}
              </h3>
              <p className={`text-red-700 mb-4 ${locale === 'ar' ? 'font-arabic' : ''}`}>{error}</p>
              <button
                onClick={handleRetry}
                className={`bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors ${locale === 'ar' ? 'font-arabic' : ''}`}
              >
                {locale === 'ar' ? 'حاول مرة أخرى' : 'Try Again'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[88vw]">
      {/* Desktop/Tablet Layout */}
      <div className="hidden md:flex h-[80vh]">
        {/* Cards Wrapper - Slightly wider sidebar */}
        <div className="flex-[1] w-72">
          <DestinationCardWrapper destinations={destinationList} />
        </div>
        {/* Map Section - Takes major width */}
        <div className="flex-[4] ">
          <DestinationsMap 
            destinations={destinationList}
            language={locale}
          />
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden relative">
        {/* Map Section - Full height background on mobile */}
        <div className="h-[80vh] w-full">
          <DestinationsMap 
            destinations={destinationList}
            language={locale}
          />
        </div>

        {/* Cards Wrapper - Overlay at bottom on mobile */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <DestinationCardWrapper destinations={destinationList} />
        </div>
      </div>

      
    </div>
  );
}