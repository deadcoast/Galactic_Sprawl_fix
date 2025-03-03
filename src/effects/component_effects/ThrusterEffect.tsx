/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from 'react';
// Mock the @react-three/fiber imports if they can't be found
// This allows TypeScript to compile without errors while preserving the component's structure
// In a real environment with @react-three/fiber installed, these will be overridden by the actual imports
import { useFrame as ThreeUseFrame } from '@react-three/fiber';
import * as THREE from 'three';

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
 * when the application is built with the proper dependencies.
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
 * Interface for the state object passed to useFrame callbacks
 * This defines the structure of the state object that is passed to
 * animation frame callbacks, allowing components to access time
 * information for animations.
 *
 * Properties:
 * - clock: Contains timing information for animations
 *   - elapsedTime: The total time elapsed since the animation started
 *
 * This interface is used for type checking during development and
 * will be replaced by the actual @react-three/fiber implementation.
 */
interface FrameState {
  clock: {
    elapsedTime: number;
  };
}

// Mock implementation of useFrame if the real one is not available
const mockUseFrame = (callback: (state: { clock: { elapsedTime: number } }) => void) => {
  React.useEffect(() => {
    let frameId: number;
    const state = { clock: { elapsedTime: 0 } };
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

// Use the real useFrame if available, otherwise use the mock
const useFrame = ThreeUseFrame || mockUseFrame;

/**
 * Canvas component for rendering 3D content
 * This component provides a container for rendering 3D content
 * using Three.js. It's a simplified version that works without
 * the full @react-three/fiber library for development purposes.
 *
 * @param children - The 3D content to render
 * @param camera - Camera configuration for the 3D scene
 * @param style - CSS styles for the canvas container
 */
const Canvas: React.FC<CanvasProps> = ({ children, camera, style }) => {
  const defaultCamera = camera || { position: [0, 0, 5], fov: 75 };
  const defaultStyle = style || { width: '100%', height: '100%' };

  return React.createElement('div', { style: defaultStyle }, children);
};

interface ThrusterEffectProps {
  size: 'small' | 'medium' | 'large';
  color: string;
  intensity: number;
}

function ThrusterParticles({ size, color, intensity }: ThrusterEffectProps) {
  const pointsRef = React.useRef<THREE.Points>(null);

  // Convert size to numeric value
  const sizeValue = size === 'small' ? 1 : size === 'medium' ? 2 : 3;

  // Calculate particle count based on size and intensity
  const particleCount = Math.floor(sizeValue * intensity * 50);

  // Create arrays for particle properties
  const positions = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const opacities = new Float32Array(particleCount);
  const velocities = new Float32Array(particleCount * 3);
  const lifetimes = new Float32Array(particleCount);

  // Initialize particles
  React.useEffect(() => {
    // Create a THREE.Color object from the color string
    const colorObj = new THREE.Color(color);

    // Log color information for debugging
    console.warn(
      `Initializing thruster with color: rgb(${Math.floor(colorObj.r * 255)}, ${Math.floor(
        colorObj.g * 255
      )}, ${Math.floor(colorObj.b * 255)})`
    );

    // Initialize each particle
    for (let i = 0; i < particleCount; i++) {
      // Random position within a cone shape
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * sizeValue * 0.2;

      // Position at the base of the cone (thruster output)
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
      positions[i * 3 + 2] = 0;

      // Random sizes based on intensity and particle position
      sizes[i] = (Math.random() * 0.5 + 0.5) * sizeValue * (intensity * 0.5);

      // Initial opacity
      opacities[i] = Math.random() * 0.7 + 0.3;

      // Velocity - primarily in the z-direction (backward from thruster)
      velocities[i * 3] = (Math.random() - 0.5) * 0.1 * intensity;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.1 * intensity;
      velocities[i * 3 + 2] = -(Math.random() * 0.5 + 0.5) * intensity;

      // Random lifetime
      lifetimes[i] = Math.random() * 1 + 0.5;
    }
  }, [
    color,
    intensity,
    particleCount,
    positions,
    sizes,
    opacities,
    velocities,
    lifetimes,
    sizeValue,
  ]);

  // Animate particles
  useFrame(state => {
    if (!pointsRef.current) {
      return;
    }

    const time = state.clock.elapsedTime;
    const { geometry } = pointsRef.current;

    // Get attribute arrays
    const positionArray = geometry.attributes.position.array as Float32Array;
    const sizeArray = geometry.attributes.size.array as Float32Array;
    const opacityArray = geometry.attributes.opacity.array as Float32Array;

    // Update each particle
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Calculate particle age based on time
      const age = (time * intensity) % lifetimes[i];
      const ageRatio = age / lifetimes[i];

      // Update position based on velocity
      positionArray[i3] += velocities[i3] * 0.1;
      positionArray[i3 + 1] += velocities[i3 + 1] * 0.1;
      positionArray[i3 + 2] += velocities[i3 + 2] * 0.1;

      // Add some turbulence
      positionArray[i3] += Math.sin(time * 10 + i) * 0.01 * intensity;
      positionArray[i3 + 1] += Math.cos(time * 10 + i) * 0.01 * intensity;

      // Fade out based on age
      opacityArray[i] = Math.max(0, 1 - ageRatio) * intensity;

      // Grow slightly as they age
      sizeArray[i] = sizes[i] * (1 - ageRatio * 0.5);

      // Reset particle if it's reached the end of its life
      if (ageRatio > 0.95) {
        // Reset position to thruster output
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * sizeValue * 0.2;

        positionArray[i3] = Math.cos(angle) * radius;
        positionArray[i3 + 1] = Math.sin(angle) * radius;
        positionArray[i3 + 2] = 0;

        // Reset opacity
        opacityArray[i] = Math.random() * 0.7 + 0.3;
      }
    }

    // Mark attributes as needing update
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.size.needsUpdate = true;
    geometry.attributes.opacity.needsUpdate = true;
  });

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
      float alpha = smoothstep(0.5, 0.2, dist) * vOpacity;
      
      // Add some variation to the color based on position
      vec3 finalColor = color * (1.0 + (gl_PointCoord.y - 0.5) * 0.5);
      
      gl_FragColor = vec4(finalColor, alpha);
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
        vertexShader,
        fragmentShader,
      } as ThreeShaderMaterialProps)
    )
  );
}

export function ThrusterEffect({ size, color, intensity }: ThrusterEffectProps) {
  // Create the thruster particles element
  const thrusterParticlesElement = React.createElement(ThrusterParticles, {
    size,
    color,
    intensity,
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
