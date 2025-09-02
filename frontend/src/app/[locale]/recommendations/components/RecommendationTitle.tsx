"use client"

interface RecommendationTitleProps {
  title: string;
  icon?: string;
  size?: 'small' | 'medium' | 'large' | 'xl';
  align?: 'left' | 'center' | 'right';
  className?: string;
  gradient?: string;
  locale?: string;
}

export default function RecommendationTitle({ 
  title, 
  icon,
  size = 'medium',
  align = 'left',
  className = "",
  gradient,
  locale = 'en'
}: RecommendationTitleProps) {
  const sizeClasses = {
    small: 'text-xl md:text-2xl',
    medium: 'text-2xl md:text-3xl',
    large: 'text-3xl md:text-4xl',
    xl: 'text-4xl md:text-5xl lg:text-6xl'
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  const textColor = gradient 
    ? `bg-gradient-to-r ${gradient} bg-clip-text text-transparent`
    : 'text-gray-900';

  return (
    <div className={`${alignClasses[align]} ${locale === 'ar' ? 'rtl' : 'ltr'} ${className}`}>
      {icon && (
        <div className={`${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'} flex items-center gap-3 mb-4`}>
          <span className="text-4xl">{icon}</span>
        </div>
      )}
      <h1 className={`${sizeClasses[size]} font-bold ${textColor} leading-tight`}>
        {title}
      </h1>
    </div>
  );
}