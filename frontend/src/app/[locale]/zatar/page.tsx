"use client"
import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from 'next-intl';
import { ArrowRight, ArrowLeft, MapPin, Utensils, Dice6, Star, Clock, Phone, Globe, Navigation } from "lucide-react";
import { zatarApi, type ZatarRecommendation } from './zatarApi';
import AnimatedEmoji from './AnimatedEmoji';
import ImageCarousel from './ImageCarousel';

interface ZatarState {
  step: number;
  placeName: string;
  foodType: string;
  isLoading: boolean;
  recommendation: ZatarRecommendation | null;
  error: string | null;
}

const FOOD_TYPES = [
  { id: 'arabic', name_en: 'Arabic Cuisine', name_ar: 'المأكولات العربية', emoji: '🥙' },
  { id: 'seafood', name_en: 'Seafood', name_ar: 'المأكولات البحرية', emoji: '🐟' },
  { id: 'grilled', name_en: 'Grilled Food', name_ar: 'المشاوي', emoji: '🔥' },
  { id: 'desserts', name_en: 'Desserts & Sweets', name_ar: 'الحلويات', emoji: '🍰' },
  { id: 'coffee', name_en: 'Coffee & Beverages', name_ar: 'القهوة والمشروبات', emoji: '☕' },
  { id: 'fastfood', name_en: 'Fast Food', name_ar: 'الوجبات السريعة', emoji: '🍔' },
];

