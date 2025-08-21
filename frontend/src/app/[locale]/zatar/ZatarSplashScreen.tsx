"use client"
import { useEffect, useState } from "react";

interface ZatarSplashScreenProps {
  onComplete: () => void;
}

const ZatarSplashScreen: React.FC<ZatarSplashScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  // Array of available PNG images with duplicates
  const images = [
    '/alryam.png',
    '/chai.png',
    '/khayma.png',
    '/rb3.png',
    '/samhah.png',
    '/alryam.png',
    '/chai.png',
    '/khayma.png',
    '/rb3.png',
    '/samhah.png',
    '/alryam.png',
    '/chai.png',
    '/khayma.png',
    '/rb3.png',
    '/samhah.png'
  ];

  // Generate random positions and delays for each image
  const generateImageProps = () => {
    return images.map((img, index) => ({
      src: img,
      left: Math.random() * 80 + 10, // Random position between 10% and 90%
      delay: Math.random() * 1000, // Random delay up to 1000ms
      duration: 2000, // Fixed duration of 2 seconds
      rotation: Math.random() * 60 - 30, // Random rotation between -30 and 30 degrees
      id: `image-${index}`
    }));
  };

  const [imageProps] = useState(generateImageProps);

  useEffect(() => {
    // Auto-hide splash screen after 2 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300); // Allow fade out animation to complete
    }, 2000);

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
              transform: `rotate(${props.rotation}deg)`
            }}
          >
            <img
              src={props.src}
              alt="Floating image"
              className="w-24 h-24 object-contain opacity-80"
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
            opacity: 0.8;
          }
          90% {
            opacity: 0.8;
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