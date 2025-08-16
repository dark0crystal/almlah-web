"use client";
import Image from "next/image";
import { useState } from "react";
import ImagesModal from "./ImagesModal";

interface PlaceImage {
  id: string;
  image_url: string;
  alt_text?: string;
  is_primary: boolean;
  display_order: number;
}

interface PlaceImagesContainerProps {
  images: PlaceImage[];
  placeName?: string;
}

export default function PlaceImagesContainer({ 
  images, 
  placeName = "المكان" 
}: PlaceImagesContainerProps) {
  const [showModal, setShowModal] = useState(false);

  // Sort images by display_order and primary status
  const sortedImages = [...images].sort((a, b) => {
    // Primary image first
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    // Then by display order
    return a.display_order - b.display_order;
  });

  // If no images, show placeholder
  if (!images || images.length === 0) {
    return (
      <div className="mt-6">
        <div className="bg-gray-200 rounded-2xl h-64 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>لا توجد صور متاحة</p>
          </div>
        </div>
      </div>
    );
  }

  const remainingImageCount = Math.max(0, sortedImages.length - 3);

  return (
    <div className="mt-6">
      {showModal && (
        <ImagesModal 
          images={sortedImages.map(img => img.image_url)}
          placeName={placeName}
          onClose={() => setShowModal(false)} 
        />
      )}
      
      {/* Desktop Layout (lg screens and up) */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-3 gap-4">
          {/* Right column: third image or first if only one */}
          {sortedImages[0] && (
            <div className="col-span-2">
              <div className="relative w-full h-[33rem] rounded-2xl overflow-hidden cursor-pointer group">
                <Image
                  src={sortedImages[2]?.image_url || sortedImages[0].image_url}
                  alt={sortedImages[2]?.alt_text || sortedImages[0].alt_text || `المنظر الرئيسي لـ ${placeName}`}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  onClick={() => setShowModal(true)}
                />
              </div>
            </div>
          )}
          
          {/* Left column: first two images */}
          <div className="flex flex-col gap-4">
            {sortedImages.slice(0, 2).map((img, index) => (
              <div
                key={img.id}
                className="relative w-full h-64 rounded-2xl overflow-hidden cursor-pointer group"
                onClick={() => setShowModal(true)}
              >
                <Image
                  src={img.image_url}
                  alt={img.alt_text || `منظر ${index + 1} لـ ${placeName}`}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {/* Show overlay only on the second image if there are more than 3 */}
                {index === 1 && remainingImageCount > 0 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer hover:bg-black/40 transition-colors">
                    <span className="text-white text-4xl font-bold">
                      +{remainingImageCount}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile & iPad Layout (below lg screens) */}
      <div className="block lg:hidden">
        <div className="relative w-full max-w-md mx-auto bg-white overflow-hidden shadow-lg">
          
          {/* Main Image */}
          <div className="relative">
            <div className="relative w-full h-64 sm:h-80 cursor-pointer group">
              <Image
                src={sortedImages[0].image_url}
                alt={sortedImages[0].alt_text || `المنظر الرئيسي لـ ${placeName}`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                priority
                onClick={() => setShowModal(true)}
              />
            </div>
          </div>

          {/* Bottom Images Row */}
          {sortedImages.length > 1 && (
            <div className="grid grid-cols-2 gap-2">
              
              {/* Left Image - More Photos Counter */}
              <div 
                className="relative h-32 sm:h-40 cursor-pointer group"
                onClick={() => setShowModal(true)}
              >
                <Image
                  src={sortedImages[1].image_url}
                  alt={sortedImages[1].alt_text || `منظر إضافي لـ ${placeName}`}
                  fill
                  className="object-cover"
                />
                
                {/* Semi-transparent overlay with counter */}
                {remainingImageCount > 0 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/30 transition-all duration-200">
                    <div className="text-white text-center">
                      {/* Gallery Icon */}
                      <div className="w-6 h-6 mx-auto mb-1 flex items-center justify-center">
                        <svg 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2"
                          className="w-5 h-5"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="9" cy="9" r="2"/>
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                        </svg>
                      </div>
                      <div className="text-lg font-bold">
                        +{remainingImageCount}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Image - Interior View */}
              {sortedImages[2] && (
                <div 
                  className="relative h-32 sm:h-40 cursor-pointer group"
                  onClick={() => setShowModal(true)}
                >
                  <Image
                    src={sortedImages[2].image_url}
                    alt={sortedImages[2].alt_text || `المنظر الداخلي لـ ${placeName}`}
                    fill
                    className="object-cover"
                  />
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}