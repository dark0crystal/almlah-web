"use client"
import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from 'next-intl';
import { ArrowRight, ArrowLeft, MapPin, Utensils, Star, Clock, Phone, Globe, Navigation } from "lucide-react";
import { zatarApi, type ZatarRecommendation } from './zatarApi';
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
      let [hours] = time.split(':').map(Number);
      const [, minutes] = time.split(':').map(Number);
      
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
    <div className={`h-[88vh] flex flex-col font-zatar ${isRTL ? 'rtl' : 'ltr'}`}>
      
      {/* Progress Bar - Paper style */}
      <div className="px-4 mb-4 w-full max-w-md mx-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-700 font-zatar">
            {t('step', { step: state.step })}
          </span>
          <span className="text-sm text-gray-700 font-zatar">{Math.round((state.step / 4) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-300 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(state.step / 4) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Main Content Container - Paper note style */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-4 w-full">
        <div className="paper-note paper-note-shadow rounded-lg w-full max-w-md min-h-[500px] flex flex-col relative">
          <div className="third-star"></div>
          {state.step === 1 && (
            <div className="flex flex-col h-full">
              <div className="flex flex-col justify-center text-center">
                <div className="mb-6">
                  <div className="text-6xl mb-4 mx-auto">🎲</div>
                  <h2 className="text-2xl font-zatar-bold text-gray-800 mb-4">
                    {t('welcome.title')}
                  </h2>
                  <div className="text-gray-700 space-y-4 font-zatar">
                    <p className="leading-8">
                      {t('welcome.description')}
                    </p>
                    <p className="text-sm text-blue-600 font-zatar italic">
                      {t('welcome.tagline')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {state.step === 2 && (
            <div className="flex flex-col h-full">
              <div className="flex flex-col justify-center text-center">
                <div className="mb-6">
                  <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h2 className="text-xl font-zatar-bold text-gray-800 mb-3">
                    {t('stepOne.title')}
                  </h2>
                  <p className="text-gray-700 font-zatar">
                    {t('stepOne.subtitle')}
                  </p>
                </div>
                
                <div className="mb-8">
                  <input
                    type="text"
                    value={state.placeName}
                    onChange={(e) => setState(prev => ({ ...prev, placeName: e.target.value }))}
                    placeholder={t('stepOne.placeholder')}
                    className={`w-full paper-input font-zatar text-lg ${isRTL ? 'text-right' : 'text-left'}`}
                  />
                </div>
              </div>
            </div>
          )}

          {state.step === 3 && (
            <div className="flex flex-col h-full">
              <div className="flex flex-col justify-center text-center">
                <div className="mb-6">
                  <Utensils className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h2 className="text-xl font-zatar-bold text-gray-800 mb-3">
                    {t('stepTwo.title')}
                  </h2>
                  <p className="text-gray-700 font-zatar">
                    {t('stepTwo.subtitle')}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {FOOD_TYPES.map((food) => (
                    <button
                      key={food.id}
                      onClick={() => setState(prev => ({ ...prev, foodType: food.id }))}
                      className={`p-3 border-2 rounded-lg transition-all duration-200 bg-white shadow-sm ${
                        state.foodType === food.id 
                          ? 'border-blue-500 bg-blue-50 shadow-md transform scale-105' 
                          : 'border-gray-300 hover:border-blue-400 hover:bg-blue-25'
                      }`}
                    >
                      <div className="text-2xl mb-2">{food.emoji}</div>
                      <div className="font-zatar text-gray-800 text-sm">
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
                  <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
                  <h2 className="text-lg font-zatar-bold text-gray-800 mb-2">
                    {t('loading.title')}
                  </h2>
                  <p className="text-gray-600 font-zatar">
                    {t('loading.subtitle')}
                  </p>
                </div>
              ) : state.error ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="text-red-500 text-4xl mb-4">😵</div>
                  <h2 className="text-lg font-zatar-bold text-gray-800 mb-2">
                    {t('error.title')}
                  </h2>
                  <p className="text-gray-600 mb-4 font-zatar">
                    {state.error}
                  </p>
                  <button
                    onClick={generateRecommendation}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-zatar transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    <span>{t('error.tryAgain')}</span>
                  </button>
                </div>
              ) : state.recommendation ? (
                <div className="flex flex-col h-full relative">
                  <div className="absolute top-2 right-2 z-20">
                    <button
                      onClick={rollAgain}
                      disabled={state.isLoading}
                      className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-110 border-2 border-gray-300"
                    >
                      <span className="text-xl">🎲</span>
                    </button>
                  </div>

                  <div className="mb-4">
                    <div className="bg-gray-100 h-32 flex items-center justify-center relative rounded-lg overflow-hidden border-2 border-gray-300">
                      {(state.recommendation.image_urls && state.recommendation.image_urls.length > 0) || state.recommendation.image_url ? (
                        <ImageCarousel 
                          images={state.recommendation.image_urls || (state.recommendation.image_url ? [state.recommendation.image_url] : [])}
                          alt={state.recommendation.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="text-center text-gray-400">
                          <div className="text-4xl mb-2">🍽️</div>
                          <p className="text-xs font-zatar">{t('result.noImage')}</p>
                        </div>
                      )}
                      
                      {(() => {
                        const isOpen = isRestaurantOpen(state.recommendation.opening_time, state.recommendation.closing_time);
                        if (isOpen === null) return null;
                        const overlayClass = isOpen ? 'bg-opacity-50' : 'bg-opacity-70';
                        const statusClass = isOpen ? 'bg-green-500' : 'bg-red-500';
                        const statusText = isOpen ? t('result.open') : t('result.closed');
                        return (
                          <div className={`absolute inset-0 bg-black ${overlayClass} flex items-center justify-center rounded-lg`}>
                            <div className={`px-4 py-2 rounded-full text-white font-bold text-sm shadow-lg ${statusClass}`}>
                              {statusText}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-zatar-bold text-gray-800 mb-2">{state.recommendation.name}</h3>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-zatar">
                        {state.recommendation.cuisine}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-zatar">
                        {state.recommendation.type}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 text-sm mb-4 font-zatar leading-6">
                      {t('result.description', { name: state.recommendation.name })}
                    </p>

                    <div className="space-y-1 mb-4 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span className="font-zatar">{state.recommendation.address}</span>
                      </div>
                      
                      {state.recommendation.rating && (
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="font-zatar">{t('result.rating', { rating: state.recommendation.rating })}</span>
                        </div>
                      )}
                      
                      {(state.recommendation.opening_time && state.recommendation.closing_time) && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span className="font-zatar">{state.recommendation.opening_time} - {state.recommendation.closing_time}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-center mb-4">
                      <button
                        onClick={() => state.recommendation && openGoogleMaps(state.recommendation.name, state.recommendation.address)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-zatar transition-all duration-200 transform hover:scale-105 flex items-center gap-2 mx-auto text-sm"
                      >
                        <Navigation className="w-4 h-4" />
                        <span>{t('result.getDirections')}</span>
                      </button>
                    </div>

                    {(state.recommendation.phone || state.recommendation.website) && (
                      <div className="flex gap-2">
                        {state.recommendation.phone && (
                          <a 
                            href={`tel:${state.recommendation.phone}`}
                            className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-lg font-zatar transition-colors flex items-center justify-center gap-2 text-xs"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{t('result.call')}</span>
                          </a>
                        )}
                        {state.recommendation.website && (
                          <a 
                            href={state.recommendation.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg font-zatar transition-colors flex items-center justify-center gap-2 text-xs"
                          >
                            <Globe className="w-3 h-3" />
                            <span>{t('result.website')}</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className={`flex justify-between mt-auto pt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={handleBack}
              disabled={state.step === 1}
              className={`px-4 py-2 rounded-lg font-zatar transition-all duration-200 bg-white border-2 shadow-sm ${
                state.step === 1 
                  ? 'text-gray-400 cursor-not-allowed border-gray-200' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50 border-gray-300'
              } flex items-center gap-2`}
            >
              {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              <span>{t('navigation.back')}</span>
            </button>

            {state.step < 4 && (
              <button
                onClick={handleNext}
                disabled={
                  (state.step === 2 && !state.placeName.trim()) ||
                  (state.step === 3 && !state.foodType)
                }
                className={`px-4 py-2 rounded-lg font-zatar transition-all duration-200 flex items-center gap-2 border-2 shadow-sm ${
                  ((state.step === 2 && !state.placeName.trim()) ||
                   (state.step === 3 && !state.foodType))
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed border-gray-300' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white border-blue-600 transform hover:scale-105'
                }`}
              >
                <span>{t('navigation.next')}</span>
                {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}