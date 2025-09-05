// CategoryCard.tsx
import Image, { StaticImageData } from 'next/image';
import Link from 'next/link';
import { useLocale } from 'next-intl';

interface CategoryCardProps {
  title: string;
  subtitle?: string;
  icon?: string;
  bgColor: string;
  bgImage?: string | StaticImageData; // Can be string URL or imported image
  textColor?: string;
  slug?: string; // For navigation
  href?: string; // Custom href
  onClick?: () => void;
}

export default function CategoryCard({
  title,
  subtitle,
  icon,
  bgColor,
  bgImage,
  textColor = "text-gray-900",
  slug,
  href: customHref,
  onClick
}: CategoryCardProps) {
  const locale = useLocale();
  
  // Use custom href if provided, otherwise create href based on slug
  const href = customHref 
    ? `/${locale}${customHref}` 
    : slug 
    ? `/${locale}/places?category=${slug}` 
    : `/${locale}/places`;

  const cardContent = (
    <>
      {/* Image Container */}
      <div className="w-full aspect-square mb-3 overflow-hidden rounded-lg">
        {bgImage ? (
          <Image
            src={bgImage}
            alt={title}
            width={400}
            height={400}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            priority={false}
          />
        ) : (
          // Fallback gradient background with icon if no image
          <div className={`${bgColor} w-full h-full flex items-center justify-center rounded-lg`}>
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
    </>
  );

  return (
    <Link 
      href={href}
      className="w-full cursor-pointer group transition-all duration-300 hover:scale-105 block"
      onClick={onClick}
    >
      {cardContent}
    </Link>
  );
}