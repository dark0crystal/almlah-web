'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Scene from '@/components/Scene';
import Text from '@/components/Text';
import Image from 'next/image';

export default function AboutUs() {
  const [imageVisible, setImageVisible] = useState(true);

  const handleImageInteraction = () => {
    setImageVisible(false);
  };

  return (
    <main className="flex w-full h-screen items-center justify-center bg-black relative">
      <Text />
      <Scene />
      {imageVisible && (
        <motion.div 
          className="absolute inset-0 flex items-center justify-center z-50"
          onClick={handleImageInteraction}
          onTouchStart={handleImageInteraction}
          style={{ touchAction: 'manipulation' }}
          animate={{
            y: [0, -10, 0, 10, 0],
            rotate: [0, 2, 0, -2, 0],
          }}
          transition={{
            duration: 4,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "loop"
          }}
        >
          <motion.div
            animate={{
              scale: [1, 1.05, 1, 0.95, 1],
            }}
            transition={{
              duration: 3,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "loop",
              delay: 0.5
            }}
          >
            <Image 
              src="/mishkak.png" 
              alt="Interactive mishkak"
              width={200}
              height={200}
              className="w-auto h-auto max-w-xs max-h-xs object-contain cursor-pointer"
              onMouseEnter={handleImageInteraction}
            />
          </motion.div>
        </motion.div>
      )}
    </main>
  );
}