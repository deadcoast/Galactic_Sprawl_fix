/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import { useSpring } from '@react-spring/three';
import { Trail } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import * as React from 'react';
import { useRef } from 'react';
import * as THREE from 'three';
import { RenderBatcher } from '../../lib/optimization/RenderBatcher';
import { Position } from '../../types/core/Position';
import { WeaponCategory } from '../../types/weapons/WeaponTypes';
import { VisualEffect, VisualEffectConfig } from './VisualEffect';

// Props and Config Types
interface WeaponEffectProps {
  type:
    | 'machineGun'
    | 'railGun'
    | 'gaussCannon'
    | 'rockets'
    | 'mgss'
    | 'pointDefense'
    | 'plasmaCannon'
    | 'beamWeapon'
    | 'pulseWeapon'
    | 'disruptor'
    | 'ionCannon';
  color: string;
  position: { x: number; y: number };
  rotation: number;
  firing: boolean;
}

interface WeaponEffectConfig extends VisualEffectConfig {
  type: WeaponCategory;
  target?: Position;
  damage?: number;
  impactSize?: number;
  opacity?: number;
  color?: string;
  duration?: number;
}

// React Components
function WeaponBeam({ type, color, firing }: Omit<WeaponEffectProps, 'position' | 'rotation'>) {
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
        else if (weaponType == 5) { // Point Defense
          float pointDefense = smoothstep(0.45, 0.55, abs(uv.x - 0.5));
          float energyPulse = sin(uv.y * 30.0 - time * 15.0) * 0.5 + 0.5;
          alpha = (1.0 - pointDefense) * (energyPulse + 0.5) * intensity;
          finalColor = mix(color, vec3(1.0), fresnel * 0.5);
        }
        else if (weaponType == 6) { // Plasma Cannon
          float plasmaCore = smoothstep(0.45, 0.55, abs(uv.x - 0.5));
          float plasmaField = fbm(uv * 10.0 + time * 3.0);
          float energyRings = sin(uv.y * 60.0 + time * 8.0) * 0.5 + 0.5;
          alpha = (1.0 - plasmaCore) * (plasmaField + energyRings * 0.4) * intensity;
          finalColor = mix(color, vec3(1.0), fresnel * 0.9 + plasmaField * 0.5);
        }
        else if (weaponType == 7) { // Beam Weapon
          float beamCore = smoothstep(0.48, 0.52, abs(uv.x - 0.5));
          float energyField = fbm(uv * 12.0 + time * 4.0);
          float beamPulse = sin(uv.y * 80.0 - time * 20.0) * 0.5 + 0.5;
          alpha = (1.0 - beamCore) * (energyField + beamPulse * 0.6) * intensity;
          finalColor = mix(color, vec3(1.0), fresnel * 0.95 + beamPulse * 0.4);
        }
        else if (weaponType == 8) { // Pulse Weapon
          float pulseCore = smoothstep(0.46, 0.54, abs(uv.x - 0.5));
          float pulseWave = sin(uv.y * 40.0 - time * 12.0) * 0.5 + 0.5;
          float energyField = fbm(uv * 8.0 + time * 2.0);
          alpha = (1.0 - pulseCore) * (pulseWave + energyField * 0.3) * intensity;
          finalColor = mix(color, vec3(1.0), fresnel * 0.8 + pulseWave * 0.5);
        }
        else if (weaponType == 9) { // Disruptor
          float disruptorCore = smoothstep(0.47, 0.53, abs(uv.x - 0.5));
          float disruption = fbm(uv * 15.0 + time * 5.0);
          float chaosField = noise(uv * 25.0 + time * 6.0);
          alpha = (1.0 - disruptorCore) * (disruption + chaosField * 0.4) * intensity;
          finalColor = mix(color, vec3(1.0), fresnel * 0.7 + disruption * 0.6);
        }
        else if (weaponType == 10) { // Ion Cannon
          float ionCore = smoothstep(0.46, 0.54, abs(uv.x - 0.5));
          float ionField = fbm(uv * 10.0 + time * 3.5);
          float ionPulse = sin(uv.y * 70.0 - time * 15.0) * 0.5 + 0.5;
          alpha = (1.0 - ionCore) * (ionField + ionPulse * 0.5) * intensity;
          finalColor = mix(color, vec3(1.0), fresnel * 0.85 + ionPulse * 0.45);
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
    pointDefense: 5,
    plasmaCannon: 6,
    beamWeapon: 7,
    pulseWeapon: 8,
    disruptor: 9,
    ionCannon: 10,
  };

  return React.createElement(
    'mesh',
    null,
    React.createElement('planeGeometry', { args: [0.2, 1, 32, 32] }),
    React.createElement('shaderMaterial', {
      ref: materialRef,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: shader.uniforms,
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader,
    }),
    type !== 'machineGun' &&
      React.createElement(Trail, {
        width: 0.2,
        length: 5,
        color: color,
        attenuation: (t: number) => t * t,
      })
  );
}

