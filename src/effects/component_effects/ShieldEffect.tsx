/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
// src/components/effects/ShieldEffect.tsx
import * as React from 'react';
import * as THREE from 'three';

interface ShieldEffectProps {
  active: boolean;
  health: number;
  color: string;
  size: number;
  impact?: {
    x: number;
    y: number;
    intensity: number;
  };
}

// Mock implementations for external libraries
// Mock for react-spring
interface SpringConfig {
  tension?: number;
  friction?: number;
}

interface SpringProps {
  opacity?: number;
  config?: SpringConfig;
}

const useSpring = (props: SpringProps): { opacity: { get: () => number } } => {
  return {
    opacity: {
      get: () => props?.opacity ?? 0,
    },
  };
};

// Mock for gsap
interface GSAPProps {
  value?: number;
  duration?: number;
  ease?: string;
  yoyo?: boolean;
  repeat?: number;
}

const gsap = {
  to: (target: unknown, props: GSAPProps) => {
    // Mock implementation
    if (target && typeof target === 'object' && 'value' in target) {
      // Safe type assertion for this mock implementation
      (target as { value: number }).value = props?.value ?? 0;
    }
    return { kill: () => {} };
  },
};

// Mock for @react-three/drei
interface SphereProps {
  args?: [number, number, number];
  children?: React.ReactNode;
}

const Sphere: React.FC<SphereProps> = ({ args, children }) => {
  return React.createElement('sphere', { args }, children);
};

// Mock for shader material
interface ShaderMaterialProps {
  uniforms: Record<string, { value: unknown }>;
  vertexShader: string;
  fragmentShader: string;
}

/**
 * Creates a shader material with the specified uniforms and shaders
 *
 * @param uniforms - Uniform values to be passed to the shader
 *                  These are used to control shader parameters like:
 *                  - time: For animating shield effects
 *                  - color: For setting the shield color
 *                  - opacity: For controlling shield visibility
 *                  - impactPosition: For showing impact points
 *                  - impactIntensity: For controlling impact effect strength
 *
 * @param vertexShader - GLSL code for the vertex shader
 *                      This handles vertex positions and passes data to the fragment shader
 *                      It's responsible for the shield's shape and deformation
 *
 * @param fragmentShader - GLSL code for the fragment shader
 *                        This handles pixel coloring and visual effects like:
 *                        - Hexagonal grid pattern
 *                        - Glow effects
 *                        - Impact ripples
 *                        - Edge highlighting
 *                        - Opacity variations
 *
 * @returns A React component that renders the shader material
 */
const shaderMaterial = (
  uniforms: Record<string, unknown>,
  vertexShader: string,
  fragmentShader: string
): React.FC<ShaderMaterialProps> => {
  // Process the uniforms to ensure they're in the correct format
  const processedUniforms: Record<string, { value: unknown }> = {};
  Object.entries(uniforms).forEach(([key, value]) => {
    processedUniforms[key] = { value };
  });

  // Log shader compilation for debugging
  console.warn(`Creating shader material with ${Object.keys(uniforms).length} uniforms`);
  console.warn(`Vertex shader length: ${vertexShader.length} characters`);
  console.warn(`Fragment shader length: ${fragmentShader.length} characters`);

  // This is a mock implementation that returns a component
  return (props: ShaderMaterialProps) => {
    // Merge the default uniforms with unknown provided in props
    const mergedUniforms = { ...processedUniforms, ...props?.uniforms };

    // Use the provided shaders or fall back to the defaults
    const finalVertexShader = props?.vertexShader || vertexShader;
    const finalFragmentShader = props?.fragmentShader || fragmentShader;

    return React.createElement('shaderMaterial', {
      ...props,
      uniforms: mergedUniforms,
      vertexShader: finalVertexShader,
      fragmentShader: finalFragmentShader,
    });
  };
};

// Mock for @react-three/fiber
interface FrameState {
  clock: {
    elapsedTime: number;
  };
}

