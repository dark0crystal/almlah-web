"use client"

import Image, { StaticImageData } from "next/image";

interface RecommendationImageProps {
  src: string | StaticImageData;
  alt: string;
  height?: string;
  gradient?: string;
  priority?: boolean;
  className?: string;
}

export default function RecommendationImage({ 
  src, 
  alt, 
  height = "h-48 md:h-64", 
  gradient = "from-blue-500 to-purple-600",
  priority = false,
  className = ""
}: RecommendationImageProps) {
  return (
    <div className={`relative ${height} rounded-2xl overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        priority={priority}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          if (target.parentNode) {
            (target.parentNode as HTMLElement).style.background = 
              `linear-gradient(135deg, ${gradient.replace('from-', '').replace(' to-', ', ')})`;
          }
        }}
      />
    </div>
  );
}