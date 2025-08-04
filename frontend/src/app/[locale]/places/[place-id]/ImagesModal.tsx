"use client";
import Image from "next/image";
import { useState } from "react";

const images = [
  "/img1.jpeg",
  "/img2.jpeg",
  "/img3.jpeg",
  "/img4.jpeg",
  "/img5.jpeg",
];

export default function ImagesModal({ onClose }: { onClose: () => void }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center p-4">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 md:top-6 md:right-6 text-black text-xl md:text-2xl bg-white hover:bg-gray-100 rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center shadow-lg transition-colors duration-200 z-10"
      >
        ✕
      </button>

      {/* Main Image Container */}
      <div className="w-full max-w-6xl mx-auto flex flex-col items-center justify-center flex-1">
        {/* Main Image */}
        <div className="relative w-full max-w-4xl h-[50vh] sm:h-[60vh] md:h-[70vh] mb-4 md:mb-6">
          <div className="relative w-full h-full rounded-xl md:rounded-2xl overflow-hidden shadow-2xl">
            <Image
              src={images[selectedIndex]}
              alt={`Image ${selectedIndex + 1}`}
              fill
              className="object-contain"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
            />
          </div>
        </div>

        {/* Image Counter */}
        <div className="text-white text-sm md:text-base mb-4 opacity-80">
          {selectedIndex + 1} / {images.length}
        </div>

        {/* Thumbnails Container */}
        <div className="w-full max-w-4xl">
          <div className="flex gap-2 md:gap-4 justify-center overflow-x-auto pb-2 px-2">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedIndex(i)}
                className={`relative flex-shrink-0 w-16 h-12 sm:w-20 sm:h-16 md:w-24 md:h-18 lg:w-28 lg:h-20 rounded-lg md:rounded-xl overflow-hidden border-2 md:border-4 transition-all duration-200 hover:scale-105 ${
                  i === selectedIndex 
                    ? "border-white shadow-lg" 
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={img}
                  alt={`Thumbnail ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 64px, (max-width: 768px) 80px, (max-width: 1024px) 96px, 112px"
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation arrows for larger screens */}
      <button
        onClick={() => setSelectedIndex(selectedIndex > 0 ? selectedIndex - 1 : images.length - 1)}
        className="hidden md:block absolute left-4 lg:left-8 top-1/2 transform -translate-y-1/2 text-white bg-black/30 hover:bg-black/50 rounded-full w-12 h-12 flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
      >
        ←
      </button>
      
      <button
        onClick={() => setSelectedIndex(selectedIndex < images.length - 1 ? selectedIndex + 1 : 0)}
        className="hidden md:block absolute right-4 lg:right-8 top-1/2 transform -translate-y-1/2 text-white bg-black/30 hover:bg-black/50 rounded-full w-12 h-12 flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
      >
        →
      </button>
    </div>
  );
}