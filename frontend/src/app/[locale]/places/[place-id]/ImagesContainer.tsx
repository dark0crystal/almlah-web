"use client";

import Image from "next/image";
import { useState } from "react";
import ImagesModal from "./ImagesModal";

const placeImages = [
  "/img1.jpeg",
  "/img1.jpeg",
  "/img1.jpeg",
  "/img1.jpeg",
  "/img1.jpeg",
];

export default function PlaceImagesContainer() {
  const remainingImageCount = placeImages.length - 3;
  const [showModal, setShowModal] = useState(false);
  const handleOverlayClick = () => {
    alert("Open gallery or modal for remaining images");
  };

  return (
    <div className="mt-6 ">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {showModal && <ImagesModal onClose={() => setShowModal(false)} />}


        {/* Right column: third image */}
        {placeImages[2] && (
          <div className="lg:col-span-2">
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
  );
}
