"use client"
import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from 'next-intl';
import { ArrowRight, ArrowLeft, MapPin, Utensils, Dice6, Star, Clock, Phone, Globe, Navigation } from "lucide-react";
import { zatarApi, type ZatarRecommendation } from './zatarApi';
import AnimatedEmoji from './AnimatedEmoji';
import ImageCarousel from './ImageCarousel';
import ZatarSplashScreen from './ZatarSplashScreen';

interface ZatarState {
  step: number;
  placeName: string;
  foodType: string;
  isLoading: boolean;
  recommendation: ZatarRecommendation | null;
  error: string | null;
  showSplash: boolean;
}

const FOOD_TYPES = [
  { id: 'arabic', emoji: '🥙' },
  { id: 'seafood', emoji: '🐟' },
  { id: 'grilled', emoji: '🔥' },
  { id: 'desserts', emoji: '🍰' },
  { id: 'coffee', emoji: '☕' },
  { id: 'fastfood', emoji: '🍔' },
];

export default function ZatarPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const t = useTranslations('zatar');
  
  const [state, setState] = useState<ZatarState>({
    step: 1,
    placeName: '',
    foodType: '',
    isLoading: false,
    recommendation: null,
    error: null,
    showSplash: true
  });

  const handleNext = () => {
    if (state.step === 1) {
      setState(prev => ({ ...prev, step: 2 }));
    } else if (state.step === 2 && state.placeName.trim()) {
      setState(prev => ({ ...prev, step: 3 }));
    } else if (state.step === 3 && state.foodType) {
      setState(prev => ({ ...prev, step: 4 }));
      generateRecommendation();
    }
  };

  const handleBack = () => {
    if (state.step > 1) {
      setState(prev => ({ 
        ...prev, 
        step: prev.step - 1,
        recommendation: prev.step === 4 ? null : prev.recommendation
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

  const handleSplashComplete = () => {
    setState(prev => ({ ...prev, showSplash: false }));
  };

  const isRTL = locale === 'ar';

  // Show splash screen first
  if (state.showSplash) {
    return <ZatarSplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <div className={`min-h-screen flex flex-col ${isRTL ? 'rtl' : 'ltr'}`}>
      
      {/* Progress Bar - Compact */}
      <div className="px-4 mb-4 w-full max-w-md mx-auto mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">
            {t('step', { step: state.step })}
          </span>
          <span className="text-sm text-gray-500">{Math.round((state.step / 4) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(state.step / 4) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Main Content Container - Centered with max width */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-4 w-full">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
          {state.step === 1 && (
            <div className="flex flex-col">
              <div className="flex flex-col justify-center text-center p-6">
                <div className="mb-6">
                  <div className="text-6xl mb-4 mx-auto">🎲</div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    {locale === 'ar' ? 'مرحباً بك في زعتر!' : 'Welcome to Zatar!'}
                  </h2>
                  <div className="text-gray-600 space-y-3">
                    <p className="leading-relaxed">
                      {locale === 'ar' 
                        ? 'زعتر هو مساعدك الذكي لاكتشاف أفضل المطاعم والمقاهي في عمان. ببساطة أخبرنا عن المنطقة ونوع الطعام الذي تريده، وسنقترح عليك خياراً رائعاً!'
                        : 'Zatar is your smart assistant for discovering the best restaurants and cafes in Oman. Simply tell us your location and food preference, and we\'ll suggest something amazing!'
                      }
                    </p>
                    <p className="text-sm text-green-600 font-medium">
                      {locale === 'ar' 
                        ? '🎯 اكتشافات عشوائية مخصصة لك'
                        : '🎯 Personalized random discoveries'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {state.step === 2 && (
            <div className="flex flex-col">
              <div className="flex flex-col justify-center text-center p-6">
                <div className="mb-4">
                  <MapPin className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    {t('stepOne.title')}
                  </h2>
                  <p className="text-gray-600">
                    {t('stepOne.subtitle')}
                  </p>
                </div>
                
                <div className="mb-6">
                  <input
                    type="text"
                    value={state.placeName}
                    onChange={(e) => setState(prev => ({ ...prev, placeName: e.target.value }))}
                    placeholder={t('stepOne.placeholder')}
                    className={`w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                  />
                </div>
              </div>
            </div>
          )}

          {state.step === 3 && (
            <div className="flex flex-col">
              <div className="flex flex-col justify-center text-center p-4">
                <div className="mb-4">
                  <Utensils className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    {t('stepTwo.title')}
                  </h2>
                  <p className="text-gray-600">
                    {t('stepTwo.subtitle')}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {FOOD_TYPES.map((food) => (
                    <button
                      key={food.id}
                      onClick={() => setState(prev => ({ ...prev, foodType: food.id }))}
                      className={`p-3 border-2 rounded-xl transition-all duration-200 ${
                        state.foodType === food.id 
                          ? 'border-green-500 bg-green-50 shadow-md transform scale-105' 
                          : 'border-gray-200 hover:border-green-300 hover:bg-green-25'
                      }`}
                    >
                      <div className="text-xl mb-1">{food.emoji}</div>
                      <div className="font-medium text-gray-800 text-sm">
                        {t(`foodTypes.${food.id}`)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {state.step === 4 && (
            <div className="flex flex-col">
              {state.isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full mb-4"></div>
                  <h2 className="text-lg font-bold text-gray-800 mb-2">
                    {t('loading.title')}
                  </h2>
                  <p className="text-gray-600">
                    {t('loading.subtitle')}
                  </p>
                </div>
              ) : state.error ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="text-red-500 text-4xl mb-4">😵</div>
                  <h2 className="text-lg font-bold text-gray-800 mb-2">
                    {t('error.title')}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {state.error}
                  </p>
                  <button
                    onClick={generateRecommendation}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    {t('error.tryAgain')}
                  </button>
                </div>
              ) : state.recommendation ? (
                <div className="flex flex-col p-4">
                  <h2 className="text-lg font-bold text-gray-800 mb-3 text-center">
                    {t('result.title')}
                  </h2>
                  
                  <div className="w-full bg-white rounded-3xl shadow-lg overflow-hidden relative mx-auto">
                    {/* Roll again dice button in top left */}
                    <div className="absolute top-4 left-4 z-20">
                      <button
                        onClick={rollAgain}
                        disabled={state.isLoading}
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                        title={t('result.rollAgain')}
                      >
                        <span className="text-lg">🎲</span>
                      </button>
                    </div>
                    
                    {/* Product Image with rounded style and margin */}
                    <div className="p-2">
                      <div className="bg-gray-100 h-48 flex items-center justify-center relative rounded-2xl overflow-hidden">
                        {(state.recommendation.image_urls && state.recommendation.image_urls.length > 0) || state.recommendation.image_url ? (
                          <ImageCarousel 
                            images={state.recommendation.image_urls || (state.recommendation.image_url ? [state.recommendation.image_url] : [])}
                            alt={state.recommendation.name}
                            className="w-full h-full object-cover rounded-2xl"
                          />
                        ) : (
                          <div className="text-center text-gray-400">
                            <div className="text-6xl mb-2">🍽️</div>
                            <p className="text-sm">No Image Available</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="px-4 pb-4">
                      {/* Restaurant Name */}
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{state.recommendation.name}</h3>
                      
                      {/* Options/Variants (using cuisine types) */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm font-medium">
                          {state.recommendation.cuisine}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                          {state.recommendation.type}
                        </span>
                        {(() => {
                          const isOpen = isRestaurantOpen(state.recommendation.opening_time, state.recommendation.closing_time);
                          if (isOpen === null) return null;
                          return (
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              isOpen 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-red-100 text-red-600'
                            }`}>
                              {isOpen 
                                ? t('result.open')
                                : t('result.closed')
                              }
                            </span>
                          );
                        })()}
                      </div>
                      
                      {/* Description */}
                      <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                        {locale === 'ar' 
                          ? `استمتع بتجربة رائعة في ${state.recommendation.name} مع أجواء مميزة وخدمة متميزة.`
                          : `Enjoy a wonderful experience at ${state.recommendation.name} with great atmosphere and excellent service.`
                        }
                      </p>

                      {/* Details */}
                      <div className="space-y-2 mb-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>{state.recommendation.address}</span>
                        </div>
                        
                        {state.recommendation.rating && (
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span>{state.recommendation.rating}/5 Rating</span>
                          </div>
                        )}
                        
                        {(state.recommendation.opening_time && state.recommendation.closing_time) && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>{state.recommendation.opening_time} - {state.recommendation.closing_time}</span>
                          </div>
                        )}
                      </div>

                      {/* Price and Action Button */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {state.recommendation.rating && (
                            <span className="text-2xl font-bold text-gray-800">★{state.recommendation.rating}</span>
                          )}
                        </div>
                        <button
                          onClick={() => openGoogleMaps(state.recommendation.name, state.recommendation.address)}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-2xl font-medium transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
                        >
                          <Navigation className="w-4 h-4" />
                          {t('result.getDirections')}
                        </button>
                      </div>

                      {/* Additional Action Buttons */}
                      {(state.recommendation.phone || state.recommendation.website) && (
                        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                          {state.recommendation.phone && (
                            <a 
                              href={`tel:${state.recommendation.phone}`}
                              className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                            >
                              <Phone className="w-4 h-4" />
                              {t('result.call')}
                            </a>
                          )}
                          {state.recommendation.website && (
                            <a 
                              href={state.recommendation.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                            >
                              <Globe className="w-4 h-4" />
                              {t('result.website')}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className={`flex justify-between p-4 border-t bg-white ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={handleBack}
              disabled={state.step === 1}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                state.step === 1 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              } flex items-center gap-2`}
            >
              {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              {t('navigation.back')}
            </button>

            {state.step < 4 && (
              <button
                onClick={handleNext}
                disabled={
                  (state.step === 2 && !state.placeName.trim()) ||
                  (state.step === 3 && !state.foodType)
                }
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                  ((state.step === 2 && !state.placeName.trim()) ||
                   (state.step === 3 && !state.foodType))
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg transform hover:scale-105'
                }`}
              >
                {t('navigation.next')}
                {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}