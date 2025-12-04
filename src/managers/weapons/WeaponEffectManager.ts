import { TypedEventEmitter } from '../../lib/events/EventEmitter';
import { Position } from '../../types/core/GameTypes';
import { WeaponCategory, WeaponVariant } from '../../types/weapons/WeaponTypes';
import { effectLifecycleManager } from '../effects/EffectLifecycleManager';
import { ParticleSystemConfig, particleSystemManager } from '../effects/ParticleSystemManager';

interface WeaponEffectEvents {
  effectStarted: { weaponId: string; effectType: string };
  effectEnded: { weaponId: string; effectType: string };
  qualityChanged: { weaponId: string; quality: 'low' | 'medium' | 'high' };
  [key: string]: unknown;
}

interface WeaponEffectConfig {
  duration: number;
  particleCount: number;
  color: string;
  size: number;
  spread: number;
  speed: number;
  pattern: 'beam' | 'projectile' | 'explosion' | 'continuous';
  quality?: 'low' | 'medium' | 'high';
}

export class WeaponEffectManager extends TypedEventEmitter<WeaponEffectEvents> {
  private static instance: WeaponEffectManager;
  private activeEffects: Map<string, Set<string>>;
  private effectConfigs: Map<WeaponCategory, Map<WeaponVariant, WeaponEffectConfig>>;
  private qualitySettings: Map<string, 'low' | 'medium' | 'high'>;

  private constructor() {
    super();
    this.activeEffects = new Map();
    this.effectConfigs = new Map();
    this.qualitySettings = new Map();
    this.initializeEffectConfigs();
  }

  public static getInstance(): WeaponEffectManager {
    if (!WeaponEffectManager.instance) {
      WeaponEffectManager.instance = new WeaponEffectManager();
    }
    return WeaponEffectManager.instance;
  }

  private initializeEffectConfigs(): void {
    // Machine Gun effects
    this.setEffectConfig('machineGun', 'basic', {
      duration: 200,
      particleCount: 10,
      color: '#ffaa00',
      size: 2,
      spread: 0.1,
      speed: 2,
      pattern: 'projectile',
    });

    // Plasma Cannon effects
    this.setEffectConfig('plasmaCannon', 'basic', {
      duration: 1000,
      particleCount: 30,
      color: '#00ffff',
      size: 4,
      spread: 0.2,
      speed: 1,
      pattern: 'beam',
    });

    // Beam Weapon effects
    this.setEffectConfig('beamWeapon', 'basic', {
      duration: 2000,
      particleCount: 50,
      color: '#ff00ff',
      size: 3,
      spread: 0.05,
      speed: 3,
      pattern: 'continuous',
    });
  }

  private setEffectConfig(
    category: WeaponCategory,
    variant: WeaponVariant,
    config: WeaponEffectConfig
  ): void {
    if (!this.effectConfigs.has(category)) {
      this.effectConfigs.set(category, new Map());
    }
    this.effectConfigs.get(category)!.set(variant, config);
  }

  public createWeaponEffect(
    weaponId: string,
    category: WeaponCategory,
    variant: WeaponVariant,
    position: Position,
    direction: number
  ): string[] {
    const config = this.effectConfigs.get(category)?.get(variant);
    if (!config) {
      return [];
    }

    const quality = this.qualitySettings.get(weaponId) || 'medium';

    const systemIds: string[] = [];

    // Create main weapon effect
    const mainEffectId = this.createMainEffect(weaponId, position, direction, config, quality);
    if (mainEffectId) {
      systemIds.push(mainEffectId);
    }

    // Create additional effects based on pattern
    switch (config.pattern) {
      case 'beam':
        systemIds.push(...this.createBeamEffect(position, direction, config, quality));
        break;
      case 'explosion':
        systemIds.push(...this.createExplosionEffect(position, config, quality));
        break;
      case 'continuous':
        systemIds.push(...this.createContinuousEffect(position, direction, config, quality));
        break;
    }

    // Register with effect lifecycle manager
    const effectId = effectLifecycleManager.registerEffect(
      `weapon-${category}-${variant}`,
      position,
      config.duration,
      systemIds,
      () => this.cleanupWeaponEffect(weaponId, systemIds)
    );

    // Track active effects
    if (!this.activeEffects.has(weaponId)) {
      this.activeEffects.set(weaponId, new Set());
    }
    this.activeEffects.get(weaponId)!.add(effectId);

    this.emit('effectStarted', { weaponId, effectType: `${category}-${variant}` });
    return systemIds;
  }

