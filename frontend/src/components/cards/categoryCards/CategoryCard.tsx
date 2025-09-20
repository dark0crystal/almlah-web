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
      <div className="w-full aspect-square mb-3 overflow-hidden rounded-lg relative">
        {/* Star background for all images */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 16 16" className="w-20 h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 opacity-30" preserveAspectRatio="xMidYMid meet">
            <path 
              d="M3.77256 14.1251C3.1287 14.1251 2.65038 13.9688 2.33777 13.6564C2.02987 13.3486 1.87583 12.8729 1.87583 12.2292V10.7319C1.87583 10.6013 1.83157 10.4917 1.74288 10.4031L0.68604 9.33974C0.228617 8.88741 0 8.44205 0 8.00365C0 7.56525 0.228617 7.11744 0.685851 6.6604L1.74269 5.59706C1.83139 5.5084 1.87564 5.40111 1.87564 5.27518V3.77099C1.87564 3.12271 2.02968 2.64459 2.33758 2.33682C2.65019 2.02906 3.12851 1.87508 3.77237 1.87508H5.27025C5.40094 1.87508 5.51054 1.83085 5.59924 1.74219L6.66304 0.685812C7.12046 0.228777 7.56602 7.12149e-05 7.99991 7.12149e-05C8.4385 -0.00463467 8.88406 0.223883 9.33677 0.685624L10.4006 1.742C10.494 1.83066 10.6058 1.87489 10.7365 1.87489H12.2274C12.876 1.87489 13.3543 2.03113 13.6622 2.3436C13.9701 2.65607 14.1242 3.13193 14.1242 3.7708V5.27499C14.1242 5.40092 14.1709 5.50821 14.2641 5.59687L15.3209 6.66021C15.7735 7.11725 15.9998 7.56506 15.9998 8.00346C16.0045 8.44186 15.7782 8.88722 15.3209 9.33974L14.2641 10.4031C14.1707 10.4917 14.1242 10.6013 14.1242 10.7319V12.2292C14.1242 12.8774 13.9679 13.3556 13.6553 13.6633C13.3474 13.9711 12.8715 14.1251 12.2274 14.1251H10.7365C10.6058 14.1251 10.4938 14.1695 10.4006 14.258L9.33677 15.3213C8.88424 15.7736 8.43868 15.9999 7.99991 15.9999C7.56602 16.0046 7.12028 15.7783 6.66304 15.3213L5.59924 14.258C5.51054 14.1693 5.40094 14.1251 5.27025 14.1251H3.77237H3.77256Z" 
              fill="#FFC00A"
            />
          </svg>
        </div>
        
        {bgImage ? (
          <Image
            src={bgImage}
            alt={title}
            width={400}
            height={400}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 relative z-10"
            priority={false}
          />
        ) : (
          // Fallback gradient background with icon if no image
          <div className={`${bgColor} w-full h-full flex items-center justify-center rounded-lg relative z-10`}>
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