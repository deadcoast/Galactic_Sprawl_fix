// src/components/effects/ShieldEffect.tsx
import { useSpring } from '@react-spring/three';
import { Sphere, shaderMaterial } from '@react-three/drei';
import { Canvas, extend as extendThree, useFrame } from '@react-three/fiber';
import gsap from 'gsap';
import { useEffect, useRef } from 'react';
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

// Update type definition for the material
declare module '@react-three/fiber' {
  interface ThreeElements {
    shieldMaterial: Omit<JSX.IntrinsicElements['shaderMaterial'], 'args'> & {
      ref?: React.RefObject<ShieldMaterialType>;
      color?: THREE.ColorRepresentation;
      uniforms?: {
        time: { value: number };
        color: { value: THREE.Color };
        opacity: { value: number };
        health: { value: number };
        impactPosition: { value: THREE.Vector2 };
        impactIntensity: { value: number };
      };
    };
  }
}

function Shield({ active, health, color, impact }: Omit<ShieldEffectProps, 'size'>) {
  const materialRef = useRef<ShieldMaterialType>(null);
  const timeRef = useRef(0);

  const { opacity } = useSpring({
    opacity: active ? 1 : 0,
    config: { tension: 280, friction: 60 },
  });

  useEffect(() => {
    if (impact && materialRef.current) {
      gsap.to(materialRef.current.uniforms.impactIntensity, {
        value: impact.intensity,
        duration: 0.3,
        ease: 'expo.out',
        yoyo: true,
        repeat: 1,
      });
    }
  }, [impact]);

  useFrame(state => {
    if (materialRef.current) {
      // Use state.clock for smooth continuous time and delta for increments
      timeRef.current = state.clock.elapsedTime;
      materialRef.current.uniforms.time.value =
        timeRef.current * (1 + Math.sin(state.clock.elapsedTime * 0.1) * 0.2);
      materialRef.current.uniforms.health.value = health;
      materialRef.current.uniforms.opacity.value = opacity.get();
      if (impact) {
        materialRef.current.uniforms.impactPosition.value.set(impact.x / 100, impact.y / 100);
      }
    }
  });

  return (
    <Sphere args={[1, 64, 64]}>
      <shieldMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        color={new THREE.Color(color)}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </Sphere>
  );
}

export function ShieldEffect({ active, health, color, size, impact }: ShieldEffectProps) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      <Canvas camera={{ position: [0, 0, 2], fov: 75 }} style={{ background: 'transparent' }}>
        <ambientLight intensity={0.5} />
        <Shield active={active} health={health} color={color} impact={impact} />
      </Canvas>
    </div>
  );
}
