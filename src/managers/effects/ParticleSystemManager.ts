import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from 'three';
import { EntityPool, PooledEntity } from '../../lib/optimization/EntityPool';
import { Position } from '../../types/core/GameTypes';

interface Particle extends PooledEntity {
  id: string;
  active: boolean;
  position: Position;
  velocity: Position;
  acceleration: Position;
  size: number;
  color: string;
  opacity: number;
  life: number;
  maxLife: number;
  reset(): void;
}

export interface ParticleSystemConfig {
  maxParticles: number;
  spawnRate: number;
  position: Position;
  spread: number;
  initialVelocity: {
    min: Position;
    max: Position;
  };
  acceleration: Position;
  size: {
    min: number;
    max: number;
  };
  life: {
    min: number;
    max: number;
  };
  color: string | string[];
  blendMode?: 'normal' | 'additive';
  quality: 'low' | 'medium' | 'high';
}

export class ParticleSystemManager {
  private static instance: ParticleSystemManager;
  private particlePools: Map<string, Map<number, EntityPool<Particle>>>;
  private systems: Map<string, ParticleSystem>;
  private renderer: WebGLRenderer;
  private scene: Scene;
  private camera: PerspectiveCamera;
  private frameCount: number = 0;
  private readonly FRAME_SKIP_THRESHOLD = 2;

  private constructor() {
    this.particlePools = new Map();
    this.systems = new Map();
    this.renderer = new WebGLRenderer({ antialias: true });
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.z = 5;
    this.initializeRenderer();

    // Start cleanup interval
    setInterval(() => this.cleanupInactiveSystems(), 5000);
  }

  public static getInstance(): ParticleSystemManager {
    if (!ParticleSystemManager.instance) {
      ParticleSystemManager.instance = new ParticleSystemManager();
    }
    return ParticleSystemManager.instance;
  }

  private initializeRenderer(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
  }

  private getPoolSizeForQuality(quality: 'low' | 'medium' | 'high'): number {
    switch (quality) {
      case 'low':
        return 100;
      case 'medium':
        return 500;
      case 'high':
        return 1000;
      default:
        return 500;
    }
  }

  private getOrCreatePool(
    systemId: string,
    particleSize: number,
    quality: 'low' | 'medium' | 'high'
  ): EntityPool<Particle> {
    if (!this.particlePools.has(systemId)) {
      this.particlePools.set(systemId, new Map());
    }

    const sizePools = this.particlePools.get(systemId)!;
    if (!sizePools.has(particleSize)) {
      const poolSize = this.getPoolSizeForQuality(quality);
      sizePools.set(particleSize, new EntityPool<Particle>(() => this.createParticle(), poolSize));
    }

    return sizePools.get(particleSize)!;
  }

  private createParticle(): Particle {
    return {
      id: `particle-${Date.now()}-${Math.random()}`,
      active: false,
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      size: 1,
      color: '#ffffff',
      opacity: 1,
      life: 1,
      maxLife: 1,
      reset(): void {
        this.active = false;
        this.position = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.acceleration = { x: 0, y: 0 };
        this.opacity = 1;
        this.life = this.maxLife;
      },
    };
  }

  public createParticleSystem(id: string, config: ParticleSystemConfig): void {
    const pool = this.getOrCreatePool(id, config.size.max, config.quality);
    const geometry = new BufferGeometry();
    const material = this.createParticleMaterial(config);
    const points = new Points(geometry, material);

    const system = new ParticleSystem(pool, config, points, this.scene);
    this.systems.set(id, system);
    this.scene.add(points);
  }

  private createParticleMaterial(config: ParticleSystemConfig): ShaderMaterial {
    return new ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new Color(config.color as string) },
      },
      vertexShader: `
        attribute float size;
        attribute float opacity;
        attribute vec3 color;
        varying float vOpacity;
        varying vec3 vColor;
        
        void main() {
          vOpacity = opacity;
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vOpacity;
        varying vec3 vColor;
        
        void main() {
          vec2 xy = gl_PointCoord.xy - vec2(0.5);
          float r = length(xy);
          if (r > 0.5) discard;
          
          float glow = exp(-r * 3.0);
          gl_FragColor = vec4(vColor, vOpacity * glow);
        }
      `,
      transparent: true,
      blending: config.blendMode === 'additive' ? AdditiveBlending : undefined,
      depthWrite: false,
    });
  }

  public update(deltaTime: number): void {
    this.frameCount++;

    // Skip frames for low priority systems when under performance pressure
    const shouldUpdate = this.frameCount % this.FRAME_SKIP_THRESHOLD === 0;
    if (!shouldUpdate) {
      return;
    }

    this.systems.forEach(system => system.update(deltaTime));
    this.renderer.render(this.scene, this.camera);
  }

  private cleanupInactiveSystems(): void {
    const now = Date.now();
    this.systems.forEach((system, id) => {
      if (!system.hasActiveParticles() && now - system.getLastUpdateTime() > 5000) {
        this.removeSystem(id);
      }
    });
  }

  public removeSystem(id: string): void {
    const system = this.systems.get(id);
    if (system) {
      system.cleanup();
      this.systems.delete(id);

      // Clean up size-based pools
      const sizePools = this.particlePools.get(id);
      if (sizePools) {
        sizePools.forEach(pool => pool.clear());
        this.particlePools.delete(id);
      }
    }
  }

  public cleanup(): void {
    this.systems.forEach(system => system.cleanup());
    this.systems.clear();
    this.particlePools.forEach(sizePools => {
      sizePools.forEach(pool => pool.clear());
    });
    this.particlePools.clear();
    this.renderer.dispose();
    this.scene.clear();
  }
}

