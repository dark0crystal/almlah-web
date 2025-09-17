"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ImagesModalProps {
  images: string[];
  wilayahName: string;
  onClose: () => void;
  initialIndex?: number;
}

export default function ImagesModal({ 
  images, 
  wilayahName, 
  onClose, 
  initialIndex = 0 
}: ImagesModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const t = useTranslations('wilayah.images');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [currentIndex]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 transition-colors"
        aria-label={t('close')}
      >
        <X className="w-8 h-8" />
      </button>

      {/* Image counter */}
      <div className="absolute top-4 left-4 text-white bg-black/50 px-3 py-1 rounded-full">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Navigation buttons */}
      {images.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors bg-black/50 p-2 rounded-full"
            aria-label={t('previous')}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors bg-black/50 p-2 rounded-full"
            aria-label={t('next')}
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}

      {/* Main image */}
      <div className="relative w-full h-full max-w-7xl max-h-[90vh] mx-auto px-16">
        <Image
          src={images[currentIndex]}
          alt={`${wilayahName} - ${t('image')} ${currentIndex + 1}`}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
          priority
        />
      </div>

      {/* Thumbnail navigation */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-full px-4 overflow-x-auto">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex 
                  ? 'border-white scale-110' 
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <Image
                src={img}
                alt={`${t('thumbnail')} ${index + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}