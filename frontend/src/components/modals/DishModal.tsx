"use client"
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Dish } from '@/types';

interface DishModalProps {
  dish: Dish | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DishModal: React.FC<DishModalProps> = ({ dish, isOpen, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!dish) return null;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % dish.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + dish.images.length) % dish.images.length);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Set a placeholder when image fails to load
    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgMTIwSDIyNVYxODBIMTc1VjEyMFoiIGZpbGw9IiM5Q0E0QUYiLz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwIDEwSDMwVjMwSDEwVjEwWiIgZmlsbD0iIzlDQTRBRiIvPgo8L3N2Zz4KPC9zdmc+';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black bg-opacity-75" />
          
          {/* Modal */}
          <motion.div
            className="relative bg-white rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden shadow-2xl mx-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 bg-white bg-opacity-90 rounded-full p-2 hover:bg-opacity-100 transition-all duration-200"
            >
              <XMarkIcon className="w-6 h-6 text-gray-600" />
            </button>

            <div className="flex flex-col lg:flex-row h-full">
              {/* Image Carousel Section */}
              <div className="lg:w-2/3 relative bg-gray-100">
                <div className="relative h-64 sm:h-80 md:h-96 lg:h-[500px] overflow-hidden">
                  {dish.images.length > 0 ? (
                    <>
                      <motion.img
                        key={currentImageIndex}
                        src={dish.images[currentImageIndex]}
                        alt={`${dish.name} - Image ${currentImageIndex + 1}`}
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                      />
                      
                      {/* Navigation arrows */}
                      {dish.images.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition-all duration-200"
                          >
                            <ChevronLeftIcon className="w-6 h-6 text-gray-800" />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition-all duration-200"
                          >
                            <ChevronRightIcon className="w-6 h-6 text-gray-800" />
                          </button>
                        </>
                      )}
                      
                      {/* Image indicators */}
                      {dish.images.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                          {dish.images.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                                index === currentImageIndex
                                  ? 'bg-white'
                                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    // Placeholder when no images
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-orange-200">
                      <div className="text-center">
                        <div className="text-6xl mb-4">🍽️</div>
                        <p className="text-gray-600">No images available</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Thumbnail strip */}
                {dish.images.length > 1 && (
                  <div className="p-4 bg-gray-50 border-t">
                    <div className="flex space-x-2 overflow-x-auto">
                      {dish.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                            index === currentImageIndex
                              ? 'border-amber-500 scale-110'
                              : 'border-gray-300 hover:border-amber-300'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`${dish.name} thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={handleImageError}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Information Section */}
              <div className="lg:w-1/3 p-4 sm:p-6 bg-white overflow-y-auto">
                <div className="space-y-6">
                  {/* Dish name */}
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                      {dish.name}
                    </h1>
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium capitalize">
                        {dish.governorate.replace('-', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">About This Dish</h2>
                    <p className="text-gray-600 leading-relaxed">
                      {dish.description}
                    </p>
                  </div>

                  {/* Additional info */}
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-3 sm:p-4">
                      <h3 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Regional Specialty</h3>
                      <p className="text-gray-600 text-xs sm:text-sm">
                        This traditional dish is particularly popular in the {dish.governorate.replace('-', ' ')} region of Oman, 
                        where it has been prepared for generations using authentic local ingredients and cooking methods.
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 sm:p-4">
                      <h3 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">Cultural Significance</h3>
                      <p className="text-gray-600 text-xs sm:text-sm">
                        Traditional Omani cuisine reflects the country&apos;s rich maritime heritage and position 
                        along ancient trade routes, incorporating spices and cooking techniques from various cultures.
                      </p>
                    </div>
                  </div>

                  {/* Tags or additional metadata could go here */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Traditional</span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Authentic</span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Regional</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};