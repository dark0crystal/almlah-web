"use client"
import { useEffect, useState } from "react";
import Image from "next/image";

interface ZatarSplashScreenProps {
  onComplete: () => void;
}

const ZatarSplashScreen: React.FC<ZatarSplashScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  // Array of available images from zatarImages directory with duplicates
  const images = [
    '/zatarImages/baklava.png',
    '/zatarImages/bntchai.png',
    '/zatarImages/burger.png',
    '/zatarImages/chai.png',
    '/zatarImages/coffee.png',
    '/zatarImages/croissant.png',
    '/zatarImages/match.png',
    '/zatarImages/turkishbaklava.png',
    '/zatarImages/baklava.png',
    '/zatarImages/bntchai.png',
    '/zatarImages/burger.png',
    '/zatarImages/chai.png',
    '/zatarImages/coffee.png',
    '/zatarImages/croissant.png',
    '/zatarImages/match.png'
  ];

  // Generate random positions and delays for each image with larger gaps
  const generateImageProps = () => {
    const positions: number[] = [];
    return images.map((img, index) => {
      let left: number;
      let attempts = 0;
      
      // Ensure minimum 15% gap between images
      do {
        left = Math.random() * 50 + 25; // Random position between 25% and 75%
        attempts++;
      } while (
        positions.some(pos => Math.abs(pos - left) < 15) && 
        attempts < 10
      );
      
      positions.push(left);
      
      return {
        src: img,
        left,
        delay: index * 200 + Math.random() * 300, // More staggered timing
        duration: 2000,
        rotation: Math.random() * 60 - 30,
        id: `image-${index}`
      };
    });
  };

  const [imageProps] = useState(generateImageProps);

  useEffect(() => {
    // Auto-hide splash screen after 2.5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300); // Allow fade out animation to complete
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) {
    return (
      <div className="fixed inset-0 z-50 transition-opacity duration-300 opacity-0 pointer-events-none" style={{ backgroundColor: '#f3f3eb' }}>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" style={{ backgroundColor: '#f3f3eb' }}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
      </div>

      {/* Animated PNG images */}
      <div className="absolute inset-0">
        {imageProps.map((props) => (
          <div
            key={props.id}
            className="absolute animate-float-up"
            style={{
              left: `${props.left}%`,
              bottom: '-120px',
              animationDelay: `${props.delay}ms`,
              animationDuration: `${props.duration}ms`,
              transform: `rotate(${props.rotation}deg)`,
              margin: '10px'
            }}
          >
            <Image
              src={props.src}
              alt="Floating image"
              width={192}
              height={192}
              className="object-contain"
            />
          </div>
        ))}
      </div>

      {/* Custom animation styles */}
      <style jsx>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) rotate(${imageProps[0]?.rotation || 0}deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-120vh) rotate(${imageProps[0]?.rotation || 0}deg);
            opacity: 0;
          }
        }

        .animate-float-up {
          animation: float-up 2s linear forwards;
        }
      `}</style>
    </div>
  );
};

export default ZatarSplashScreen;