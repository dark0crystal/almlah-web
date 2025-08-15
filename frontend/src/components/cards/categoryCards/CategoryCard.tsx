interface CategoryCardProps {
  title: string;
  subtitle?: string;
  icon?: string;
  bgColor: string;
  textColor?: string;
  onClick?: () => void;
}

export default function CategoryCard({ 
  title, 
  subtitle, 
  icon, 
  bgColor, 
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
      {/* Background Pattern/Decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full"></div>
        <div className="absolute bottom-6 left-4 w-12 h-12 bg-white/10 rounded-lg rotate-12"></div>
      </div>
      
      {/* Icon Section */}
      {icon && (
        <div className="flex justify-end">
          <div className="w-8 h-8 flex items-center justify-center">
            <span className="text-xl">{icon}</span>
          </div>
        </div>
      )}
      
      {/* Content Section */}
      <div className="relative z-10">
        <h3 className="text-xl font-bold mb-1 leading-tight">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm opacity-80 font-medium">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
