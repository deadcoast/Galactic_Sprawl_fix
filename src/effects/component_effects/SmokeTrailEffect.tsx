/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useEffect, useRef } from 'react';
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

// Declare JSX namespace for Three.js elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      points: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        ref?: React.RefObject<THREE.Points>;
      };
      bufferGeometry: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      bufferAttribute: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        attach: string;
        count: number;
        array: Float32Array;
        itemSize: number;
      };
      shaderMaterial: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        attach?: string;
        transparent?: boolean;
        depthWrite?: boolean;
        blending?: THREE.Blending;
        uniforms?: Record<string, { value: unknown }>;
        vertexShader?: string;
        fragmentShader?: string;
      };
    }
  }
}

interface SmokeTrailProps {
  position: { x: number; y: number };
  direction: number;
  intensity: number;
  color: string;
}

function SmokeParticles({ direction, intensity, color }: Omit<SmokeTrailProps, 'position'>) {
  const pointsRef = useRef<THREE.Points>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const particleCount = Math.floor(intensity * 100);
  const positions = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const opacities = new Float32Array(particleCount);
  const velocities = useRef<Float32Array>(new Float32Array(particleCount * 3));
  const ages = useRef<Float32Array>(new Float32Array(particleCount));

  // Initialize particles
  useEffect(() => {
    if (!geometryRef.current) return;

    // Convert direction from degrees to radians
    const directionRad = (direction * Math.PI) / 180;
    const baseVelocity = 0.2 + intensity * 0.1;

    for (let i = 0; i < particleCount; i++) {
      // Random position near origin
      positions[i * 3] = (Math.random() - 0.5) * 0.2;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.2;

      // Random size
      sizes[i] = Math.random() * 0.5 + 0.5;

      // Initial opacity
      opacities[i] = Math.random() * 0.5 + 0.5;

      // Velocity in direction with some randomness
      const spreadAngle = (Math.random() - 0.5) * Math.PI * 0.2;
      const speed = baseVelocity * (Math.random() * 0.5 + 0.75);
      velocities.current[i * 3] = Math.cos(directionRad + spreadAngle) * speed;
      velocities.current[i * 3 + 1] = Math.sin(directionRad + spreadAngle) * speed;
      velocities.current[i * 3 + 2] = (Math.random() - 0.5) * 0.05;

      // Random initial age
      ages.current[i] = Math.random() * 2;
    }

    // Set attributes
    geometryRef.current.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometryRef.current.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometryRef.current.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
  }, [particleCount, positions, sizes, opacities, direction, intensity]);

  // Vertex shader
  const vertexShader = `
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

  // Fragment shader
  const fragmentShader = `
    uniform vec3 color;
    varying float vOpacity;
    
    void main() {
      // Create a circular particle
      vec2 center = gl_PointCoord - vec2(0.5);
      float dist = length(center);
      float alpha = smoothstep(0.5, 0.4, dist) * vOpacity;
      
      // Smoke color with soft edges
      gl_FragColor = vec4(color, alpha);
    }
  `;

  // Update particles
  useFrame(state => {
    if (!geometryRef.current) return;

    const positions = geometryRef.current.attributes.position.array as Float32Array;
    const opacities = geometryRef.current.attributes.opacity.array as Float32Array;
    const sizes = geometryRef.current.attributes.size.array as Float32Array;

    const time = state.clock.elapsedTime;
    const lifespan = 2 + intensity;

    for (let i = 0; i < particleCount; i++) {
      // Update age
      ages.current[i] += 0.016; // Approximately 60fps

      // Reset particles that have lived their lifespan
      if (ages.current[i] > lifespan) {
        // Reset position
        positions[i * 3] = (Math.random() - 0.5) * 0.2;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 0.2;

        // Reset age
        ages.current[i] = 0;

        // Reset opacity
        opacities[i] = Math.random() * 0.5 + 0.5;

        // Reset size
        sizes[i] = Math.random() * 0.5 + 0.5;
      } else {
        // Update position based on velocity
        positions[i * 3] += velocities.current[i * 3];
        positions[i * 3 + 1] += velocities.current[i * 3 + 1];
        positions[i * 3 + 2] += velocities.current[i * 3 + 2];

        // Add some turbulence
        const turbulence = 0.01;
        positions[i * 3] += Math.sin(time * 2 + i) * turbulence;
        positions[i * 3 + 1] += Math.cos(time * 2 + i) * turbulence;

        // Fade out based on age
        const ageRatio = ages.current[i] / lifespan;
        opacities[i] = Math.max(0, 1 - ageRatio) * (Math.random() * 0.1 + 0.9);

        // Grow slightly as they age
        sizes[i] = (Math.random() * 0.5 + 0.5) * (1 + ageRatio);
      }
    }

    // Update attributes
    geometryRef.current.attributes.position.needsUpdate = true;
    geometryRef.current.attributes.opacity.needsUpdate = true;
    geometryRef.current.attributes.size.needsUpdate = true;
  });

  // Parse color string to RGB
  const colorObj = new THREE.Color(color);

  return React.createElement('points', { ref: pointsRef }, [
    React.createElement('bufferGeometry', { ref: geometryRef }),
    React.createElement('shaderMaterial', {
      attach: 'material',
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        color: { value: colorObj },
      },
      vertexShader,
      fragmentShader,
    }),
  ]);
}

export function SmokeTrailEffect({ position, direction, intensity, color }: SmokeTrailProps) {
  // Create the smoke particles element
  const smokeParticlesElement = React.createElement(SmokeParticles, {
    direction,
    intensity,
    color,
  });

  return React.createElement(
    'div',
    {
      style: {
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '0',
        height: '0',
        overflow: 'visible',
        pointerEvents: 'none',
      },
    },
    React.createElement(Canvas, {
      camera: { position: [0, 0, 5], fov: 75 },
      style: { width: '300px', height: '300px', transform: 'translate(-150px, -150px)' },
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
