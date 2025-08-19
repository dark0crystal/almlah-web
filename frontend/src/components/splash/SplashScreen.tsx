"use client";

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [animatedWords, setAnimatedWords] = useState<number[]>([]);
  const t = useTranslations('splash');
  const locale = useLocale() as 'ar' | 'en';

  // Single text to repeat
  const text = locale === 'ar' ? 'مـــــــراااااحــــــــب' : 'ALMLAH';

  // Calculate how many times to repeat text to fill screen
  const [repeatedTexts, setRepeatedTexts] = useState<string[]>([]);

  useEffect(() => {
    // Calculate texts needed based on viewport height
    const calculateTextsNeeded = () => {
      const screenHeight = window.innerHeight || 800;
      const needed = Math.ceil(screenHeight / 80); // Approximate texts needed
      setRepeatedTexts(Array.from({ length: needed }, () => text));
    };

    calculateTextsNeeded();
    window.addEventListener('resize', calculateTextsNeeded);
    return () => window.removeEventListener('resize', calculateTextsNeeded);
  }, [text]);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    // Animate texts appearing one by one
    repeatedTexts.forEach((_, index) => {
      const timer = setTimeout(() => {
        setAnimatedWords(prev => [...prev, index]);
      }, index * 50); // 50ms delay between each text
      timers.push(timer);
    });

    // Start exit animation
    const exitTimer = setTimeout(() => {
      setIsVisible(false);
    }, 1700);
    timers.push(exitTimer);

    // Complete splash screen
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2000);
    timers.push(completeTimer);

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [onComplete, repeatedTexts]);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 overflow-hidden transition-all duration-1000 ${
        !isVisible ? 'opacity-0 scale-110' : 'opacity-100 scale-100'
      }`}
      style={{ backgroundColor: '#f3f3eb' }}
    >
      {/* Vertical Text Pattern - Full Width */}
      <div className="w-full h-full flex justify-between py-4 overflow-hidden">
        
        {/* Left Column */}
        <div className="flex flex-col justify-start items-center w-1/3">
          {repeatedTexts.map((textItem, index) => (
            <div
              key={`left-${index}`}
              className={`text-5xl md:text-6xl lg:text-8xl font-bold text-gray-800 transition-all duration-300 mb-2 ${
                animatedWords.includes(index)
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4'
              }`}
              style={{
                transitionDelay: `${index * 50}ms`
              }}
            >
              {textItem}
            </div>
          ))}
        </div>

        {/* Center Column */}
        <div className="flex flex-col justify-start items-center w-1/3">
          {repeatedTexts.map((textItem, index) => (
            <div
              key={`center-${index}`}
              className={`text-5xl md:text-6xl lg:text-8xl font-bold text-gray-800 transition-all duration-300 mb-2 ${
                animatedWords.includes(index)
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4'
              }`}
              style={{
                transitionDelay: `${index * 50 + 16}ms` // Slight offset
              }}
            >
              {textItem}
            </div>
          ))}
        </div>

        {/* Right Column */}
        <div className="flex flex-col justify-start items-center w-1/3">
          {repeatedTexts.map((textItem, index) => (
            <div
              key={`right-${index}`}
              className={`text-5xl md:text-6xl lg:text-8xl font-bold text-gray-800 transition-all duration-300 mb-2 ${
                animatedWords.includes(index)
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4'
              }`}
              style={{
                transitionDelay: `${index * 50 + 33}ms` // Different offset
              }}
            >
              {textItem}
            </div>
          ))}
        </div>
        
      </div>

      {/* Skip Button */}
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onComplete, 500);
        }}
        className="absolute top-8 right-8 px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors z-10 bg-white/50 rounded-full"
      >
        {t('skip')}
      </button>
    </div>
  );
}