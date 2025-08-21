"use client"
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import rb3 from "../../../public/rb3.png"
import khayma from "../../../public/khayma.png"

interface ScrollAnimatedPngProps {
  alt?: string;
  className?: string;
  imageSize?: string;
}

const ScrollAnimatedPng: React.FC<ScrollAnimatedPngProps> = ({
  alt = "Animated PNG",
  className = "",
  imageSize = "w-46 h-38"
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "calc(100% - 200px)"]);
  
  return (
    <div 
      ref={containerRef}
      className={`relative mx-auto overflow-hidden w-full max-w-[88vw] ${className}`}
      style={{ height: '100px' }}
    >
      <motion.div
        style={{ x }}
        className="absolute bottom-0 left-0 z-10"
        transition={{ type: "spring", stiffness: 100, damping: 30 }}
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

      <div className="absolute bottom-0 right-0 z-10">
        <motion.img
          src={khayma.src}
          alt="Static Image"
          className="w-50 h-50 object-contain drop-shadow-lg"
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