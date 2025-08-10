"use client"
import React, { useState, useEffect } from 'react';
import { MapPin, AlertCircle, Loader2 } from 'lucide-react';
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

// Function to get display name based on language preference
const getDisplayName = (governorate, language = 'ar') => {
  return language === 'ar' ? governorate.name_ar : governorate.name_en;
};

// Function to get display subtitle based on language preference
const getDisplaySubtitle = (governorate, language = 'ar') => {
  return language === 'ar' ? governorate.subtitle_ar : governorate.subtitle_en;
};

// Function to transform API data to component format
const transformGovernorateData = (governorates, language = 'ar') => {
  return governorates.map((gov, index) => ({
    id: gov.id,
    name: getDisplayName(gov, language),
    category: getDisplaySubtitle(gov, language) || getDisplayName(gov, language === 'ar' ? 'en' : 'ar'),
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
  const [language, setLanguage] = useState('ar'); // 'ar' or 'en'

  // Fetch governorates data on component mount
  useEffect(() => {
    const loadGovernorates = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const governorates = await fetchGovernoratesFromAPI();
        const transformedData = transformGovernorateData(governorates, language);
        
        setDestinationList(transformedData);
      } catch (err) {
        console.error('Failed to load governorates:', err);
        setError('Failed to load governorates. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadGovernorates();
  }, [language]);

  // Retry function
  const handleRetry = () => {
    setDestinationList([]);
    setError(null);
    
    // Re-trigger the useEffect
    const loadGovernorates = async () => {
      try {
        setLoading(true);
        const governorates = await fetchGovernoratesFromAPI();
        const transformedData = transformGovernorateData(governorates, language);
        setDestinationList(transformedData);
      } catch (err) {
        setError('Failed to load governorates. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadGovernorates();
  };

  // Toggle language
  const toggleLanguage = () => {
    const newLanguage = language === 'ar' ? 'en' : 'ar';
    setLanguage(newLanguage);
    
    // Transform existing data with new language
    if (destinationList.length > 0) {
      const governorates = destinationList.map(dest => dest.governorateData);
      const transformedData = transformGovernorateData(governorates, newLanguage);
      setDestinationList(transformedData);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-[88vw]">
        <div className="flex flex-col md:flex-row h-[80vh]">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading governorates...</p>
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
              <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Data</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[88vw]">
      {/* Language Toggle */}
      <div className="mb-4 flex justify-end">
        <button
          onClick={toggleLanguage}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          {language === 'ar' ? 'English' : 'العربية'}
        </button>
      </div>

      <div className="flex flex-col md:flex-row h-[80vh]">
        {/* Map Section - Top on mobile, Right on desktop */}
        <div className="flex-1 order-1 md:order-2 md:mx-4">
          <DestinationsMap 
            destinations={destinationList}
            language={language}
          />
        </div>

        {/* Destinations Cards Wrapper - Bottom on mobile, Left on desktop */}
        <div className="flex-shrink-0 order-2 md:order-1">
          <DestinationCardWrapper
            destinations={destinationList}
            language={language}
          />
        </div>
      </div>

      {/* Data Source Info */}
      <div className="mt-4 text-center text-sm text-gray-500">
        <p>
          {language === 'ar' 
            ? `عرض ${destinationList.length} محافظة عمانية` 
            : `Showing ${destinationList.length} Omani Governorates`
          }
        </p>
      </div>
    </div>
  );
}