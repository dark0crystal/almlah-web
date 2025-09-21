"use client"
import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from 'next-intl';
import { ArrowRight, ArrowLeft, MapPin, Utensils, Star as StarIcon, Clock, Phone, Globe, Navigation } from "lucide-react";
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
            className="h-2 rounded-full transition-all duration-500 ease-out"
            style={{ 
              width: `${(state.step / 4) * 100}%`,
              background: 'linear-gradient(90deg, #f6bf0c 0%, rgba(246, 191, 12, 0.7) 50%, rgba(246, 191, 12, 0.4) 100%)'
            }}
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
                  <div className="mb-4 mx-auto flex justify-center">
                    <svg 
                      viewBox="0 0 16 16" 
                      className="w-16 h-16" 
                      preserveAspectRatio="xMidYMid meet"
                    >
                      <path 
                        d="M3.77256 14.1251C3.1287 14.1251 2.65038 13.9688 2.33777 13.6564C2.02987 13.3486 1.87583 12.8729 1.87583 12.2292V10.7319C1.87583 10.6013 1.83157 10.4917 1.74288 10.4031L0.68604 9.33974C0.228617 8.88741 0 8.44205 0 8.00365C0 7.56525 0.228617 7.11744 0.685851 6.6604L1.74269 5.59706C1.83139 5.5084 1.87564 5.40111 1.87564 5.27518V3.77099C1.87564 3.12271 2.02968 2.64459 2.33758 2.33682C2.65019 2.02906 3.12851 1.87508 3.77237 1.87508H5.27025C5.40094 1.87508 5.51054 1.83085 5.59924 1.74219L6.66304 0.685812C7.12046 0.228777 7.56602 7.12149e-05 7.99991 7.12149e-05C8.4385 -0.00463467 8.88406 0.223883 9.33677 0.685624L10.4006 1.742C10.494 1.83066 10.6058 1.87489 10.7365 1.87489H12.2274C12.876 1.87489 13.3543 2.03113 13.6622 2.3436C13.9701 2.65607 14.1242 3.13193 14.1242 3.7708V5.27499C14.1242 5.40092 14.1709 5.50821 14.2641 5.59687L15.3209 6.66021C15.7735 7.11725 15.9998 7.56506 15.9998 8.00346C16.0045 8.44186 15.7782 8.88722 15.3209 9.33974L14.2641 10.4031C14.1707 10.4917 14.1242 10.6013 14.1242 10.7319V12.2292C14.1242 12.8774 13.9679 13.3556 13.6553 13.6633C13.3474 13.9711 12.8715 14.1251 12.2274 14.1251H10.7365C10.6058 14.1251 10.4938 14.1695 10.4006 14.258L9.33677 15.3213C8.88424 15.7736 8.43868 15.9999 7.99991 15.9999C7.56602 16.0046 7.12028 15.7783 6.66304 15.3213L5.59924 14.258C5.51054 14.1693 5.40094 14.1251 5.27025 14.1251H3.77237H3.77256Z" 
                        fill="#FFC00A"
                      />
                      <path 
                        fillRule="evenodd" 
                        clipRule="evenodd" 
                        d="M11.5676 7.69257C11.4444 7.62989 11.2793 7.60447 11.1354 7.57323C10.7482 7.49172 10.3855 7.34546 10.0577 7.14763C10.1631 6.7209 10.3479 6.31054 10.6109 5.94104C10.6644 5.8584 10.7104 5.7784 10.7373 5.69821C10.8524 5.36014 10.6396 5.1497 10.3053 5.26113C10.1739 5.30386 10.0392 5.40268 9.9153 5.48212C9.58424 5.69784 9.22474 5.85087 8.85319 5.94273C8.6274 5.56909 8.46846 5.15139 8.39294 4.70716C8.37374 4.6168 8.35208 4.53247 8.31894 4.45925C8.25604 4.31807 8.14738 4.21323 8.03476 4.1976C7.88599 4.17953 7.77282 4.28306 7.69353 4.43308C7.63139 4.55468 7.60597 4.71789 7.57508 4.86019C7.49373 5.2489 7.34703 5.61313 7.14817 5.94236C6.72408 5.83789 6.31599 5.65454 5.9484 5.39403C5.871 5.34377 5.79586 5.29934 5.72072 5.27111C5.57647 5.21577 5.42544 5.2184 5.33486 5.28692C5.21697 5.37916 5.21001 5.53257 5.26029 5.69464C5.30228 5.82452 5.39983 5.95779 5.47873 6.08033C5.69605 6.41257 5.8501 6.7736 5.94218 7.14669C5.56837 7.37219 5.15069 7.53087 4.70663 7.60636C4.61794 7.62518 4.5347 7.64645 4.46239 7.67864C4.11908 7.82979 4.10383 8.14584 4.43979 8.30885C4.51474 8.34556 4.60268 8.36927 4.69722 8.3896C5.14673 8.46301 5.56687 8.62245 5.94162 8.85003C5.83691 9.27412 5.65368 9.68203 5.39286 10.0497C5.34352 10.1257 5.29964 10.1995 5.27121 10.2735C5.13543 10.623 5.34823 10.8572 5.70114 10.735C5.78023 10.7079 5.85895 10.6625 5.9403 10.6102C6.31016 10.3444 6.72031 10.1609 7.1461 10.057C7.38695 10.4536 7.55343 10.8993 7.6263 11.3729C7.67715 11.6427 7.92968 11.9574 8.19295 11.7216L8.19559 11.7191C8.35886 11.5704 8.38485 11.3165 8.43268 11.1036C8.51497 10.7284 8.65847 10.3768 8.85074 10.0581C9.30195 10.1682 9.73527 10.3659 10.1221 10.6494C10.3488 10.8041 10.7499 10.8481 10.7693 10.4954V10.4918C10.7797 10.2714 10.6185 10.0734 10.5015 9.8889C10.294 9.56494 10.1466 9.21426 10.0571 8.85247C10.4339 8.6249 10.8554 8.4649 11.3034 8.38941C11.3996 8.36871 11.4887 8.34461 11.5646 8.30697C11.8851 8.14923 11.8834 7.85012 11.5682 7.69257H11.5676Z" 
                        fill="black"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-zatar-bold text-gray-800 mb-4">
                    {t('welcome.title')}
                  </h2>
                  <div className="text-gray-700 space-y-4 font-zatar">
                    <p className="leading-8">
                      {t('welcome.description')}
                    </p>
                    <p className="text-sm font-zatar italic" style={{ color: '#fce7a1' }}>
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
                  <MapPin className="w-16 h-16 mx-auto mb-4 text-black" />
                  <h2 className="text-xl font-zatar-bold text-gray-800 mb-3">
                    {t('stepOne.title')}
                  </h2>
                  <p className="text-gray-700 font-zatar">
                    {t('stepOne.subtitle')}
                  </p>
                </div>
                
                <div className="mb-8 mt-4">
                  <input
                    type="text"
                    value={state.placeName}
                    onChange={(e) => setState(prev => ({ ...prev, placeName: e.target.value }))}
                    placeholder={t('stepOne.placeholder')}
                    className={`w-full paper-input font-zatar text-2xl ${isRTL ? 'text-right' : 'text-left'}`}
                  />
                </div>
              </div>
            </div>
          )}

          {state.step === 3 && (
            <div className="flex flex-col h-full">
              <div className="flex flex-col justify-center text-center">
                <div className="mb-6">
                  <Utensils className="w-16 h-16 mx-auto mb-4 text-black" />
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
                          ? 'shadow-md transform scale-105' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={state.foodType === food.id ? {
                        borderColor: '#fce7a1',
                        backgroundColor: '#fef7e6'
                      } : {}}
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
                  <div className="animate-spin w-12 h-12 border-4 border-t-transparent rounded-full mb-4" style={{ borderColor: '#fce7a1', borderTopColor: 'transparent' }}></div>
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
                    className="text-white px-6 py-3 rounded-lg font-zatar transition-all duration-200 transform hover:scale-105 shadow-lg"
                    style={{ backgroundColor: '#fce7a1' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5dc80'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fce7a1'}
                  >
                    <span>{t('error.tryAgain')}</span>
                  </button>
                </div>
              ) : state.recommendation ? (
                <div className="flex flex-col h-full relative">
                  {/* Image Container at the top */}
                  <div className="mb-4">
                    <div className="bg-gray-100 h-64 flex items-center justify-center relative rounded-lg overflow-hidden border-2 border-gray-300">
                      {(() => {
                        // Prioritize image_urls array, fallback to single image_url
                        const images = (state.recommendation.image_urls && state.recommendation.image_urls.length > 0) 
                          ? state.recommendation.image_urls 
                          : state.recommendation.image_url 
                            ? [state.recommendation.image_url] 
                            : [];
                        
                        return images.length > 0 ? (
                          <ImageCarousel 
                            images={images}
                            alt={state.recommendation.name}
                            className="w-full h-full"
                          />
                        ) : (
                          <div className="text-center text-gray-400">
                            <div className="text-4xl mb-2">🍽️</div>
                            <p className="text-xs font-zatar">{t('result.noImage')}</p>
                          </div>
                        );
                      })()}
                      
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

                  <div className="flex-1 pt-4">
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

                    <div className="space-y-1 mb-4 text-gray-700">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-black" />
                        <span className="font-zatar text-base">{state.recommendation.address}</span>
                      </div>
                      
                      {state.recommendation.rating && (
                        <div className="flex items-center gap-2">
                          <StarIcon className="w-5 h-5 text-black fill-black" />
                          <span className="font-zatar text-base">{t('result.rating', { rating: state.recommendation.rating })}</span>
                        </div>
                      )}
                      
                      {(state.recommendation.opening_time && state.recommendation.closing_time) && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-black" />
                          <span className="font-zatar text-base">{state.recommendation.opening_time} - {state.recommendation.closing_time}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-center mb-4">
                      <button
                        onClick={() => state.recommendation && openGoogleMaps(state.recommendation.name, state.recommendation.address)}
                        className="text-black px-4 py-2 rounded-lg font-zatar-bold transition-all duration-200 transform hover:scale-105 flex items-center gap-2 mx-auto text-base"
                        style={{ backgroundColor: '#f6bf0c' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5ab0b'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f6bf0c'}
                      >
                        <Navigation className="w-5 h-5 fill-black" />
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
          <div className={`flex justify-between items-center mt-auto pt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={handleBack}
              disabled={state.step === 1}
              className={`px-4 py-2 h-10 rounded-lg font-zatar transition-all duration-200 bg-white border-2 shadow-sm ${
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
                className={`px-4 py-2 h-10 rounded-lg font-zatar transition-all duration-200 flex items-center gap-2 border-2 shadow-sm ${
                  ((state.step === 2 && !state.placeName.trim()) ||
                   (state.step === 3 && !state.foodType))
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed border-gray-300' 
                    : 'text-black transform hover:scale-105'
                }`}
                style={((state.step === 2 && !state.placeName.trim()) ||
                        (state.step === 3 && !state.foodType)) ? {} : {
                  backgroundColor: '#fce7a1',
                  borderColor: '#fce7a1'
                }}
                onMouseEnter={(e) => {
                  if (!((state.step === 2 && !state.placeName.trim()) ||
                        (state.step === 3 && !state.foodType))) {
                    e.currentTarget.style.backgroundColor = '#f5dc80';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!((state.step === 2 && !state.placeName.trim()) ||
                        (state.step === 3 && !state.foodType))) {
                    e.currentTarget.style.backgroundColor = '#fce7a1';
                  }
                }}
              >
                <span>{t('navigation.next')}</span>
                {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </button>
            )}

            {/* Star Button - show on step 4 with recommendation */}
            {state.step === 4 && state.recommendation && (
              <button
                onClick={rollAgain}
                disabled={state.isLoading}
                className="w-16 h-16 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-110 group"
              >
                <svg 
                  viewBox="0 0 16 16" 
                  className="w-12 h-12 animate-spin-attract group-hover:animate-spin-custom" 
                  preserveAspectRatio="xMidYMid meet"
                >
                  <path 
                    d="M3.77256 14.1251C3.1287 14.1251 2.65038 13.9688 2.33777 13.6564C2.02987 13.3486 1.87583 12.8729 1.87583 12.2292V10.7319C1.87583 10.6013 1.83157 10.4917 1.74288 10.4031L0.68604 9.33974C0.228617 8.88741 0 8.44205 0 8.00365C0 7.56525 0.228617 7.11744 0.685851 6.6604L1.74269 5.59706C1.83139 5.5084 1.87564 5.40111 1.87564 5.27518V3.77099C1.87564 3.12271 2.02968 2.64459 2.33758 2.33682C2.65019 2.02906 3.12851 1.87508 3.77237 1.87508H5.27025C5.40094 1.87508 5.51054 1.83085 5.59924 1.74219L6.66304 0.685812C7.12046 0.228777 7.56602 7.12149e-05 7.99991 7.12149e-05C8.4385 -0.00463467 8.88406 0.223883 9.33677 0.685624L10.4006 1.742C10.494 1.83066 10.6058 1.87489 10.7365 1.87489H12.2274C12.876 1.87489 13.3543 2.03113 13.6622 2.3436C13.9701 2.65607 14.1242 3.13193 14.1242 3.7708V5.27499C14.1242 5.40092 14.1709 5.50821 14.2641 5.59687L15.3209 6.66021C15.7735 7.11725 15.9998 7.56506 15.9998 8.00346C16.0045 8.44186 15.7782 8.88722 15.3209 9.33974L14.2641 10.4031C14.1707 10.4917 14.1242 10.6013 14.1242 10.7319V12.2292C14.1242 12.8774 13.9679 13.3556 13.6553 13.6633C13.3474 13.9711 12.8715 14.1251 12.2274 14.1251H10.7365C10.6058 14.1251 10.4938 14.1695 10.4006 14.258L9.33677 15.3213C8.88424 15.7736 8.43868 15.9999 7.99991 15.9999C7.56602 16.0046 7.12028 15.7783 6.66304 15.3213L5.59924 14.258C5.51054 14.1693 5.40094 14.1251 5.27025 14.1251H3.77237H3.77256Z" 
                    fill="#FFC00A"
                  />
                  <path 
                    fillRule="evenodd" 
                    clipRule="evenodd" 
                    d="M11.5676 7.69257C11.4444 7.62989 11.2793 7.60447 11.1354 7.57323C10.7482 7.49172 10.3855 7.34546 10.0577 7.14763C10.1631 6.7209 10.3479 6.31054 10.6109 5.94104C10.6644 5.8584 10.7104 5.7784 10.7373 5.69821C10.8524 5.36014 10.6396 5.1497 10.3053 5.26113C10.1739 5.30386 10.0392 5.40268 9.9153 5.48212C9.58424 5.69784 9.22474 5.85087 8.85319 5.94273C8.6274 5.56909 8.46846 5.15139 8.39294 4.70716C8.37374 4.6168 8.35208 4.53247 8.31894 4.45925C8.25604 4.31807 8.14738 4.21323 8.03476 4.1976C7.88599 4.17953 7.77282 4.28306 7.69353 4.43308C7.63139 4.55468 7.60597 4.71789 7.57508 4.86019C7.49373 5.2489 7.34703 5.61313 7.14817 5.94236C6.72408 5.83789 6.31599 5.65454 5.9484 5.39403C5.871 5.34377 5.79586 5.29934 5.72072 5.27111C5.57647 5.21577 5.42544 5.2184 5.33486 5.28692C5.21697 5.37916 5.21001 5.53257 5.26029 5.69464C5.30228 5.82452 5.39983 5.95779 5.47873 6.08033C5.69605 6.41257 5.8501 6.7736 5.94218 7.14669C5.56837 7.37219 5.15069 7.53087 4.70663 7.60636C4.61794 7.62518 4.5347 7.64645 4.46239 7.67864C4.11908 7.82979 4.10383 8.14584 4.43979 8.30885C4.51474 8.34556 4.60268 8.36927 4.69722 8.3896C5.14673 8.46301 5.56687 8.62245 5.94162 8.85003C5.83691 9.27412 5.65368 9.68203 5.39286 10.0497C5.34352 10.1257 5.29964 10.1995 5.27121 10.2735C5.13543 10.623 5.34823 10.8572 5.70114 10.735C5.78023 10.7079 5.85895 10.6625 5.9403 10.6102C6.31016 10.3444 6.72031 10.1609 7.1461 10.057C7.38695 10.4536 7.55343 10.8993 7.6263 11.3729C7.67715 11.6427 7.92968 11.9574 8.19295 11.7216L8.19559 11.7191C8.35886 11.5704 8.38485 11.3165 8.43268 11.1036C8.51497 10.7284 8.65847 10.3768 8.85074 10.0581C9.30195 10.1682 9.73527 10.3659 10.1221 10.6494C10.3488 10.8041 10.7499 10.8481 10.7693 10.4954V10.4918C10.7797 10.2714 10.6185 10.0734 10.5015 9.8889C10.294 9.56494 10.1466 9.21426 10.0571 8.85247C10.4339 8.6249 10.8554 8.4649 11.3034 8.38941C11.3996 8.36871 11.4887 8.34461 11.5646 8.30697C11.8851 8.14923 11.8834 7.85012 11.5682 7.69257H11.5676Z" 
                    fill="black"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}