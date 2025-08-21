'use client';
import { Canvas } from '@react-three/fiber';
import React from 'react';
import Model from './Model';

interface SceneProps {
  activeMenu: number | null;
}

const Scene: React.FC<SceneProps> = ({ activeMenu }) => {
  return (
    <div className='fixed top-0 h-screen w-full '>
      <Canvas >
        <Model activeMenu={activeMenu}  />
      </Canvas>
    </div>
  );
};

export default Scene;