/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from "react";
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Mock for @react-three/fiber
interface FrameState {
  clock: {
    elapsedTime: number;
  };
}

const useFrame = (callback: (state: FrameState) => void): void => {
  // This is a mock implementation
  useEffect(() => {
    let frameId: number;
    const state: FrameState = { clock: { elapsedTime: 0 } };
    let lastTime = 0;

    const animate = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;
      state.clock.elapsedTime += delta;
      callback(state);
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [callback]);
};

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
 *                 2. Set up proper perspective for smoke trail effects
 *                 3. Enable camera animations during intense smoke effects
 *                 4. Support dynamic camera adjustments based on smoke density
 *                 5. Allow for camera tracking of moving smoke sources
 * @param style - CSS styles for the canvas container
 */
const Canvas: React.FC<CanvasProps> = ({ children, camera, style }) => {
  // Apply camera settings to the container style
  const enhancedStyle = {
    ...style,
    // Use camera position to adjust perspective
    perspective: `${1000 / (camera.fov / 75)}px`,
    perspectiveOrigin: `${50 + camera.position[0] * 5}% ${50 - camera.position[1] * 5}%`,
    // Add a subtle transform based on camera position for parallax effect
    transform: `${style.transform || ''} rotateX(${camera.position[1]}deg) rotateY(${-camera.position[0]}deg)`,
  };

  return React.createElement('div', { style: enhancedStyle }, children);
};

// Define custom element types for Three.js components
type ThreePointsProps = {
  ref?: React.RefObject<THREE.Points>;
  [key: string]: unknown;
};

type ThreeBufferGeometryProps = {
  [key: string]: unknown;
};

type ThreeBufferAttributeProps = {
  attach: string;
  count: number;
  array: Float32Array;
  itemSize: number;
  [key: string]: unknown;
};

type ThreeShaderMaterialProps = {
  attach?: string;
  transparent?: boolean;
  depthWrite?: boolean;
  blending?: THREE.Blending;
  uniforms?: Record<string, { value: unknown }>;
  vertexShader?: string;
  fragmentShader?: string;
  [key: string]: unknown;
};

interface SmokeTrailProps {
  position: { x: number; y: number };
  direction: number;
  intensity: number;
  color: string;
}

function SmokeParticles({ direction, intensity, color }: Omit<SmokeTrailProps, 'position'>) {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = Math.floor(intensity * 100);
  const positions = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const opacities = new Float32Array(particleCount);
  const angles = new Float32Array(particleCount);
  const lifetimes = new Float32Array(particleCount);
  const velocities = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  // Initialize particles
  useEffect(() => {
    // Create a THREE.Color object from the color string
    const colorObj = new THREE.Color(color);

    // Convert direction from degrees to radians
    const directionRad = (direction * Math.PI) / 180;

    // Base direction vector
    const baseVectorX = Math.cos(directionRad);
    const baseVectorY = Math.sin(directionRad);

    for (let i = 0; i < particleCount; i++) {
      // Random angle deviation from base direction
      const angleDeviation = (Math.random() - 0.5) * Math.PI * 0.5;
      // Calculate the final direction vector with deviation
      const vectorX =
        baseVectorX * Math.cos(angleDeviation) - baseVectorY * Math.sin(angleDeviation);
      const vectorY =
        baseVectorX * Math.sin(angleDeviation) + baseVectorY * Math.cos(angleDeviation);

      // Use the color object to create slight variations in particle colors
      const r = colorObj.r * (0.9 + Math.random() * 0.2); // ±10% variation
      const g = colorObj.g * (0.9 + Math.random() * 0.2);
      const b = colorObj.b * (0.9 + Math.random() * 0.2);

      // Random distance from origin
      const distance = Math.random() * intensity * 5;

      // Calculate position
      const x = vectorX * distance;
      const y = vectorY * distance;
      const z = (Math.random() - 0.5) * 2; // Small z-variation for depth

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Store velocity for animation
      const speed = 0.01 * intensity;
      velocities[i * 3] = vectorX * speed * intensity;
      velocities[i * 3 + 1] = vectorY * speed * intensity;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1; // Small z-velocity

      // Store color with variation
      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;

      // Store the direction angle for animation
      angles[i] = Math.atan2(vectorY, vectorX);

      // Random sizes based on intensity
      sizes[i] = Math.random() * intensity + 0.5;

      // Random opacity
      opacities[i] = Math.random() * 0.7 + 0.3;

      // Random lifetime for each particle
      lifetimes[i] = Math.random() * 2 + 1;
    }

    console.warn(`Initialized ${particleCount} smoke particles with base color: ${color}`);
  }, [
    color,
    direction,
    intensity,
    particleCount,
    positions,
    sizes,
    opacities,
    angles,
    lifetimes,
    velocities,
    colors,
  ]);

  // Animate particles
  useFrame(state => {
    if (!pointsRef.current) {
      return;
    }

    const time = state.clock.elapsedTime;
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const sizes = pointsRef.current.geometry.attributes.size.array as Float32Array;
    const opacities = pointsRef.current.geometry.attributes.opacity.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      const angle = angles[i];
      const lifetime = lifetimes[i];

      // Calculate age of particle (0 to 1)
      const age = (time % lifetime) / lifetime;

      // Move particles along their angle
      const speed = 0.01 * intensity * (1 - age); // Slow down as they age
      positions[idx] += Math.cos(angle) * speed;
      positions[idx + 1] += Math.sin(angle) * speed;

      // Add some turbulence
      positions[idx] += Math.sin(time * 2 + i) * 0.003;
      positions[idx + 1] += Math.cos(time * 2 + i) * 0.003;

      // Fade out particles as they age
      opacities[i] = (1 - age) * 0.7;

      // Grow particles slightly as they age
      sizes[i] = (0.5 + age * 1.5) * intensity;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.geometry.attributes.size.needsUpdate = true;
    pointsRef.current.geometry.attributes.opacity.needsUpdate = true;
  });

  // Create shader material for smoke particles
  const smokeVertexShader = `
    attribute float size;
    attribute float opacity;
    varying float vOpacity;
    
    void main() {
      vOpacity = opacity;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const smokeFragmentShader = `
    uniform vec3 color;
    varying float vOpacity;
    
    void main() {
      // Calculate distance from center of point
      vec2 center = gl_PointCoord - vec2(0.5);
      float dist = length(center);
      
      // Soft circular particle
      float alpha = smoothstep(0.5, 0.3, dist) * vOpacity;
      
      // Apply a soft smoke texture effect
      float noise = fract(sin(dot(gl_PointCoord, vec2(12.9898, 78.233))) * 43758.5453);
      alpha *= mix(0.8, 1.0, noise);
      
      gl_FragColor = vec4(color, alpha);
    }
  `;

  // Use React.createElement with type assertions for Three.js elements
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      'points',
      { ref: pointsRef } as ThreePointsProps,
      React.createElement(
        'bufferGeometry',
        {} as ThreeBufferGeometryProps,
        React.createElement('bufferAttribute', {
          attach: 'attributes.position',
          count: particleCount,
          array: positions,
          itemSize: 3,
        } as ThreeBufferAttributeProps),
        React.createElement('bufferAttribute', {
          attach: 'attributes.size',
          count: particleCount,
          array: sizes,
          itemSize: 1,
        } as ThreeBufferAttributeProps),
        React.createElement('bufferAttribute', {
          attach: 'attributes.opacity',
          count: particleCount,
          array: opacities,
          itemSize: 1,
        } as ThreeBufferAttributeProps)
      ),
      React.createElement('shaderMaterial', {
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          color: { value: new THREE.Color(color) },
        },
        vertexShader: smokeVertexShader,
        fragmentShader: smokeFragmentShader,
      } as ThreeShaderMaterialProps)
    )
  );
}

export function SmokeTrailEffect({ position, direction, intensity, color }: SmokeTrailProps) {
  // Create the smoke particles element first
  const smokeParticlesElement = React.createElement(SmokeParticles, {
    direction,
    intensity,
    color,
  });

  // Then create the Canvas with the smoke particles as children
  return React.createElement(
    'div',
    {
      style: {
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '0',
        height: '0',
        pointerEvents: 'none',
      },
    },
    React.createElement(Canvas, {
      camera: { position: [0, 0, 10], fov: 75 },
      style: {
        width: '300px',
        height: '300px',
        transform: 'translate(-150px, -150px)',
      },
      children: smokeParticlesElement,
    })
  );
}

// Add to global styles
const style = document.createElement('style');
style.textContent = `
  @keyframes smoke {
    0% { transform: scale(1); opacity: 0.8; }
    100% { transform: scale(2); opacity: 0; }
  }
`;
document.head.appendChild(style);
