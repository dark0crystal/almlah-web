"use client";
import Image from "next/image";
import { useState } from "react";
import GovernateImagesModal from "./GovernateImagesModal";
import { GovernateImage, getGovernateImageUrl, getSortedImages } from '@/services/governateApi';

interface GovernateImagesContainerProps {
  images: GovernateImage[];
  governateName: string;
  language?: 'ar' | 'en';
}

export default function GovernateImagesContainer({ 
  images, 
  governateName,
  language = 'ar'
}: GovernateImagesContainerProps) {
  const [showModal, setShowModal] = useState(false);
  const [imageErrors, setImageErrors] = useState<{[key: string]: boolean}>({});

  console.log('GovernateImagesContainer - received images:', images);

  // Handle individual image errors
  const handleImageError = (imageId: string) => {
    console.log('Governate image failed to load:', imageId);
    setImageErrors(prev => ({ ...prev, [imageId]: true }));
  };

  // Sort images by display_order and primary status
  const sortedImages = getSortedImages(images);

  console.log('GovernateImagesContainer - sorted images:', sortedImages);

  // If no images, show governate placeholder
  if (!images || images.length === 0) {
    console.log('No governate images available, showing placeholder');
    return (
      <div className="mt-6">
        <div className="bg-gradient-to-br from-blue-100 to-indigo-200 rounded-2xl h-64 flex items-center justify-center">
          <div className="text-center text-blue-700">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p>{language === 'ar' ? 'لا توجد صور متاحة للمحافظة' : 'No images available for this governate'}</p>
          </div>
        </div>
      </div>
    );
  }

  const remainingImageCount = Math.max(0, sortedImages.length - 3);

  // Function to render image with error handling
  const renderImage = (img: GovernateImage, className: string, onClick?: () => void) => {
    const imageUrl = getGovernateImageUrl(img.image_url);
    const altText = img.alt_text || `${language === 'ar' ? 'صورة' : 'Image of'} ${governateName}`;
    const hasError = imageErrors[img.id];

    console.log(`Rendering governate image ${img.id}:`, imageUrl);

    if (hasError) {
      return (
        <div className={`${className} bg-gradient-to-br from-blue-200 to-indigo-300 flex items-center justify-center rounded-2xl`}>
          <div className="text-center text-blue-700">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-xs">{language === 'ar' ? 'فشل تحميل الصورة' : 'Failed to load image'}</p>
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
          onLoad={() => console.log('Governate image loaded successfully:', img.id)}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={img.is_primary}
        />
        
        {/* Governate-specific overlay effects */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Primary image indicator */}
        {img.is_primary && (
          <div className="absolute top-3 left-3 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
            {language === 'ar' ? 'الرئيسية' : 'Primary'}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-6">
      {showModal && (
        <GovernateImagesModal 
          images={sortedImages.map(img => getGovernateImageUrl(img.image_url))}
          governateName={governateName}
          language={language}
          onClose={() => setShowModal(false)} 
        />
      )}
      
      {/* Desktop Layout (lg screens and up) */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-3 gap-4">
          {/* Main large image */}
          {sortedImages[0] && (
            <div className="col-span-2">
              {renderImage(
                sortedImages[0],
                "w-full h-[33rem]",
                () => setShowModal(true)
              )}
            </div>
          )}
          
          {/* Side images column */}
          <div className="flex flex-col gap-4">
            {sortedImages.slice(1, 3).map((img, index) => (
              <div key={img.id} className="relative">
                {renderImage(
                  img,
                  "w-full h-64",
                  () => setShowModal(true)
                )}
                {/* Show overlay only on the second side image if there are more than 3 */}
                {index === 1 && remainingImageCount > 0 && (
                  <div 
                    className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer hover:bg-black/40 transition-colors rounded-2xl"
                    onClick={() => setShowModal(true)}
                  >
                    <div className="text-white text-center">
                      <div className="text-3xl font-bold mb-1">+{remainingImageCount}</div>
                      <div className="text-sm">
                        {language === 'ar' ? 'المزيد من الصور' : 'More photos'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile & iPad Layout (below lg screens) */}
      <div className="block lg:hidden">
        <div className="relative w-full max-w-md mx-auto bg-white overflow-hidden shadow-lg rounded-2xl border border-blue-100">
          
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
                {sortedImages[1] && renderImage(
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

              {/* Right Image */}
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