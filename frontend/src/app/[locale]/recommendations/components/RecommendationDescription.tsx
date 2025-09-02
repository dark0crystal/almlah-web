"use client"

interface RecommendationDescriptionProps {
  description: string;
  size?: 'small' | 'medium' | 'large';
  align?: 'left' | 'center' | 'right';
  maxWidth?: string;
  className?: string;
  locale?: string;
}

export default function RecommendationDescription({ 
  description, 
  size = 'medium',
  align = 'left',
  maxWidth = 'max-w-3xl',
  className = "",
  locale = 'en'
}: RecommendationDescriptionProps) {
  const sizeClasses = {
    small: 'text-sm md:text-base',
    medium: 'text-base md:text-lg',
    large: 'text-lg md:text-xl'
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  const marginClass = align === 'center' ? 'mx-auto' : '';

  return (
    <div className={`${alignClasses[align]} ${locale === 'ar' ? 'rtl' : 'ltr'} ${className}`}>
      <p className={`${sizeClasses[size]} text-gray-600 ${maxWidth} ${marginClass} leading-relaxed`}>
        {description}
      </p>
    </div>
  );
}