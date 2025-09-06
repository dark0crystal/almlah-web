"use client"
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Car } from '@/types';

const cars: Car[] = [
  { id: '1', name: 'Mini Coper', image: '/minicober.png' },
  { id: '2', name: 'RB3', image: '/rb3.png' },
  { id: '3', name: 'G63', image: '/G63.png' },
  { id: '4', name: 'Land Cruiser', image: '/landcruiser.png' },
  { id: '5', name: 'G63', image: '/G63.png' },
];

interface FirstVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCarSelect: (car: Car) => void;
}

export const FirstVisitModal: React.FC<FirstVisitModalProps> = ({ isOpen, onClose, onCarSelect }) => {
  const t = useTranslations('firstVisitModal');
  const [currentCarIndex, setCurrentCarIndex] = useState(0);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [dominantColors, setDominantColors] = useState<{ [key: string]: string }>({});
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const extractDominantColor = (imageSrc: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('#3B82F6');
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const colorCount: { [key: string]: number } = {};

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const alpha = data[i + 3];

          if (alpha > 128) {
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            if (brightness > 50 && brightness < 200) {
              const key = `${Math.floor(r / 32) * 32},${Math.floor(g / 32) * 32},${Math.floor(b / 32) * 32}`;
              colorCount[key] = (colorCount[key] || 0) + 1;
            }
          }
        }

        let maxCount = 0;
        let dominantColor = '#3B82F6';
        for (const color in colorCount) {
          if (colorCount[color] > maxCount) {
            maxCount = colorCount[color];
            const [r, g, b] = color.split(',').map(Number);
            dominantColor = `rgb(${r}, ${g}, ${b})`;
          }
        }
        resolve(dominantColor);
      };
      img.onerror = () => resolve('#3B82F6');
      img.src = imageSrc;
    });
  };

  useEffect(() => {
    const loadColors = async () => {
      const colors: { [key: string]: string } = {};
      for (const car of cars) {
        colors[car.id] = await extractDominantColor(car.image);
      }
      setDominantColors(colors);
    };
    
    if (isOpen) {
      loadColors();
    }
  }, [isOpen]);

  const minSwipeDistance = 50;

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

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      nextCar();
    }
    if (isRightSwipe) {
      prevCar();
    }
  };

  const getCarIndex = (offset: number) => {
    return (currentCarIndex + offset + cars.length) % cars.length;
  };

  const handleCarSelect = (car: Car) => {
    setSelectedCar(car);
  };

  const handleConfirm = () => {
    if (selectedCar) {
      // Save selected car to localStorage for Brand component
      localStorage.setItem('selectedCar', JSON.stringify(selectedCar));
      onCarSelect(selectedCar);
      onClose();
    }
  };

  if (!isOpen) return null;

  const currentCarColor = dominantColors[cars[currentCarIndex]?.id] || '#3B82F6';

  return (
    <div 
      className="fixed inset-0 z-50 p-4 sm:p-6 md:p-8 transition-colors duration-500"
      style={{ backgroundColor: currentCarColor }}
    >

        {/* Modal content */}
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 sm:mb-4">{t('welcome')}</h2>
            <p className="text-white/80 text-lg sm:text-xl">اختر موترك ، ونعطيك على جوك</p>
          </div>

          {/* Car slider */}
          <div className="relative mb-8 sm:mb-12 w-full max-w-6xl">
            <div className="flex justify-center items-center space-x-2 sm:space-x-4 md:space-x-6">
            {/* Previous button - Hidden on mobile */}
            <button
              onClick={prevCar}
              disabled={isTransitioning}
              className="hidden sm:block p-3 transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 z-10"
            >
              <Image 
                src="/arrow.png" 
                alt="Previous" 
                width={80}
                height={80}
                className="w-16 h-16 md:w-20 md:h-20 transform rotate-180 opacity-60 hover:opacity-100 transition-opacity"
              />
            </button>

            {/* Three car display */}
            <div 
              className="flex items-center justify-center space-x-2 sm:space-x-4 md:space-x-6 overflow-hidden"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {/* Left car (smaller) */}
              <div 
                className={`transition-all duration-500 ease-in-out cursor-pointer ${isTransitioning ? 'opacity-50 scale-95' : 'opacity-70 hover:opacity-90'}`}
                onClick={prevCar}
              >
                <div className="relative">
                  <Image
                    src={cars[getCarIndex(-1)].image}
                    alt={cars[getCarIndex(-1)].name}
                    width={128}
                    height={128}
                    className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 object-contain mx-auto"
                  />
                  <div className="mt-2 text-center">
                    <h4 className="text-xs sm:text-sm font-medium text-white/70">
                      {cars[getCarIndex(-1)].name}
                    </h4>
                  </div>
                </div>
              </div>

              {/* Center car (larger) */}
              <div className={`transition-all duration-500 ease-in-out ${isTransitioning ? 'opacity-70 scale-95' : 'opacity-100 scale-100'}`}>
                <div 
                  className={`relative rounded-xl p-4 sm:p-6 border-2 transition-all duration-300 cursor-pointer ${
                    selectedCar?.id === cars[currentCarIndex].id 
                      ? 'border-2' 
                      : 'border-white/30 hover:border-2'
                  }`}
                  style={{
                    borderColor: selectedCar?.id === cars[currentCarIndex].id 
                      ? 'white' 
                      : undefined,
                    backgroundColor: selectedCar?.id === cars[currentCarIndex].id 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : undefined
                  }}
                  onClick={() => handleCarSelect(cars[currentCarIndex])}
                >
                  <div className="w-48 h-48 sm:w-52 sm:h-52 md:w-56 md:h-56 lg:w-64 lg:h-64 flex items-center justify-center">
                    <Image
                      src={cars[currentCarIndex].image}
                      alt={cars[currentCarIndex].name}
                      width={256}
                      height={256}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="mt-3 sm:mt-4 text-center">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-white">
                      {cars[currentCarIndex].name}
                    </h3>
                    {selectedCar?.id === cars[currentCarIndex].id && (
                      <p className="text-sm sm:text-base mt-1 font-medium text-white/90">
                        {t('selectedVehicle')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right car (smaller) */}
              <div 
                className={`transition-all duration-500 ease-in-out cursor-pointer ${isTransitioning ? 'opacity-50 scale-95' : 'opacity-70 hover:opacity-90'}`}
                onClick={nextCar}
              >
                <div className="relative">
                  <Image
                    src={cars[getCarIndex(1)].image}
                    alt={cars[getCarIndex(1)].name}
                    width={128}
                    height={128}
                    className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 object-contain mx-auto"
                  />
                  <div className="mt-2 text-center">
                    <h4 className="text-xs sm:text-sm font-medium text-white/70">
                      {cars[getCarIndex(1)].name}
                    </h4>
                  </div>
                </div>
              </div>
            </div>

            {/* Next button - Hidden on mobile */}
            <button
              onClick={nextCar}
              disabled={isTransitioning}
              className="hidden sm:block p-3 transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 z-10"
            >
              <Image 
                src="/arrow.png" 
                alt="Next" 
                width={80}
                height={80}
                className="w-16 h-16 md:w-20 md:h-20 opacity-60 hover:opacity-100 transition-opacity"
              />
            </button>
          </div>

            {/* Dots indicator */}
            <div className="flex justify-center mt-6 sm:mt-8 space-x-2 sm:space-x-3">
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
                  className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all duration-300 disabled:cursor-not-allowed ${
                    index === currentCarIndex 
                      ? 'scale-125' 
                      : 'bg-white/30 hover:bg-white/50'
                  }`}
                  style={{
                    backgroundColor: index === currentCarIndex ? 'white' : undefined
                  }}
                />
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-center items-center mt-8 sm:mt-12 w-full max-w-md">
            <button
              onClick={handleConfirm}
              disabled={!selectedCar}
              className={`px-8 py-3 bg-white text-current rounded-lg font-semibold transition-all duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed text-lg ${
                selectedCar ? 'hover:shadow-lg transform hover:scale-105' : ''
              }`}
              style={{
                color: selectedCar ? currentCarColor : '#666',
                backgroundColor: selectedCar ? 'white' : '#ccc'
              }}
            >
              {t('continue')}
            </button>
          </div>
        </div>
    </div>
  );
};