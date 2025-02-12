import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ThrusterEffectProps {
  size: 'small' | 'medium' | 'large';
  color: string;
  intensity: number;
}

function ThrusterParticles({ size, color, intensity }: ThrusterEffectProps) {
  const particlesRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);

  const sizeScale = {
    small: 0.5,
    medium: 1,
    large: 1.5
  };

  const particleCount = Math.floor(1000 * sizeScale[size]);

  useFrame((state) => {
    if (!particlesRef.current) {
      return;
    }

    const time = state.clock.elapsedTime;
    timeRef.current = time;

    const material = particlesRef.current.material as THREE.ShaderMaterial;
    material.uniforms.time.value = time;
    material.uniforms.intensity.value = intensity * (0.8 + Math.sin(time * 2) * 0.2); // Pulsing intensity
  });

  const thrusterShader = {
    uniforms: {
      time: { value: 0 },
      color: { value: new THREE.Color(color) },
      intensity: { value: intensity }
    },
    vertexShader: `
      attribute float size;
      attribute float speed;
      attribute float offset;
      
      uniform float time;
      uniform float intensity;
      
      varying float vAlpha;
      varying vec3 vPosition;
      
      void main() {
        vPosition = position;
        
        // Calculate particle lifecycle
        float t = mod(time * speed + offset, 1.0);
        
        // Update position based on time
        vec3 pos = position;
        pos.y -= t * 2.0;
        
        // Add turbulence
        float turbulence = sin(t * 10.0 + position.x * 5.0) * 0.1;
        pos.x += turbulence * intensity;
        
        // Calculate alpha based on lifecycle
        float fadeIn = smoothstep(0.0, 0.1, t);
        float fadeOut = 1.0 - smoothstep(0.4, 1.0, t);
        vAlpha = fadeIn * fadeOut * intensity;
        
        // Project position
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        // Dynamic point size
        float distanceFactor = 1.0 + length(mvPosition.xyz) * 0.1;
        gl_PointSize = size * (1.0 - t * 0.5) * intensity / distanceFactor;
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float intensity;
      
      varying float vAlpha;
      varying vec3 vPosition;
      
      void main() {
        // Soft particle shape
        vec2 uv = gl_PointCoord - 0.5;
        float r = length(uv);
        if (r > 0.5) discard;
        
        // Enhanced glow effect
        float glow = exp(-r * 2.0);
        float corePower = smoothstep(0.5, 0.0, r);
        
        // Mix core and glow colors
        vec3 coreColor = mix(color, vec3(1.0), corePower * 0.7);
        vec3 glowColor = mix(color, vec3(1.0), glow * 0.3);
        vec3 finalColor = mix(glowColor, coreColor, corePower);
        
        // Add heat distortion
        float heat = sin(vPosition.y * 20.0 + gl_PointCoord.y * 10.0) * 0.1;
        finalColor = mix(finalColor, vec3(1.0, 0.8, 0.4), heat * intensity);
        
        gl_FragColor = vec4(finalColor, vAlpha * (glow + corePower));
      }
    `
  };

  // Generate particle attributes
  const positions = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const speeds = new Float32Array(particleCount);
  const offsets = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    const radius = Math.random() * 0.2 * sizeScale[size];
    const angle = Math.random() * Math.PI * 2;
    
    positions[i3] = Math.cos(angle) * radius;
    positions[i3 + 1] = Math.random() * 2 * sizeScale[size];
    positions[i3 + 2] = Math.sin(angle) * radius;
    
    sizes[i] = (Math.random() * 0.5 + 0.5) * 20 * sizeScale[size];
    speeds[i] = Math.random() * 0.5 + 0.5;
    offsets[i] = Math.random();
  }

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={particleCount}
          array={sizes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-speed"
          count={particleCount}
          array={speeds}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-offset"
          count={particleCount}
          array={offsets}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        attach="material"
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={thrusterShader.uniforms}
        vertexShader={thrusterShader.vertexShader}
        fragmentShader={thrusterShader.fragmentShader}
      />
    </points>
  );
}

export function ThrusterEffect({ size, color, intensity }: ThrusterEffectProps) {
  const sizeMap = {
    small: 40,
    medium: 60,
    large: 80
  };

  return (
    <div
      className="relative"
      style={{
        width: sizeMap[size],
        height: sizeMap[size] * 2
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 2], fov: 75 }}
        style={{ background: 'transparent' }}
      >
        <ThrusterParticles size={size} color={color} intensity={intensity} />
      </Canvas>

      {/* Enhanced Glow Effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${color}66 0%, ${color}00 70%)`,
          filter: `blur(${intensity * 8}px)`,
          opacity: intensity * 0.8,
          animation: 'pulse 2s ease-in-out infinite'
        }}
      />
    </div>
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