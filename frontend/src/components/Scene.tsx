'use client'
import React, { useEffect, useRef } from 'react'
import useWindow from '@/hooks/useWindow'

export default function Scene() {
  const { dimension } = useWindow();
  const canvas = useRef<HTMLCanvasElement>(null);
  const prevPosition = useRef<{x: number, y: number} | null>(null)

  useEffect( () => {
    dimension.width > 0 && init();
  }, [dimension])

  const init = () => {
    if (!canvas.current) return;
    const ctx = canvas.current.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#f3f3eb";
    ctx.fillRect(0, 0, dimension.width, dimension.height); 
    ctx.globalCompositeOperation = "destination-out";
  }

  const lerp = (x: number, y: number, a: number) => x * (1 - a) + y * a;

  const manageMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { clientX, clientY, movementX, movementY } = e;
    handleMovement(clientX, clientY, movementX, movementY);
  }

  const manageTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // Prevent scrolling
    const touch = e.touches[0];
    if (!touch) return;

    const rect = canvas.current?.getBoundingClientRect();
    if (!rect) return;

    const clientX = touch.clientX - rect.left;
    const clientY = touch.clientY - rect.top;

    // Calculate movement based on previous position
    let movementX = 0;
    let movementY = 0;
    
    if (prevPosition.current) {
      movementX = clientX - prevPosition.current.x;
      movementY = clientY - prevPosition.current.y;
    }

    handleMovement(clientX, clientY, movementX, movementY);
  }

  const handleMovement = (clientX: number, clientY: number, movementX: number, movementY: number) => {
    const nbOfCircles = Math.max(Math.abs(movementX), Math.abs(movementY)) / 10;

    if(prevPosition.current != null){
      const { x, y } = prevPosition.current;
      for(let i = 0 ; i < nbOfCircles ; i++){
        const targetX = lerp(x, clientX, (1 / nbOfCircles) * i);
        const targetY = lerp(y, clientY, (1 / nbOfCircles) * i);
        draw(targetX, targetY, 50)
      }
    }

    prevPosition.current = {
      x: clientX,
      y: clientY
    }
  }

  const handleTouchEnd = () => {
    prevPosition.current = null;
  }

  const draw = (x: number, y: number, radius: number) => {
    if (!canvas.current) return;
    const ctx = canvas.current.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();
  }

  return (
    <div className='relative w-full h-full'>
      {dimension.width == 0 && <div className='absolute w-full h-full' style={{backgroundColor: '#f3f3eb'}}/>}
      <canvas 
        ref={canvas} 
        onMouseMove={manageMouseMove} 
        onTouchMove={manageTouchMove}
        onTouchStart={manageTouchMove}
        onTouchEnd={handleTouchEnd}
        height={dimension.height} 
        width={dimension.width}
        style={{ touchAction: 'none' }} // Prevent default touch behaviors
      />
    </div>
  )
}