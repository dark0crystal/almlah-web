"use client"
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import rb3 from "../../../public/rb3.png"

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
  imageSize = "w-24 h-18",
  moveRange = 200,
  staticImageUrl = "/static-image.png",
  staticImageAlt = "Static Image",
  staticImageSize = "w-20 h-16"
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track scroll progress relative to the container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  // Calculate responsive movement - move across most of the component width but stop before the static image
  // Using vw units to make it responsive, stopping at about 75% of the component width
  const x = useTransform(scrollYProgress, [0, 1], ["0vw", "66vw"]);
  
  return (
    <div 
      ref={containerRef}
      className={`relative h-[12vh] w-[88vw] mx-auto overflow-hidden ${className}`}
    >
      {/* PNG positioned at the bottom - starts from left edge */}
      <motion.div
        style={{ x }}
        className="absolute bottom-4 left-0 z-10"
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
      <div className="absolute bottom-4 right-4 z-10">
        <motion.img
          src={staticImageUrl}
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