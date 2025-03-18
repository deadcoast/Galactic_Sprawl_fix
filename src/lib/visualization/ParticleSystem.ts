import { Position } from '../../types/core/Position';

/**
 * Particle animation easing functions
 */
export enum EasingType {
  LINEAR = 'linear',
  EASE_IN = 'easeIn',
  EASE_OUT = 'easeOut',
  EASE_IN_OUT = 'easeInOut',
  BOUNCE = 'bounce',
  ELASTIC = 'elastic',
  BACK = 'back',
}

/**
 * Easing function type
 */
export type EasingFunction = (progress: number) => number;

/**
 * Path type for particle movement
 */
export enum ParticlePath {
  LINEAR = 'linear',
  CURVED = 'curved',
  SPIRAL = 'spiral',
  BEZIER = 'bezier',
  WAVE = 'wave',
  RANDOM = 'random',
}

/**
 * Particle blend mode
 */
export enum ParticleBlendMode {
  NORMAL = 'normal',
  ADD = 'add',
  MULTIPLY = 'multiply',
  SCREEN = 'screen',
}

/**
 * Basic particle properties
 */
export interface Particle {
  id: string;
  position: Position;
  prevPosition?: Position;
  targetPosition?: Position;
  startPosition?: Position;
  velocity: { x: number; y: number };
  acceleration: { x: number; y: number };
  size: number;
  startSize?: number;
  targetSize?: number;
  color: string;
  startColor?: string;
  targetColor?: string;
  opacity: number;
  startOpacity?: number;
  targetOpacity?: number;
  rotation: number;
  startRotation?: number;
  targetRotation?: number;
  life: number;
  maxLife: number;
  active: boolean;
  path?: ParticlePath;
  pathParams?: Record<string, number>;
  easing?: EasingFunction | EasingType;
  blendMode?: ParticleBlendMode;
  group?: string;
  data?: Record<string, unknown>;
}

/**
 * Particle emitter configuration
 */
export interface ParticleEmitterConfig {
  position: Position;
  rate: number;
  burstCount?: number;
  emitRadius?: number;
  direction?: number; // Angle in radians
  spread?: number; // Angle in radians
  minLife?: number;
  maxLife?: number;
  minSize?: number;
  maxSize?: number;
  minVelocity?: number;
  maxVelocity?: number;
  colors?: string[];
  minOpacity?: number;
  maxOpacity?: number;
  gravity?: { x: number; y: number };
  path?: ParticlePath;
  pathParams?: Record<string, number>;
  easing?: EasingFunction | EasingType;
  blendMode?: ParticleBlendMode;
  group?: string;
}

/**
 * Transition configuration for moving particles between data states
 */
export interface ParticleTransitionConfig {
  /**
   * Optional transition ID
   */
  id?: string;

  /**
   * Source data points with positions
   */
  sourceData?: DataPoint[];

  /**
   * Target data points with positions
   */
  targetData?: DataPoint[];

  /**
   * Transition duration in milliseconds
   */
  duration: number;

  /**
   * Easing function or type for the transition
   */
  easing?: EasingFunction | EasingType;

  /**
   * Path type for particle movement
   */
  path?: ParticlePath;

  /**
   * Additional path parameters
   */
  pathParams?: Record<string, number>;

  /**
   * Delay between individual particle transitions in milliseconds
   */
  staggerDelay?: number;

  /**
   * Whether to transition colors
   */
  transitionColors?: boolean;

  /**
   * Whether to transition sizes
   */
  transitionSizes?: boolean;

  /**
   * Whether to transition opacity
   */
  transitionOpacity?: boolean;

  /**
   * Whether to reverse the transition
   */
  reverse?: boolean;

  /**
   * Callback when transition is complete
   */
  onComplete?: () => void;

  /**
   * Callback when transition is updated
   */
  onUpdate?: (progress: number) => void;
}

/**
 * Data point for visualization
 */
export interface DataPoint {
  id?: string;
  x: number;
  y: number;
  value: number;
  size?: number;
  color?: string;
  opacity?: number;
  group?: string;
  active?: boolean;
  [key: string]: unknown;
}

/**
 * Manages a particle system for animated data transitions
 */