export default function ZatarPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  
  const [state, setState] = useState<ZatarState>({
    step: 1,
    placeName: '',
    foodType: '',
    isLoading: false,
    recommendation: null,
    error: null
  });

  const handleNext = () => {
    if (state.step === 1 && state.placeName.trim()) {
      setState(prev => ({ ...prev, step: 2 }));
    } else if (state.step === 2 && state.foodType) {
      setState(prev => ({ ...prev, step: 3 }));
      generateRecommendation();
    }
  };

  const handleBack = () => {
    if (state.step > 1) {
      setState(prev => ({ 
        ...prev, 
        step: prev.step - 1,
        recommendation: prev.step === 3 ? null : prev.recommendation
      }));
    }
  };

  const generateRecommendation = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const recommendation = await zatarApi.getRandomRecommendation({
        place_name: state.placeName,
        food_type: state.foodType,
        locale: locale
      });
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        recommendation: recommendation
      }));
    } catch (error) {
      console.error('Failed to get recommendation:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get recommendation'
      }));
    }
  };

  const rollAgain = () => {
    setState(prev => ({ ...prev, recommendation: null }));
    generateRecommendation();
  };

  const isRestaurantOpen = (openingTime?: string, closingTime?: string) => {
    if (!openingTime || !closingTime) return null;
    
    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    
    // Convert time string (e.g., "10:00 AM") to number (e.g., 1000)
    const parseTime = (timeStr: string) => {
      const [time, period] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      
      return hours * 100 + minutes;
    };
    
    try {
      const openTime = parseTime(openingTime);
      const closeTime = parseTime(closingTime);
      
      // Handle overnight hours (e.g., 10 PM to 2 AM)
      if (closeTime < openTime) {
        return currentTime >= openTime || currentTime <= closeTime;
      }
      
      return currentTime >= openTime && currentTime <= closeTime;
    } catch {
      return null;
    }
  };

  const openGoogleMaps = (name: string, address: string) => {
    const query = encodeURIComponent(`${name} ${address}`);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    window.open(url, '_blank');
  };

  const isRTL = locale === 'ar';

  return (
    <div className={`min-h-screen ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            <AnimatedEmoji emoji="🎲" className="mr-2" />
            {locale === 'ar' ? 'زعتر - مكتشف المطاعم' : 'Zatar - Restaurant Finder'}
          </h1>
          <p className="text-gray-600">
            {locale === 'ar' ? 'دعنا نجد لك المكان المثالي للطعام' : 'Let us find the perfect place for you to eat'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">
              {locale === 'ar' ? `الخطوة ${state.step} من 3` : `Step ${state.step} of 3`}
            </span>
            <span className="text-sm text-gray-500">{Math.round((state.step / 3) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(state.step / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          {state.step === 1 && (
            <div className="text-center">
              <div className="mb-6">
                <MapPin className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {locale === 'ar' ? 'أين تريد أن تأكل؟' : 'Where do you want to eat?'}
                </h2>
                <p className="text-gray-600">
                  {locale === 'ar' ? 'أدخل اسم المنطقة أو المدينة' : 'Enter the area or city name'}
                </p>
              </div>
              
              <div className="mb-6">
                <input
                  type="text"
                  value={state.placeName}
                  onChange={(e) => setState(prev => ({ ...prev, placeName: e.target.value }))}
                  placeholder={locale === 'ar' ? 'مثال: صلالة' : 'Example: Salalah'}
                  className={`w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                />
              </div>
            </div>
          )}

          {state.step === 2 && (
            <div className="text-center">
              <div className="mb-6">
                <Utensils className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {locale === 'ar' ? 'ما نوع الطعام المفضل؟' : 'What type of food do you prefer?'}
                </h2>
                <p className="text-gray-600">
                  {locale === 'ar' ? 'اختر نوع المأكولات التي تشتهيها' : 'Choose the cuisine type you\'re craving'}
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {FOOD_TYPES.map((food) => (
                  <button
                    key={food.id}
                    onClick={() => setState(prev => ({ ...prev, foodType: food.id }))}
                    className={`p-4 border-2 rounded-xl transition-all duration-200 ${
                      state.foodType === food.id 
                        ? 'border-green-500 bg-green-50 shadow-md transform scale-105' 
                        : 'border-gray-200 hover:border-green-300 hover:bg-green-25'
                    }`}
                  >
                    <div className="text-2xl mb-2">{food.emoji}</div>
                    <div className="font-medium text-gray-800">
                      {locale === 'ar' ? food.name_ar : food.name_en}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {state.step === 3 && (
            <div className="text-center">
              {state.isLoading ? (
                <div className="py-12">
                  <div className="animate-spin w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    {locale === 'ar' ? '🎲 جاري البحث...' : '🎲 Finding your match...'}
                  </h2>
                  <p className="text-gray-600">
                    {locale === 'ar' ? 'نبحث عن أفضل الخيارات لك' : 'Searching for the best options for you'}
                  </p>
                </div>
              ) : state.error ? (
                <div className="py-12">
                  <div className="text-red-500 text-6xl mb-4">😵</div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    {locale === 'ar' ? 'عذراً! حدث خطأ' : 'Oops! Something went wrong'}
                  </h2>
                  <p className="text-gray-600 mb-6">
                    {state.error}
                  </p>
                  <button
                    onClick={generateRecommendation}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    {locale === 'ar' ? 'المحاولة مرة أخرى' : 'Try Again'}
                  </button>
                </div>
              ) : state.recommendation ? (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    {locale === 'ar' ? '🎉 وجدنا لك!' : '🎉 We found you something!'}
                  </h2>
                  
                  <div className="bg-white rounded-2xl mb-6 border border-green-200 overflow-hidden relative">
                    {/* Status Bar */}
                    {(() => {
                      const isOpen = isRestaurantOpen(state.recommendation.opening_time, state.recommendation.closing_time);
                      return (
                        <div className={`h-4 w-full ${
                          isOpen === true ? 'bg-green-500' : 
                          isOpen === false ? 'bg-red-500' : 
                          'bg-gray-400'
                        }`}></div>
                      );
                    })()}
                    
                    {/* Dice in bottom corner */}
                    <div className={`absolute bottom-4 ${isRTL ? 'left-4' : 'right-4'} z-10`}>
                      <button
                        onClick={rollAgain}
                        disabled={state.isLoading}
                        className=" disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-full  transition-all duration-200 transform hover:scale-105"
                        title={locale === 'ar' ? 'رمي النرد مرة أخرى' : 'Roll Again'}
                      >
                        <span className="text-2xl">🎲</span>
                      </button>
                    </div>
                    
                    {/* Restaurant Images */}
                    <div className="flex justify-center mb-6 pt-6">
                      {(state.recommendation.image_urls && state.recommendation.image_urls.length > 0) || state.recommendation.image_url ? (
                        <div className="w-80 h-80">
                          <ImageCarousel 
                            images={state.recommendation.image_urls || (state.recommendation.image_url ? [state.recommendation.image_url] : [])}
                            alt={state.recommendation.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                      ) : (
                        <div className="w-80 h-80 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center rounded-lg">
                          <div className="text-center text-gray-500">
                            <div className="text-6xl mb-2">🍽️</div>
                            <p className="text-sm">No Image Available</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      {/* Header */}
                      <div className={`flex items-start justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-800 mb-1">{state.recommendation.name}</h3>
                          <p className="text-green-600 font-medium">{state.recommendation.cuisine}</p>
                          
                          {/* Open/Closed Status */}
                          {(() => {
                            const isOpen = isRestaurantOpen(state.recommendation.opening_time, state.recommendation.closing_time);
                            if (isOpen === null) return null;
                            
                            return (
                              <div className={`inline-flex items-center mt-2 px-2 py-1 rounded-full text-xs font-medium ${
                                isOpen 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                <div className={`w-2 h-2 rounded-full mr-1 ${
                                  isOpen ? 'bg-green-500' : 'bg-red-500'
                                }`}></div>
                                {isOpen 
                                  ? (locale === 'ar' ? 'مفتوح الآن' : 'Open Now')
                                  : (locale === 'ar' ? 'مغلق الآن' : 'Closed Now')
                                }
                              </div>
                            );
                          })()}
                        </div>
                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                          {state.recommendation.type}
                        </span>
                      </div>
                    
                    {/* Details Grid */}
                    <div className="grid grid-cols-1 gap-3 mb-4">
                      <div className={`flex items-center text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <MapPin className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'} text-green-500`} />
                        <span>{state.recommendation.address}</span>
                      </div>
                      
                      {state.recommendation.rating && (
                        <div className={`flex items-center text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Star className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'} text-yellow-500`} />
                          <span>{state.recommendation.rating}/5 ⭐</span>
                        </div>
                      )}
                      
                      {state.recommendation.distance && (
                        <div className={`flex items-center text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <MapPin className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'} text-blue-500`} />
                          <span>{state.recommendation.distance}</span>
                        </div>
                      )}
                      
                      {(state.recommendation.opening_time && state.recommendation.closing_time) && (
                        <div className={`flex items-center text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Clock className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'} text-green-500`} />
                          <span>{state.recommendation.opening_time} - {state.recommendation.closing_time}</span>
                        </div>
                      )}
                      
                      {state.recommendation.price_range && (
                        <div className={`flex items-center text-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <span className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'} text-green-600 font-bold`}>$</span>
                          <span>{state.recommendation.price_range}</span>
                        </div>
                      )}
                    </div>

                    {/* Contact Info */}
                    <div className="border-t border-green-200 pt-3 mt-3">
                      <div className="flex gap-3 justify-center flex-wrap">
                        {/* Google Maps Button - Always shown */}
                        <button
                          onClick={() => openGoogleMaps(state.recommendation.name, state.recommendation.address)}
                          className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg text-sm transition-colors"
                        >
                          <Navigation className="w-4 h-4" />
                          {locale === 'ar' ? 'الاتجاهات' : 'Directions'}
                        </button>
                        
                        {state.recommendation.phone && (
                          <a 
                            href={`tel:${state.recommendation.phone}`}
                            className="flex items-center gap-1 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-lg text-sm transition-colors"
                          >
                            <Phone className="w-4 h-4" />
                            {locale === 'ar' ? 'اتصال' : 'Call'}
                          </a>
                        )}
                        {state.recommendation.website && (
                          <a 
                            href={state.recommendation.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm transition-colors"
                          >
                            <Globe className="w-4 h-4" />
                            {locale === 'ar' ? 'موقع الويب' : 'Website'}
                          </a>
                        )}
                      </div>
                    </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className={`flex justify-between mt-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={handleBack}
              disabled={state.step === 1}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                state.step === 1 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              } flex items-center gap-2`}
            >
              {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
              {locale === 'ar' ? 'السابق' : 'Back'}
            </button>

            {state.step < 3 && (
              <button
                onClick={handleNext}
                disabled={
                  (state.step === 1 && !state.placeName.trim()) ||
                  (state.step === 2 && !state.foodType)
                }
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                  ((state.step === 1 && !state.placeName.trim()) ||
                   (state.step === 2 && !state.foodType))
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg transform hover:scale-105'
                }`}
              >
                {locale === 'ar' ? 'التالي' : 'Next'}
                {isRTL ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Summary */}
        {state.step > 1 && (
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 mb-4">
            <h3 className="font-medium text-gray-700 mb-2">
              {locale === 'ar' ? 'ملخص اختياراتك:' : 'Your choices:'}
            </h3>
            <div className="flex flex-wrap gap-2">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                📍 {state.placeName}
              </span>
              {state.foodType && (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  🍽️ {FOOD_TYPES.find(f => f.id === state.foodType)?.[locale === 'ar' ? 'name_ar' : 'name_en']}
                </span>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}