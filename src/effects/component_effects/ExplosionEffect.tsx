import { animated, useSpring } from '@react-spring/three';
import { Canvas, useFrame } from '@react-three/fiber';
import gsap from 'gsap';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

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
  const particles = useRef<THREE.Points>(null);
  const particleCount = size * 100;
  const velocitiesRef = useRef<Float32Array>();

  useEffect(() => {
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    // Store velocities reference for animation
    velocitiesRef.current = velocities;

    const color1 = new THREE.Color(color);
    const color2 = new THREE.Color('#ffffff');

    for (let i = 0; i < particleCount; i++) {
      // Random sphere distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const radius = Math.random() * size;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Velocities
      velocities[i * 3] = (Math.random() - 0.5) * 2;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 2;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 2;

      // Color gradient
      const colorMix = Math.random();
      const mixedColor = new THREE.Color().lerpColors(color1, color2, colorMix);
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;

      sizes[i] = Math.random() * 2 + 1;
    }

    if (particles.current) {
      const geometry = particles.current.geometry as THREE.BufferGeometry;
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

      // GSAP Animation
      gsap.to(particles.current.scale, {
        x: 2,
        y: 2,
        z: 2,
        duration: 1,
        ease: 'expo.out',
      });

      gsap.to(particles.current.material as THREE.Material, {
        opacity: 0,
        duration: 1.5,
        ease: 'power2.out',
        onComplete,
      });
    }
  }, [color, size, onComplete, particleCount]);

  useFrame((state, delta) => {
    if (particles.current && velocitiesRef.current) {
      const positions = (particles.current.geometry as THREE.BufferGeometry).attributes.position;
      const velocities = velocitiesRef.current;

      // Add time-based variation to particle movement
      const time = state.clock.elapsedTime;

      for (let i = 0; i < positions.count; i++) {
        const timeOffset = Math.sin(time + i * 0.1) * 0.2;
        positions.setXYZ(
          i,
          positions.getX(i) + (velocities[i * 3] + timeOffset) * delta,
          positions.getY(i) + (velocities[i * 3 + 1] + timeOffset) * delta,
          positions.getZ(i) + velocities[i * 3 + 2] * delta
        );
      }
      positions.needsUpdate = true;
    }
  });

  const { scale } = useSpring({
    from: { scale: 0 },
    to: { scale: 1 },
    config: { mass: 1, tension: 280, friction: 60 },
  });

  return (
    <animated.points ref={particles} scale={scale}>
      <bufferGeometry />
      <pointsMaterial
        size={2}
        transparent
        vertexColors
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </animated.points>
  );
}

export function ExplosionEffect({ position, size, color, onComplete }: ExplosionEffectProps) {
  const sizeMap = {
    small: 5,
    medium: 10,
    large: 15,
  };

  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: position.x,
        top: position.y,
        width: sizeMap[size] * 20,
        height: sizeMap[size] * 20,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <Canvas camera={{ position: [0, 0, 20], fov: 75 }} style={{ background: 'transparent' }}>
        <ambientLight intensity={0.5} />
        <ExplosionParticles color={color} size={sizeMap[size]} onComplete={onComplete} />
      </Canvas>

      {/* Core Flash */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${color}cc 0%, ${color}00 100%)`,
          animation: 'flash 0.3s ease-out forwards',
        }}
      />
    </div>
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
