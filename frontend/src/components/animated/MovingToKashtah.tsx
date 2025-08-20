"use client"
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import rb3 from "../../../public/rb3.png"
import khayma from "../../../public/khayma.png"

interface ScrollAnimatedPngProps {
  imageUrl?: string;
  alt?: string;
  className?: string;
  imageSize?: string;
  moveRange?: number;
}

const ScrollAnimatedPng: React.FC<ScrollAnimatedPngProps> = ({
  alt = "Animated PNG",
  className = "",
  imageSize = "w-46 h-38",
  moveRange = 200,
  staticImageUrl = "/static-image.png",
  staticImageAlt = "Static Image",
  staticImageSize = "w-50 h-50"
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollDirection, setScrollDirection] = useState<'down' | 'up'>('down');
  const [lastScrollY, setLastScrollY] = useState(0);
  
  // Track scroll progress relative to the container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  // Detect scroll direction
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY) {
        setScrollDirection('down');
      } else if (currentScrollY < lastScrollY) {
        setScrollDirection('up');
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);
  
  // Calculate horizontal movement within the container (88vw - image width)
  const x = useTransform(scrollYProgress, [0, 1], ["0px", "calc(88vw - 200px)"]);
  
  // Calculate vertical position based on scroll direction (within 100px container)
  const y = useTransform(scrollYProgress, [0, 1], 
    scrollDirection === 'down' ? ["0px", "20px"] : ["-20px", "0px"]
  );
  
  // Create inverted y transform for upward movement (always call this hook)
  const yInverted = useTransform(y, (value) => -parseFloat(value.replace('px', '')) + 'px');
  
  // Calculate rotation based on scroll direction
  const rotateY = scrollDirection === 'up' ? 180 : 0;
  
  return (
    <div 
      ref={containerRef}
      className={`relative mx-auto overflow-hidden ${className}`}
      style={{ height: '100px', width: '88vw' }}
    >
      {/* PNG that moves based on scroll direction */}
      <motion.div
        style={{ 
          x,
          y: scrollDirection === 'down' ? y : yInverted
        }}
        className={`absolute z-10 ${scrollDirection === 'down' ? 'bottom-0' : 'top-0'} left-0`}
        animate={{
          rotateY: rotateY
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <motion.img
          src={rb3.src}
          alt={alt}
          className={`${imageSize} object-contain drop-shadow-lg`}
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true }}
        />
      </motion.div>

      {/* Static image at the end (right side) */}
      <div className="absolute bottom-0 right-0 z-10 pointer-events-auto">
        <motion.img
          src={khayma.src}
          alt={staticImageAlt}
          className={`${staticImageSize} object-contain drop-shadow-lg`}
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          viewport={{ once: true }}
        />
      </div>
    </div>
  );
};

export default ScrollAnimatedPng;