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
  const text = locale === 'ar' ? 'حَـــــــــــيّــــــهـــــــــم' : 'ALMLAH';

  // Calculate how many times to repeat text to fill screen
  const [repeatedTexts, setRepeatedTexts] = useState<string[]>([]);
  const [columnsCount, setColumnsCount] = useState(3);

  useEffect(() => {
    // Calculate texts needed based on viewport height and columns needed based on width
    const calculateLayout = () => {
      const screenHeight = window.innerHeight || 800;
      const screenWidth = window.innerWidth || 1200;
      
      // Calculate vertical texts needed (responsive line height)
      const lineHeight = screenWidth < 640 ? 60 : screenWidth < 768 ? 85 : 120; // includes font + margin
      const textsNeeded = Math.ceil(screenHeight / lineHeight);
      setRepeatedTexts(Array.from({ length: textsNeeded }, () => text));
      
      // Calculate horizontal columns that can fit
      // Responsive column width and margins
      const baseWidth = screenWidth < 640 ? 200 : screenWidth < 768 ? 300 : 400;
      const marginWidth = screenWidth < 640 ? 32 : screenWidth < 768 ? 64 : 144; // mx-4=32, mx-8=64, mx-18=144
      const columnWidth = baseWidth + marginWidth;
      const maxColumns = Math.floor(screenWidth / columnWidth);
      setColumnsCount(Math.max(1, maxColumns)); // At least 1 column
    };

    calculateLayout();
    window.addEventListener('resize', calculateLayout);
    return () => window.removeEventListener('resize', calculateLayout);
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
      {/* Vertical Text Pattern - Dynamic Columns */}
      <div className="w-full h-full flex justify-center items-start py-4 overflow-hidden">
        
        {/* Dynamic Columns */}
        {Array.from({ length: columnsCount }, (_, columnIndex) => (
          <div key={columnIndex} className="flex flex-col justify-start items-center mx-4 sm:mx-8 md:mx-18" style={{ width: window.innerWidth < 640 ? '200px' : window.innerWidth < 768 ? '300px' : '400px' }}>
            {repeatedTexts.map((textItem, index) => (
              <div
                key={`column-${columnIndex}-${index}`}
                className={`font-bold transition-all duration-300 whitespace-nowrap text-center ${
                  animatedWords.includes(index)
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-4'
                }`}
                style={{
                  fontSize: window.innerWidth < 640 ? '40px' : window.innerWidth < 768 ? '60px' : '80px',
                  lineHeight: window.innerWidth < 640 ? '45px' : window.innerWidth < 768 ? '65px' : '90px',
                  marginBottom: window.innerWidth < 640 ? '15px' : window.innerWidth < 768 ? '20px' : '30px',
                  color: '#f6bf0c',
                  transitionDelay: `${index * 50 + columnIndex * 16}ms`
                }}
              >
                {textItem}
              </div>
            ))}
          </div>
        ))}
        
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