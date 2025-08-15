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
    <div className="relative w-full aspect-square">
      {/* Main Card with overflow-hidden */}
      <div 
        className="relative w-full h-full rounded-2xl overflow-hidden cursor-pointer group shadow-lg"
        onClick={onClick}
      >
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: image ? `url(${image})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}
        />
        
        {/* Dark Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />

        {/* Category Badge - Top Left */}
        {category && (
          <div className="absolute top-3 left-3 z-10">
            <span className="bg-white/20 backdrop-blur-md text-white text-xs font-medium px-3 py-1 rounded-full border border-white/30">
              {category}
            </span>
          </div>
        )}

        {/* Content Overlay - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
          {/* Title */}
          <h3 className="text-white text-lg font-bold mb-2 line-clamp-2 drop-shadow-lg">
            {title}
          </h3>

          {/* Description */}
          {description && (
            <p className="text-white/90 text-sm mb-3 line-clamp-2 drop-shadow-md">
              {description}
            </p>
          )}

          {/* Meta Information */}
          <div className="flex items-center justify-between text-sm">
            {author && (
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <div className="w-6 h-6 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/40">
                  <span className="text-xs font-medium text-white">
                    {author.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-white/90 text-xs drop-shadow-md">{author}</span>
              </div>
            )}
            
            {date && (
              <span className="text-white/80 text-xs drop-shadow-md bg-black/20 px-2 py-1 rounded-md backdrop-blur-sm">
                {date}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* NEW Badge - Outside overflow container, positioned relative to wrapper */}
      {isNew && (
        <div className="absolute -top-3 -right-3 z-50 pointer-events-none">
          <svg 
            width="50" 
            height="50" 
            viewBox="0 0 16 16" 
            className="drop-shadow-xl filter brightness-110"
          >
            <path 
              d="M3.77256 14.1251C3.1287 14.1251 2.65038 13.9688 2.33777 13.6564C2.02987 13.3486 1.87583 12.8729 1.87583 12.2292V10.7319C1.87583 10.6013 1.83157 10.4917 1.74288 10.4031L0.68604 9.33974C0.228617 8.88741 0 8.44205 0 8.00365C0 7.56525 0.228617 7.11744 0.685851 6.6604L1.74269 5.59706C1.83139 5.5084 1.87564 5.40111 1.87564 5.27518V3.77099C1.87564 3.12271 2.02968 2.64459 2.33758 2.33682C2.65019 2.02906 3.12851 1.87508 3.77237 1.87508H5.27025C5.40094 1.87508 5.51054 1.83085 5.59924 1.74219L6.66304 0.685812C7.12046 0.228777 7.56602 7.12149e-05 7.99991 7.12149e-05C8.4385 -0.00463467 8.88406 0.223883 9.33677 0.685624L10.4006 1.742C10.494 1.83066 10.6058 1.87489 10.7365 1.87489H12.2274C12.876 1.87489 13.3543 2.03113 13.6622 2.3436C13.9701 2.65607 14.1242 3.13193 14.1242 3.7708V5.27499C14.1242 5.40092 14.1709 5.50821 14.2641 5.59687L15.3209 6.66021C15.7735 7.11725 15.9998 7.56506 15.9998 8.00346C16.0045 8.44186 15.7782 8.88722 15.3209 9.33974L14.2641 10.4031C14.1707 10.4917 14.1242 10.6013 14.1242 10.7319V12.2292C14.1242 12.8774 13.9679 13.3556 13.6553 13.6633C13.3474 13.9711 12.8715 14.1251 12.2274 14.1251H10.7365C10.6058 14.1251 10.4938 14.1695 10.4006 14.258L9.33677 15.3213C8.88424 15.7736 8.43868 15.9999 7.99991 15.9999C7.56602 16.0046 7.12028 15.7783 6.66304 15.3213L5.59924 14.258C5.51054 14.1693 5.40094 14.1251 5.27025 14.1251H3.77237H3.77256Z" 
              fill="#FF3B30"
            />
            <text 
              x="8" 
              y="10" 
              textAnchor="middle" 
              className="text-[5.5px] font-extrabold fill-white"
              style={{ fontSize: '5.5px', fontWeight: '900' }}
            >
              NEW
            </text>
          </svg>
        </div>
      )}
    </div>
  );
}