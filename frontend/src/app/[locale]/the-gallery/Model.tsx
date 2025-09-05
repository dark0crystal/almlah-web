'use client'
import React, { useEffect, useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
// import { motion } from "framer-motion"
import { animate, useMotionValue } from 'framer-motion'
import { vertex, fragment } from './Shader'
import { useTexture } from '@react-three/drei';
import useMouse from './useMouse'
import useDimension from './useDimension'
import { projects } from './data'
// import { Mesh, PlaneGeometry, ShaderMaterial } from 'three'

interface ModelProps {
  activeMenu: number | null;
}

const lerp = (x: number, y: number, a: number) => x * (1 - a) + y * a

const Model: React.FC<ModelProps> = ({ activeMenu }) => {
  const plane = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();
  const dimension = useDimension();
  const mouse = useMouse();
  const opacity = useMotionValue(0);
  
  // Load textures outside of map to avoid hook rule violation
  const texture0 = useTexture(projects[0].src);
  const texture1 = useTexture(projects[1].src);
  const texture2 = useTexture(projects[2].src);
  const texture3 = useTexture(projects[3].src);
  const texture4 = useTexture(projects[4].src);
  const texture5 = useTexture(projects[5].src);
  const texture6 = useTexture(projects[6].src);
  const texture7 = useTexture(projects[7].src);
  const texture8 = useTexture(projects[8].src);
  const texture9 = useTexture(projects[9].src);
  
  const textures = useMemo(() => [texture0, texture1, texture2, texture3, texture4, texture5, texture6, texture7, texture8, texture9], [texture0, texture1, texture2, texture3, texture4, texture5, texture6, texture7, texture8, texture9]);
  const { width, height } = textures[0].image;
  
  // Aspect ratio calculation
  const aspectRatio = width / height;

  // Desired height adjustment
  const desiredHeight = 3; // Adjust this value to change the image height

  // Calculate corresponding width to maintain aspect ratio
  const desiredWidth = (desiredHeight-0.2) * aspectRatio;

  const smoothMouse = {
    x: useMotionValue(0),
    y: useMotionValue(0)
  }   

  useEffect(() => {
    if(activeMenu !== null) {
      plane.current.material.uniforms.uTexture.value = textures[activeMenu]
      animate(opacity, 1, { duration: 0.2, onUpdate: latest => plane.current.material.uniforms.uAlpha.value = latest })
    } else {
      animate(opacity, 0, { duration: 0.2, onUpdate: latest => plane.current.material.uniforms.uAlpha.value = latest })
    }
  }, [activeMenu, textures, opacity])

  const uniforms = useRef({
    uDelta: { value: { x: 0, y: 0 } },
    uAmplitude: { value: 0.0005 },
    uTexture: { value: textures[0] },
    uAlpha: { value: 0 }
  })

  useFrame(() => {
    const { x, y } = mouse
    const smoothX = smoothMouse.x.get();
    const smoothY = smoothMouse.y.get();

    if (Math.abs(x - smoothX) > 1) {
      smoothMouse.x.set(lerp(smoothX, x, 0.1))
      smoothMouse.y.set(lerp(smoothY, y, 0.1))
      plane.current.material.uniforms.uDelta.value = {
        x: x - smoothX,
        y: -1 * (y - smoothY)
      }
    }

    // Update mesh position
    const xPos = (smoothX / dimension.width - 0.5) * viewport.width
    const yPos = -(smoothY / dimension.height - 0.5) * viewport.height
    plane.current.position.set(xPos, yPos, 0)
  })

  return(
    <mesh ref={plane} scale={[desiredWidth, desiredHeight, 1]}>
      <planeGeometry args={[1, 1, 15, 15]} />
      <shaderMaterial 
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms.current}
        transparent
      />
    </mesh>
  )
}

export default Model;