export class ParticleSystem {
  private particles: Map<string, Particle> = new Map();
  private emitters: Map<string, ParticleEmitterConfig> = new Map();
  private lastFrameTime: number = 0;
  private animationFrame: number | null = null;
  private transitionConfigs: Map<string, ParticleTransitionConfig> = new Map();
  private transitionTimers: Map<string, number> = new Map();
  private transitionProgress: Map<string, number> = new Map();

  /**
   * Create a new particle system
   */
  constructor() {
    this.lastFrameTime = performance.now();
  }

  /**
   * Add a particle to the system
   */
  public addParticle(particle: Omit<Particle, 'id'>): string {
    const id = `particle-${Math.random().toString(36).substring(2, 9)}`;
    this.particles.set(id, {
      ...particle,
      id,
    });
    return id;
  }

  /**
   * Remove a particle from the system
   */
  public removeParticle(id: string): boolean {
    return this.particles.delete(id);
  }

  /**
   * Add a particle emitter
   */
  public addEmitter(config: ParticleEmitterConfig): string {
    const id = `emitter-${Math.random().toString(36).substring(2, 9)}`;
    this.emitters.set(id, config);
    return id;
  }

  /**
   * Remove a particle emitter
   */
  public removeEmitter(id: string): boolean {
    return this.emitters.delete(id);
  }

  /**
   * Start the animation loop
   */
  public start(): void {
    if (this.animationFrame !== null) {
      return;
    }

    this.lastFrameTime = performance.now();
    this.animationLoop();
  }

