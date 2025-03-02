/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from 'react';
// Mock the @react-three/fiber imports if they can't be found
// This allows TypeScript to compile without errors while preserving the component's structure
// In a real environment with @react-three/fiber installed, these will be overridden by the actual imports
import { Canvas as ThreeCanvas, useFrame as ThreeUseFrame } from '@react-three/fiber';
import * as THREE from 'three';

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

// Define mock types if @react-three/fiber is not available
// This helps TypeScript understand the structure without the actual library
/**
 * Interface for Canvas component props
 * This interface defines the expected properties for the Canvas component
 * which is used to render 3D content in the application.
 *
 * Properties:
 * - children: The 3D content to render inside the canvas
 * - camera: Configuration for the camera viewing the 3D scene
 * - style: CSS styles to apply to the canvas container
 *
 * This interface is currently used for type checking during development,
 * but will be replaced by the actual @react-three/fiber implementation
 * at runtime.
 */
interface CanvasProps {
  children: React.ReactNode;
  camera?: {
    position: [number, number, number];
    fov: number;
  };
  style?: React.CSSProperties;
}

/**
 * Mock implementation of the useFrame hook from @react-three/fiber
 *
 * @param callback - Function to be called on each animation frame
 *                  This function receives a state object with clock information
 *                  and is used to:
 *                  1. Update particle positions and properties
 *                  2. Animate thruster effects based on time
 *                  3. Apply physics-based movement to particles
 *                  4. Handle particle lifecycle (creation, animation, destruction)
 *                  5. Synchronize thruster animations with ship movement
 */
