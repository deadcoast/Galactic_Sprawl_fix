import { useSpring } from "@react-spring/three";
import { Trail } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

interface WeaponEffectProps {
  type: "machineGun" | "railGun" | "gaussCannon" | "rockets" | "mgss";
  color: string;
  position: { x: number; y: number };
  rotation: number;
  firing: boolean;
}

function WeaponBeam({
  type,
  color,
  firing,
}: Omit<WeaponEffectProps, "position" | "rotation">) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const timeRef = useRef(0);

  const { intensity } = useSpring({
    intensity: firing ? 1 : 0,
    config: { tension: 280, friction: 60 },
  });

  // Create shader material directly
  const shader = {
    uniforms: {
      time: { value: 0 },
      color: { value: new THREE.Color(color) },
      intensity: { value: 0 },
      weaponType: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vPosition;
      varying vec3 vNormal;
      
      void main() {
        vUv = uv;
        vPosition = position;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 color;
      uniform float intensity;
      uniform int weaponType;
      
      varying vec2 vUv;
      varying vec3 vPosition;
      varying vec3 vNormal;
      
      float noise(vec2 p) {
        return fract(sin(dot(p.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }
      
      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        vec2 shift = vec2(100.0);
        mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
        for (int i = 0; i < 5; ++i) {
          v += a * noise(p);
          p = rot * p * 2.0 + shift;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 uv = vUv;
        float alpha = 0.0;
        vec3 finalColor = color;
        
        // Edge glow
        float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
        
        if (weaponType == 0) { // Machine Gun
          float bulletPattern = smoothstep(0.48, 0.52, abs(uv.x - 0.5));
          float trailFade = smoothstep(0.0, 1.0, uv.y);
          float energyPulse = sin(uv.y * 30.0 - time * 15.0) * 0.5 + 0.5;
          alpha = (1.0 - bulletPattern) * (1.0 - trailFade) * intensity;
          alpha *= mix(0.8, 1.0, energyPulse);
          finalColor = mix(color, vec3(1.0), fresnel * 0.5);
        }
        else if (weaponType == 1) { // Rail Gun
          float beam = smoothstep(0.45, 0.55, abs(uv.x - 0.5));
          float energyPulse = sin(uv.y * 20.0 - time * 10.0) * 0.5 + 0.5;
          float distortion = fbm(uv * 5.0 + time * 0.5);
          alpha = (1.0 - beam) * (energyPulse + distortion * 0.5) * intensity;
          finalColor = mix(color, vec3(1.0), fresnel * 0.7 + energyPulse * 0.3);
        }
        else if (weaponType == 2) { // Gauss Cannon
          float core = smoothstep(0.4, 0.6, abs(uv.x - 0.5));
          float plasma = fbm(uv * 8.0 + time * 2.0);
          float rings = sin(uv.y * 50.0 + time * 5.0) * 0.5 + 0.5;
          alpha = (1.0 - core) * (plasma + rings * 0.3) * intensity;
          finalColor = mix(color, vec3(1.0), fresnel * 0.8 + plasma * 0.4);
        }
        else if (weaponType == 3) { // Rockets
          float rocketCore = smoothstep(0.45, 0.55, abs(uv.x - 0.5));
          float exhaust = fbm(vec2(uv.x * 5.0, uv.y * 2.0 - time * 3.0));
          float sparkles = noise(uv * 20.0 + time * 4.0);
          alpha = (1.0 - rocketCore) * (exhaust + sparkles * 0.2) * intensity;
          finalColor = mix(color, vec3(1.0), fresnel * 0.6 + exhaust * 0.3);
        }
        else if (weaponType == 4) { // MGSS
          float beamCore = smoothstep(0.47, 0.53, abs(uv.x - 0.5));
          float swirl = sin(uv.y * 40.0 + time * 8.0 + uv.x * 5.0) * 0.5 + 0.5;
          float energyField = fbm(uv * 6.0 + time * 1.5);
          alpha = (1.0 - beamCore) * (swirl + energyField * 0.4) * intensity;
          finalColor = mix(color, vec3(1.0), fresnel * 0.9 + swirl * 0.3);
        }
        
        // Add global glow
        alpha += fresnel * 0.3 * intensity;
        
        gl_FragColor = vec4(finalColor, alpha);
      }
    `,
  };

  useFrame((_state, delta) => {
    if (materialRef.current) {
      timeRef.current += delta;
      materialRef.current.uniforms.time.value = timeRef.current;
      materialRef.current.uniforms.intensity.value = intensity.get();
      materialRef.current.uniforms.weaponType.value = typeMap[type];
    }
  });

  const typeMap = {
    machineGun: 0,
    railGun: 1,
    gaussCannon: 2,
    rockets: 3,
    mgss: 4,
  };

  return (
    <mesh>
      <planeGeometry args={[0.2, 1, 32, 32]} />
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={shader.uniforms}
        vertexShader={shader.vertexShader}
        fragmentShader={shader.fragmentShader}
      />
      {type !== "machineGun" && (
        <Trail
          width={0.2}
          length={5}
          color={color}
          attenuation={(t: number) => t * t}
        />
      )}
    </mesh>
  );
}

export function WeaponEffect({
  type,
  color,
  position,
  rotation,
  firing,
}: WeaponEffectProps) {
  return (
    <div
      className="absolute"
      style={{
        left: position.x,
        top: position.y,
        width: "100px",
        height: "200px",
        transform: `rotate(${rotation}deg)`,
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 2], fov: 75 }}
        style={{ background: "transparent" }}
      >
        <WeaponBeam type={type} color={color} firing={firing} />
      </Canvas>

      {/* Enhanced Glow Effect */}
      {firing && (
        <>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 0%, ${color}66 0%, ${color}00 70%)`,
              filter: "blur(8px)",
              opacity: 0.8,
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 0%, ${color}33 0%, ${color}00 100%)`,
              filter: "blur(16px)",
              opacity: 0.6,
              animation: "pulse 2s ease-in-out infinite reverse",
            }}
          />
        </>
      )}
    </div>
  );
}
