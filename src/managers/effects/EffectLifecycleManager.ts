import { eventSystem } from '../../lib/events/UnifiedEventSystem';
import { Position } from '../../types/core/GameTypes';
import {
  EffectCleanedEventData,
  EffectStartedEventData,
  EventType,
} from '../../types/events/EventTypes';
import { particleSystemManager } from './ParticleSystemManager';

interface Effect {
  id: string;
  type: string;
  startTime: number;
  duration: number;
  position: Position;
  systemIds: string[];
  cleanup?: () => void;
}

export class EffectLifecycleManager {
  private static instance: EffectLifecycleManager;
  private effects: Map<string, Effect>;
  private cleanupInterval: number = 0;
  private readonly CLEANUP_CHECK_INTERVAL = 1000; // Check every second
  private readonly BATCH_SIZE = 10;

  private constructor() {
    this.effects = new Map();
    this.startCleanupInterval();
  }

  public static getInstance(): EffectLifecycleManager {
    if (!EffectLifecycleManager.instance) {
      EffectLifecycleManager.instance = new EffectLifecycleManager();
    }
    return EffectLifecycleManager.instance;
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = window.setInterval(() => {
      this.checkEffectsForCleanup();
    }, this.CLEANUP_CHECK_INTERVAL);
  }

  public registerEffect(
    type: string,
    position: Position,
    duration: number,
    systemIds: string[],
    cleanup?: () => void
  ): string {
    const id = `effect-${Date.now()}-${Math.random()}`;
    const effect: Effect = {
      id,
      type,
      startTime: Date.now(),
      duration,
      position,
      systemIds,
      cleanup,
    };

    this.effects.set(id, effect);
    const eventData: EffectStartedEventData = { effectId: id, effectType: type };
    eventSystem.publish({
      type: EventType.EFFECT_STARTED,
      managerId: 'EffectLifecycleManager',
      timestamp: Date.now(),
      data: eventData,
    });

    // Schedule cleanup
    if (duration > 0) {
      setTimeout(() => {
        this.cleanupEffect(id);
      }, duration);
    }

    return id;
  }

  private checkEffectsForCleanup(): void {
    const now = Date.now();
    let batchCount = 0;

    for (const [id, effect] of this.effects) {
      if (batchCount >= this.BATCH_SIZE) {
        break; // Process remaining effects in next interval
      }

      if (effect.duration > 0 && now - effect.startTime >= effect.duration) {
        this.cleanupEffect(id);
        batchCount++;
      }
    }
  }

  private cleanupEffect(id: string): void {
    const effect = this.effects.get(id);
    if (!effect) {
      return;
    }

    // Clean up particle systems
    effect.systemIds.forEach(systemId => {
      particleSystemManager.removeSystem(systemId);
    });

    // Run custom cleanup
    if (effect.cleanup) {
      try {
        effect.cleanup();
      } catch (error) {
        console.error(`Error cleaning up effect ${id}:`, error);
      }
    }

    this.effects.delete(id);
    const eventData: EffectCleanedEventData = { effectId: id, effectType: effect.type };
    eventSystem.publish({
      type: EventType.EFFECT_CLEANED,
      managerId: 'EffectLifecycleManager',
      timestamp: Date.now(),
      data: eventData,
    });
  }

  public cleanupEffectsByType(type: string): void {
    for (const [id, effect] of this.effects) {
      if (effect.type === type) {
        this.cleanupEffect(id);
      }
    }
  }

  public cleanupEffectsInArea(center: Position, radius: number): void {
    for (const [id, effect] of this.effects) {
      const dx = effect.position.x - center.x;
      const dy = effect.position.y - center.y;
      const distanceSquared = dx * dx + dy * dy;

      if (distanceSquared <= radius * radius) {
        this.cleanupEffect(id);
      }
    }
  }

  public getActiveEffects(): Effect[] {
    return Array.from(this.effects.values());
  }

  public getActiveEffectsByType(type: string): Effect[] {
    return Array.from(this.effects.values()).filter(effect => effect.type === type);
  }

  public cleanup(): void {
    // Clean up all effects
    for (const [id] of this.effects) {
      this.cleanupEffect(id);
    }

    // Clear interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Export singleton instance
export const effectLifecycleManager = EffectLifecycleManager.getInstance();