export function WeaponEffectComponent({
  type,
  color,
  position,
  rotation,
  firing,
}: WeaponEffectProps) {
  return React.createElement(
    'div',
    {
      className: 'absolute',
      style: {
        left: position.x,
        top: position.y,
        width: '100px',
        height: '200px',
        transform: `rotate(${rotation}deg)`,
      },
    },
    React.createElement(Canvas, {
      camera: { position: [0, 0, 2], fov: 75 },
      style: { background: 'transparent' },
      children: React.createElement(WeaponBeam, { type: type, color: color, firing: firing }),
    }),

    /* Enhanced Glow Effect */
    firing &&
      React.createElement(
        React.Fragment,
        null,
        React.createElement('div', {
          className: 'pointer-events-none absolute inset-0',
          style: {
            background: `radial-gradient(circle at 50% 0%, ${color}66 0%, ${color}00 70%)`,
            filter: 'blur(8px)',
            opacity: 0.8,
            animation: 'pulse 1.5s ease-in-out infinite',
          },
        }),
        React.createElement('div', {
          className: 'pointer-events-none absolute inset-0',
          style: {
            background: `radial-gradient(circle at 50% 0%, ${color}33 0%, ${color}00 100%)`,
            filter: 'blur(16px)',
            opacity: 0.6,
            animation: 'pulse 2s ease-in-out infinite reverse',
          },
        })
      )
  );
}

// Visual Effect Class
export class WeaponEffectVisual extends VisualEffect {
  protected override config: WeaponEffectConfig;
  private trailPoints: Position[] = [];
  private impactParticles: Position[] = [];
  private impactStartTime: number = 0;

  constructor(config: WeaponEffectConfig) {
    super(config);
    this.config = config;
  }

  protected getEffectType(): string {
    return `weapon-${this.config.type}`;
  }

  protected onStart(): void {
    // Initialize trail points
    this.trailPoints = [this.config.position];

    // Debug logging
    console.warn(`[WeaponEffect] Started ${this.config.type} effect`);
  }

  protected onUpdate(progress: number): void {
    // Update trail points
    if (this.config.target) {
      const currentPoint = {
        x: this.config.position.x + (this.config.target.x - this.config.position.x) * progress,
        y: this.config.position.y + (this.config.target.y - this.config.position.y) * progress,
      };

      this.trailPoints.push(currentPoint);

      // Keep only recent points
      while (this.trailPoints.length > 10) {
        this.trailPoints.shift();
      }

      // Create impact when projectile reaches target
      if (progress >= 1 && !this.impactStartTime) {
        this.impactStartTime = Date.now();
        this.createImpactParticles();
      }
    }
  }

  protected onComplete(): void {
    this.trailPoints = [];
    this.impactParticles = [];
    this.impactStartTime = 0;

    console.warn(`[WeaponEffect] Completed ${this.config.type} effect`);
  }

  protected onReset(): void {
    this.trailPoints = [];
    this.impactParticles = [];
    this.impactStartTime = 0;
  }

  protected updateRendering(batcher: RenderBatcher): void {
    if (!this.batchId) {
      return;
    }

    // Render trail
    this.renderTrail(batcher);

    // Render impact
    if (this.impactStartTime) {
      this.renderImpact(batcher);
    }
  }

  private renderTrail(batcher: RenderBatcher): void {
    // Different trail rendering based on weapon type
    switch (this.config.type) {
      case 'machineGun':
        this.renderProjectileTrail(batcher);
        break;
      case 'gaussCannon':
      case 'railGun':
        this.renderBeamTrail(batcher);
        break;
      case 'mgss':
        this.renderEnergyTrail(batcher);
        break;
      case 'rockets':
        this.renderRocketTrail(batcher);
        break;
      case 'harmonicCannon':
        this.renderHarmonicTrail(batcher);
        break;
      case 'temporalCannon':
        this.renderTemporalTrail(batcher);
        break;
      case 'quantumCannon':
        this.renderQuantumTrail(batcher);
        break;
    }
  }

  private renderProjectileTrail(batcher: RenderBatcher): void {
    // Simple projectile with small trail
    this.trailPoints.forEach((point, index) => {
      const opacity = index / this.trailPoints.length;
      batcher.addItem(this.batchId!, {
        id: `${this.id}-trail-${index}`,
        position: point,
        size: { width: 4, height: 4 },
        rotation: 0,
        opacity,
        color: this.config.color || '#ffff00',
        shader: 'additive',
      });
    });
  }

