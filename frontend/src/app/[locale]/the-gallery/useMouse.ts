import React, { useEffect, useState } from 'react';

interface MousePosition {
  x: number;
  y: number;
}

export default function useMouse(): MousePosition {
  const [mouse, setMouse] = useState<MousePosition>({ x: 0, y: 0 });

  const mouseMove = (e: MouseEvent) => {
    const { clientX, clientY } = e;
    setMouse({
      x: clientX,
      y: clientY
    });
  };

  useEffect(() => {
    window.addEventListener('mousemove', mouseMove);
    return () => window.removeEventListener('mousemove', mouseMove);
  }, []);

  return mouse;
}