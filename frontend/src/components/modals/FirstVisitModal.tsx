"use client"
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';
import { Car } from '@/types';

const cars: Car[] = [
  { id: '1', name: 'Al Ryam', image: '/alryam.png' },
  { id: '2', name: 'RB3', image: '/rb3.png' },
  { id: '3', name: 'Chai', image: '/chai.png' },
  { id: '4', name: 'Khayma', image: '/khayma.png' },
  { id: '5', name: 'Samhah', image: '/samhah.png' },
];

// Function to extract dominant color from image
const extractColorFromImage = (imageSrc: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('rgb(59, 130, 246)'); // Default blue
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const colorCounts: { [key: string]: number } = {};

      // Sample pixels and count colors
      for (let i = 0; i < data.length; i += 4 * 10) { // Sample every 10th pixel for performance
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const alpha = data[i + 3];

        if (alpha > 128) { // Only consider non-transparent pixels
          // Group similar colors together
          const rGroup = Math.floor(r / 30) * 30;
          const gGroup = Math.floor(g / 30) * 30;
          const bGroup = Math.floor(b / 30) * 30;
          const colorKey = `${rGroup},${gGroup},${bGroup}`;
          
          colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
        }
      }

      // Find the most common color (excluding white and very light colors)
      let dominantColor = 'rgb(59, 130, 246)'; // Default blue
      let maxCount = 0;

      for (const [color, count] of Object.entries(colorCounts)) {
        const [r, g, b] = color.split(',').map(Number);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        
        // Exclude very light colors (brightness > 200)
        if (count > maxCount && brightness < 200) {
          maxCount = count;
          dominantColor = `rgb(${r}, ${g}, ${b})`;
        }
      }

      resolve(dominantColor);
    };
    img.onerror = () => resolve('rgb(59, 130, 246)'); // Default blue on error
    img.src = imageSrc;
  });
};

interface FirstVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCarSelect: (car: Car) => void;
}

