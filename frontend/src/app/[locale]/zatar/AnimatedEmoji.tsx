"use client"
import { useState, useEffect } from 'react';

interface AnimatedEmojiProps {
  emoji: string;
  className?: string;
}

export default function AnimatedEmoji({ emoji, className = "" }: AnimatedEmojiProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <span 
      className={`inline-block transition-transform duration-300 ${
        isAnimating ? 'animate-bounce' : ''
      } ${className}`}
    >
      {emoji}
    </span>
  );
}