  /**
   * Adjusts particle count based on quality setting
   * Currently unused but kept for future implementation of quality-based particle effects
   */
  private _getQualityAdjustedParticleCount(
    baseCount: number,
    quality: 'low' | 'medium' | 'high'
  ): number {
    switch (quality) {
      case 'low':
        return Math.floor(baseCount * 0.5);
      case 'high':
        return Math.floor(baseCount * 1.5);
      default:
        return baseCount;
    }
  }

  private createMainEffect(
    weaponId: string,
    position: Position,
    direction: number,
    config: WeaponEffectConfig,
    quality: 'low' | 'medium' | 'high'
  ): string {
    const adjustedParticleCount = this._getQualityAdjustedParticleCount(
      Math.max(5, config.particleCount * 0.2),
      quality
    );

    const systemId = `${weaponId}-main-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const particleConfig: ParticleSystemConfig = {
      maxParticles: adjustedParticleCount,
      spawnRate: adjustedParticleCount,
      position: position,
      spread: config.spread * 10,
      initialVelocity: {
        min: {
          x: Math.cos(direction) * config.speed * 80,
          y: Math.sin(direction) * config.speed * 80,
        },
        max: {
          x: Math.cos(direction) * config.speed * 90,
          y: Math.sin(direction) * config.speed * 90,
        },
      },
      acceleration: { x: 0, y: 0 },
      size: {
        min: config.size,
        max: config.size * 1.3,
      },
      life: {
        min: (config.duration / 1000) * 0.9,
        max: (config.duration / 1000) * 1.1,
      },
      color: config.color,
      blendMode: 'normal',
      quality: quality,
    };

    particleSystemManager.createParticleSystem(systemId, particleConfig);

    console.warn(
      `[WeaponEffectManager] Creating main effect with ID ${systemId} at quality ${quality}`
    );

    return systemId;
  }

  private createBeamEffect(
    position: Position,
    direction: number,
    config: WeaponEffectConfig,
    quality: 'low' | 'medium' | 'high'
  ): string[] {
    const adjustedParticleCount = this._getQualityAdjustedParticleCount(
      config.particleCount,
      quality
    );

    // Generate a unique ID for this particle system instance
    const systemId = `beam-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    // Define particle config based on weapon config
    const particleConfig: ParticleSystemConfig = {
      maxParticles: adjustedParticleCount,
      spawnRate: adjustedParticleCount * 2,
      position: position,
      spread: config.spread * 50,
      initialVelocity: {
        min: {
          x: Math.cos(direction) * config.speed * 50,
          y: Math.sin(direction) * config.speed * 50,
        },
        max: {
          x: Math.cos(direction) * config.speed * 60,
          y: Math.sin(direction) * config.speed * 60,
        },
      },
      acceleration: { x: 0, y: 0 },
      size: {
        min: config.size * 0.8,
        max: config.size * 1.2,
      },
      life: {
        min: (config.duration / 1000) * 0.5,
        max: config.duration / 1000,
      },
      color: config.color,
      blendMode: 'additive',
      quality: quality,
    };

    // Create the particle system
    particleSystemManager.createParticleSystem(systemId, particleConfig);

    console.warn(
      `[WeaponEffectManager] Creating beam effect with ID ${systemId} using ${adjustedParticleCount} particles at quality ${quality}`
    );

    return [systemId];
  }

