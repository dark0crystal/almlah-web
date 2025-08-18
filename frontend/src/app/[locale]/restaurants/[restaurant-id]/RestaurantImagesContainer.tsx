"use client";
import Image from "next/image";
import { useState } from "react";
import RestaurantImagesModal from "./RestaurantImagesModal";

// Updated to match the corrected backend response format
interface RestaurantImage {
  id: string;
  image_url: string;  // This maps from backend 'url' field
  alt_text?: string;  // Backend returns single alt_text
  alt_text_ar?: string;
  alt_text_en?: string;
  is_primary: boolean;
  display_order: number;
}

interface RestaurantImagesContainerProps {
  images: RestaurantImage[];
  restaurantName?: string;
}

export default function RestaurantImagesContainer({ 
  images, 
  restaurantName = "المطعم" 
}: RestaurantImagesContainerProps) {
  const [showModal, setShowModal] = useState(false);
  const [imageErrors, setImageErrors] = useState<{[key: string]: boolean}>({});

  console.log('RestaurantImagesContainer - received images:', images);

  // Handle individual image errors
  const handleImageError = (imageId: string) => {
    console.log('Restaurant image failed to load:', imageId);
    setImageErrors(prev => ({ ...prev, [imageId]: true }));
  };

  // Sort images by display_order and primary status
  const sortedImages = [...(images || [])].sort((a, b) => {
    // Primary image first
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    // Then by display order
    return a.display_order - b.display_order;
  });

  console.log('RestaurantImagesContainer - sorted images:', sortedImages);

  // If no images, show restaurant placeholder
  if (!images || images.length === 0) {
    console.log('No restaurant images available, showing placeholder');
    return (
      <div className="mt-6">
        <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl h-64 flex items-center justify-center">
          <div className="text-center text-orange-600">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
            <p>لا توجد صور متاحة للمطعم</p>
          </div>
        </div>
      </div>
    );
  }

  const remainingImageCount = Math.max(0, sortedImages.length - 3);

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

  // Function to render image with error handling
  const renderImage = (img: RestaurantImage, className: string, onClick?: () => void) => {
    const imageUrl = getImageUrl(img.image_url);
    const altText = img.alt_text || img.alt_text_ar || img.alt_text_en || `صورة ${restaurantName}`;
    const hasError = imageErrors[img.id];

    console.log(`Rendering restaurant image ${img.id}:`, imageUrl);

    if (hasError) {
      return (
        <div className={`${className} bg-gradient-to-br from-orange-200 to-orange-300 flex items-center justify-center rounded-2xl`}>
          <div className="text-center text-orange-600">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
            <p className="text-xs">فشل تحميل الصورة</p>
          </div>
        </div>
      );
    }

    return (
      <div className={`${className} relative rounded-2xl overflow-hidden cursor-pointer group`} onClick={onClick}>
        <Image
          src={imageUrl}
          alt={altText}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => handleImageError(img.id)}
          onLoad={() => console.log('Restaurant image loaded successfully:', img.id)}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={img.is_primary}
        />
        
        {/* Restaurant-specific overlay effects */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    );
  };

  return (
    <div className="mt-6">
      {showModal && (
        <RestaurantImagesModal 
          images={sortedImages.map(img => getImageUrl(img.image_url))}
          restaurantName={restaurantName}
          onClose={() => setShowModal(false)} 
        />
      )}
      
      {/* Desktop Layout (lg screens and up) */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-3 gap-4">
          {/* Right column: third image or first if only one */}
          {sortedImages[0] && (
            <div className="col-span-2">
              {renderImage(
                sortedImages[2] || sortedImages[0],
                "w-full h-[33rem]",
                () => setShowModal(true)
              )}
            </div>
          )}
          
          {/* Left column: first two images */}
          <div className="flex flex-col gap-4">
            {sortedImages.slice(0, 2).map((img, index) => (
              <div key={img.id} className="relative">
                {renderImage(
                  img,
                  "w-full h-64",
                  () => setShowModal(true)
                )}
                {/* Show overlay only on the second image if there are more than 3 */}
                {index === 1 && remainingImageCount > 0 && (
                  <div 
                    className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer hover:bg-black/40 transition-colors rounded-2xl"
                    onClick={() => setShowModal(true)}
                  >
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
        <div className="relative w-full max-w-md mx-auto bg-white overflow-hidden shadow-lg rounded-2xl border border-orange-100">
          
          {/* Main Image */}
          <div className="relative">
            {renderImage(
              sortedImages[0],
              "w-full h-64 sm:h-80",
              () => setShowModal(true)
            )}
          </div>

          {/* Bottom Images Row */}
          {sortedImages.length > 1 && (
            <div className="grid grid-cols-2 gap-2 p-2">
              
              {/* Left Image - More Photos Counter */}
              <div className="relative">
                {renderImage(
                  sortedImages[1],
                  "h-32 sm:h-40",
                  () => setShowModal(true)
                )}
                
                {/* Semi-transparent overlay with counter */}
                {remainingImageCount > 0 && (
                  <div 
                    className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/30 transition-all duration-200 rounded-2xl cursor-pointer"
                    onClick={() => setShowModal(true)}
                  >
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

              {/* Right Image - Interior/Food View */}
              {sortedImages[2] && (
                <div className="relative">
                  {renderImage(
                    sortedImages[2],
                    "h-32 sm:h-40",
                    () => setShowModal(true)
                  )}
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-2xl" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}