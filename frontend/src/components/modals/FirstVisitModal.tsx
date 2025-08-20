"use client"
import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Car } from '@/types';

const cars: Car[] = [
  { id: '1', name: 'Al Ryam', image: '/alryam.png' },
  { id: '2', name: 'RB3', image: '/rb3.png' },
  { id: '3', name: 'Chai', image: '/chai.png' },
  { id: '4', name: 'Khayma', image: '/khayma.png' },
  { id: '5', name: 'Samhah', image: '/samhah.png' },
];

interface FirstVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCarSelect: (car: Car) => void;
}

export const FirstVisitModal: React.FC<FirstVisitModalProps> = ({ isOpen, onClose, onCarSelect }) => {
  const [currentCarIndex, setCurrentCarIndex] = useState(0);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

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

  const handleCarSelect = (car: Car) => {
    setSelectedCar(car);
  };

  const handleConfirm = () => {
    if (selectedCar) {
      onCarSelect(selectedCar);
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] relative overflow-y-auto">
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        {/* Modal content */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Almlah!</h2>
          <p className="text-gray-600">Choose your preferred vehicle for exploring Oman</p>
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
                  className={`relative rounded-xl p-6 border-2 transition-all duration-300 cursor-pointer ${
                    selectedCar?.id === cars[currentCarIndex].id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => handleCarSelect(cars[currentCarIndex])}
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
                    {selectedCar?.id === cars[currentCarIndex].id && (
                      <p className="text-sm text-blue-600 mt-1">Selected Vehicle</p>
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
                    ? 'bg-blue-500 scale-125' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
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
            Skip for now
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedCar}
            className={`px-8 py-2 bg-blue-500 text-white rounded-lg font-semibold transition-all duration-300 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed ${
              selectedCar ? 'hover:shadow-lg transform hover:scale-105' : ''
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};