// PostCard.tsx
"use client"

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
    <div className="relative w-full bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
         onClick={onClick}>
      
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image || '/placeholder-image.jpg'}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Category Badge - Positioned over image */}
        {category && (
          <div className="absolute top-3 left-3 z-10">
            <span className="bg-black/70 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full">
              {category}
            </span>
          </div>
        )}

        {/* NEW Badge - Top right corner */}
        {isNew && (
          <div className="absolute top-3 right-3 z-10">
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              NEW
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Categories */}
        {category && (
          <div className="mb-3">
            <span className="text-gray-500 text-sm font-medium uppercase tracking-wide">
              {category.toUpperCase()}
            </span>
          </div>
        )}

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
            {description}
          </p>
        )}

        {/* Meta Information */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          {author && (
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-gray-700">
                  {author.charAt(0).toUpperCase()}
                </span>
              </div>
              <span>{author}</span>
            </div>
          )}
          
          {date && (
            <span className="text-gray-400">
              {date}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}