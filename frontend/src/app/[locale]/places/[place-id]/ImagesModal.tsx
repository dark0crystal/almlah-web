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
    <div className="fixed inset-0 bg-black/70 z-50 flex flex-col items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white text-2xl bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg"
      >
        ✕
      </button>

      {/* Main Image */}
      <div className="w-[90%] md:w-[60%] max-h-[70vh] rounded-2xl overflow-hidden shadow-xl">
        <div className="relative w-full h-[60vh]">
          <Image
            src={images[selectedIndex]}
            alt={`Image ${selectedIndex + 1}`}
            fill
            className="object-contain rounded-2xl"
          />
        </div>
      </div>

      {/* Thumbnails */}
      <div className="flex gap-4 mt-6 overflow-x-auto px-4">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setSelectedIndex(i)}
            className={`relative w-28 h-20 rounded-xl overflow-hidden border-4 transition-all duration-200 ${
              i === selectedIndex ? "border-white" : "border-transparent"
            }`}
          >
            <Image
              src={img}
              alt={`Thumbnail ${i + 1}`}
              fill
              className="object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
