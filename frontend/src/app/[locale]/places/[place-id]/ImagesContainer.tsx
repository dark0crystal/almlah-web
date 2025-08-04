"use client";
import Image from "next/image";
import { useState } from "react";
import ImagesModal from "./ImagesModal";

const placeImages = [
  "/img1.jpeg",
  "/img2.jpeg",
  "/img3.jpeg",
  "/img4.jpeg",
  "/img5.jpeg",
];

export default function PlaceImagesContainer() {
  const remainingImageCount = placeImages.length - 3;
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="mt-6">
      {showModal && <ImagesModal onClose={() => setShowModal(false)} />}
      
      {/* Desktop Layout (lg screens and up) */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-3 gap-4">
          {/* Right column: third image */}
          {placeImages[2] && (
            <div className="col-span-2">
              <div className="relative w-full h-[33rem] rounded-2xl overflow-hidden">
                <Image
                  src={placeImages[2]}
                  alt="Main view"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}
          
          {/* Left column: first two images */}
          <div className="flex flex-col gap-4">
            {placeImages.slice(0, 2).map((img, index) => (
              <div
                key={index}
                className="relative w-full h-64 rounded-2xl overflow-hidden"
              >
                <Image
                  src={img}
                  alt={`Place view ${index + 1}`}
                  fill
                  className="object-cover"
                />
                {/* Show overlay only on the second image if there are more than 3 */}
                {index === 1 && remainingImageCount > 0 && (
                  <div
                    className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer"
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
        <div className="relative w-full max-w-md mx-auto bg-white  overflow-hidden shadow-lg">
          
          {/* Main Image */}
          <div className="relative">
            <div className="relative w-full h-64 sm:h-80">
              <Image
                src={placeImages[0]}
                alt="المنظر الرئيسي"
                fill
                className="object-cover"
                priority
                onClick={() => setShowModal(true)}
              />
            </div>
          </div>

          {/* Bottom Images Row */}
          <div className="grid grid-cols-2 gap-2">
            
            {/* Left Image - More Photos Counter */}
            <div 
              className="relative h-32 sm:h-40 cursor-pointer group"
              onClick={() => setShowModal(true)}
            >
              <Image
                src={placeImages[1]}
                alt="More photos"
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
            <div 
              className="relative h-32 sm:h-40 cursor-pointer group"
              onClick={() => setShowModal(true)}
            >
              <Image
                src={placeImages[2]}
                alt="المنظر الداخلي"
                fill
                className="object-cover"
              />
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}