  private renderBeamTrail(batcher: RenderBatcher): void {
    // Solid beam with glow
    if (this.trailPoints.length < 2) {
      return;
    }

    const start = this.trailPoints[0];
    const end = this.trailPoints[this.trailPoints.length - 1];
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const length = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));

    // Core beam
    batcher.addItem(this.batchId!, {
      id: `${this.id}-beam`,
      position: {
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2,
      },
      size: { width: length, height: 4 },
      rotation: angle,
      opacity: this.config.opacity || 1,
      color: this.config.color || '#00ffff',
      shader: 'additive',
    });

    // Glow effect
    batcher.addItem(this.batchId!, {
      id: `${this.id}-glow`,
      position: {
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2,
      },
      size: { width: length, height: 12 },
      rotation: angle,
      opacity: (this.config.opacity || 1) * 0.5,
      color: this.config.color || '#00ffff',
      shader: 'additive',
    });
  }

  private renderEnergyTrail(batcher: RenderBatcher): void {
    // Pulsing energy trail
    this.trailPoints.forEach((point, index) => {
      const opacity = index / this.trailPoints.length;
      const pulse = Math.sin(Date.now() / 100 + index) * 0.3 + 0.7;

      batcher.addItem(this.batchId!, {
        id: `${this.id}-trail-${index}`,
        position: point,
        size: { width: 6, height: 6 },
        rotation: 0,
        opacity: opacity * pulse,
        color: this.config.color || '#ff00ff',
        shader: 'additive',
      });
    });
  }

  private renderRocketTrail(batcher: RenderBatcher): void {
    // Rocket with smoke trail
    this.trailPoints.forEach((point, index) => {
      const opacity = index / this.trailPoints.length;

      // Smoke
      batcher.addItem(this.batchId!, {
        id: `${this.id}-smoke-${index}`,
        position: point,
        size: { width: 8, height: 8 },
        rotation: Math.random() * Math.PI * 2,
        opacity: opacity * 0.3,
        color: '#888888',
        shader: 'normal',
      });

      // Fire
      batcher.addItem(this.batchId!, {
        id: `${this.id}-fire-${index}`,
        position: point,
        size: { width: 6, height: 6 },
        rotation: 0,
        opacity: opacity,
        color: this.config.color || '#ff4400',
        shader: 'additive',
      });
    });
  }

  private renderHarmonicTrail(batcher: RenderBatcher): void {
    // Harmonic wave pattern
    this.trailPoints.forEach((point, index) => {
      const opacity = index / this.trailPoints.length;
      const wave = Math.sin(Date.now() / 200 + index);
      const offset = wave * 10;

      batcher.addItem(this.batchId!, {
        id: `${this.id}-trail-${index}`,
        position: {
          x: point.x + offset,
          y: point.y + offset,
        },
        size: { width: 8, height: 8 },
        rotation: wave * Math.PI,
        opacity: opacity,
        color: this.config.color || '#00ff88',
        shader: 'additive',
      });
    });
  }

  private renderTemporalTrail(batcher: RenderBatcher): void {
    // Time distortion effect
    this.trailPoints.forEach((point, index) => {
      const opacity = index / this.trailPoints.length;
      const time = Date.now() / 1000;
      const distortion = Math.sin(time * 2 + index);

      for (let i = 0; i < 3; i++) {
        const offset = distortion * (i + 1) * 5;
        batcher.addItem(this.batchId!, {
          id: `${this.id}-trail-${index}-${i}`,
          position: {
            x: point.x + offset,
            y: point.y + offset,
          },
          size: { width: 6 - i * 2, height: 6 - i * 2 },
          rotation: time + (i * Math.PI) / 3,
          opacity: opacity * (1 - i * 0.2),
          color: this.config.color || '#8800ff',
          shader: 'additive',
        });
      }
    });
  }

  private renderQuantumTrail(batcher: RenderBatcher): void {
    // Quantum tunneling effect
    this.trailPoints.forEach((point, index) => {
      const opacity = index / this.trailPoints.length;
      const time = Date.now() / 1000;

      // Phase shift effect
      for (let i = 0; i < 4; i++) {
        const phase = (time + (i * Math.PI) / 2) % (Math.PI * 2);
        const shift = Math.sin(phase) * 10;

        batcher.addItem(this.batchId!, {
          id: `${this.id}-trail-${index}-${i}`,
          position: {
            x: point.x + Math.cos(phase) * shift,
            y: point.y + Math.sin(phase) * shift,
          },
          size: { width: 5, height: 5 },
          rotation: phase,
          opacity: opacity * Math.abs(Math.sin(phase)),
          color: this.config.color || '#0088ff',
          shader: 'additive',
        });
      }
    });
  }

  private renderImpact(batcher: RenderBatcher): void {
    const impactProgress = Math.min(
      1,
      (Date.now() - this.impactStartTime) / (this.config.duration || 1000)
    );

    // Update impact particles
    this.impactParticles.forEach((particle, index) => {
      const particleProgress = impactProgress * (1 + index * 0.1);
      if (particleProgress >= 1) {
        return;
      }

      batcher.addItem(this.batchId!, {
        id: `${this.id}-impact-${index}`,
        position: particle,
        size: {
          width: (this.config.impactSize || 20) * (1 - particleProgress),
          height: (this.config.impactSize || 20) * (1 - particleProgress),
        },
        rotation: (index * Math.PI) / 4,
        opacity: 1 - particleProgress,
        color: this.config.color || '#ffffff',
        shader: 'additive',
      });
    });
  }

  private createImpactParticles(): void {
    if (!this.config.target) {
      return;
    }

    // Create particles in a circular pattern
    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const distance = (this.config.impactSize || 20) / 2;

      this.impactParticles.push({
        x: this.config.target.x + Math.cos(angle) * distance,
        y: this.config.target.y + Math.sin(angle) * distance,
      });
    }
  }
}
