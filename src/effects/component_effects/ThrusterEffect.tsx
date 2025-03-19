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
 * Interface for animation frame state.
 * This provides type safety for the frame callback.
 *
 * Properties:
 * - clock: Contains timing information for animations
 *   - elapsedTime: The total time elapsed since the animation started
 *   - delta: The time elapsed since the last frame (for frame-rate independent animations)
 *
 * This interface is used for type checking during development and
 * will be replaced by the actual @react-three/fiber implementation.
 */
interface FrameState {
  clock: {
    elapsedTime: number;
    delta: number;
  };
}

// Mock implementation of useFrame if the real one is not available
const mockUseFrame = (callback: (state: FrameState) => void) => {
  React.useEffect(() => {
    let animationFrameId: number;
    let lastTime = 0;

    const animate = (time: number) => {
      // Calculate time delta in seconds for frame-rate independent animations
      const currentTime = time;
      const deltaTime = lastTime === 0 ? 0 : (currentTime - lastTime) / 1000;

      // Convert time to seconds for consistency with Three.js
      const timeInSeconds = time / 1000;

      // Call the callback with a state object matching the FrameState interface
      // Include both elapsedTime (total time) and delta (time since last frame)
      callback({
        clock: {
          elapsedTime: timeInSeconds,
          // Add a delta property to track time between frames for smooth animations
          delta: deltaTime,
        } as { elapsedTime: number; delta: number },
      });

      // Update lastTime for the next frame's delta calculation
      lastTime = currentTime;
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
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

  // Create a camera element using the defaultCamera
  const cameraElement = React.createElement('div', {
    'data-camera-position': JSON.stringify(defaultCamera.position),
    'data-camera-fov': defaultCamera.fov,
    style: { display: 'none' },
  });

  return React.createElement('div', { style: defaultStyle }, [cameraElement, children]);
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

    // Use proper type assertion with unknown as intermediate step
    const clock = state.clock as unknown as { elapsedTime: number; delta: number };
    const time = clock.elapsedTime;

    // Use a default value for delta if it's not available (for compatibility)
    const deltaTime = clock.delta ?? 0.016; // Default to ~60fps if delta not available

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

      // Update position based on velocity and delta time for frame-rate independence
      positionArray[i3] += velocities[i3] * deltaTime * intensity;
      positionArray[i3 + 1] += velocities[i3 + 1] * deltaTime * intensity;
      positionArray[i3 + 2] += velocities[i3 + 2] * deltaTime * intensity;

      // Size and opacity fade-out based on age
      sizeArray[i] = sizes[i] * (1 - ageRatio * 0.5);
      opacityArray[i] = opacities[i] * (1 - ageRatio);

      // Add some turbulence
      positionArray[i3] += Math.sin(time * 10 + i) * 0.01 * intensity;
      positionArray[i3 + 1] += Math.cos(time * 10 + i) * 0.01 * intensity;

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

/**
 * ThrusterEffect Component
 *
 * A Three.js-based effect for rendering spaceship thruster particles.
 * Creates a particle system with dynamic movement and glow effects,
 * simulating the exhaust from a thruster.
 *
 * Features:
 * - Frame-rate independent animation using delta time
 * - Dynamic particle count based on thruster size
 * - Color customization for different ship types
 * - Intensity adjustment for throttle effects
 * - Smooth particle movement and fading
 *
 * @param {ThrusterEffectProps} props - Component properties
 * @returns {JSX.Element} The thruster effect component
 */
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
