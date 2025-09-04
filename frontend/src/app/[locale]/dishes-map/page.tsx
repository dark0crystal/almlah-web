"use client"
import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { DishModal } from '@/components/modals/DishModal';
import DishesSplashScreen from './DishesSplashScreen';
import { Dish } from '@/types';
import { 
  dishesApi, 
  DishResponse,
  convertApiDishToFrontendDish,
  getDishName,
  getDishDescription
} from '@/lib/api/dishesApi';
import { 
  governoratesApi, 
  GovernorateResponse,
  getGovernorateName,
  createGovernorateMapping
} from '@/lib/api/governoratesApi';

// Map SVG IDs to our internal governorate names
const governorateMapping: { [key: string]: string } = {
  'OMMU': 'musandam',
  'OMBA': 'al-batinah-north',
  'OMBU': 'al-buraimi',
  'OMZA': 'ad-dhahirah',
  'OMZU': 'dhofar',
  'OMWU': 'al-wusta',
  'OMSH': 'alsharqiyah-south',
  'OMSS': 'alsharqiyah-north',
  'OMMA': 'muscat',
  'OMBJ': 'al-batinah-south',
  'OMDA': 'ad-dakhiliyah'
};


export default function DishesMap() {
  const [selectedGovernorate, setSelectedGovernorate] = useState<string | null>(null);
  const [selectedGovernorateData, setSelectedGovernorateData] = useState<GovernorateResponse | null>(null);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [isGovernorateModalOpen, setIsGovernorateModalOpen] = useState(false);
  const [hoveredGovernorate, setHoveredGovernorate] = useState<string | null>(null);
  const [governorates, setGovernorates] = useState<GovernorateResponse[]>([]);
  const [dishesData, setDishesData] = useState<{ [key: string]: Dish[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load governorates
        const governoratesData = await governoratesApi.getActiveGovernorates();
        setGovernorates(governoratesData);
        
        // Load all dishes grouped by governorate
        const allDishes = await dishesApi.getDishes({ 
          is_active: true, 
          page_size: 1000 // Get all active dishes
        });
        
        // Group dishes by governorate slug
        const groupedDishes: { [key: string]: Dish[] } = {};
        allDishes.dishes.forEach(dish => {
          if (dish.governate?.slug) {
            const slug = dish.governate.slug;
            if (!groupedDishes[slug]) {
              groupedDishes[slug] = [];
            }
            groupedDishes[slug].push(convertApiDishToFrontendDish(dish));
          }
        });
        
        setDishesData(groupedDishes);
      } catch (error) {
        console.error('Error loading dishes data:', error);
        setError('Failed to load dishes data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const handleGovernorateClick = async (governorateId: string) => {
    if (governorateMapping[governorateId]) {
      const mappedId = governorateMapping[governorateId];
      
      // Find the governorate data
      const governorateData = governorates.find(gov => gov.slug === mappedId);
      
      setSelectedGovernorate(mappedId);
      setSelectedGovernorateData(governorateData || null);
      setIsGovernorateModalOpen(true);
    }
  };

  const handleGovernorateHover = (governorateId: string) => {
    if (governorateMapping[governorateId]) {
      setHoveredGovernorate(governorateMapping[governorateId]);
    }
  };

  const handleGovernorateLeave = () => {
    setHoveredGovernorate(null);
  };

  const handleDishClick = (dish: Dish) => {
    setSelectedDish(dish);
    setIsDishModalOpen(true);
    setIsGovernorateModalOpen(false);
  };

  const handleCloseDishModal = () => {
    setIsDishModalOpen(false);
    setSelectedDish(null);
  };

  const handleCloseGovernorateModal = () => {
    setIsGovernorateModalOpen(false);
    setSelectedGovernorate(null);
    setSelectedGovernorateData(null);
  };

  const selectedDishes = selectedGovernorate ? dishesData[selectedGovernorate] || [] : [];
  const hoveredGovernorateData = hoveredGovernorate ? governorates.find(gov => gov.slug === hoveredGovernorate) : null;

  // Default dish image for dishes without images
  const defaultDishImage = '/dishesmapdefualt.png';

  // Generate marker positions for dishes in each governorate
  const generateMarkerPositions = (governorateId: string, dishCount: number) => {
    // Base positions for each governorate (approximate center of each region)
    const governoratePositions: { [key: string]: { x: number; y: number } } = {
      'musandam': { x: 530, y: 120 },
      'al-batinah-north': { x: 580, y: 280 },
      'al-buraimi': { x: 480, y: 250 },
      'ad-dhahirah': { x: 500, y: 350 },
      'dhofar': { x: 400, y: 700 },
      'al-wusta': { x: 500, y: 550 },
      'alsharqiyah-south': { x: 720, y: 600 },
      'alsharqiyah-north': { x: 780, y: 450 },
      'muscat': { x: 750, y: 380 },
      'al-batinah-south': { x: 650, y: 320 },
      'ad-dakhiliyah': { x: 650, y: 400 }
    };

    const basePos = governoratePositions[governorateId];
    if (!basePos || dishCount === 0) return [];

    const positions = [];
    const radius = Math.min(40, dishCount * 6); // Reduced radius for closer markers, max 40px

    if (dishCount === 1) {
      // Single dish at center
      positions.push({ x: basePos.x, y: basePos.y });
    } else {
      // Multiple dishes in circle around center
      for (let i = 0; i < dishCount; i++) {
        const angle = (2 * Math.PI * i) / dishCount;
        const x = basePos.x + radius * Math.cos(angle);
        const y = basePos.y + radius * Math.sin(angle);
        positions.push({ x, y });
      }
    }

    return positions;
  };

  // Generate all dish markers data
  const dishMarkers = useMemo(() => {
    const markers: Array<{
      id: string;
      dish: Dish;
      position: { x: number; y: number };
      image: string;
      governorate: string;
    }> = [];

    Object.entries(dishesData).forEach(([governorateSlug, dishes]) => {
      const positions = generateMarkerPositions(governorateSlug, dishes.length);
      dishes.forEach((dish, index) => {
        if (positions[index]) {
          // Use the first dish image if available, otherwise use default
          const dishImage = dish.images && dish.images.length > 0 ? dish.images[0] : defaultDishImage;
          
          markers.push({
            id: `${governorateSlug}-${dish.id}`,
            dish,
            position: positions[index],
            image: dishImage,
            governorate: governorateSlug
          });
        }
      });
    });

    return markers;
  }, [dishesData, defaultDishImage]);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  // Show splash screen first
  if (showSplash) {
    return <DishesSplashScreen onComplete={handleSplashComplete} />;
  }

  // Show loading state
  if (loading) {
    return (
      <div className="h-[92vh] max-h-[92vh] w-full flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#f3f3eb' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Omani Dishes</h2>
          <p className="text-gray-600">Please wait while we fetch traditional dishes from all governorates...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="h-[92vh] max-h-[92vh] w-full flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#f3f3eb' }}>
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Unable to Load Dishes</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[92vh] max-h-[92vh] w-full relative overflow-hidden" style={{ backgroundColor: '#f3f3eb' }}>
      {/* Header */}
      <div className="absolute top-4 left-4 z-10">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Omani Traditional Dishes</h1>
        <p className="text-gray-600 text-sm md:text-base">Click on any governorate to explore local dishes</p>
        {governorates.length > 0 && (
          <p className="text-amber-600 text-xs mt-1">
            {Object.values(dishesData).reduce((total, dishes) => total + dishes.length, 0)} dishes from {governorates.length} governorates
          </p>
        )}
      </div>
      
      {/* Hover tooltip */}
      {hoveredGovernorate && hoveredGovernorateData && (
        <div className="absolute top-20 left-4 z-10 bg-white bg-opacity-90 px-3 py-1 rounded-lg shadow-md">
          <p className="text-gray-800 font-medium">{getGovernorateName(hoveredGovernorateData)}</p>
          <p className="text-xs text-gray-500">
            {dishesData[hoveredGovernorate]?.length || 0} dishes
          </p>
        </div>
      )}

      {/* SVG Map Container */}
      <div className="w-full h-full flex items-center justify-center p-4 pt-16">
        <div className="w-full max-w-6xl h-full flex items-center justify-center">
          <svg 
            id="oman-map" 
            className="w-full h-full max-h-[75vh] drop-shadow-lg"
            baseProfile="tiny" 
            height="100%" 
            stroke="#fff6fa" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="1" 
            version="1.2" 
            viewBox="0 0 1000 1000" 
            width="100%" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <g id="features">
              {/* Musandam */}
              <path 
                d="M537.8 150.6l-0.4 2.6-2.4 1.3-2 0.7-1 0.9-2.6 1.8-1.4 0.6-1.4-0.4-1-0.5-0.1-0.5-0.1-0.4 0.2-2.4 2.4-1.2 0.8-1-0.5-0.8-0.3-0.9-0.2-1.6 2.4-1.7 2.6 0.3 1.6 2.5 3.4 0.7z m-7.4 4.3l1.7-0.6 0.5-1.6-1.3-0.9-0.7 0-0.5 0.5 0.3 2.6z m-9.6-39.2l-0.1-0.1-0.5-1.2-0.5-4.3 0.1-1.6 1-1 1.1-0.9 0.6-1.3-0.4-1.2-2-2.7-0.4-1.6 0.4-1.4 1.7-2.4 0.6-1.4 0.3-8.6 0.6-2.9 0.2-1.8-0.5-1.9-1.3-3.8-1-0.1-4.4 1.2-2 0.1 0.4-0.9 0.8-3.4 5.8-9.2 2-4.3 0.9-0.9 1.4-0.8 0.1 0.6-0.1 1.3 1 1.6-0.2 0.5-0.4 1.4 0.6 0 0.9-0.9 2.2-0.1 0.5-0.6 0.5-0.3 1.1 0.4 1.1 1.1 0.2 1.7 0.6-1.1 0.6 0.1 0.8 0.4 1-0.1 2.4-1.7 0.9-0.2 2.6 0.7 0.6-0.1 0.2-0.8-0.3-0.9-0.7-0.7-0.6-0.2-1.7-0.2-1.1 0-0.8 0.5-0.5 0.6-0.8 0.9-1 0.5-1-0.3 0-1.1 0.7-4.1 0-1.5 2.5 2 1.1 0.5 0.5-1.5-0.4-0.7-1-1-1.2-0.8-1-0.4 0.4-0.9 0.5-0.1 0.5 0 0.5-0.3 1.1-1.4 0.4-1.1-0.1-2.1 0.3-1.4 0.5 0 1.2 2.6 1.4-0.9 0.4-0.4 0.7 0.7-0.5 0.7 0 0.3 0.2 0.2 0.3 0.7 0.8-0.7 0.5 0.3 0.4 0.6 0.6 0.5 2 0.6 1.1 0.1 1.1-0.1-0.2-0.4-0.3-1.1-0.1-0.4 1.8-0.7 0.9 2.4-0.2 1-1.2 0.1-2.2-0.1-1.5 0.5-2.6 2.3-1.4 0.9 0.1 0 0 0.6-0.8 1 2 2 0.9 0.8 1.2 0.4 0.8-0.4 0.9-0.7 1-0.2 0.9 1.3-1.6 2.9-0.8 0.3-0.5-1.8-0.9 0.1-1-0.1 0.4 0.9 0 0.6-0.1 0.5-0.3 0.6 1.1 1.1 1.3 0.8 1.2 1 0.6 1.8-1-0.1-1-0.2-0.8-0.4-0.8-0.7-1.2 0.6-1.1-0.5-0.6-1.1-0.1-1.6-0.5 0.3-1.3 0.7-0.5 0.3 0-1.1 0.1-0.7 0.4-0.6 0.7-0.3-2-0.3-2.1 1.3-1.3 1.8 0.6 1.2-0.4 1-0.1 1.2 0.1 1.2 0.4 1.3 0.8-2 0.7-1 0.9-0.3 0.6 0.6 0 1.1-0.2 1.2-0.4 1 1.7 0.7 7.8-0.1-0.8 1.3-1.3 1.1-2.7 1.6-2.5 1-0.8 0.8 0.3 1.6 2.2-1.2 1.2 1.1 0.1 1.8-2 1.4 0.4 0.9 1.1 1.6 0.4 0.7 0.7 0.4 2 0.5-0.7 0.5-0.3 0.3-0.3 1.3-1.3-0.7-1.4-0.4-1.2 0.1-0.9 1 1.4 2.2-0.6 2.2-1.4 2-1.1 2-0.1 0.8 0.1 2.2-1.7 1.7-1.4 2.6-1 1.3-1.3 0.7 0-2-1.2 2-1.2 3.1-0.6 3.6 0.6 3.2 0.5 1.1-3.6 1-1.4 0.3-1.4-0.4-0.6-0.7-0.9-1.9-0.7-0.7-2.1-0.3-0.3-0.2z" 
                id="OMMU" 
                name="Musandam" 
                fill={hoveredGovernorate === 'musandam' ? '#6b7280' : '#9ca3af'}
                stroke="#fff6fa" 
                strokeWidth="2" 
                className="cursor-pointer transition-all duration-300"
                onClick={() => handleGovernorateClick('OMMU')}
                onMouseEnter={() => handleGovernorateHover('OMMU')}
                onMouseLeave={handleGovernorateLeave}
              />
              
              {/* Al Batinah North */}
              <path 
                d="M640.4 290.1l-10.1 17.7-11.2 9.7-10.7 3.5-25 1.2-1.5-2-8-30.7-25.7-22.8-13.5-6-0.6-8.3-8.5-29-11.5-15 0.1-3.9 0.1 0.1 1.9-0.1 1.6-0.5 0.8-1 0.5-1.6 1.9-2.3 1.4-3.5 1.3-0.6 3.3-0.4 1.5-0.8 2.9-2.8 0.5-0.5 2.4-1.7 0.5-1 0-0.6 0.2-1.7 0.3-3.2 0.4-0.5 0.4-0.4 4.7-0.6 1.9 7.8 5.6 11.6 0.9 1 0.6 2.2 0.6 4 10.2 19.4 2.1 2.4 4.9 4.4 9.4 11.6 1.9 3 0.8 1.8 0.8 2.7 8.5 10.3 10.3 8.8 8.1 6.6 2.8 1.8 12.3 4.8 15.9 4.2 2 0.9z" 
                id="OMBA" 
                name="Al Batinah North" 
                fill={hoveredGovernorate === 'al-batinah-north' ? '#6b7280' : '#9ca3af'}
                stroke="#fff6fa" 
                strokeWidth="2" 
                className="cursor-pointer transition-all duration-300"
                onClick={() => handleGovernorateClick('OMBA')}
                onMouseEnter={() => handleGovernorateHover('OMBA')}
                onMouseLeave={handleGovernorateLeave}
              />
              
              {/* Al Buraimi */}
              <path 
                d="M514.2 204.5l-0.1 3.9 11.5 15 8.5 29 0.6 8.3-3 9.4-10.2 0-12.7 2.7-4.8 3.3 0 7.9-5.4 2.6-3.7 4.6 3.1 13.9-6.1 3.9-11.4 3.3-9.1 5.3-11.9-1.2 2.9-11.7 0.8-1.6 4-6.1 0.4-1.2-0.3-7.2-0.4-2.7-1.4-2.1-3.1-1.9-1.5-1.3-0.7-1.7 0.3-1.4 3.7-0.7 3.7-1.4 1.7-1 2.5-1.4 2.4-0.9 2.5-0.5 2.9 0.1 2.8 0.5 1.3-0.1 1.4-0.5 1.6-0.3 2.3 1.8 1.6 0.2 10.1-4.2 5.4-1.3 1-1.5-3.2-5.8-1-4.1-1.4-3.4-2.6-1.1-4.9 2-1.4-0.1-5.4-1.2-1.1-0.5-0.1-1.4 0.7-1.7 3.3-6 0.6-1.4 0.3-4.6-0.2-0.8-0.7-0.8-1.7-1.2-0.5-0.7-0.3-1.4 0.2-5.2-1.1-4-0.1-2 0.8-1.3 1.3-1.4 0.5-3.2 2.4-2.2-0.3-1.8-1.3-3-0.4-1-0.2-1.7 0.4-3.6 0-1.8-0.7-7.3 0.9-3 2.6-3.3 2.5-2.3 0.3-0.3 3.1-1.9 3.3-0.9 3.5 0.5 0.2 0.1 2.4 1.4 1 2.9 0.7 4.2 0.3 2-2.1-1.5-1.1-0.6-1.2-0.3-1.5 0.5-0.3 1.2 0.6 1.4 3.3 3 2.5 6.5 2.7 2.2 1.2 0.1z" 
                id="OMBU" 
                name="Al Buraimi" 
                fill={hoveredGovernorate === 'al-buraimi' ? '#6b7280' : '#9ca3af'}
                stroke="#fff6fa" 
                strokeWidth="2" 
                className="cursor-pointer transition-all duration-300"
                onClick={() => handleGovernorateClick('OMBU')}
                onMouseEnter={() => handleGovernorateHover('OMBU')}
                onMouseLeave={handleGovernorateLeave}
              />
              
              {/* Ad Dhahirah */}
              <path 
                d="M534.7 260.7l13.5 6 25.7 22.8 8 30.7 1.5 2-16.6 74.7-13.8 41.7-17.2 22.3-60.8 13.5-2.1 0.4 3.3-10.5-0.1-2.2-0.9-2-4.6-7.7-7-11.7-7-11.7-7-11.7-7-11.7-5.5-9.2 0.9-13.7-0.5-13.8 0.3-2.8 2.7-9 8.2-14.5 2-5.8 1.8-9.4 0.9-3.2 1.7-2.4 3.2-3.6 1.2-1.8 11.9 1.2 9.1-5.3 11.4-3.3 6.1-3.9-3.1-13.9 3.7-4.6 5.4-2.6 0-7.9 4.8-3.3 12.7-2.7 10.2 0 3-9.4z" 
                id="OMZA" 
                name="Ad Dhahirah" 
                fill={hoveredGovernorate === 'ad-dhahirah' ? '#6b7280' : '#9ca3af'}
                stroke="#fff6fa" 
                strokeWidth="2" 
                className="cursor-pointer transition-all duration-300"
                onClick={() => handleGovernorateClick('OMZA')}
                onMouseEnter={() => handleGovernorateHover('OMZA')}
                onMouseLeave={handleGovernorateLeave}
              />
              
              {/* Dhofar */}
              <path 
                d="M450.8 546.4l1.1 1.8 105.7 176.5 75.2 20.2-20.6 3.3-10.7 3-14.6 6.1-5.6 4.1-3.7 1.8-2 1.6-0.9 1.9-0.7 1-9.2 9.3-1.7 3.3-0.3 4.3 0.5 3 0.1 1-0.3 1.2-1.2 1.7-0.5 1.5-0.8 1.8-0.2 1 0 3.8-0.8 3.8-4.5 10.6 1.3 1.8-0.2 1.9-1.2 1.8-1.7 1.3-3.8 1.7-1.8 1.1-2.7 4.8-0.5 0.4-1.3 0.4-0.6 0.4-4 4.5-0.3 0.6 0.2 2.1-1 0.2-13.6-1.8-1.7 0.3-2.6 1.2-1.9 0.4-7.4-0.6-1.8 0.2-5.6 2.3-3.2 0.8-22.1 1-8.8 2.3-1.9 0.2-0.7 0.2-0.4 0.3-0.4 0.5-0.6 0.3-1.6 0-0.1 0-2.8 0.8-0.8 0.4-1.2 1.5-1.2 3.6-0.8 1.5-1.3 1.5-0.4 0.7-1.3 3.7-0.4 0.6-1.2 1.4-8 6.7-2.4 4.5-0.6 1.8-0.2 2.1 0.3 2.4 0.9 1.3 2.9 1.6 1.7 1.8 0.7 1.9 0 4.1-0.6 1.7-3.5 4.8-0.2 0.9-0.2 1.2 0.1 1.2 0.6 0.5 0.7 0.3 0 0.7-0.4 1.1-0.5 0.5-2.3 1.2-0.8 0.5-0.5 0.7-0.3 0.8-0.4 1.6-0.8 1.4 0.2 0.4-0.8 1-2.6 0.9-1.3 0.7-0.5 0.8-0.5 1.2-0.7 1.2-1 0.5-3.6 4-3.9 2.9-0.5 0-0.8-1.4-1 0.6-1.1 1.3-1 0.7-1.4 0.2-1.2 0.5-1.2 0.2-1.3-0.3-1.3 1.4-1.6 0.6-3.6 0.4-2.9 1.2-1.4 0-1-1.2-1 0.6-1.6-0.3-1 0.4-2.9-1.9-0.7 0.7-0.7-1.8-0.4-1.6-0.9-1.1-3.6-0.7-2.5-0.8-1-0.2-1.1 0.1-1.7 0.4-1.1 0.1-3-0.6-1.2 0-0.9 0.2-1.8 0.9-0.5 0.1-4.1-1.2-2.1-0.1-1.8 1.3-0.8-0.4-0.9-0.2-16.1 1.9-6.9 0-1.5 0.4-3.8 1.9-0.9 0.7-0.4 0.8 0.1 0.7 0.1 0.7 0.2 0.7-0.3 0.7-1.2 1.1-0.3 0.6-1 0.9-2.2 0.5-3.9 0.2-5.2 1.1-1.7 0.1-1.6 0.6-1.8 1-1.8 0.7-1.5-0.4-1.6 1-2.2 1.8-2 2.1-0.8 1.6-0.7 1-1.6 1-3.1 1.4-2.8 0.7-13.8 0.3-7.4 1.1-14.1 4.5-5.8 3.1-0.2 0-0.1 0.1-0.4 0.2-0.9 0.4-0.1-0.3-5.3-11.9-5.4-12.2-5.4-12.3-5.4-12.3-3.4-7.6-0.9-1.2-1.5-0.6-3.3-0.2-1.2-0.8 0.1 0 0.4-0.1 0.2 0-2.7-6.5-3.8-8.8-3.7-8.8-3.7-8.7-3.7-8.8-3.7-8.8-3.7-8.8-3.7-8.8-3.7-8.8-3.7-8.8-3.7-8.8-3.7-8.8-3.7-8.9-3.7-8.8-3.7-8.8-3.8-8.9-3.7-8.8-2.4-5.8-0.5-1.1 0.2-0.1 0.7-0.3 0.4-0.2 0.1 0 0.1-0.1 0.2-0.1-1.4 0.3 9.2-3.3 14.9-5.2 14.8-5.2 14.8-5.3 14.8-5.2 14.9-5.3 14.8-5.2 14.8-5.2 14.9-5.3 14.8-5.2 14.8-5.3 14.9-5.2 14.8-5.3 14.8-5.2 14.8-5.3 14.9-5.2 14.8-5.3 13-4.6 2.8-8.9 0.6-1.8 1.6-5.2 2.5-8 3.2-10.4 3.9-12.3 4.3-13.8 4.5-14.7 4.8-15.2 3.6-11.7z m42.6 331.2l-0.3-0.8-0.1-0.2 0.5-0.7 1-0.5 1.2-0.3 1.7 1 0.7 0.3-1.3 0.8-2.6 0-0.8 0.4z m19-6.2l0.2 1.2 0 0.2 0.9 1.1 1.1 0.7 1.3 0.5-2.8 1.7-1.5 0.6-1.3 0.2-3.9-0.2-1.2-0.5-0.7-1.9 2.3-1.4 3.3-1.1 2.3-1.1z" 
                id="OMZU" 
                name="Dhofar" 
                fill={hoveredGovernorate === 'dhofar' ? '#6b7280' : '#9ca3af'}
                stroke="#fff6fa" 
                strokeWidth="2" 
                className="cursor-pointer transition-all duration-300"
                onClick={() => handleGovernorateClick('OMZU')}
                onMouseEnter={() => handleGovernorateHover('OMZU')}
                onMouseLeave={handleGovernorateLeave}
              />
              
              {/* Al Wusta */}
              <path 
                d="M472.9 474.8l2.1-0.4 60.8-13.5 142.7 71.5 27.5 14.2 9.3 4.7-12.3 40.4-1.7-0.6-2.6 0.2-2.5 0.8-2.8 1.8-3.5 0.9-1.1 0.8-0.6 0.8-1.5 4.4 0 1 0.5 1 0.3 0.8-0.7 0.7-1.1 0.5-2.1 0.5-1.6 0.8-1.6 1-2 2-0.8 0.9-0.5 1.1-0.2 1.2 0.2 0.9 1.3 1.4 0.2 0.8-0.6 2.1-1.5 1.2-3.8 1.5-1.5 0.9-1.5 1.3-1.3 1.5-0.5 1.7-0.4 1-1 1.2-0.9 1.6 0 2.3 1.6 3.7 0.5 2.3-1.4 3.3-1.3 5.1-0.1 1.3-0.1 2.7-2.1 4.9-1.4 5.2-1 2.2-5.5 8.2-0.8 2.4 0.3 2.8 0.7 1.1 0.7 0.9 0.7 0.9 0.2 1.2 0.1 2.8-0.1 1.4-0.5 1.2-0.6 2.4-0.2 1.8 0.6 1.8 4.2 6.9 0.7 1.6 0.5 2.5 0 2.5-0.4 2.3-1.5 4.2-0.3 1.9 0.2 2.1 1.8 4.7 0.8 1.5 2.2 2.5 0.5 1.5-0.8 3.9 0 1.8 3.2 6 0.1 1.3-2.2 2.2-1.2 1-0.4 0.1-3.9 0.6-0.4 0.5-0.4 0.5-0.9 0.7-1.1 0.7-0.8 0.2-18.1-0.8-4.9 0.7-75.2-20.2-105.7-176.5-1.1-1.8 1.1-3.5 4.6-14.8 4.2-13.8 3.9-12.4 3.2-10.5 2.5-8.1 1.6-5.2 0.6-1.9 0.4-1.4z" 
                id="OMWU" 
                name="Al Wusta" 
                fill={hoveredGovernorate === 'al-wusta' ? '#6b7280' : '#9ca3af'}
                stroke="#fff6fa" 
                strokeWidth="2" 
                className="cursor-pointer transition-all duration-300"
                onClick={() => handleGovernorateClick('OMWU')}
                onMouseEnter={() => handleGovernorateHover('OMWU')}
                onMouseLeave={handleGovernorateLeave}
              />
              
              {/* Ash Sharqiyah South */}
              <path 
                d="M703 591.7l12.3-40.4-9.3-4.7-9.7-28.1-8.3-29.2 22.4-8.1 21.9-8 20.4-7.4 19.3-7.1 18.8-10.3 10.7-5.7 4.2-11.3 0.9-12.5-1.7-4.9-0.1-4.6 4.7-5.1 2 1.8 2 1.1 0.5 0.5 0.1 1-0.6 0.2-0.7-0.2-0.5-0.3 0 1.3 0.6 0.6 1.1 0.1 1.2-0.1 6.7-2.3 2.3 0.9 3.5 2.7 0.5 0 1.4-0.1 0.5 0.1 0.2 0.4 0.2 1 0.2 0.5 0 0.3-0.1 0.4 0.1 0.6 0.5 0.6 0.5 0.3 0.5 0.2 0.6 0.1 0.5 0.1 0.4-0.5-0.6-1-1.3-1.4 0.4-1.3 0.9 0 1.8-0.3 2.3 0.6 1.9 2.5 1.2 3.1 0.5 2.8-1.7 15.4-1.2 4.1-1.7 3.7-5 7-2.5 2.2-1.5 1.6-0.6 1.6-0.3 2.2-1.6 4.5-0.4 4.5-0.8 1.8-3.4 1.5-1.1 1.6-1.4 3.4-6.9 9.4-2.6 8.3-1.6 3.9-8.2 13-0.6 3-0.3 0.8-0.7 0.7-12.2 5.4-2.5 1.5-9.7 8-11.7 12.4-3.6 5.6-0.9 0.8-1.2 0.9-1.3 1.9-2.7 5-0.3 0.9-0.2 3.2-0.3 1-0.5 0.8-5 4.1 0.4 1.9-1.5 1.3-3.6 1.9 0.1 0.1-0.7 1.7-0.1 0.1-0.6 0.6-0.4 0.4-0.2 0.6 0.2 0.8 0.6 0.9 0.7 0.7 0.9 0.5 1.3-0.6 1.4-1.4 1-0.6-0.1 1.9-0.9 1.2-1.5 1.2-1.6 0.4-0.8-0.9-0.5 0-0.5 1.3-0.7 2.5-0.7 1.3-0.6 0.6-2 1.1-0.9 0.9-1.1 1.8-1 2.3-0.6 2.6-0.2 2.4-2.2 4.5-1.2 3.2 0.1 1.5-0.5 0.7-0.5 3.1-0.2 0.7-0.8 0.1-1.1 0.4-1.2 0.6-0.8 0.8-0.6 2.5-1.9 1-2.4-0.1-2.3-0.9-1.6-0.8-1.2-0.4-2.8-0.1-1.1 0.2-2.1 0.9-1.2 0.2 0.3-0.8 0.5-0.4-0.5-0.3-3-0.8-1.8-0.2-1.8-0.8-0.2-1.8 1.1-3.8 0 1.2 0.3 1 0.7 0.9 0.8 0.7 0.4-1.8-0.9-4.2 0.8-1.9 1.2-1.8 0.9-2.7 0.2-2.7-0.8-2z m56.5-1.6l0.1 2 0.5 1.6 2.7 4.8 0.8 1.4-0.4 1.1-0.7 0.7-3.3 2.5-3.6 2-1.5 1.4-2.1 3.2-1 2.1-1 4.5-0.8 1.5 0 1.1 0 0.1 0.1 0.8 0 0.6-0.3 0.7-3 2.9-1.5 2.1-0.8 0.9-0.8 0.3-1.1 0.2-1 0.2-0.4 0.6-0.3 1-0.7 1-1 0.8-1 0-0.4-0.8-0.4-0.7-0.4-2.9-0.1-2.9 0.2-1.5-0.1-0.2-0.2-0.8 0.6-7.3 0.5-1.2 0.9-1.3 0.5-0.4 1.5-1.2 0.7-0.3 0.2-0.1 0.1-0.2 0.4-1.7 0.2-0.5 1.5-0.6 1.4 0 1.5-0.3 1.5-1 0.8-1 0.3-0.5 0.3-1.1 0.1-0.2 0.3-3.6 0.6-1.7 0.8-1.4 4.1-5.5 1.6-3.4 1-3 0.8-1.1 1.3-0.3 1 1.5-0.1 1.6-0.6 1.7-0.3 1.8z" 
                id="OMSH" 
                name="Ash Sharqiyah South" 
                fill={hoveredGovernorate === 'ash-sharqiyah-south' ? '#6b7280' : '#9ca3af'}
                stroke="#fff6fa" 
                strokeWidth="2" 
                className="cursor-pointer transition-all duration-300"
                onClick={() => handleGovernorateClick('OMSH')}
                onMouseEnter={() => handleGovernorateHover('OMSH')}
                onMouseLeave={handleGovernorateLeave}
              />
              
              {/* Ash Sharqiyah North */}
              <path 
                d="M809.5 404.3l-4.7 5.1 0.1 4.6 1.7 4.9-0.9 12.5-4.2 11.3-10.7 5.7-18.8 10.3-19.3 7.1-20.4 7.4-21.9 8-22.4 8.1-21.4-76 8.5-17.9 19.9-15.8 5.3-0.6 14.4-9.3 13.1-3.3 26 17.7 28.5 3.8 5.7-6.4 2-2.7 2.4 6 0.3 1.4 0.7 1.8 1.5 1.2 3.2 1.8 3.4 5.5 0.5 1.5 1.2 1.4 3.6 3.5 2.7 1.4z" 
                id="OMSS" 
                name="Ash Sharqiyah North" 
                fill={hoveredGovernorate === 'ash-sharqiyah-north' ? '#6b7280' : '#9ca3af'}
                stroke="#fff6fa" 
                strokeWidth="2" 
                className="cursor-pointer transition-all duration-300"
                onClick={() => handleGovernorateClick('OMSS')}
                onMouseEnter={() => handleGovernorateHover('OMSS')}
                onMouseLeave={handleGovernorateLeave}
              />
              
              {/* Muscat */}
              <path 
                d="M790 378.8l-2 2.7-5.7 6.4-28.5-3.8-26-17.7 4-21.4-21.9-22.6-18.7 2.5-2.2-9.3 2.7-13.5-0.1 0 0-0.3 0.7-0.6 5.4 2.2 1.4 0.3 1.5 0.7 3.2 3.2 1.6 1.3 3 1 4 0.5 4.2-0.1 3.6-0.7 1.9-0.7 0.7-0.6 0.7-1.8 0.7 0 1.7 0.5 3.7 0 1.9 0.4 1.8 0.9 0.8 1.2 1.7 3.8 0.8 0.8 0.4 0.2 0.4 0.4 0.3 0.4 0.3 0.3 0.2 0 0.5-0.1 0.6 0 0.6 0.1 1.2 1.1 0.7 0.8 0.4 0.7 0.6 0 0.6-1.3 0.2 0.5 0.1 0.3 0.2 0.4 0.1 0.8 0.6 0 0.1-0.5 0.4-0.8 0.5 0.4 0.3 0.1 1.1-0.5 2 2.8 0.6 1.5-0.3 1.5 0.7 1.3 0.9 4.3 1.1 1.8 5.1 4.8 3.1 1.4 1.3 1.7 1.4 4.1 0.9 1.4 2.6 2.6 1.3 1.9 0.8 5.6 5.5 5.6 0.3 0.8 0.5 2.8 0.4 0.6 0.4 0.5 2.4 2 4.6 2.7 3 2.2 2.1 2.6 1.5 2.9 0.8 2z" 
                id="OMMA" 
                name="Muscat" 
                fill={hoveredGovernorate === 'muscat' ? '#6b7280' : '#9ca3af'}
                stroke="#fff6fa" 
                strokeWidth="2" 
                className="cursor-pointer transition-all duration-300"
                onClick={() => handleGovernorateClick('OMMA')}
                onMouseEnter={() => handleGovernorateHover('OMMA')}
                onMouseLeave={handleGovernorateLeave}
              />
              
              {/* Al Batinah South */}
              <path 
                d="M608.4 321l10.7-3.5 11.2-9.7 10.1-17.7 4.7 2.1 5.1 1.7 3.6 0.6 2 0.1 5.8-0.3 1.6 0.3 2.5 3.3 0.9 0.7 2.1 0.6 2.5 1.2 2.2 0.3 11.2-0.6 3.8 0.2 3.9 0.9-0.7 0.6 0 0.3 0.1 0-2.7 13.5 2.2 9.3-18.9 15.7-2.6 5.8-22.3 3.7-3.3-1.7-10-1.1-25.7-26.3z" 
                id="OMBJ" 
                name="Al Batinah South" 
                fill={hoveredGovernorate === 'al-batinah-south' ? '#6b7280' : '#9ca3af'}
                stroke="#fff6fa" 
                strokeWidth="2" 
                className="cursor-pointer transition-all duration-300"
                onClick={() => handleGovernorateClick('OMBJ')}
                onMouseEnter={() => handleGovernorateHover('OMBJ')}
                onMouseLeave={handleGovernorateLeave}
              />
              
              {/* Ad Dakhiliyah */}
              <path 
                d="M583.4 322.2l25-1.2 25.7 26.3 10 1.1 3.3 1.7 22.3-3.7 2.6-5.8 18.9-15.7 18.7-2.5 21.9 22.6-4 21.4-13.1 3.3-14.4 9.3-5.3 0.6-19.9 15.8-8.5 17.9 21.4 76 8.3 29.2 9.7 28.1-27.5-14.2-142.7-71.5 17.2-22.3 13.8-41.7 16.6-74.7z" 
                id="OMDA" 
                name="Ad Dakhiliyah" 
                fill={hoveredGovernorate === 'ad-dakhiliyah' ? '#6b7280' : '#9ca3af'}
                stroke="#fff6fa" 
                strokeWidth="2" 
                className="cursor-pointer transition-all duration-300"
                onClick={() => handleGovernorateClick('OMDA')}
                onMouseEnter={() => handleGovernorateHover('OMDA')}
                onMouseLeave={handleGovernorateLeave}
              />
            </g>

            {/* Dish Markers */}
            {[...dishMarkers]
              .sort((a, b) => {
                // Put hovered marker last (on top)
                if (a.id === hoveredMarker) return 1;
                if (b.id === hoveredMarker) return -1;
                return 0;
              })
              .map((marker) => (
                <g key={marker.id}>
                  <foreignObject
                    x={marker.position.x - 60}
                    y={marker.position.y - 60}
                    width="120"
                    height="120"
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDishClick(marker.dish);
                    }}
                    onMouseEnter={() => setHoveredMarker(marker.id)}
                    onMouseLeave={() => setHoveredMarker(null)}
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 flex items-center justify-center hover:scale-110 transition-transform duration-200">
                      <Image
                        src={marker.image}
                        alt={marker.dish.name}
                        width={96}
                        height={96}
                        className="w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 lg:w-24 lg:h-24 object-contain drop-shadow-lg hover:drop-shadow-xl transition-all duration-200"
                        style={{ filter: 'none' }}
                      />
                    </div>
                  </foreignObject>
                </g>
              ))}
          </svg>
        </div>
      </div>

      {/* Governorate Modal */}
      <AnimatePresence>
        {isGovernorateModalOpen && selectedGovernorate && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseGovernorateModal}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black bg-opacity-50" />
            
            {/* Modal */}
            <motion.div
              className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl md:text-3xl font-bold">
                    {selectedGovernorateData ? getGovernorateName(selectedGovernorateData) : 'Unknown'} Dishes
                  </h2>
                  <button
                    onClick={handleCloseGovernorateModal}
                    className="text-white hover:text-gray-200 text-2xl font-semibold p-1"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {selectedDishes.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {selectedDishes.map((dish) => (
                      <motion.div
                        key={dish.id}
                        onClick={() => handleDishClick(dish)}
                        className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 cursor-pointer border border-amber-200 hover:border-amber-300 hover:shadow-lg transition-all duration-300"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-amber-200 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span className="text-3xl">🍽️</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-800 mb-2 text-lg">
                              {dish.name}
                            </h3>
                            <p className="text-gray-600 text-sm line-clamp-3">
                              {dish.description}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-8xl mb-6">🍽️</div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      Coming Soon!
                    </h3>
                    <p className="text-gray-500">
                      We&apos;re working on adding traditional dishes from {selectedGovernorateData ? getGovernorateName(selectedGovernorateData) : 'this region'}.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dish Detail Modal */}
      <DishModal
        dish={selectedDish}
        isOpen={isDishModalOpen}
        onClose={handleCloseDishModal}
      />
    </div>
  );
}