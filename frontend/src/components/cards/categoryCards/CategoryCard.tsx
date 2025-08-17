// CategoryCard.tsx
import rb3 from "../../../../public/rb3.png"
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
  textColor = "text-gray-900",
  onClick
}: CategoryCardProps) {
  return (
    <div
      className="w-full cursor-pointer group transition-all duration-300 hover:scale-105"
      onClick={onClick}
    >
      {/* Image Container */}
      <div className="w-full aspect-square mb-3 overflow-hidden">
        {bgImage ? (
          <img
            src={rb3.src}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          // Fallback gradient background with icon if no image
          <div className={`${bgColor} w-full h-full flex items-center justify-center`}>
            {icon && (
              <span className="text-4xl opacity-80">{icon}</span>
            )}
          </div>
        )}
      </div>

      {/* Text Content */}
      <div className="text-center">
        <h3 className={`text-lg font-bold mb-1 leading-tight ${textColor}`}>
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-gray-600 font-medium">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}