import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

interface SmokeTrailProps {
  position: { x: number; y: number };
  direction: number;
  intensity: number;
  color: string;
}

function SmokeParticles({
  direction,
  intensity,
  color,
}: Omit<SmokeTrailProps, "position">) {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 1000;
  const particlePositions = useRef<Float32Array>();
  const particleVelocities = useRef<Float32Array>();
  const particleStartTimes = useRef<Float32Array>();

  useEffect(() => {
    if (!particlesRef.current) {
      return;
    }

    particlePositions.current = new Float32Array(particleCount * 3);
    particleVelocities.current = new Float32Array(particleCount * 3);
    particleStartTimes.current = new Float32Array(particleCount);

    const positions = particlePositions.current;
    const velocities = particleVelocities.current;
    const startTimes = particleStartTimes.current;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = 0;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = 0;

      const angle =
        direction * (Math.PI / 180) + (Math.random() - 0.5) * Math.PI * 0.5;
      const speed = (0.5 + Math.random() * 0.5) * intensity;
      velocities[i3] = Math.cos(angle) * speed;
      velocities[i3 + 1] = Math.sin(angle) * speed;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.2;

      startTimes[i] = -Math.random() * 2.0;
    }

    const geometry = particlesRef.current.geometry as THREE.BufferGeometry;
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute(
      "startTime",
      new THREE.BufferAttribute(startTimes, 1),
    );
  }, [direction, intensity]);

  useFrame((state) => {
    if (
      !particlesRef.current ||
      !particlePositions.current ||
      !particleVelocities.current ||
      !particleStartTimes.current
    ) {
      return;
    }

    const time = state.clock.elapsedTime;
    const positions = particlePositions.current;
    const velocities = particleVelocities.current;
    const startTimes = particleStartTimes.current;
    const geometry = particlesRef.current.geometry as THREE.BufferGeometry;
    const positionAttribute = geometry.getAttribute("position");

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const particleTime = time - startTimes[i];

      if (particleTime > 2.0) {
        // Reset particle
        positions[i3] = 0;
        positions[i3 + 1] = 0;
        positions[i3 + 2] = 0;
        startTimes[i] = time;
      } else if (particleTime > 0) {
        // Update particle position
        positions[i3] += velocities[i3] * 0.016;
        positions[i3 + 1] += velocities[i3 + 1] * 0.016;
        positions[i3 + 2] += velocities[i3 + 2] * 0.016;

        // Add turbulence
        positions[i3] += Math.sin(particleTime * 5 + i) * 0.02;
        positions[i3 + 1] += Math.cos(particleTime * 3 + i) * 0.02;
      }
    }

    positionAttribute.needsUpdate = true;
  });

  const smokeShader = {
    uniforms: {
      time: { value: 0 },
      color: { value: new THREE.Color(color) },
      intensity: { value: intensity },
    },
    vertexShader: `
      attribute float startTime;
      uniform float time;
      varying float vAlpha;
      
      void main() {
        float particleTime = time - startTime;
        if (particleTime > 0.0 && particleTime < 2.0) {
          float normalizedTime = particleTime / 2.0;
          vAlpha = (1.0 - normalizedTime) * (1.0 - normalizedTime);
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = mix(8.0, 2.0, normalizedTime) * (1.0 - length(position) * 0.1);
        } else {
          vAlpha = 0.0;
          gl_Position = vec4(0.0);
          gl_PointSize = 0.0;
        }
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float intensity;
      varying float vAlpha;

      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float r = length(uv);
        if (r > 0.5) discard;
        
        float softness = smoothstep(0.5, 0.0, r);
        float glowPower = pow(softness, 2.0);
        vec3 glowColor = mix(color, vec3(1.0), glowPower * 0.5);
        
        gl_FragColor = vec4(glowColor, vAlpha * intensity * softness);
      }
    `,
  };

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={new Float32Array(particleCount * 3)}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-startTime"
          count={particleCount}
          array={new Float32Array(particleCount)}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        attach="material"
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={smokeShader.uniforms}
        vertexShader={smokeShader.vertexShader}
        fragmentShader={smokeShader.fragmentShader}
      />
    </points>
  );
}

export function SmokeTrailEffect({
  position,
  direction,
  intensity,
  color,
}: SmokeTrailProps) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
        width: "400px",
        height: "400px",
        transform: "translate(-50%, -50%)",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 50], fov: 50 }}
        style={{ background: "transparent" }}
      >
        <SmokeParticles
          direction={direction}
          intensity={intensity}
          color={color}
        />
      </Canvas>
    </div>
  );
}

// Add to global styles
const style = document.createElement("style");
style.textContent = `
  @keyframes smoke {
    0% { transform: scale(1); opacity: 0.8; }
    100% { transform: scale(2); opacity: 0; }
  }
`;
document.head.appendChild(style);
