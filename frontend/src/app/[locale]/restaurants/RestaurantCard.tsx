"use client"
import { useState } from "react";
import { MapPin, Star, Clock, Phone } from "lucide-react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { Place } from "@/types"; // Using Place type instead of Restaurant

interface RestaurantCardProps {
  restaurant: Place; // Changed from Restaurant to Place
}

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const router = useRouter();
  const params = useParams();
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const locale = (params?.locale as string) || 'en';

  const handleCardClick = () => {
    // Fixed navigation path to match your dynamic route structure
    const navigationPath = locale 
      ? `/${locale}/restaurants/${restaurant.id}` 
      : `/restaurants/${restaurant.id}`;
    
    console.log('Navigating to:', navigationPath);
    router.push(navigationPath);
  };

  // Get image source with proper URL handling
  const getImageSrc = () => {
    let imageUrl = '';
    
    // First try primary_image
    if (restaurant.primary_image) {
      imageUrl = restaurant.primary_image;
    }
    // Then try images array
    else if (restaurant.images && restaurant.images.length > 0) {
      const primaryImage = restaurant.images.find(img => img.is_primary) || restaurant.images[0];
      imageUrl = primaryImage.image_url;
    }
    
    // If no image found, return default
    if (!imageUrl) {
      return '/images/default-restaurant.jpg';
    }
    
    // If it's already a full URL, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // If it's a relative path, add API base URL
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:9000";
    if (imageUrl.startsWith('/')) {
      return `${API_BASE_URL}${imageUrl}`;
    }
    
    return imageUrl;
  };

  // Get localized content
  const restaurantName = locale === 'ar' ? restaurant.name_ar : restaurant.name_en;
  const governateName = restaurant.governate 
    ? (locale === 'ar' ? restaurant.governate.name_ar : restaurant.governate.name_en)
    : '';
  const wilayahName = restaurant.wilayah 
    ? (locale === 'ar' ? restaurant.wilayah.name_ar : restaurant.wilayah.name_en)
    : '';

  const locationString = [governateName, wilayahName]
    .filter(Boolean)
    .join(' | ') || (locale === 'ar' ? 'سلطنة عمان' : 'Sultanate of Oman');

  const getCuisineText = () => {
    // Get the first category as cuisine type
    if (restaurant.categories && restaurant.categories.length > 0) {
      return locale === 'ar' ? restaurant.categories[0].name_ar : restaurant.categories[0].name_en;
    }
    return locale === 'ar' ? 'مطاعم ومشروبات' : 'Food & Beverages';
  };

  return (
    <div 
      className={`bg-white rounded-2xl hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 ${
        isHovered ? 'transform -translate-y-1' : ''
      } ${locale === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      <div className="flex h-36 md:h-44">
        {/* Image Section - Increased width and added padding */}
        <div className="w-2/5 p-2 flex items-center">
          <div className="relative w-full h-full rounded-2xl overflow-hidden">
            {!imageError ? (
              <Image 
                src={getImageSrc()}
                alt={restaurantName}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 40vw, 30vw"
                className={`object-cover transition-transform duration-300 ${
                  isHovered ? 'scale-110' : 'scale-100'
                }`}
                onError={() => setImageError(true)}
                priority={false}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center rounded-2xl">
                <MapPin className="w-8 h-8 text-gray-400" />
              </div>
            )}

            {/* Corner badge for featured restaurants */}
            {restaurant.is_featured && (
              <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-full p-1">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {locale === 'ar' ? 'م' : 'F'}
                  </span>
                </div>
              </div>
            )}

            {/* Rating badge */}
            {restaurant.rating && restaurant.rating > 0 && (
              <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                <span className="text-white text-xs font-medium">
                  {restaurant.rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content Section - Adjusted width and centered vertically */}
        <div className={`flex-1 p-4 flex flex-col justify-between ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
          {/* Header */}
          <div>
            {/* Restaurant Name */}
            <h3 className="font-bold text-gray-800 text-lg mb-1 line-clamp-1">
              {restaurantName}
            </h3>

            {/* Cuisine Type */}
            <p className="text-orange-600 text-sm font-medium mb-1">
              {getCuisineText()}
            </p>

            {/* Location */}
            <p className="text-gray-600 text-sm line-clamp-1 mb-2">
              {locationString}
            </p>
          </div>

          {/* Footer */}
          <div className={`flex items-center justify-between ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
            {/* Rating or additional info */}
            <div className="text-sm text-gray-600">
              {restaurant.rating ? (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                  <span>{restaurant.rating.toFixed(1)}</span>
                </div>
              ) : (
                <span>{locale === 'ar' ? 'جديد' : 'New'}</span>
              )}
            </div>

            {/* Additional Info */}
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {restaurant.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span className="hidden sm:inline">
                    {locale === 'ar' ? 'هاتف' : 'Phone'}
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span className="hidden sm:inline">
                  {locale === 'ar' ? 'ساعات العمل' : 'Hours'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const router = useRouter();
  const params = useParams();
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const locale = (params?.locale as string) || 'en';

  const handleCardClick = () => {
    // Fixed navigation path to match your dynamic route structure
    const navigationPath = locale 
      ? `/${locale}/restaurants/${restaurant.id}` 
      : `/restaurants/${restaurant.id}`;
    
    console.log('Navigating to:', navigationPath);
    router.push(navigationPath);
  };

  // Get image source with proper URL handling
  const getImageSrc = () => {
    let imageUrl = '';
    
    // First try primary_image
    if (restaurant.primary_image) {
      imageUrl = restaurant.primary_image;
    }
    // Then try images array
    else if (restaurant.images && restaurant.images.length > 0) {
      const primaryImage = restaurant.images.find(img => img.is_primary) || restaurant.images[0];
      imageUrl = primaryImage.image_url;
    }
    
    // If no image found, return default
    if (!imageUrl) {
      return '/images/default-restaurant.jpg';
    }
    
    // If it's already a full URL, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // If it's a relative path, add API base URL
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:9000";
    if (imageUrl.startsWith('/')) {
      return `${API_BASE_URL}${imageUrl}`;
    }
    
    return imageUrl;
  };

  // Get localized content
  const restaurantName = locale === 'ar' ? restaurant.name_ar : restaurant.name_en;
  const governateName = restaurant.governate 
    ? (locale === 'ar' ? restaurant.governate.name_ar : restaurant.governate.name_en)
    : '';
  const wilayahName = restaurant.wilayah 
    ? (locale === 'ar' ? restaurant.wilayah.name_ar : restaurant.wilayah.name_en)
    : '';

  const locationString = [governateName, wilayahName]
    .filter(Boolean)
    .join(' | ') || (locale === 'ar' ? 'سلطنة عمان' : 'Sultanate of Oman');

  const getCuisineText = () => {
    if (restaurant.category) {
      return locale === 'ar' ? restaurant.category.name_ar : restaurant.category.name_en;
    }
    return locale === 'ar' ? 'مطاعم ومشروبات' : 'Food & Beverages';
  };

  // Format hours (if available)
  const formatHours = () => {
    if (restaurant.opening_hours) {
      return restaurant.opening_hours;
    }
    return locale === 'ar' ? 'غير محدد' : 'Hours not specified';
  };

  // Format price range
  const getPriceRange = () => {
    if (restaurant.price_range) {
      return restaurant.price_range;
    }
    return locale === 'ar' ? 'غير محدد' : 'Price not specified';
  };

  return (
    <div 
      className={`bg-white rounded-2xl hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 ${
        isHovered ? 'transform -translate-y-1' : ''
      } ${locale === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      <div className="flex h-36 md:h-44">
        {/* Image Section - Increased width and added padding */}
        <div className="w-2/5 p-2 flex items-center">
          <div className="relative w-full h-full rounded-2xl overflow-hidden">
            {!imageError ? (
              <Image 
                src={getImageSrc()}
                alt={restaurantName}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 40vw, 30vw"
                className={`object-cover transition-transform duration-300 ${
                  isHovered ? 'scale-110' : 'scale-100'
                }`}
                onError={() => setImageError(true)}
                priority={false}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center rounded-2xl">
                <MapPin className="w-8 h-8 text-gray-400" />
              </div>
            )}

            {/* Corner badge for featured restaurants */}
            {restaurant.is_featured && (
              <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-full p-1">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {locale === 'ar' ? 'م' : 'F'}
                  </span>
                </div>
              </div>
            )}

            {/* Rating badge */}
            {restaurant.rating && restaurant.rating > 0 && (
              <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                <span className="text-white text-xs font-medium">
                  {restaurant.rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content Section - Adjusted width and centered vertically */}
        <div className={`flex-1 p-4 flex flex-col justify-between ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
          {/* Header */}
          <div>
            {/* Restaurant Name */}
            <h3 className="font-bold text-gray-800 text-lg mb-1 line-clamp-1">
              {restaurantName}
            </h3>

            {/* Cuisine Type */}
            <p className="text-orange-600 text-sm font-medium mb-1">
              {getCuisineText()}
            </p>

            {/* Location */}
            <p className="text-gray-600 text-sm line-clamp-1 mb-2">
              {locationString}
            </p>
          </div>

          {/* Footer */}
          <div className={`flex items-center justify-between ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
            {/* Price Range */}
            <div className="text-sm text-gray-600">
              {getPriceRange()}
            </div>

            {/* Additional Info */}
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {restaurant.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span className="hidden sm:inline">
                    {locale === 'ar' ? 'هاتف' : 'Phone'}
                  </span>
                </div>
              )}
              
              {restaurant.opening_hours && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span className="hidden sm:inline">
                    {locale === 'ar' ? 'ساعات العمل' : 'Hours'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}