const mockUseFrame = (callback: (state: { clock: { elapsedTime: number } }) => void) => {
  // This is a mock implementation that would be replaced at runtime
  // In a real implementation, this would set up a requestAnimationFrame loop
  React.useEffect(() => {
    let frameId: number;
    const state = { clock: { elapsedTime: 0 } };
    let lastTime = 0;

    const animate = (time: number) => {
      // Calculate elapsed time
      const delta = (time - lastTime) / 1000;
      lastTime = time;
      state.clock.elapsedTime += delta;

      // Call the provided callback with the current state
      callback(state);

      // Continue the animation loop
      frameId = requestAnimationFrame(animate);
    };

    // Start the animation loop
    frameId = requestAnimationFrame(animate);

    // Clean up the animation loop when the component unmounts
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [callback]);
};

// Use either the real useFrame or our mock implementation
const useFrame = ThreeUseFrame || mockUseFrame;

// Create a Canvas component that uses either the real Canvas or our mock implementation
const Canvas: React.FC<CanvasProps> = ({ children, camera, style }) => {
  if (ThreeCanvas) {
    // Make sure to pass children explicitly
    return React.createElement(ThreeCanvas, { camera, style, children });
  }
  return React.createElement('div', { style }, children);
};

interface ThrusterEffectProps {
  size: 'small' | 'medium' | 'large';
  color: string;
  intensity: number;
}

function ThrusterParticles({ size, color, intensity }: ThrusterEffectProps) {
  const pointsRef = React.useRef<THREE.Points>(null);
  const geometryRef = React.useRef<THREE.BufferGeometry>(null);

  // Determine particle count based on size
  const particleCount = size === 'small' ? 100 : size === 'medium' ? 200 : 300;

  // Create arrays for particle properties
  const positions = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const opacities = new Float32Array(particleCount);
  const velocities = React.useRef<Float32Array>(new Float32Array(particleCount * 3));
  const lifetimes = React.useRef<Float32Array>(new Float32Array(particleCount));

  // Initialize particles
  React.useEffect(() => {
    if (!geometryRef.current) return;

    // Set up initial particle properties
    for (let i = 0; i < particleCount; i++) {
      // Random position near origin with slight spread
      positions[i * 3] = (Math.random() - 0.5) * 0.1;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.1;

      // Random size based on thruster size
      const sizeMultiplier = size === 'small' ? 0.5 : size === 'medium' ? 0.75 : 1;
      sizes[i] = (Math.random() * 0.5 + 0.5) * sizeMultiplier;

      // Initial opacity
      opacities[i] = Math.random() * 0.5 + 0.5;

      // Velocity - primarily in the negative y direction (thruster pointing down)
      velocities.current[i * 3] = (Math.random() - 0.5) * 0.2;
      velocities.current[i * 3 + 1] = -(Math.random() * 0.5 + 0.5) * intensity;
      velocities.current[i * 3 + 2] = (Math.random() - 0.5) * 0.2;

      // Random lifetime
      lifetimes.current[i] = Math.random() * 2;
    }

    // Set geometry attributes
    geometryRef.current.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometryRef.current.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometryRef.current.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
  }, [particleCount, size, intensity, positions, sizes, opacities]);

  // Vertex shader for particles
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

  // Fragment shader for particles
  const fragmentShader = `
    uniform vec3 color;
    varying float vOpacity;
    
    void main() {
      // Create a circular particle with soft edges
      vec2 center = gl_PointCoord - vec2(0.5);
      float dist = length(center);
      float alpha = smoothstep(0.5, 0.3, dist) * vOpacity;
      
      // Add glow effect
      vec3 finalColor = mix(color, vec3(1.0, 1.0, 1.0), smoothstep(0.5, 0.0, dist) * 0.6);
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `;

  // Update particles on each frame
  useFrame(state => {
    if (!geometryRef.current) return;

    const positions = geometryRef.current.attributes.position.array as Float32Array;
    const opacities = geometryRef.current.attributes.opacity.array as Float32Array;
    const sizes = geometryRef.current.attributes.size.array as Float32Array;

    const time = state.clock.elapsedTime;
    const maxLifetime = 1.0 + intensity * 0.5;

    for (let i = 0; i < particleCount; i++) {
      // Update lifetime
      lifetimes.current[i] += 0.016; // Approximately 60fps

      // Reset particles that have lived their lifetime
      if (lifetimes.current[i] > maxLifetime) {
        // Reset position to origin with slight randomness
        positions[i * 3] = (Math.random() - 0.5) * 0.1;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 0.1;

        // Reset lifetime
        lifetimes.current[i] = 0;

        // Reset opacity
        opacities[i] = Math.random() * 0.5 + 0.5;

        // Reset size
        const sizeMultiplier = size === 'small' ? 0.5 : size === 'medium' ? 0.75 : 1;
        sizes[i] = (Math.random() * 0.5 + 0.5) * sizeMultiplier;

        // Reset velocity with some randomness
        velocities.current[i * 3] = (Math.random() - 0.5) * 0.2;
        velocities.current[i * 3 + 1] = -(Math.random() * 0.5 + 0.5) * intensity;
        velocities.current[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
      } else {
        // Update position based on velocity
        positions[i * 3] += velocities.current[i * 3];
        positions[i * 3 + 1] += velocities.current[i * 3 + 1];
        positions[i * 3 + 2] += velocities.current[i * 3 + 2];

        // Add some turbulence based on time
        const turbulence = 0.01 * intensity;
        positions[i * 3] += Math.sin(time * 5 + i) * turbulence;
        positions[i * 3 + 2] += Math.cos(time * 5 + i) * turbulence;

        // Fade out based on lifetime
        const lifeRatio = lifetimes.current[i] / maxLifetime;
        opacities[i] = Math.max(0, 1 - lifeRatio) * (Math.random() * 0.1 + 0.9);

        // Grow slightly as they age
        sizes[i] *= 1.01;
      }
    }

    // Update geometry attributes
    geometryRef.current.attributes.position.needsUpdate = true;
    geometryRef.current.attributes.opacity.needsUpdate = true;
    geometryRef.current.attributes.size.needsUpdate = true;
  });

  // Parse color string to THREE.Color
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

export function ThrusterEffect({ size, color, intensity }: ThrusterEffectProps) {
  // Size multiplier based on thruster size
  const sizeMultiplier = size === 'small' ? 1 : size === 'medium' ? 1.5 : 2;

  // Create the thruster particles element
  const thrusterParticlesElement = React.createElement(ThrusterParticles, {
    size,
    color,
    intensity: intensity * sizeMultiplier,
  });

  return React.createElement(
    'div',
    {
      style: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      },
    },
    React.createElement(Canvas, {
      camera: { position: [0, 0, 5], fov: 75 },
      style: { width: '100%', height: '100%' },
      children: thrusterParticlesElement,
    })
  );
}

// Add to global styles
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0%, 100% { opacity: 0.8; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.05); }
  }
`;
document.head.appendChild(style);
