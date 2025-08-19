"use client"
import React, { useState, useEffect } from 'react';
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

  const nextCar = () => {
    setCurrentCarIndex((prev) => (prev + 1) % cars.length);
  };

  const prevCar = () => {
    setCurrentCarIndex((prev) => (prev - 1 + cars.length) % cars.length);
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
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 relative">
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
          <div className="flex justify-center items-center">
            {/* Previous button */}
            <button
              onClick={prevCar}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors mr-4"
            >
              <ChevronLeftIcon className="w-8 h-8 text-gray-600" />
            </button>

            {/* Car display area */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <img
                  src={cars[currentCarIndex].image}
                  alt={cars[currentCarIndex].name}
                  className="w-full h-48 object-contain mx-auto"
                />
                <div className="mt-4 text-center">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {cars[currentCarIndex].name}
                  </h3>
                </div>
              </div>
            </div>

            {/* Next button */}
            <button
              onClick={nextCar}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors ml-4"
            >
              <ChevronRightIcon className="w-8 h-8 text-gray-600" />
            </button>
          </div>

          {/* Dots indicator */}
          <div className="flex justify-center mt-6 space-x-2">
            {cars.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentCarIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentCarIndex ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Car selection */}
        <div className="mb-8">
          <p className="text-center text-gray-700 mb-4">Select this vehicle:</p>
          <div className="flex justify-center">
            <button
              onClick={() => handleCarSelect(cars[currentCarIndex])}
              className={`px-6 py-2 rounded-lg transition-colors ${
                selectedCar?.id === cars[currentCarIndex].id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {selectedCar?.id === cars[currentCarIndex].id ? 'Selected' : 'Select'}
            </button>
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
            className={`px-8 py-2 rounded-lg font-semibold transition-colors ${
              selectedCar
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};