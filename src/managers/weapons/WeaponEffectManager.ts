import { EventEmitter } from '../../utils/EventEmitter';
import { effectLifecycleManager } from '../effects/EffectLifecycleManager';
import { particleSystemManager } from '../effects/ParticleSystemManager';
import { Position } from '../../types/core/GameTypes';
import { WeaponCategory, WeaponVariant } from '../../types/weapons/WeaponTypes';

interface WeaponEffectEvents {
  effectStarted: { weaponId: string; effectType: string };
  effectEnded: { weaponId: string; effectType: string };
  qualityChanged: { weaponId: string; quality: 'low' | 'medium' | 'high' };
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

export class WeaponEffectManager extends EventEmitter<WeaponEffectEvents> {
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
      pattern: 'projectile'
    });

    // Plasma Cannon effects
    this.setEffectConfig('plasmaCannon', 'basic', {
      duration: 1000,
      particleCount: 30,
      color: '#00ffff',
      size: 4,
      spread: 0.2,
      speed: 1,
      pattern: 'beam'
    });

    // Beam Weapon effects
    this.setEffectConfig('beamWeapon', 'basic', {
      duration: 2000,
      particleCount: 50,
      color: '#ff00ff',
      size: 3,
      spread: 0.05,
      speed: 3,
      pattern: 'continuous'
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
    const particleCount = this.getQualityAdjustedParticleCount(config.particleCount, quality);

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

  private getQualityAdjustedParticleCount(baseCount: number, quality: 'low' | 'medium' | 'high'): number {
    switch (quality) {
      case 'low': return Math.floor(baseCount * 0.5);
      case 'high': return Math.floor(baseCount * 1.5);
      default: return baseCount;
    }
  }

  private createMainEffect(
    weaponId: string,
    position: Position,
    direction: number,
    config: WeaponEffectConfig,
    quality: 'low' | 'medium' | 'high'
  ): string {
    return `${weaponId}-main-${Date.now()}`;
  }

  private createBeamEffect(
    position: Position,
    direction: number,
    config: WeaponEffectConfig,
    quality: 'low' | 'medium' | 'high'
  ): string[] {
    return [`beam-${Date.now()}`];
  }

  private createExplosionEffect(
    position: Position,
    config: WeaponEffectConfig,
    quality: 'low' | 'medium' | 'high'
  ): string[] {
    return [`explosion-${Date.now()}`];
  }

  private createContinuousEffect(
    position: Position,
    direction: number,
    config: WeaponEffectConfig,
    quality: 'low' | 'medium' | 'high'
  ): string[] {
    return [`continuous-${Date.now()}`];
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
    return Array.from(this.activeEffects.get(weaponId) || []);
  }

  public cleanup(): void {
    // Clean up all active effects
    for (const [weaponId, effects] of this.activeEffects) {
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