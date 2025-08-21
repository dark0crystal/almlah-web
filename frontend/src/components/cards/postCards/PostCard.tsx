// PostCard.tsx
"use client"

import Image from 'next/image';

interface PostCardProps {
  title: string;
  description?: string;
  image?: string;
  author?: string;
  date?: string;
  category?: string;
  isNew?: boolean;
  onClick?: () => void;
}

export default function PostCard({
  title,
  description,
  image,
  author,
  date,
  category,
  isNew = false,
  onClick
}: PostCardProps) {

  return (
    <div className="relative w-full rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
         onClick={onClick}>
      
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
        <Image
          src={image || '/placeholder-image.jpg'}
          alt={title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* NEW Badge - Top right corner */}
        {isNew && (
          <div className="absolute top-4 right-4 z-10">
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1.5 rounded-full">
              NEW
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="pt-4 pb-2 px-2">
        {/* Categories */}
        {category && (
          <div className="mb-2">
            <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">
              {category.toUpperCase()}
            </span>
          </div>
        )}

        {/* Title */}
        <h3 className="text-2xl font-bold text-gray-900 leading-tight">
          {title}
        </h3>
      </div>
    </div>
  );
}