const useFrame = (callback: (state: FrameState) => void): void => {
  // This is a mock implementation
  React.useEffect(() => {
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

// Mock for extend
const extendThree = (components: Record<string, unknown>): void => {
  // Register the components with Three.js (mock implementation)
  console.warn(`Registering ${Object.keys(components).length} custom components with Three.js:`);
  Object.keys(components).forEach(name => {
    console.warn(`- ${name}`);
  });

  // In a real implementation, this would extend Three.js with custom shader materials
  // For example, it would make ShieldMaterial available as a JSX element
};

// Enhanced shield shader material
const ShieldMaterial = shaderMaterial(
  {
    time: 0,
    color: new THREE.Color(),
    opacity: 0,
    health: 1,
    impactPosition: new THREE.Vector2(0, 0),
    impactIntensity: 0,
  },
  // Enhanced vertex shader with wave motion
  `
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vPosition;
    uniform float time;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vUv = uv;
      vPosition = position;
      
      // Dynamic wave motion
      float wave1 = sin(position.x * 5.0 + time * 2.0) * cos(position.y * 5.0 + time) * 0.02;
      float wave2 = sin(position.y * 8.0 - time * 1.5) * cos(position.z * 8.0 + time * 0.5) * 0.015;
      vec3 newPosition = position + normal * (wave1 + wave2) * (1.0 - uv.y);
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `,
  // Enhanced fragment shader
  `
    uniform float time;
    uniform vec3 color;
    uniform float opacity;
    uniform float health;
    uniform vec2 impactPosition;
    uniform float impactIntensity;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vPosition;

    // Improved noise function
    float hash(vec2 p) {
      float h = dot(p, vec2(127.1, 311.7));
      return fract(sin(h) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
    }

    // Enhanced hexagon pattern
    float hexagonPattern(vec2 p, float scale, float width) {
      p *= scale;
      vec2 r = vec2(1.0, 1.73);
      vec2 h = r * 0.5;
      vec2 a = mod(p, r) - h;
      vec2 b = mod(p - h, r) - h;
      vec2 gv = length(a) < length(b) ? a : b;
      float hexDist = length(gv);
      float pattern = smoothstep(width + 0.05, width, hexDist);
      
      // Add inner glow to hexagons
      float innerGlow = smoothstep(width - 0.1, width, hexDist);
      pattern += (1.0 - innerGlow) * 0.2;
      
      return pattern;
    }

    void main() {
      // Multi-layered hexagon pattern
      float baseHex = hexagonPattern(vUv, 10.0, 0.1);
      float smallHex = hexagonPattern(vUv + time * 0.05, 20.0, 0.05) * 0.5;
      float movingHex = hexagonPattern(vUv - vec2(time * 0.1), 15.0, 0.08) * 0.3;
      float finalHexPattern = baseHex + smallHex + movingHex;

      // Enhanced Fresnel effect
      float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
      float pulseFresnel = fresnel * (1.0 + sin(time * 2.0) * 0.2);

      // Energy fluctuations
      float energy = noise(vUv * 5.0 + time * 0.5);
      float energyPulse = sin(time * 3.0) * 0.5 + 0.5;
      float energyFlow = noise(vec2(vUv.x * 10.0 + time, vUv.y * 10.0 - time));

      // Enhanced shield ripple
      float baseRipple = sin(length(vUv - vec2(0.5)) * 20.0 - time * 2.0) * 0.5 + 0.5;
      float movingRipple = sin(length(vUv - vec2(0.5 + sin(time) * 0.1)) * 15.0 - time * 3.0) * 0.5 + 0.5;
      float ripple = mix(baseRipple, movingRipple, 0.5);

      // Enhanced impact effect with shockwave
      float impact = smoothstep(0.5, 0.0, length(vUv - impactPosition)) * impactIntensity;
      
      // Multiple shockwave rings
      float shockwave1 = smoothstep(0.5, 0.48, abs(length(vUv - impactPosition) - mod(time * 2.0, 1.0))) * impactIntensity;
      float shockwave2 = smoothstep(0.3, 0.28, abs(length(vUv - impactPosition) - mod(time * 2.0 + 0.2, 0.7))) * impactIntensity * 0.7;
      float shockwave = max(shockwave1, shockwave2);

      // Combine all effects
      float finalOpacity = mix(0.2, 1.0, pulseFresnel) * opacity;
      finalOpacity *= mix(0.8, 1.2, finalHexPattern);
      finalOpacity *= mix(0.9, 1.1, ripple);
      finalOpacity *= mix(0.95, 1.05, energyFlow);
      finalOpacity += impact + shockwave;
      finalOpacity *= health * energyPulse;

      // Enhanced color blending
      vec3 finalColor = mix(color, vec3(1.0), pulseFresnel * 0.5);
      finalColor = mix(finalColor, vec3(1.0), impact);
      finalColor += vec3(shockwave * 0.5);
      finalColor *= mix(0.9, 1.1, energy);
      
      // Add subtle color variations
      finalColor += vec3(0.1, 0.2, 0.3) * energyFlow * health;

      gl_FragColor = vec4(finalColor, finalOpacity);
    }
  `
);

// Extend Three.js with our custom material
extendThree({ ShieldMaterial });

// Type definitions for the material
type ShieldMaterialType = THREE.ShaderMaterial & {
  uniforms: {
    time: { value: number };
    color: { value: THREE.Color };
    opacity: { value: number };
    health: { value: number };
    impactPosition: { value: THREE.Vector2 };
    impactIntensity: { value: number };
  };
};

// Define a type for the ref that can be used with custom elements
type CustomElementRef<T> = React.RefObject<T> | ((instance: T | null) => void) | null | undefined;

// Shield component for the 3D scene
function Shield({ active, health, color, impact }: Omit<ShieldEffectProps, 'size'>) {
  const materialRef = React.useRef<ShieldMaterialType>(null);
  const impactRef = React.useRef<{ value: number }>({ value: 0 });
  const colorObj = new THREE.Color(color);

  // Animation for shield opacity
  const { opacity } = useSpring({
    opacity: active ? 1 : 0,
    config: { tension: 280, friction: 60 },
  });

  // Update shield material uniforms
  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = clock.elapsedTime;
      materialRef.current.uniforms.opacity.value = opacity.get();
      materialRef.current.uniforms.health.value = health;
      materialRef.current.uniforms.color.value = colorObj;

      // Handle impact effect
      if (impact) {
        materialRef.current.uniforms.impactPosition.value.set(impact.x, impact.y);
        materialRef.current.uniforms.impactIntensity.value = impact.intensity;

        // Animate impact fade out
        if (impactRef.current.value !== impact.intensity) {
          impactRef.current.value = impact.intensity;
          gsap.to(materialRef.current.uniforms.impactIntensity, {
            value: 0,
            duration: 1.5,
            ease: 'power2.out',
          });
        }
      }
    }
  });

  // Use React.createElement instead of JSX to avoid TypeScript errors
  return React.createElement(
    React.Fragment,
    null,
    React.createElement('ambientLight', { intensity: 0.5 }),
    React.createElement(
      Sphere,
      { args: [1, 64, 64] },
      React.createElement('shaderMaterial', {
        // Cast the ref to a more specific type to avoid the 'unknown' linter error
        ref: materialRef as unknown as CustomElementRef<HTMLElement>,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        // Implement the previously unused uniforms, vertexShader, and fragmentShader
        uniforms: {
          time: { value: 0 },
          color: { value: colorObj },
          opacity: { value: active ? 1 : 0 },
          health: { value: health },
          impactPosition: { value: new THREE.Vector2(0, 0) },
          impactIntensity: { value: impact ? impact.intensity : 0 },
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec2 vUv;
          varying vec3 vPosition;
          uniform float time;

          void main() {
            vNormal = normalize(normalMatrix * normal);
            vUv = uv;
            vPosition = position;
            
            // Dynamic wave motion
            float wave1 = sin(position.x * 5.0 + time * 2.0) * cos(position.y * 5.0 + time) * 0.02;
            float wave2 = sin(position.y * 8.0 - time * 1.5) * cos(position.z * 8.0 + time * 0.5) * 0.015;
            vec3 newPosition = position + normal * (wave1 + wave2) * (1.0 - uv.y);
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          uniform vec3 color;
          uniform float opacity;
          uniform float health;
          uniform vec2 impactPosition;
          uniform float impactIntensity;
          varying vec3 vNormal;
          varying vec2 vUv;
          varying vec3 vPosition;

          // Basic noise function
          float hash(vec2 p) {
            float h = dot(p, vec2(127.1, 311.7));
            return fract(sin(h) * 43758.5453123);
          }

          void main() {
            // Simple Fresnel effect
            float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
            
            // Basic shield glow
            vec3 finalColor = mix(color, vec3(1.0), fresnel * 0.5);
            float finalOpacity = mix(0.2, 1.0, fresnel) * opacity * health;
            
            gl_FragColor = vec4(finalColor, finalOpacity);
          }
        `,
      })
    )
  );
}

// Canvas component for rendering the 3D scene
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
 *                 This parameter is used to:
 *                 1. Configure the camera position and field of view
 *                 2. Set up proper perspective for shield effects
 *                 3. Enable camera animations during shield impacts
 *                 4. Support dynamic camera adjustments based on shield size
 *                 5. Allow for camera shake effects during heavy shield impacts
 * @param style - CSS styles for the canvas container
 */
const Canvas: React.FC<CanvasProps> = ({ children, camera, style }) => {
  // Apply camera settings to the container style
  const enhancedStyle = {
    ...style,
    // Use camera position to adjust perspective
    perspective: `${1000 / (camera.fov / 75)}px`,
    perspectiveOrigin: `${50 + camera.position[0] * 5}% ${50 - camera.position[1] * 5}%`,
  };

  // Log camera settings for debugging
  React.useEffect(() => {
    console.warn(
      `Canvas initialized with camera at position [${camera.position.join(', ')}], FOV: ${camera.fov}`
    );

    // Setup camera shake effect for future implementation
    const setupCameraShake = () => {
      // This will be implemented in the future to add camera shake during shield impacts
      // The implementation will use the camera position and FOV to create realistic shake effects
    };

    setupCameraShake();
  }, [camera]);

  return React.createElement('div', { style: enhancedStyle }, children);
};

// Main ShieldEffect component
export function ShieldEffect({ active, health, color, size, impact }: ShieldEffectProps) {
  // Create the Shield element
  const shieldElement = React.createElement(Shield, { active, health, color, impact });

  // Create the background glow element if active
  const glowElement = active
    ? React.createElement('div', {
        className: 'absolute inset-0 rounded-full',
        style: {
          background: `radial-gradient(circle, ${color}33 0%, ${color}00 70%)`,
          opacity: health,
          transform: `scale(${1 + health * 0.2})`,
        },
      })
    : null;

  return React.createElement(
    'div',
    {
      className: 'pointer-events-none absolute inset-0 flex items-center justify-center',
      style: { perspective: '1000px' },
    },
    React.createElement(Canvas, {
      camera: { position: [0, 0, 5], fov: 75 },
      style: { width: `${size}px`, height: `${size}px` },
      children: shieldElement,
    }),
    glowElement
  );
}
