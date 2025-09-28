'use client';

import Star from './Star';
import Image from 'next/image';
import { useState } from 'react';
import { useLocale } from 'next-intl';

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
    <div className="relative w-[88vw] h-[40vh] md:h-[60vh] mt-8 mx-auto mb-0 flex flex-col items-center justify-center bg-white rounded-3xl">
      {/* Big Screens Design (md and above) */}
      <div className="hidden md:flex w-full h-full flex-col items-center justify-center px-8">
        <h1 className="text-black font-extrabold text-4xl lg:text-6xl leading-relaxed text-center">
          {locale === 'ar' ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <span>رفـيقـك</span>
                <div className="relative w-16 h-12 lg:w-20 lg:h-14 overflow-hidden rounded-xl bg-gray-200 flex-shrink-0 shadow-md">
                  <Image 
                    src={rotationImages[currentImageIndex]} 
                    alt="مكان جميل"
                    fill
                    className="object-cover"
                  />
                </div>
                <span>إلّـي حــافظ الـبلاد</span>
              </div>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <span>من شـمالهــا لــجنوبهــا</span>
                <div className="relative w-16 h-12 lg:w-20 lg:h-14 overflow-hidden rounded-xl bg-gray-200 flex-shrink-0 shadow-md">
                  <Image 
                    src="/gallery-alkhalil/img3.jpg" 
                    alt="مكان آخر"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <span>Your companion</span>
              <div className="relative w-16 h-12 lg:w-20 lg:h-14 overflow-hidden rounded-xl bg-gray-200 flex-shrink-0 shadow-md">
                <Image 
                  src={rotationImages[currentImageIndex]} 
                  alt="Beautiful place"
                  fill
                  className="object-cover"
                />
              </div>
              <span>who knows every place</span>
              <div className="relative w-16 h-12 lg:w-20 lg:h-14 overflow-hidden rounded-xl bg-gray-200 flex-shrink-0 shadow-md">
                <Image 
                  src="/gallery-alkhalil/img3.jpg" 
                  alt="Another place"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}
        </h1>
      </div>

      {/* Small Screens Design (below md) */}
      <div className="md:hidden w-full h-full flex flex-col items-center justify-center px-4 pb-16">
        <div className="text-center">
          <h1 className="text-black font-extrabold text-3xl sm:text-4xl md:text-5xl leading-tight max-w-full">
            {locale === 'ar' ? (
              <div className="flex flex-col items-center gap-1 sm:gap-2">
                <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                  <span>رفيقك</span>
                  <div className="relative w-12 h-8 sm:w-14 sm:h-10 overflow-hidden rounded-lg bg-gray-200 flex-shrink-0 shadow-md">
                    <Image 
                      src={rotationImages[currentImageIndex]} 
                      alt="مكان جميل"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span>إلي حافظ البلاد</span>
                </div>
                <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                  <span>من شمالها لجنوبها</span>
                  <div className="relative w-12 h-8 sm:w-14 sm:h-10 overflow-hidden rounded-lg bg-gray-200 flex-shrink-0 shadow-md">
                    <Image 
                      src="/gallery-alkhalil/img3.jpg" 
                      alt="مكان آخر"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                <span>Your companion</span>
                <div className="relative w-12 h-8 sm:w-14 sm:h-10 overflow-hidden rounded-lg bg-gray-200 flex-shrink-0 shadow-md">
                  <Image 
                    src={rotationImages[currentImageIndex]} 
                    alt="Beautiful place"
                    fill
                    className="object-cover"
                  />
                </div>
                <span>who knows every place</span>
                <div className="relative w-12 h-8 sm:w-14 sm:h-10 overflow-hidden rounded-lg bg-gray-200 flex-shrink-0 shadow-md">
                  <Image 
                    src="/gallery-alkhalil/img3.jpg" 
                    alt="Another place"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}
          </h1>
        </div>
      </div>
      
      {/* Star Component - Bottom Center, Top Half Only */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-full overflow-hidden">
        <Star onRotationChange={handleStarRotation} />
      </div>
    </div>
  );
}