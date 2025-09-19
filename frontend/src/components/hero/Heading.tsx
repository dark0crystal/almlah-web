'use client';

import Star from './Star';
import { useState } from 'react';
import { useLocale } from 'next-intl';
import Image from 'next/image';

export default function Heading() {
  const [starRotation, setStarRotation] = useState(0);
  const locale = useLocale();

  // Images that change based on star rotation
  const rotationImages = [
    '/gallery-alkhalil/img1.jpg',
    '/gallery-alkhalil/img3.jpg',
    '/gallery-alkhalil/img10.jpg',
    '/gallery-alkhalil/img11.jpg',
    '/gallery-alkhalil/img12.jpg',
    '/gallery-alkhalil/img14.jpg',
    '/gallery-alkhalil/img15.jpg',
    '/gallery-alkhalil/img16.jpg'
  ];

  // Calculate which image to show based on rotation
  const getImageIndex = (rotation: number) => {
    const normalizedRotation = ((rotation % 360) + 360) % 360; // Ensure positive
    return Math.floor(normalizedRotation / 45) % rotationImages.length;
  };

  const handleStarRotation = (rotation: number) => {
    setStarRotation(rotation);
  };

  const currentImageIndex = getImageIndex(starRotation);

  return (
    <div className="relative w-[88vw] h-[40vh] md:h-[50vh] mt-8 mx-auto mb-0 flex flex-col items-center justify-center bg-white rounded-3xl">
      {/* Big Screens Design (md and above) */}
      <div className="hidden md:flex w-full h-full flex-col items-center justify-center px-8">
        <h1 className="text-black font-extrabold text-4xl lg:text-6xl leading-relaxed text-center">
          {locale === 'ar' ? (
            <div className="flex items-center justify-center gap-6">
              <span>رفـيقـك</span>
              <div className="relative w-32 h-20 lg:w-40 lg:h-24 overflow-hidden rounded-2xl bg-gray-200 flex-shrink-0 shadow-lg">
                <Image 
                  src={rotationImages[currentImageIndex]} 
                  alt="Dynamic content"
                  fill
                  className="object-cover"
                />
              </div>
              <span>إلـي يــعرف كــل مـــكـان</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-6">
              <span>Your companion</span>
              <div className="relative w-32 h-20 lg:w-40 lg:h-24 overflow-hidden rounded-2xl bg-gray-200 flex-shrink-0 shadow-lg">
                <Image 
                  src={rotationImages[currentImageIndex]} 
                  alt="Dynamic content"
                  fill
                  className="object-cover"
                />
              </div>
              <span>who knows every place</span>
            </div>
          )}
        </h1>
        <p className="text-black font-semibold text-xl lg:text-2xl mt-4 opacity-80">
          {locale === 'ar' ? 'مـلاحك جــاهـز' : 'Almlah is ready'}
        </p>
      </div>

      {/* Small Screens Design (below md) */}
      <div className="md:hidden w-full h-full flex flex-col items-center justify-center px-4 space-y-4">
        <div className="text-center">
          <h1 className="text-black font-extrabold text-2xl sm:text-3xl leading-tight">
            {locale === 'ar' ? 'رفـيقـك إلـي يــعرف كــل مـــكـان' : 'Your companion who knows every place'}
          </h1>
          <p className="text-black font-semibold text-lg mt-2 opacity-80">
            {locale === 'ar' ? 'مـلاحك جــاهـز' : 'Almlah is ready'}
          </p>
        </div>
        
        <div className="relative w-24 h-16 sm:w-28 sm:h-18 overflow-hidden rounded-xl bg-gray-200 shadow-md">
          <Image 
            src={rotationImages[currentImageIndex]} 
            alt="Dynamic content"
            fill
            className="object-cover"
          />
        </div>
      </div>
      
      {/* Star Component - Bottom Center, Top Half Only */}
     <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-full overflow-hidden">
      <Star onRotationChange={handleStarRotation} />
    </div>
    </div>
  );
}