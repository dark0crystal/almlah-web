"use client";
import Image from "next/image";
import { useState, useEffect } from "react";

interface RestaurantImagesModalProps {
  images: string[];
  restaurantName?: string;
  onClose: () => void;
  initialIndex?: number;
}

export default function RestaurantImagesModal({ 
  images, 
  restaurantName = "المطعم",
  onClose, 
  initialIndex = 0 
}: RestaurantImagesModalProps) {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const [imageErrors, setImageErrors] = useState<{[key: number]: boolean}>({});

  console.log('RestaurantImagesModal - received images:', images);

  // Handle individual image errors
  const handleImageError = (index: number) => {
    console.log('Restaurant modal image failed to load at index:', index);
    setImageErrors(prev => ({ ...prev, [index]: true }));
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        setSelectedIndex(selectedIndex > 0 ? selectedIndex - 1 : images.length - 1);
      } else if (e.key === 'ArrowRight') {
        setSelectedIndex(selectedIndex < images.length - 1 ? selectedIndex + 1 : 0);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedIndex, images.length, onClose]);

  // Prevent scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!images || images.length === 0) {
    return null;
  }

  const goToPrevious = () => {
    setSelectedIndex(selectedIndex > 0 ? selectedIndex - 1 : images.length - 1);
  };

  const goToNext = () => {
    setSelectedIndex(selectedIndex < images.length - 1 ? selectedIndex + 1 : 0);
  };

  // Function to get image URL with fallback
  const getImageUrl = (imageUrl: string) => {
    if (!imageUrl) return '/images/default-restaurant.jpg';
    
    // If it's already a full URL, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // If it's a relative path, you might need to add your API base URL
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:9000";
    if (imageUrl.startsWith('/')) {
      return `${API_BASE_URL}${imageUrl}`;
    }
    
    return imageUrl;
  };

  const currentImageUrl = getImageUrl(images[selectedIndex]);
  const hasCurrentImageError = imageErrors[selectedIndex];

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center p-4">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 md:top-6 md:right-6 text-black text-xl md:text-2xl bg-white hover:bg-gray-100 rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center shadow-lg transition-colors duration-200 z-10"
        aria-label="إغلاق معرض صور المطعم"
      >
        ✕
      </button>

      {/* Header with restaurant name and cuisine icon */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 text-white z-10">
        <div className="flex items-center gap-2">
          <span className="text-xl">🍽️</span>
          <h2 className="text-lg md:text-xl font-semibold">{restaurantName}</h2>
        </div>
      </div>

      {/* Main Image Container */}
      <div className="w-full max-w-6xl mx-auto flex flex-col items-center justify-center flex-1">
        {/* Main Image */}
        <div className="relative w-full max-w-4xl h-[50vh] sm:h-[60vh] md:h-[70vh] mb-4 md:mb-6">
          <div className="relative w-full h-full rounded-xl md:rounded-2xl overflow-hidden shadow-2xl">
            {hasCurrentImageError ? (
              <div className="w-full h-full bg-gradient-to-br from-orange-800 to-orange-900 flex items-center justify-center">
                <div className="text-center text-white">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                  <p>فشل تحميل صورة المطعم</p>
                </div>
              </div>
            ) : (
              <Image
                src={currentImageUrl}
                alt={`صورة ${selectedIndex + 1} من ${restaurantName}`}
                fill
                className="object-contain"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
                onError={() => handleImageError(selectedIndex)}
                onLoad={() => console.log('Restaurant modal image loaded successfully:', selectedIndex)}
              />
            )}
          </div>
        </div>

        {/* Image Counter */}
        <div className="text-white text-sm md:text-base mb-4 opacity-80">
          {selectedIndex + 1} / {images.length}
        </div>

        {/* Thumbnails Container */}
        <div className="w-full max-w-4xl">
          <div className="flex gap-2 md:gap-4 justify-center overflow-x-auto pb-2 px-2">
            {images.map((img, i) => {
              const thumbnailUrl = getImageUrl(img);
              const hasThumbnailError = imageErrors[i];
              
              return (
                <button
                  key={i}
                  onClick={() => setSelectedIndex(i)}
                  className={`relative flex-shrink-0 w-16 h-12 sm:w-20 sm:h-16 md:w-24 md:h-18 lg:w-28 lg:h-20 rounded-lg md:rounded-xl overflow-hidden border-2 md:border-4 transition-all duration-200 hover:scale-105 ${
                    i === selectedIndex
                      ? "border-orange-500 shadow-lg shadow-orange-500/50"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                  aria-label={`عرض صورة المطعم ${i + 1}`}
                >
                  {hasThumbnailError ? (
                    <div className="w-full h-full bg-orange-700 flex items-center justify-center">
                      <svg className="w-4 h-4 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                      </svg>
                    </div>
                  ) : (
                    <Image
                      src={thumbnailUrl}
                      alt={`صورة مصغرة للمطعم ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 64px, (max-width: 768px) 80px, (max-width: 1024px) 96px, 112px"
                      onError={() => handleImageError(i)}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation arrows for larger screens */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="hidden md:block absolute left-4 lg:left-8 top-1/2 transform -translate-y-1/2 text-white bg-orange-600/30 hover:bg-orange-600/50 rounded-full w-12 h-12 flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
            aria-label="الصورة السابقة"
          >
            ←
          </button>
              
          <button
            onClick={goToNext}
            className="hidden md:block absolute right-4 lg:right-8 top-1/2 transform -translate-y-1/2 text-white bg-orange-600/30 hover:bg-orange-600/50 rounded-full w-12 h-12 flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
            aria-label="الصورة التالية"
          >
            →
          </button>
        </>
      )}

      {/* Mobile swipe indicators */}
      <div className="md:hidden absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="flex gap-2">
          {images.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === selectedIndex ? 'bg-orange-500' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}