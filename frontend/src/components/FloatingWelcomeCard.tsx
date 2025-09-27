'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface FloatingWelcomeCardProps {
  onClose?: () => void;
}

export default function FloatingWelcomeCard({ onClose }: FloatingWelcomeCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(9);
  const [shouldFlicker, setShouldFlicker] = useState(false);

  // Check if car is selected before showing the card
  useEffect(() => {
    const selectedCar = localStorage.getItem('selectedCar') || localStorage.getItem('selected_car');
    
    if (selectedCar) {
      setIsVisible(true);
    } else {
      // If no car is selected, close the card immediately
      onClose?.();
    }
  }, [onClose]);

  useEffect(() => {
    if (!isVisible) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsVisible(false);
          return 0;
        }
        
        if (prev <= 2) {
          setShouldFlicker(true);
        }
        
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible]);

  // Handle close callback separately to avoid setState during render
  useEffect(() => {
    if (!isVisible) {
      const timeoutId = setTimeout(() => {
        // Mark that the welcome card has been fully shown when it closes
        localStorage.setItem('hasSeenWelcomeCard', 'true');
        onClose?.();
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [isVisible, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    // onClose will be called by the useEffect when isVisible changes
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleClose}
          />
          
          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ 
              opacity: shouldFlicker ? [1, 0.7, 1] : 1,
              scale: 1,
              y: [0, -10, 0],
              rotate: [-1, 1, -1]
            }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{
              opacity: {
                duration: shouldFlicker ? 0.3 : 0.5,
                repeat: shouldFlicker ? Infinity : 0,
                repeatType: shouldFlicker ? "reverse" : undefined
              },
              y: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              },
              rotate: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              },
              scale: {
                duration: 0.5
              }
            }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl p-8 max-w-md w-[90%] mx-auto"
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close welcome card"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>

            {/* Content */}
            <div className="text-center">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  مرحباً بك في الملاح!
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  اكتشف أجمل الأماكن السياحية والمطاعم والكافيهات في فلسطين. رفيقك المثالي لرحلة لا تُنسى!
                </p>
              </div>

              {/* Notes Section */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6 text-right">
                <h3 className="font-semibold text-blue-800 mb-2">ملاحظات مهمة:</h3>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• استخدم الخريطة لاستكشاف الأماكن القريبة منك</li>
                  <li>• يمكنك حفظ الأماكن المفضلة لديك</li>
                  <li>• شارك تجربتك مع الآخرين</li>
                </ul>
              </div>

              {/* Timer */}
              <div className="text-sm text-gray-500">
                سيختفي هذا التنبيه خلال {timeLeft} ثوانٍ
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}