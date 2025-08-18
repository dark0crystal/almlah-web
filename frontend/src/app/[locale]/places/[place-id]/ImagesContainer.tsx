"use client";
import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import ImagesModal from "./ImagesModal";

// Updated to match the corrected backend response format
interface PlaceImage {
  id: string;
  image_url: string;  // This maps from backend 'url' field
  alt_text?: string;  // Backend returns single alt_text
  alt_text_ar?: string;
  alt_text_en?: string;
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
  const t = useTranslations('placeDetails.images');
  const [showModal, setShowModal] = useState(false);
  const [imageErrors, setImageErrors] = useState<{[key: string]: boolean}>({});

  console.log('PlaceImagesContainer - received images:', images);

  // Handle individual image errors
  const handleImageError = (imageId: string) => {
    console.log('Image failed to load:', imageId);
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

  console.log('PlaceImagesContainer - sorted images:', sortedImages);

  // If no images, show placeholder
  if (!images || images.length === 0) {
    console.log('No images available, showing placeholder');
    return (
      <div className="mt-6">
        <div className="bg-gray-200 rounded-2xl h-64 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>{t('noImages')}</p>
          </div>
        </div>
      </div>
    );
  }

  const remainingImageCount = Math.max(0, sortedImages.length - 3);

  // Function to get image URL with proper fallback and debugging
  const getImageUrl = (imageUrl: string) => {
    console.log('Processing image URL:', imageUrl);
    
    if (!imageUrl) {
      console.log('No image URL provided, using default');
      return '/images/default-place.jpg';
    }
    
    // If it's already a full URL, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      console.log('Full URL detected, using as is:', imageUrl);
      return imageUrl;
    }
    
    // If it's a relative path starting with /, construct full URL
    if (imageUrl.startsWith('/')) {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:9000";
      const fullUrl = `${API_BASE_URL}${imageUrl}`;
      console.log('Constructed full URL from relative path:', fullUrl);
      return fullUrl;
    }
    
    // If it's a relative path without /, add API base URL
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:9000";
    const fullUrl = `${API_BASE_URL}/${imageUrl}`;
    console.log('Constructed full URL from relative path:', fullUrl);
    return fullUrl;
  };

  // Function to render image with error handling
  const renderImage = (img: PlaceImage, className: string, onClick?: () => void) => {
    const imageUrl = getImageUrl(img.image_url);
    // FIXED: Handle alt text properly - backend sends single alt_text, but we have fallbacks
    const altText = img.alt_text || img.alt_text_ar || img.alt_text_en || t('imageOf', { placeName });
    const hasError = imageErrors[img.id];

    console.log(`Rendering image ${img.id}:`, { originalUrl: img.image_url, processedUrl: imageUrl, altText });

    if (hasError) {
      return (
        <div className={`${className} bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center rounded-2xl`}>
          <div className="text-center text-gray-500">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xs">{t('loadFailed')}</p>
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
          onError={() => {
            console.error('Image failed to load:', imageUrl);
            handleImageError(img.id);
          }}
          onLoad={() => console.log('Image loaded successfully:', img.id, imageUrl)}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={img.is_primary}
          unoptimized={imageUrl.startsWith('http://localhost:9000')} // Disable optimization for local development
        />
      </div>
    );
  };

  return (
    <div className="mt-6">
      {showModal && (
        <ImagesModal 
          images={sortedImages.map(img => getImageUrl(img.image_url))}
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
        <div className="relative w-full max-w-md mx-auto bg-white overflow-hidden shadow-lg rounded-2xl">
          
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

              {/* Right Image - Interior View */}
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