  /**
   * Stop the animation loop
   */
  public stop(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  /**
   * Clear all particles
   */
  public clear(): void {
    this.particles.clear();
  }

  /**
   * Set up a transition between data states
   */
  public setupTransition(id: string, config: ParticleTransitionConfig): void {
    this.transitionConfigs.set(id, config);
    this.transitionProgress.set(id, 0);

    // Create particles for transition if needed
    if (config.sourceData && config.targetData) {
      this.createParticlesForTransition(id, config);
    }
  }

  /**
   * Start a transition between data states
   */
  public startTransition(id: string): void {
    const config = this.transitionConfigs.get(id);
    if (!config) {
      console.warn(`No transition config found with id: ${id}`);
      return;
    }

    // Start the transition timer
    const startTime = performance.now();
    this.transitionTimers.set(id, startTime);

    // Ensure animation is running
    this.start();
  }

  /**
   * Stop a transition
   */
  public stopTransition(id: string): void {
    this.transitionTimers.delete(id);
  }

  /**
   * Create particles for a data transition
   */
  private createParticlesForTransition(
    transitionId: string,
    config: ParticleTransitionConfig
  ): void {
    if (!config.sourceData || !config.targetData) {
      return;
    }

    // Clear any existing particles for this transition
    this.particles.forEach((particle, id) => {
      if (particle.group === transitionId) {
        this.particles.delete(id);
      }
    });

    // Determine how to map source to target
    const isEqualSize = config.sourceData.length === config.targetData.length;

    if (isEqualSize) {
      // Direct mapping when source and target have same number of points
      config.sourceData.forEach((sourcePoint, index) => {
        const targetPoint = config.targetData![index];
        this.createTransitionParticle(sourcePoint, targetPoint, transitionId, config);
      });
    } else if (config.sourceData.length < config.targetData.length) {
      // Source has fewer points, need to generate additional particles
      config.sourceData.forEach((sourcePoint, index) => {
        const targetPoint = config.targetData![index % config.targetData!.length];
        this.createTransitionParticle(sourcePoint, targetPoint, transitionId, config);
      });

      // Create additional particles starting from appropriate source points
      for (let i = config.sourceData.length; i < config.targetData.length; i++) {
        const sourceIndex = i % config.sourceData.length;
        const sourcePoint = config.sourceData[sourceIndex];
        const targetPoint = config.targetData[i];
        this.createTransitionParticle(sourcePoint, targetPoint, transitionId, config);
      }
    } else {
      // Target has fewer points, some source particles will converge
      config.sourceData.forEach((sourcePoint, index) => {
        const targetPoint = config.targetData![index % config.targetData!.length];
        this.createTransitionParticle(sourcePoint, targetPoint, transitionId, config);
      });
    }
  }

  /**
   * Create a single transition particle
   */
  private createTransitionParticle(
    sourcePoint: DataPoint,
    targetPoint: DataPoint,
    transitionId: string,
    config: ParticleTransitionConfig
  ): string {
    const sourceColor = sourcePoint.color || '#ffffff';
    const targetColor = targetPoint.color || '#ffffff';
    const sourceSize = sourcePoint.size || 10;
    const targetSize = targetPoint.size || 10;
    const sourceOpacity = sourcePoint.opacity !== undefined ? sourcePoint.opacity : 1;
    const targetOpacity = targetPoint.opacity !== undefined ? targetPoint.opacity : 1;

    return this.addParticle({
      position: { x: sourcePoint.x, y: sourcePoint.y },
      startPosition: { x: sourcePoint.x, y: sourcePoint.y },
      targetPosition: { x: targetPoint.x, y: targetPoint.y },
      velocity: { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      size: sourceSize,
      startSize: sourceSize,
      targetSize: targetSize,
      color: sourceColor,
      startColor: sourceColor,
      targetColor: targetColor,
      opacity: sourceOpacity,
      startOpacity: sourceOpacity,
      targetOpacity: targetOpacity,
      rotation: 0,
      life: 1,
      maxLife: 1,
      active: true,
      path: config.path || ParticlePath.LINEAR,
      easing: config.easing || this.getEasingFunction(EasingType.EASE_IN_OUT),
      pathParams: config.pathParams,
      group: transitionId,
      data: {
        sourcePoint,
        targetPoint,
        startTime: performance.now(),
        staggerDelay: config.staggerDelay ?? 0,
        transitionStarted: false,
      },
    });
  }

  /**
   * Main animation loop
   */
  private animationLoop(): void {
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastFrameTime) / 1000; // in seconds
    this.lastFrameTime = currentTime;

    // Update transitions
    this.updateTransitions(currentTime);

    // Update emitters
    this.updateEmitters(deltaTime);

    // Update particles
    this.updateParticles(deltaTime);

    // Schedule next frame
    this.animationFrame = requestAnimationFrame(() => this.animationLoop());
  }

  /**
   * Update particle transitions
   */
  private updateTransitions(currentTime: number): void {
    this.transitionTimers.forEach((startTime, id) => {
      const config = this.transitionConfigs.get(id);
      if (!config) return;

      // Calculate progress
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(1, elapsedTime / config.duration);

      // Store progress
      this.transitionProgress.set(id, progress);

      // Call update callback
      config.onUpdate?.(progress);

      // Check if transition is complete
      if (progress >= 1) {
        this.transitionTimers.delete(id);
        config.onComplete?.();
      }
    });
  }

  /**
   * Update particle emitters
   */
  private updateEmitters(deltaTime: number): void {
    this.emitters.forEach((config, id) => {
      // Calculate number of particles to emit
      const emitCount = config.burstCount || Math.floor(config.rate * deltaTime);

      // Emit particles
      for (let i = 0; i < emitCount; i++) {
        this.emitParticle(config);
      }
    });
  }

  /**
   * Emit a single particle from an emitter
   */
  private emitParticle(config: ParticleEmitterConfig): string {
    // Randomize position within emit radius
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * (config.emitRadius ?? 0);
    const position = {
      x: config.position.x + Math.cos(angle) * radius,
      y: config.position.y + Math.sin(angle) * radius,
    };

    // Randomize velocity
    const direction = (config.direction ?? 0) + (Math.random() - 0.5) * (config.spread ?? 0);
    const speed =
      config.minVelocity !== undefined && config.maxVelocity !== undefined
        ? config.minVelocity + Math.random() * (config.maxVelocity - config.minVelocity)
        : 50;

    const velocity = {
      x: Math.cos(direction) * speed,
      y: Math.sin(direction) * speed,
    };

    // Randomize life
    const life =
      config.minLife !== undefined && config.maxLife !== undefined
        ? config.minLife + Math.random() * (config.maxLife - config.minLife)
        : 1;

    // Randomize size
    const size =
      config.minSize !== undefined && config.maxSize !== undefined
        ? config.minSize + Math.random() * (config.maxSize - config.minSize)
        : 10;

    // Randomize color
    const color =
      config.colors && config.colors.length > 0
        ? config.colors[Math.floor(Math.random() * config.colors.length)]
        : '#ffffff';

    // Randomize opacity
    const opacity =
      config.minOpacity !== undefined && config.maxOpacity !== undefined
        ? config.minOpacity + Math.random() * (config.maxOpacity - config.minOpacity)
        : 1;

    // Create particle
    return this.addParticle({
      position,
      velocity,
      acceleration: config.gravity || { x: 0, y: 0 },
      size,
      color,
      opacity,
      rotation: Math.random() * Math.PI * 2,
      life,
      maxLife: life,
      active: true,
      path: config.path,
      pathParams: config.pathParams,
      easing: config.easing,
      blendMode: config.blendMode,
      group: config.group,
    });
  }

  /**
   * Update all particles
   */
  private updateParticles(deltaTime: number): void {
    this.particles.forEach((particle, id) => {
      if (!particle.active) return;

      // Handle transition particles
      if (particle.group && this.transitionTimers.has(particle.group)) {
        this.updateTransitionParticle(particle, this.transitionProgress.get(particle.group) ?? 0);
      } else {
        // Handle regular particles
        this.updateRegularParticle(particle, deltaTime);
      }

      // Remove dead particles
      if (particle.life <= 0) {
        this.particles.delete(id);
      }
    });
  }

  /**
   * Update a transition particle
   */
  private updateTransitionParticle(particle: Particle, transitionProgress: number): void {
    if (!particle.startPosition || !particle.targetPosition) return;

    const data = particle.data as Record<string, unknown>;
    const staggerDelay = (data.staggerDelay as number) ?? 0;

    // Handle staggered start
    if (!data.transitionStarted) {
      const elapsedSinceStart = performance.now() - (data.startTime as number);
      if (elapsedSinceStart < staggerDelay) {
        return;
      }
      data.transitionStarted = true;
    }

    // Apply easing
    const easedProgress = this.applyEasing(
      transitionProgress,
      particle.easing || this.getEasingFunction(EasingType.LINEAR)
    );

    // Update position based on path type
    this.updateParticlePosition(particle, easedProgress);

    // Update size
    if (particle.startSize !== undefined && particle.targetSize !== undefined) {
      particle.size =
        particle.startSize + (particle.targetSize - particle.startSize) * easedProgress;
    }

    // Update opacity
    if (particle.startOpacity !== undefined && particle.targetOpacity !== undefined) {
      particle.opacity =
        particle.startOpacity + (particle.targetOpacity - particle.startOpacity) * easedProgress;
    }

    // Update color
    if (particle.startColor && particle.targetColor) {
      particle.color = this.interpolateColor(
        particle.startColor,
        particle.targetColor,
        easedProgress
      );
    }

    // Store previous position for trail effects
    particle.prevPosition = { ...particle.position };
  }

  /**
   * Update a regular particle
   */
  private updateRegularParticle(particle: Particle, deltaTime: number): void {
    // Update velocity
    particle.velocity.x += particle.acceleration.x * deltaTime;
    particle.velocity.y += particle.acceleration.y * deltaTime;

    // Store previous position for trail effects
    particle.prevPosition = { ...particle.position };

    // Update position
    particle.position.x += particle.velocity.x * deltaTime;
    particle.position.y += particle.velocity.y * deltaTime;

    // Update life
    particle.life -= deltaTime;

    // Update opacity based on life
    const lifeRatio = Math.max(0, particle.life / particle.maxLife);
    particle.opacity = lifeRatio;
  }

  /**
   * Update particle position based on path type
   */
  private updateParticlePosition(particle: Particle, progress: number): void {
    const start = particle.startPosition || { x: 0, y: 0 };
    const end = particle.targetPosition || { x: 0, y: 0 };
    let position: Position;

    switch (particle.path || ParticlePath.LINEAR) {
      case ParticlePath.CURVED:
        position = this.calculateCurvedPath(start, end, progress);
        break;

      case ParticlePath.SPIRAL:
        position = this.calculateSpiralPath(start, end, progress, particle.pathParams?.turns);
        break;

      case ParticlePath.BEZIER:
        position = this.calculateBezierPath(start, end, progress);
        break;

      case ParticlePath.WAVE:
        position = this.calculateWavePath(
          start,
          end,
          progress,
          particle.pathParams?.amplitude,
          particle.pathParams?.frequency
        );
        break;

      case ParticlePath.RANDOM:
        position = this.calculateRandomPath(
          start,
          end,
          progress,
          particle,
          particle.pathParams?.jitter
        );
        break;

      case ParticlePath.LINEAR:
      default:
        position = {
          x: start.x + (end.x - start.x) * progress,
          y: start.y + (end.y - start.y) * progress,
        };
    }

    particle.position = position;
  }

  /**
   * Calculate curved path position
   */
  private calculateCurvedPath(start: Position, end: Position, progress: number): Position {
    const controlX = (start.x + end.x) / 2;
    const controlY = Math.min(start.y, end.y) - Math.abs(end.x - start.x) * 0.2;

    const t = progress;
    const invT = 1 - t;

    return {
      x: invT * invT * start.x + 2 * invT * t * controlX + t * t * end.x,
      y: invT * invT * start.y + 2 * invT * t * controlY + t * t * end.y,
    };
  }

  /**
   * Calculate spiral path position
   */
  private calculateSpiralPath(
    start: Position,
    end: Position,
    progress: number,
    turns = 2
  ): Position {
    const angle = progress * turns * Math.PI * 2;
    const radius =
      (1 - progress) * Math.min(Math.abs(end.x - start.x), Math.abs(end.y - start.y)) * 0.2;

    return {
      x: start.x + (end.x - start.x) * progress + Math.cos(angle) * radius,
      y: start.y + (end.y - start.y) * progress + Math.sin(angle) * radius,
    };
  }

  /**
   * Calculate bezier path position
   */
  private calculateBezierPath(start: Position, end: Position, progress: number): Position {
    const cp1x = start.x + (end.x - start.x) * 0.3;
    const cp1y = start.y - Math.abs(end.y - start.y) * 0.3;
    const cp2x = start.x + (end.x - start.x) * 0.7;
    const cp2y = end.y + Math.abs(end.y - start.y) * 0.3;

    const t1 = progress;
    const t2 = t1 * t1;
    const t3 = t2 * t1;
    const invT1 = 1 - t1;
    const invT2 = invT1 * invT1;
    const invT3 = invT2 * invT1;

    return {
      x: invT3 * start.x + 3 * invT2 * t1 * cp1x + 3 * invT1 * t2 * cp2x + t3 * end.x,
      y: invT3 * start.y + 3 * invT2 * t1 * cp1y + 3 * invT1 * t2 * cp2y + t3 * end.y,
    };
  }

  /**
   * Calculate wave path position
   */
  private calculateWavePath(
    start: Position,
    end: Position,
    progress: number,
    amplitude?: number,
    frequency = 3
  ): Position {
    const actualAmplitude =
      amplitude || Math.min(Math.abs(end.x - start.x), Math.abs(end.y - start.y)) * 0.1;
    const waviness = Math.sin(progress * Math.PI * frequency) * actualAmplitude;

    // Calculate the normal vector to the path
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const normalX = -dy / length;
    const normalY = dx / length;

    return {
      x: start.x + (end.x - start.x) * progress + normalX * waviness,
      y: start.y + (end.y - start.y) * progress + normalY * waviness,
    };
  }

  /**
   * Calculate random path position
   */
  private calculateRandomPath(
    start: Position,
    end: Position,
    progress: number,
    particle: Particle,
    jitter = 0.1
  ): Position {
    // Get or create random seeds
    let seeds = (particle.data?.randomSeeds as number[]) ?? [];
    if (!seeds.length) {
      seeds = Array.from({ length: 10 }, () => Math.random());
      (particle.data as Record<string, unknown>).randomSeeds = seeds;
    }

    const jitterSize = Math.min(Math.abs(end.x - start.x), Math.abs(end.y - start.y)) * jitter;

    // Use seeds and progress to generate controlled randomness
    const index = Math.floor(progress * 10);
    const subProgress = (progress * 10) % 1;
    const seed1 = seeds[index % seeds.length];
    const seed2 = seeds[(index + 1) % seeds.length];

    const randomX =
      (seed1 * 2 - 1) * jitterSize * (1 - subProgress) + (seed2 * 2 - 1) * jitterSize * subProgress;
    const randomY =
      (seeds[(index + 2) % seeds.length] * 2 - 1) * jitterSize * (1 - subProgress) +
      (seeds[(index + 3) % seeds.length] * 2 - 1) * jitterSize * subProgress;

    return {
      x: start.x + (end.x - start.x) * progress + randomX,
      y: start.y + (end.y - start.y) * progress + randomY,
    };
  }

  /**
   * Bounce easing function
   */
  private bounceEasing(t: number): number {
    const a = 7.5625;
    const b = 2.75;

    if (t < 1 / b) {
      return a * t * t;
    } else if (t < 2 / b) {
      t -= 1.5 / b;
      return a * t * t + 0.75;
    } else if (t < 2.5 / b) {
      t -= 2.25 / b;
      return a * t * t + 0.9375;
    } else {
      t -= 2.625 / b;
      return a * t * t + 0.984375;
    }
  }

  /**
   * Elastic easing function
   */
  private elasticEasing(t: number): number {
    return t === 0
      ? 0
      : t === 1
        ? 1
        : Math.pow(2, -10 * t) * Math.sin(((t * 10 - 0.75) * Math.PI) / 1.5) + 1;
  }

  /**
   * Back easing function
   */
  private backEasing(t: number): number {
    const overshoot = 1.70158;
    return t * t * ((overshoot + 1) * t - overshoot);
  }

  /**
   * Get easing function by type
   */
  private getEasingFunction(type: EasingType): EasingFunction {
    switch (type) {
      case EasingType.LINEAR:
        return (t: number) => t;

      case EasingType.EASE_IN:
        return (t: number) => t * t;

      case EasingType.EASE_OUT:
        return (t: number) => t * (2 - t);

      case EasingType.EASE_IN_OUT:
        return (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

      case EasingType.BOUNCE:
        return this.bounceEasing.bind(this);

      case EasingType.ELASTIC:
        return this.elasticEasing.bind(this);

      case EasingType.BACK:
        return this.backEasing.bind(this);

      default:
        return (t: number) => t;
    }
  }

  /**
   * Apply easing function to progress
   */
  private applyEasing(progress: number, easing: EasingFunction | EasingType): number {
    if (typeof easing === 'function') {
      return easing(progress);
    }
    return this.getEasingFunction(easing)(progress);
  }

  /**
   * Interpolate between two colors
   */
  private interpolateColor(color1: string, color2: string, progress: number): string {
    // Parse colors
    const parseColor = (color: string): [number, number, number] => {
      // Handle hex colors
      if (color.startsWith('#')) {
        const hex = color.substring(1);
        if (hex.length === 3) {
          return [
            parseInt(hex[0] + hex[0], 16),
            parseInt(hex[1] + hex[1], 16),
            parseInt(hex[2] + hex[2], 16),
          ];
        } else {
          return [
            parseInt(hex.substring(0, 2), 16),
            parseInt(hex.substring(2, 4), 16),
            parseInt(hex.substring(4, 6), 16),
          ];
        }
      }

      // Handle rgb colors
      if (color.startsWith('rgb')) {
        const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
          return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
        }
      }

      // Default
      return [255, 255, 255];
    };

    const [r1, g1, b1] = parseColor(color1);
    const [r2, g2, b2] = parseColor(color2);

    // Interpolate
    const r = Math.round(r1 + (r2 - r1) * progress);
    const g = Math.round(g1 + (g2 - g1) * progress);
    const b = Math.round(b1 + (b2 - b1) * progress);

    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  /**
   * Get all particles
   */
  public getParticles(): Particle[] {
    return Array.from(this.particles.values());
  }

  /**
   * Get particles by group
   */
  public getParticlesByGroup(group: string): Particle[] {
    return Array.from(this.particles.values()).filter(p => p.group === group);
  }

  /**
   * Check if a transition is running
   */
  public isTransitionRunning(id: string): boolean {
    return this.transitionTimers.has(id);
  }

  /**
   * Get transition progress
   */
  public getTransitionProgress(id: string): number {
    return this.transitionProgress.get(id) ?? 0;
  }

  /**
   * Clear everything
   */
  public dispose(): void {
    this.stop();
    this.particles.clear();
    this.emitters.clear();
    this.transitionConfigs.clear();
    this.transitionTimers.clear();
    this.transitionProgress.clear();
  }
}