export const FirstVisitModal: React.FC<FirstVisitModalProps> = ({ isOpen, onClose, onCarSelect }) => {
  const t = useTranslations('firstVisitModal');
  const [currentCarIndex, setCurrentCarIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('rgb(59, 130, 246)');
  const [isLoadingColor, setIsLoadingColor] = useState(false);

  // Extract color from current car image
  useEffect(() => {
    const updateBackgroundColor = async () => {
      if (cars[currentCarIndex]) {
        setIsLoadingColor(true);
        try {
          const color = await extractColorFromImage(cars[currentCarIndex].image);
          setBackgroundColor(color);
        } catch (error) {
          console.error('Failed to extract color:', error);
          setBackgroundColor('rgb(59, 130, 246)'); // Fallback color
        } finally {
          setIsLoadingColor(false);
        }
      }
    };

    updateBackgroundColor();
  }, [currentCarIndex]);

  const nextCar = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentCarIndex((prev) => (prev + 1) % cars.length);
      setIsTransitioning(false);
    }, 150);
  };

  const prevCar = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentCarIndex((prev) => (prev - 1 + cars.length) % cars.length);
      setIsTransitioning(false);
    }, 150);
  };

  const getCarIndex = (offset: number) => {
    return (currentCarIndex + offset + cars.length) % cars.length;
  };

  const handleConfirm = () => {
    // Auto-select the centered car
    const selectedCar = cars[currentCarIndex];
    onCarSelect(selectedCar);
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  // Helper function to get a lighter version of the background color
  const getLighterColor = (color: string, opacity: number = 0.1) => {
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch;
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return `rgba(59, 130, 246, ${opacity})`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div 
        className="rounded-2xl p-8 w-screen h-screen relative transition-all duration-500 ease-in-out"
        style={{
          background: `linear-gradient(135deg, ${getLighterColor(backgroundColor, 0.95)} 0%, ${getLighterColor(backgroundColor, 0.85)} 100%)`,
          boxShadow: `0 25px 50px -12px ${getLighterColor(backgroundColor, 0.3)}`,
        }}
      >
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        {/* Modal content */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('welcome')}</h2>
          <p className="text-gray-600">{t('subtitle')}</p>
        </div>

        {/* Car slider */}
        <div className="relative mb-8">
          <div className="flex justify-center items-center space-x-4">
            {/* Previous button */}
            <button
              onClick={prevCar}
              disabled={isTransitioning}
              className="p-3 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 z-10"
            >
              <ChevronLeftIcon className="w-8 h-8 text-gray-600" />
            </button>

            {/* Three car display */}
            <div className="flex items-center justify-center space-x-4 overflow-hidden">
              {/* Left car (smaller) */}
              <div 
                className={`transition-all duration-500 ease-in-out cursor-pointer ${isTransitioning ? 'opacity-50 scale-95' : 'opacity-70 hover:opacity-90'}`}
                onClick={prevCar}
              >
                <div className="relative">
                  <img
                    src={cars[getCarIndex(-1)].image}
                    alt={cars[getCarIndex(-1)].name}
                    className="w-32 h-32 object-contain mx-auto"
                  />
                  <div className="mt-2 text-center">
                    <h4 className="text-sm font-medium text-gray-500">
                      {cars[getCarIndex(-1)].name}
                    </h4>
                  </div>
                </div>
              </div>

              {/* Center car (larger) */}
              <div className={`transition-all duration-500 ease-in-out ${isTransitioning ? 'opacity-70 scale-95' : 'opacity-100 scale-100'}`}>
                <div 
                  className="relative rounded-xl p-6 border-2 transition-all duration-500 ease-in-out"
                  style={{
                    backgroundColor: getLighterColor(backgroundColor, 0.1),
                    borderColor: getLighterColor(backgroundColor, 0.3),
                    boxShadow: `0 10px 25px -5px ${getLighterColor(backgroundColor, 0.2)}`,
                  }}
                >
                  <img
                    src={cars[currentCarIndex].image}
                    alt={cars[currentCarIndex].name}
                    className="w-48 h-48 object-contain mx-auto"
                  />
                  <div className="mt-4 text-center">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {cars[currentCarIndex].name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{t('selectedVehicle')}</p>
                  </div>
                </div>
              </div>

              {/* Right car (smaller) */}
              <div 
                className={`transition-all duration-500 ease-in-out cursor-pointer ${isTransitioning ? 'opacity-50 scale-95' : 'opacity-70 hover:opacity-90'}`}
                onClick={nextCar}
              >
                <div className="relative">
                  <img
                    src={cars[getCarIndex(1)].image}
                    alt={cars[getCarIndex(1)].name}
                    className="w-32 h-32 object-contain mx-auto"
                  />
                  <div className="mt-2 text-center">
                    <h4 className="text-sm font-medium text-gray-500">
                      {cars[getCarIndex(1)].name}
                    </h4>
                  </div>
                </div>
              </div>
            </div>

            {/* Next button */}
            <button
              onClick={nextCar}
              disabled={isTransitioning}
              className="p-3 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 z-10"
            >
              <ChevronRightIcon className="w-8 h-8 text-gray-600" />
            </button>
          </div>

          {/* Dots indicator */}
          <div className="flex justify-center mt-6 space-x-2">
            {cars.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (!isTransitioning && index !== currentCarIndex) {
                    setIsTransitioning(true);
                    setTimeout(() => {
                      setCurrentCarIndex(index);
                      setIsTransitioning(false);
                    }, 150);
                  }
                }}
                disabled={isTransitioning}
                className={`w-3 h-3 rounded-full transition-all duration-300 disabled:cursor-not-allowed ${
                  index === currentCarIndex 
                    ? 'scale-125' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                style={{
                  backgroundColor: index === currentCarIndex ? backgroundColor : undefined,
                }}
              />
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-between">
          <button
            onClick={handleSkip}
            className="px-6 py-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            {t('skipForNow')}
          </button>
          <button
            onClick={handleConfirm}
            className="px-8 py-2 rounded-lg font-semibold text-white transition-all duration-300 hover:shadow-lg transform hover:scale-105"
            style={{
              backgroundColor: backgroundColor,
              boxShadow: `0 4px 12px ${getLighterColor(backgroundColor, 0.3)}`,
            }}
          >
            {t('continue')}
          </button>
        </div>
      </div>
    </div>
  );
};