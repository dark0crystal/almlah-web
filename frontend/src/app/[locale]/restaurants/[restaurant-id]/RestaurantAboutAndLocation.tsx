import React from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Place } from '@/types';
import sepfngan from "../../../../../public/seperators/sepfngan.png";


interface RestaurantAboutAndLocationProps {
  restaurant: Place;
  language?: 'ar' | 'en';
}

export default function RestaurantAboutAndLocation({ restaurant, language = 'ar' }: RestaurantAboutAndLocationProps) {
  const t = useTranslations('restaurants.details');
  const restaurantName = language === 'ar' ? restaurant.name_ar : restaurant.name_en;
  const description = language === 'ar' ? restaurant.description_ar : restaurant.description_en;
  const subtitle = language === 'ar' ? restaurant.subtitle_ar : restaurant.subtitle_en;
  const governateName = language === 'ar' ? restaurant.governate?.name_ar : restaurant.governate?.name_en;
  const wilayahName = language === 'ar' ? restaurant.wilayah?.name_ar : restaurant.wilayah?.name_en;

  // Get content sections (about section)
  const aboutSection = restaurant.content_sections?.find(section => 
    section.section_type === 'about' || section.section_type === 'description'
  );

  const aboutTitle = aboutSection 
    ? (language === 'ar' ? aboutSection.title_ar : aboutSection.title_en)
    : t('about.defaultTitle');

  const aboutContent = aboutSection 
    ? (language === 'ar' ? aboutSection.content_ar : aboutSection.content_en)
    : description;

  // Get cuisine type from categories
  const cuisineType = restaurant.categories && restaurant.categories.length > 0
    ? (language === 'ar' ? restaurant.categories[0].name_ar : restaurant.categories[0].name_en)
    : t('info.defaultCuisine');

  // Get properties for "suitable for" tags from backend only
  const suitableForTags = restaurant.properties?.map(prop => ({
    name: prop.name,
    icon: prop.icon || '🍽️'
  })) || [];

  // Format coordinates for map
  const mapUrl = restaurant.lat && restaurant.lng 
    ? `https://www.google.com/maps?q=${restaurant.lat},${restaurant.lng}&z=15`
    : '#';

  const handleLocationClick = () => {
    if (restaurant.lat && restaurant.lng) {
      window.open(mapUrl, '_blank');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: restaurantName,
          text: subtitle || description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled or failed:', error);
      }
    } else {
      // Fallback: copy URL to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert(t('share.linkCopied'));
      } catch (error) {
        console.error('Failed to copy link:', error);
      }
    }
  };


  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto py-8">
        
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {aboutTitle}
          </h1>
          {/* Share button */}
          <div className="flex items-center gap-4">
            <button 
              onClick={handleShare}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              aria-label={t('share.text')}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Right Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* About Section */}
            <div className="rounded-2xl p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
                {restaurantName}
              </h2>
              <p className="text-gray-700 leading-relaxed text-sm md:text-base">
                {aboutContent || t('about.noInfo')}
              </p>
              
              {/* Separator */}
              <div className="h-[55px] rounded-lg mt-6 relative overflow-hidden flex items-center justify-between" style={{ backgroundColor: '#fce7a1b3' }}>
                <div 
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: '4px 4px'
                  }}
                />
                <Image 
                  src={sepfngan} 
                  alt="Fngan decoration" 
                  width={48}
                  height={48}
                  className="h-8 md:h-12 w-auto ml-2 relative z-10"
                />
                <span className="text-amber-800 font-medium text-sm md:text-base mr-4 relative z-10">
                  {t('separatorText')}
                </span>
              </div>
              
              {/* Additional content sections */}
              {restaurant.content_sections?.filter(section => section.section_type !== 'about' && section.section_type !== 'description').map(section => (
                <div key={section.id} className="mt-8">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
                    {language === 'ar' ? section.title_ar : section.title_en}
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-sm md:text-base">
                    {language === 'ar' ? section.content_ar : section.content_en}
                  </p>
                  
                  {/* Section images */}
                  {section.images && section.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                      {section.images.filter(img => img.image_url).map(img => (
                        <div key={img.id} className="relative h-32 rounded-lg overflow-hidden">
                          <Image
                            src={img.image_url!}
                            alt={language === 'ar' ? (img.alt_text_ar || '') : (img.alt_text_en || '')}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Left Column - Sidebar */}
          <div className="space-y-6">
            
            
            {/* Restaurant Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">
                    {t('info.title')}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-900 font-medium">
                      {t('info.cuisineType')}
                    </span>
                    <span className="text-gray-600 text-sm">{cuisineType}</span>
                  </div>
                  
                  {governateName && (
                    <div className="flex justify-between">
                      <span className="text-gray-900 font-medium">
                        {t('info.region')}
                      </span>
                      <span className="text-gray-600 text-sm">{governateName}</span>
                    </div>
                  )}
                  
                  {wilayahName && (
                    <div className="flex justify-between">
                      <span className="text-gray-900 font-medium">
                        {t('info.wilayah')}
                      </span>
                      <span className="text-gray-600 text-sm">{wilayahName}</span>
                    </div>
                  )}
                  
                  {restaurant.rating && restaurant.rating > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-900 font-medium">
                        {t('info.rating')}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-600 text-sm">{restaurant.rating.toFixed(1)}</span>
                        <span className="text-yellow-500">★</span>
                        {restaurant.review_count && (
                          <span className="text-gray-400 text-xs">
                            ({restaurant.review_count})
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-900 font-medium">
                      {t('info.serviceType')}
                    </span>
                    <span className="text-gray-600 text-sm">
                      {t('info.serviceTypeValue')}
                    </span>
                  </div>
                </div>
              </div>
            </div>


            {/* Suitable For Tags - Only show if backend has properties */}
            {suitableForTags.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-medium text-gray-900 mb-4">
                  {t('suitableFor.title')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {suitableForTags.slice(0, 6).map((tag, index) => (
                    <span 
                      key={index}
                      className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                    >
                      <span>{tag.icon}</span>
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}


            {/* Map */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="h-48 md:h-64 bg-gray-200 relative">
                {restaurant.lat && restaurant.lng ? (
                  <div className="absolute inset-0">
                    <iframe
                      src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1000!2d${restaurant.lng}!3d${restaurant.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM!5e0!3m2!1sen!2s!4v1234567890`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center mb-2 mx-auto">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-600">
                        {t('location.notAvailable')}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Google Maps attribution */}
                <div className="absolute bottom-2 right-2">
                  <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">Google</span>
                </div>
              </div>
              
              {/* Location Button */}
              <div className="p-4">
                <button 
                  onClick={handleLocationClick}
                  disabled={!restaurant.lat || !restaurant.lng}
                  className={`w-full py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                    restaurant.lat && restaurant.lng
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  📍 {t('location.viewOnMap')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}