class ParticleSystem {
  private pool: EntityPool<Particle>;
  private config: ParticleSystemConfig;
  private points: Points;
  private scene: Scene;
  private particles: Set<Particle>;
  private lastSpawnTime: number;
  private lastUpdateTime: number;

  constructor(
    pool: EntityPool<Particle>,
    config: ParticleSystemConfig,
    points: Points,
    scene: Scene
  ) {
    this.pool = pool;
    this.config = config;
    this.points = points;
    this.scene = scene;
    this.particles = new Set();
    this.lastSpawnTime = 0;
    this.lastUpdateTime = Date.now();
  }

  public update(deltaTime: number): void {
    this.lastUpdateTime = Date.now();
    this.spawnParticles(deltaTime);
    this.updateParticles(deltaTime);
    this.updateGeometry();
  }

  private spawnParticles(_deltaTime: number): void {
    const now = performance.now();
    const spawnInterval = 1000 / this.config.spawnRate;

    while (
      now - this.lastSpawnTime >= spawnInterval &&
      this.particles.size < this.config.maxParticles
    ) {
      this.spawnParticle();
      this.lastSpawnTime += spawnInterval;
    }
  }

  private spawnParticle(): void {
    const particle = this.pool.acquire();
    if (!particle) {
      return;
    }

    particle.active = true;
    particle.position = { ...this.config.position };
    particle.velocity = {
      x:
        this.config.initialVelocity.min.x +
        Math.random() * (this.config.initialVelocity.max.x - this.config.initialVelocity.min.x),
      y:
        this.config.initialVelocity.min.y +
        Math.random() * (this.config.initialVelocity.max.y - this.config.initialVelocity.min.y),
    };
    particle.acceleration = { ...this.config.acceleration };
    particle.size =
      this.config.size.min + Math.random() * (this.config.size.max - this.config.size.min);
    particle.life =
      this.config.life.min + Math.random() * (this.config.life.max - this.config.life.min);
    particle.maxLife = particle.life;

    this.particles.add(particle);
  }

  private updateParticles(deltaTime: number): void {
    this.particles.forEach(particle => {
      particle.life -= deltaTime;
      if (particle.life <= 0) {
        this.particles.delete(particle);
        this.pool.release(particle);
        return;
      }

      particle.velocity.x += particle.acceleration.x * deltaTime;
      particle.velocity.y += particle.acceleration.y * deltaTime;
      particle.position.x += particle.velocity.x * deltaTime;
      particle.position.y += particle.velocity.y * deltaTime;
      particle.opacity = particle.life / particle.maxLife;
    });
  }

  private updateGeometry(): void {
    const positions = new Float32Array(this.particles.size * 3);
    const sizes = new Float32Array(this.particles.size);
    const opacities = new Float32Array(this.particles.size);
    const colors = new Float32Array(this.particles.size * 3);

    let i = 0;
    this.particles.forEach(particle => {
      positions[i * 3] = particle.position.x;
      positions[i * 3 + 1] = particle.position.y;
      positions[i * 3 + 2] = 0;

      sizes[i] = particle.size;
      opacities[i] = particle.opacity;

      const color = new Color(particle.color);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      i++;
    });

    const geometry = this.points.geometry as BufferGeometry;
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    geometry.setAttribute('size', new BufferAttribute(sizes, 1));
    geometry.setAttribute('opacity', new BufferAttribute(opacities, 1));
    geometry.setAttribute('color', new BufferAttribute(colors, 3));
  }

  public hasActiveParticles(): boolean {
    return this.particles.size > 0;
  }

  public getLastUpdateTime(): number {
    return this.lastUpdateTime;
  }

  public cleanup(): void {
    this.particles.forEach(particle => {
      this.pool.release(particle);
    });
    this.particles.clear();
    this.scene.remove(this.points);
    this.points.geometry.dispose();
    (this.points.material as ShaderMaterial).dispose();
  }
}

// Export singleton instance
export const particleSystemManager = ParticleSystemManager.getInstance();
