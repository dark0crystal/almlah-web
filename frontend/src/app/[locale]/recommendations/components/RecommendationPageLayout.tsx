"use client"

import { useState } from "react";
import { ChevronLeft, ChevronRight, Star, Clock } from "lucide-react";
import { useTranslations } from 'next-intl';
import { Place } from "@/types";
import RecommendationImage from "./RecommendationImage";
import RecommendationTitle from "./RecommendationTitle";
import RecommendationDescription from "./RecommendationDescription";

interface RecommendationPageLayoutProps {
  locale: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  icon: string;
  image: string;
  gradient: string;
  places: Place[];
}

export default function RecommendationPageLayout({
  locale,
  title,
  titleAr,
  description,
  descriptionAr,
  icon,
  image,
  gradient,
  places
}: RecommendationPageLayoutProps) {
  const t = useTranslations('recommendations');

  const currentTitle = locale === 'ar' ? titleAr : title;
  const currentDescription = locale === 'ar' ? descriptionAr : description;

  return (
    <div className={`min-h-screen bg-gray-50 ${locale === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Hero Section */}
      <div className="relative h-96 md:h-[500px] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <RecommendationImage
            src={image}
            alt={currentTitle}
            height="h-full"
            gradient={gradient}
            priority
          />
        </div>
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        
        {/* Content */}
        <div className="relative h-full flex items-center">
          <div className="w-[88vw] mx-auto px-4 text-center text-white">
            <div className="text-6xl mb-4">{icon}</div>
            <RecommendationTitle
              title={currentTitle}
              size="xl"
              align="center"
              className="text-white mb-6"
              locale={locale}
            />
            <RecommendationDescription
              description={currentDescription}
              size="large"
              align="center"
              maxWidth="max-w-3xl"
              className="text-white opacity-90"
              locale={locale}
            />
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="absolute bottom-4 left-4">
          <nav className="flex items-center space-x-2 text-white text-sm">
            <a href={`/${locale}`} className="hover:underline opacity-75">
              {t('breadcrumb.home')}
            </a>
            {locale === 'ar' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <a href={`/${locale}/recommendations`} className="hover:underline opacity-75">
              {t('breadcrumb.recommendations')}
            </a>
            {locale === 'ar' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span className="font-medium">
              {currentTitle}
            </span>
          </nav>
        </div>
      </div>

      {/* Content Section */}
      <div className="w-[88vw] mx-auto px-4 py-12">
        {/* Places Grid */}
        {places.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {places.map((place, index) => (
              <div 
                key={place.id} 
                className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                <div className="p-6">
                  <RecommendationImage
                    src={place.image || '/placeholder-restaurant.jpg'}
                    alt={place.name}
                    height="h-48"
                    gradient={gradient}
                    className="mb-4"
                  />
                  <RecommendationTitle
                    title={place.name}
                    size="medium"
                    className="mb-2"
                    locale={locale}
                  />
                  <RecommendationDescription
                    description={place.description || ''}
                    size="small"
                    className="mb-4"
                    locale={locale}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{place.rating || 'N/A'}</span>
                    </div>
                    <span className="text-sm text-gray-500">{place.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-6 text-8xl">
              {icon}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {t('noRecommendations')}
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {t('noRecommendationsMessage', {
                category: currentTitle.toLowerCase()
              })}
            </p>
            <div className="flex gap-4 justify-center">
              <a
                href={`/${locale}/recommendations`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {t('viewAllRecommendations')}
              </a>
              <a
                href={`/${locale}/places`}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {t('browsePlaces')}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}