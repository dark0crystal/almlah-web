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

  // Star-specific state
  const [rotation, setRotation] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const [showText, setShowText] = useState(false);
  const [textMessage, setTextMessage] = useState('');
  const [resetTimeout, setResetTimeout] = useState<NodeJS.Timeout | null>(null);

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

  // Star handlers
  const handleStarClick = () => {
    const newRotation = rotation + 45;
    setRotation(newRotation);

    // Handle rapid clicking detection
    const newClickCount = clickCount + 1;
    setClickCount(newClickCount);

    // Clear existing timeout
    if (resetTimeout) {
      clearTimeout(resetTimeout);
    }

    // Check if user clicked more than 7 times
    if (newClickCount > 7 && newClickCount <= 14) {
      setTextMessage('استأنست؟');
      setShowText(true);
      // Hide text after 2 seconds
      setTimeout(() => setShowText(false), 2000);
    } else if (newClickCount > 14 && newClickCount <= 21) {
      setTextMessage('خلااااص');
      setShowText(true);
      // Hide text after 2 seconds
      setTimeout(() => setShowText(false), 2000);
    } else if (newClickCount > 21 && newClickCount <= 28) {
      setTextMessage('يا معود شبيك؟');
      setShowText(true);
      // Hide text after 2 seconds
      setTimeout(() => setShowText(false), 2000);
    } else if (newClickCount > 28) {
      setTextMessage('حلوا عن صدورنا');
      setShowText(true);
      // Hide text after 3 seconds and reset click count
      setTimeout(() => {
        setShowText(false);
        setClickCount(0);
      }, 3000);
    } else {
      // Set timeout to reset click count after 1 second
      const timeout = setTimeout(() => {
        setClickCount(0);
      }, 1000);
      setResetTimeout(timeout);
    }
  };

  const handleStarDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: { delta: { x: number; y: number } }) => {
    const deltaX = info.delta.x;
    const rotationDelta = deltaX * 0.5; // Adjust sensitivity
    const newRotation = rotation + rotationDelta;
    setRotation(newRotation);
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
                  ملحوظة بسييطة
                </h2>
                <p className="text-gray-600 leading-relaxed text-lg">
                  هذه النجمة تفاعلية، إذا شفتها إضغطها ،وكلما ضغطها أكثر أعطتك أكثر
                </p>
              </div>

              {/* Notes Section */}
              <div className="bg-[#fce7a1] rounded-lg p-4 mb-6 text-right flex items-center justify-center relative h-24">
                <div className="relative w-16 h-16">
                  <motion.div
                    className="w-full h-full cursor-grab active:cursor-grabbing"
                    drag
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    onDrag={handleStarDrag}
                    onClick={handleStarClick}
                    animate={{ rotate: rotation }}
                    transition={{ type: "spring", stiffness: 100, damping: 15 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg viewBox="0 0 16 16" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                      <path 
                        d="M3.77256 14.1251C3.1287 14.1251 2.65038 13.9688 2.33777 13.6564C2.02987 13.3486 1.87583 12.8729 1.87583 12.2292V10.7319C1.87583 10.6013 1.83157 10.4917 1.74288 10.4031L0.68604 9.33974C0.228617 8.88741 0 8.44205 0 8.00365C0 7.56525 0.228617 7.11744 0.685851 6.6604L1.74269 5.59706C1.83139 5.5084 1.87564 5.40111 1.87564 5.27518V3.77099C1.87564 3.12271 2.02968 2.64459 2.33758 2.33682C2.65019 2.02906 3.12851 1.87508 3.77237 1.87508H5.27025C5.40094 1.87508 5.51054 1.83085 5.59924 1.74219L6.66304 0.685812C7.12046 0.228777 7.56602 7.12149e-05 7.99991 7.12149e-05C8.4385 -0.00463467 8.88406 0.223883 9.33677 0.685624L10.4006 1.742C10.494 1.83066 10.6058 1.87489 10.7365 1.87489H12.2274C12.876 1.87489 13.3543 2.03113 13.6622 2.3436C13.9701 2.65607 14.1242 3.13193 14.1242 3.7708V5.27499C14.1242 5.40092 14.1709 5.50821 14.2641 5.59687L15.3209 6.66021C15.7735 7.11725 15.9998 7.56506 15.9998 8.00346C16.0045 8.44186 15.7782 8.88722 15.3209 9.33974L14.2641 10.4031C14.1707 10.4917 14.1242 10.6013 14.1242 10.7319V12.2292C14.1242 12.8774 13.9679 13.3556 13.6553 13.6633C13.3474 13.9711 12.8715 14.1251 12.2274 14.1251H10.7365C10.6058 14.1251 10.4938 14.1695 10.4006 14.258L9.33677 15.3213C8.88424 15.7736 8.43868 15.9999 7.99991 15.9999C7.56602 16.0046 7.12028 15.7783 6.66304 15.3213L5.59924 14.258C5.51054 14.1693 5.40094 14.1251 5.27025 14.1251H3.77237H3.77256Z" 
                        fill="#FFC00A"
                      />
                    </svg>
                  </motion.div>
                  
                  {/* Rapid Click Text */}
                  {showText && (
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black px-2 py-1 rounded-lg shadow-lg text-xs font-bold whitespace-nowrap z-10">
                      {textMessage}
                    </div>
                  )}
                </div>
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