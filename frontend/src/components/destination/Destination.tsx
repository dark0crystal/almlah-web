"use client"
import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import DestinationCardWrapper from './DestinationCardsWrapper';
import DestinationsMap from './DestinationsMap';
import type { Destination, GovernorateData, GovernorateImage } from './types';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_HOST || 'http://localhost:9000';

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
const getPrimaryImage = (images: GovernorateImage[] | undefined): string | null => {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return null;
  }
  
  // Find primary image or use first image
  const primaryImage = images.find(img => img.is_primary) || images[0];
  return primaryImage?.url || primaryImage?.image_url || null;
};

// Function to transform API data to component format
const transformGovernorateData = (governorates: GovernorateData[], locale: string): Destination[] => {
  return governorates.map((gov, index) => ({
    id: gov.id,
    name: locale === 'ar' ? gov.name_ar : gov.name_en,
    category: locale === 'ar' ? gov.subtitle_ar : gov.subtitle_en,
    image: getPrimaryImage(gov.images),
    coordinates: {
      x: gov.longitude ? ((gov.longitude + 180) * 100) / 360 : 50 + (index * 5),
      y: gov.latitude ? ((90 - gov.latitude) * 100) / 180 : 50 + (index * 3)
    },
    rating: 4.5,
    isFavorite: false,
    governorateData: gov
  }));
};

export default function Destination() {
  const [destinationList, setDestinationList] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlightedDestination, setHighlightedDestination] = useState<number | null>(null);
  const locale = useLocale();
  const t = useTranslations('destinations');

  // Fetch governorates data on component mount
  useEffect(() => {
    const loadGovernorates = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const governorates = await fetchGovernoratesFromAPI();
        const transformedData = transformGovernorateData(governorates, locale);
        
        setDestinationList(transformedData);
      } catch (error) {
        console.error('Failed to load governorates:', error);
        setError(t('errors.loadFailed'));
      } finally {
        setLoading(false);
      }
    };

    loadGovernorates();
  }, [locale, t]);

  // Handle marker click - highlight corresponding card
  const handleMarkerClick = (destinationId: number) => {
    setHighlightedDestination(destinationId);
  };

  // Clear highlight
  const handleClearHighlight = () => {
    setHighlightedDestination(null);
  };

  // Retry function
  const handleRetry = () => {
    setDestinationList([]);
    setError(null);
    
    const loadGovernorates = async () => {
      try {
        setLoading(true);
        const governorates = await fetchGovernoratesFromAPI();
        const transformedData = transformGovernorateData(governorates, locale);
        setDestinationList(transformedData);
      } catch (error) {
        setError(t('errors.loadFailed'));
        console.log(error)
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
        <div className="flex flex-col md:flex-row h-[78vh]">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className={`text-gray-600 ${locale === 'ar' ? 'font-arabic' : ''}`}>
                {t('loading')}
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
        <div className="flex flex-col md:flex-row h-[78vh]">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h3 className={`text-lg font-semibold text-red-800 mb-2 ${locale === 'ar' ? 'font-arabic' : ''}`}>
                {t('errors.title')}
              </h3>
              <p className={`text-red-700 mb-4 ${locale === 'ar' ? 'font-arabic' : ''}`}>
                {error}
              </p>
              <button
                onClick={handleRetry}
                className={`bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors ${locale === 'ar' ? 'font-arabic' : ''}`}
              >
                {t('errors.retry')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[88vw] mt-8">
      {/* Title Section */}
      <div className="mt-10 mb-6">
        <div></div>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {t('title')}
          </h1>
          <p className="text-lg text-gray-600">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* Desktop/Tablet Layout */}
      <div className="hidden md:flex h-[78vh] gap-4">
        <div className="flex-[1] w-72">
          <DestinationCardWrapper 
            destinations={destinationList} 
            highlightedDestination={highlightedDestination}
            onDestinationHighlight={handleClearHighlight}
          />
        </div>
        <div className="flex-[4]">
          <DestinationsMap 
            destinations={destinationList}
            language={locale}
            onMarkerClick={handleMarkerClick}
          />
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden relative">
        <div className="h-[78vh] w-full">
          <DestinationsMap 
            destinations={destinationList}
            language={locale}
            onMarkerClick={handleMarkerClick}
          />
        </div>
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <DestinationCardWrapper 
            destinations={destinationList} 
            highlightedDestination={highlightedDestination}
            onDestinationHighlight={handleClearHighlight}
          />
        </div>
      </div>
    </div>
  );
}