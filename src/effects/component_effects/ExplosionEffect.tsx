/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Mock for react-three-fiber
interface FrameState {
  clock: {
    elapsedTime: number;
  };
}

const useFrame = (callback: (state: FrameState, delta: number) => void): void => {
  // This is a mock implementation
  useEffect(() => {
    let frameId: number;
    const state: FrameState = { clock: { elapsedTime: 0 } };
    let lastTime = 0;

    const animate = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;
      state.clock.elapsedTime += delta;
      callback(state, delta);
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [callback]);
};

// Declare JSX namespace for Three.js elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      points: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        ref?: React.RefObject<THREE.Points>;
      };
      bufferGeometry: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      pointsMaterial: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        size?: number;
        transparent?: boolean;
        vertexColors?: boolean;
        blending?: THREE.Blending;
        depthWrite?: boolean;
      };
      ambientLight: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        intensity?: number;
      };
    }
  }
}

// src/components/effects/ExplosionEffect.tsx
interface ExplosionEffectProps {
  position: { x: number; y: number };
  size: 'small' | 'medium' | 'large';
  color: string;
  onComplete: () => void;
}

function ExplosionParticles({
  color,
  size,
  onComplete,
}: {
  color: string;
  size: number;
  onComplete: () => void;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const particleCount = Math.floor(size * 100);
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);

  // Initialize particles
  useEffect(() => {
    if (!geometryRef.current) return;

    // Create a THREE.Color object from the color string
    const colorObj = new THREE.Color(color);

    // Use colorObj to set a base color for all particles
    const baseR = colorObj.r;
    const baseG = colorObj.g;
    const baseB = colorObj.b;

    for (let i = 0; i < particleCount; i++) {
      // Random position within a sphere
      const radius = Math.random() * size;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Vary colors slightly based on the base color
      const hue = Math.random() * 0.1 - 0.05;
      const saturation = Math.random() * 0.2 - 0.1;
      const lightness = Math.random() * 0.2 - 0.1;

      const particleColor = new THREE.Color(color);
      particleColor.offsetHSL(hue, saturation, lightness);

      colors[i * 3] = particleColor.r;
      colors[i * 3 + 1] = particleColor.g;
      colors[i * 3 + 2] = particleColor.b;

      // Random sizes
      sizes[i] = Math.random() * 2 + 1;
    }

    geometryRef.current.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometryRef.current.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometryRef.current.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Log color information for debugging
    console.log(
      `Explosion particles initialized with base color: rgb(${Math.floor(baseR * 255)}, ${Math.floor(baseG * 255)}, ${Math.floor(baseB * 255)})`
    );
  }, [color, particleCount, positions, colors, sizes, size]);

  // Animate particles
  useFrame((state, delta) => {
    if (!geometryRef.current || !pointsRef.current) return;

    const positions = geometryRef.current.attributes.position.array as Float32Array;
    const sizes = geometryRef.current.attributes.size.array as Float32Array;

    // Use state.clock.elapsedTime to create time-based animations
    const time = state.clock.elapsedTime;
    const timeScale = Math.sin(time * 0.5) * 0.1 + 0.9; // Creates a pulsing effect

    for (let i = 0; i < particleCount; i++) {
      // Expand particles outward
      const idx = i * 3;
      const x = positions[idx];
      const y = positions[idx + 1];
      const z = positions[idx + 2];

      const length = Math.sqrt(x * x + y * y + z * z);
      const normX = x / length;
      const normY = y / length;
      const normZ = z / length;

      // Apply time-based speed variation
      const speed = 2 * delta * (1 + Math.random() * 0.5) * timeScale;
      positions[idx] += normX * speed;
      positions[idx + 1] += normY * speed;
      positions[idx + 2] += normZ * speed;

      // Shrink particles over time
      sizes[i] *= 0.99;
    }

    geometryRef.current.attributes.position.needsUpdate = true;
    geometryRef.current.attributes.size.needsUpdate = true;

    // Check if explosion is complete
    const totalSize = sizes.reduce((acc, size) => acc + size, 0) / particleCount;
    if (totalSize < 0.1) {
      onComplete();
    }
  });

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      'points',
      { ref: pointsRef },
      React.createElement('bufferGeometry', { ref: geometryRef }),
      React.createElement('pointsMaterial', {
        size: 2,
        transparent: true,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    )
  );
}

// Mock Canvas component
interface CanvasProps {
  children: React.ReactNode;
  camera: {
    position: [number, number, number];
    fov: number;
  };
  style: React.CSSProperties;
}

/**
 * Canvas component for rendering 3D content
 *
 * @param children - The 3D content to render
 * @param camera - Camera configuration for the 3D scene
 *                 This parameter is currently unused in this mock implementation
 *                 but will be used in the future to:
 *                 1. Configure the camera position and field of view
 *                 2. Set up proper perspective for explosion effects
 *                 3. Enable camera animations during explosions
 *                 4. Support dynamic camera adjustments based on explosion size
 *                 5. Allow for camera shake effects during large explosions
 * @param style - CSS styles for the canvas container
 */
const Canvas: React.FC<CanvasProps> = ({ children, camera, style }) => {
  // Apply camera settings to the container style for future 3D rendering
  const enhancedStyle = {
    ...style,
    // Use camera position to calculate perspective origin
    perspectiveOrigin: `${50 + camera.position[0] * 5}% ${50 - camera.position[1] * 5}%`,
    // Use camera FOV to set perspective
    perspective: `${1000 / (camera.fov / 75)}px`,
  };

  return React.createElement('div', { style: enhancedStyle }, children);
};

export function ExplosionEffect({ position, size, color, onComplete }: ExplosionEffectProps) {
  const sizeValue = size === 'small' ? 1 : size === 'medium' ? 2 : 3;

  // Create the particles element first
  const particlesElement = React.createElement(ExplosionParticles, {
    color,
    size: sizeValue,
    onComplete,
  });

  // Then pass it as children to the Canvas
  return React.createElement(
    'div',
    {
      style: {
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      },
    },
    React.createElement(Canvas, {
      camera: { position: [0, 0, 10], fov: 75 },
      style: {
        width: '100%',
        height: '100%',
      },
      children: particlesElement,
    })
  );
}

// Add to global styles
const style = document.createElement('style');
style.textContent = `
  @keyframes flash {
    0% { transform: scale(0.5); opacity: 1; }
    100% { transform: scale(2); opacity: 0; }
  }
`;
document.head.appendChild(style);
