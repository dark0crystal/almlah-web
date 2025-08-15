// CategoryCard.tsx
interface CategoryCardProps {
  title: string;
  subtitle?: string;
  icon?: string;
  bgColor: string;
  bgImage?: string;
  textColor?: string;
  onClick?: () => void;
}

export default function CategoryCard({ 
  title, 
  subtitle, 
  icon, 
  bgColor, 
  bgImage,
  textColor = "text-white",
  onClick 
}: CategoryCardProps) {
  return (
    <div 
      className={`
        ${bgColor} 
        ${textColor}
        w-full 
        aspect-square 
        rounded-2xl 
        p-6 
        flex 
        flex-col 
        justify-between 
        cursor-pointer 
        hover:scale-105 
        hover:shadow-lg 
        transition-all 
        duration-300 
        relative 
        overflow-hidden
        group
      `}
      onClick={onClick}
    >
      {/* Background Image */}
      {bgImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      )}
      
      {/* Overlay for better text readability */}
      <div className={`absolute inset-0 ${bgImage ? 'bg-black/40' : 'bg-gradient-to-br from-black/10 to-black/30'}`} />
      
      {/* Background Pattern/Decoration (only when no image) */}
      {!bgImage && (
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full"></div>
          <div className="absolute bottom-6 left-4 w-12 h-12 bg-white/10 rounded-lg rotate-12"></div>
        </div>
      )}
      
      {/* Icon Section */}
      {icon && (
        <div className="flex justify-end relative z-10">
          <div className="w-8 h-8 flex items-center justify-center bg-white/20 rounded-lg backdrop-blur-sm">
            <span className="text-xl">{icon}</span>
          </div>
        </div>
      )}
      
      {/* Content Section */}
      <div className="relative z-10">
        <h3 className="text-xl font-bold mb-1 leading-tight drop-shadow-lg">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm opacity-90 font-medium drop-shadow-md bg-white/20 inline-block px-2 py-1 rounded-md backdrop-blur-sm">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}