  private createExplosionEffect(
    position: Position,
    config: WeaponEffectConfig,
    quality: 'low' | 'medium' | 'high'
  ): string[] {
    const adjustedParticleCount = this._getQualityAdjustedParticleCount(
      config.particleCount * 5,
      quality
    );

    // Generate a unique ID
    const systemId = `explosion-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    // Define particle config - Explosions often burst outcombatds
    const particleConfig: ParticleSystemConfig = {
      maxParticles: adjustedParticleCount,
      spawnRate: adjustedParticleCount * 10,
      position: position,
      spread: config.spread * 100,
      initialVelocity: {
        min: { x: -config.speed * 50, y: -config.speed * 50 },
        max: { x: config.speed * 50, y: config.speed * 50 },
      },
      acceleration: { x: 0, y: 0 },
      size: {
        min: config.size * 1.5,
        max: config.size * 2.5,
      },
      life: {
        min: (config.duration / 1000) * 0.2,
        max: (config.duration / 1000) * 0.5,
      },
      color: config.color,
      blendMode: 'additive',
      quality: quality,
    };

    // Create the particle system
    particleSystemManager.createParticleSystem(systemId, particleConfig);

    console.warn(
      `[WeaponEffectManager] Creating explosion effect with ID ${systemId} using ${adjustedParticleCount} particles at quality ${quality}`
    );

    return [systemId];
  }

  private createContinuousEffect(
    position: Position,
    direction: number,
    config: WeaponEffectConfig,
    quality: 'low' | 'medium' | 'high'
  ): string[] {
    const adjustedParticleCount = this._getQualityAdjustedParticleCount(
      config.particleCount * 0.5,
      quality
    );

    // Generate a unique ID
    const systemId = `continuous-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    // Define particle config - Continuous emission
    const particleConfig: ParticleSystemConfig = {
      maxParticles: adjustedParticleCount * 10,
      spawnRate: adjustedParticleCount,
      position: position,
      spread: config.spread * 30,
      initialVelocity: {
        min: {
          x: Math.cos(direction) * config.speed * 10,
          y: Math.sin(direction) * config.speed * 10,
        },
        max: {
          x: Math.cos(direction) * config.speed * 15,
          y: Math.sin(direction) * config.speed * 15,
        },
      },
      acceleration: { x: 0, y: 0 },
      size: {
        min: config.size * 0.7,
        max: config.size * 1.1,
      },
      life: {
        min: (config.duration / 1000) * 0.8,
        max: (config.duration / 1000) * 1.2,
      },
      color: config.color,
      blendMode: 'normal',
      quality: quality,
    };

    // Create the particle system
    particleSystemManager.createParticleSystem(systemId, particleConfig);

    console.warn(
      `[WeaponEffectManager] Creating continuous effect with ID ${systemId} using ${adjustedParticleCount} particles/tick at quality ${quality}`
    );

    return [systemId];
  }

  private cleanupWeaponEffect(weaponId: string, systemIds: string[]): void {
    // Remove particle systems
    systemIds.forEach(id => {
      particleSystemManager.removeSystem(id);
    });

    // Update active effects tracking
    const effects = this.activeEffects.get(weaponId);
    if (effects) {
      effects.forEach(effectId => {
        this.emit('effectEnded', { weaponId, effectType: effectId });
      });
      effects.clear();
    }
  }

  public setQuality(weaponId: string, quality: 'low' | 'medium' | 'high'): void {
    this.qualitySettings.set(weaponId, quality);
    this.emit('qualityChanged', { weaponId, quality });
  }

  public getActiveEffects(weaponId: string): string[] {
    return Array.from(this.activeEffects.get(weaponId) ?? []);
  }

  public cleanup(): void {
    // Clean up all active effects
    for (const [_weaponId, effects] of this.activeEffects) {
      effects.forEach(effectId => {
        effectLifecycleManager.cleanupEffectsByType(`weapon-${effectId}`);
      });
      effects.clear();
    }
    this.activeEffects.clear();
    this.qualitySettings.clear();
  }
}

// Export singleton instance
export const weaponEffectManager = WeaponEffectManager.getInstance();
