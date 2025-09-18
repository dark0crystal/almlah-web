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
    '/G63.png',
    '/landcruiser.png', 
    '/rb3.png',
    '/minicober.png',
    '/chai.png',
    '/khayma.png',
    '/samhah.png',
    '/alryam.png'
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
    <div className="relative w-[88vw] h-[50vh] mt-8 mx-auto mb-0 flex flex-col items-center justify-center">
      {/* Curved Text */}
      <div className="w-full h-1/2 flex items-center justify-center relative">
        <svg viewBox="0 0 1000 200" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <path 
              id="curve" 
              d="M 50,150 Q 500,30 950,150" 
              fill="none" 
              stroke="none"
            />
          </defs>
          
          {/* Text based on locale */}
          <text 
            className="fill-black font-extrabold text-5xl lg:text-5xl md:text-4xl sm:text-3xl"
            style={{
              fontFamily: 'inherit',
              fontWeight: '800'
            }}
          >
            <textPath href="#curve" startOffset="50%" textAnchor="middle">
              {locale === 'ar' ? (
                <>
                   الـمـلاح 
                  <span className="inline-block mx-2 align-middle">
                    <div className="w-12 h-8 overflow-hidden rounded-lg bg-gray-200 inline-block">
                      <Image 
                        src={rotationImages[currentImageIndex]} 
                        alt="Dynamic content"
                        width={48}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </span>
                  رفــيقـك إلي يــعرف كــل مـــكـان
                </>
              ) : (
                <>
                  Almlah 
                  <span className="inline-block mx-2 align-middle">
                    <div className="w-12 h-8 overflow-hidden rounded-lg bg-gray-200 inline-block">
                      <Image 
                        src={rotationImages[currentImageIndex]} 
                        alt="Dynamic content"
                        width={48}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </span>
                  your companion who knows every place
                </>
              )}
            </textPath>
          </text>
        </svg>
      </div>
      
      {/* Star Component */}
      <div className="w-full h-1/2 flex items-center justify-center">
        <Star onRotationChange={handleStarRotation} />
      </div>
    </div>
  );
}