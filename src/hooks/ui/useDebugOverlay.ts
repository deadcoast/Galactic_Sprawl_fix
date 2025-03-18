import { useCallback, useEffect, useState } from 'react';
import { getCombatManager } from '../../managers/ManagerRegistry';
import { factionManager } from '../../managers/factions/factionManager';
import { CombatStats, DebugState } from '../../types/debug/DebugTypes';

interface PerformanceMetrics {
  usedJSHeapSize: number;
  networkLatency?: number;
  frameDrops?: number;
  gcTime?: number;
}

interface CombatZoneMetrics {
  id: string;
  type: 'skirmish' | 'battle' | 'siege';
  participants: number;
  intensity: number;
  duration: number;
}

interface ProjectileMetrics {
  id: string;
  type: 'bullet' | 'laser' | 'missile' | 'torpedo';
  source: string;
  damage: number;
  accuracy: number;
  lifetime: number;
}

declare global {
  interface Performance {
    memory?: PerformanceMetrics;
  }
}

interface WeaponStats {
  hits: number;
  misses: number;
  lastHitDamage?: number;
}

interface Unit {
  id: string;
  faction: string;
  position: { x: number; y: number };
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  speed: number;
  maxSpeed: number;
  status: string;
  target?: string;
  weapons: Array<{
    id: string;
    type: 'machineGun' | 'railGun' | 'gaussCannon' | 'rockets';
    range: number;
    damage: number;
    cooldown: number;
    status: 'ready' | 'charging' | 'cooling' | 'firing';
    lastFired?: number;
    stats?: WeaponStats;
  }>;
  specialAbilities?: Array<{
    name: string;
    description: string;
    cooldown: number;
    active: boolean;
    effectiveness?: number;
  }>;
  combatStats?: {
    kills: number;
    assists: number;
  };
  lastHitPosition?: { x: number; y: number };
  lastHitDamage?: number;
  smokeTrail?: boolean;
  explosions?: Array<{ type: string }>;
}

interface ExtendedCombatManager {
  getActiveProjectiles: () => Array<{
    id: string;
    type: 'bullet' | 'laser' | 'missile' | 'torpedo';
    sourceId: string;
    damage: number;
    accuracy: number;
    lifetime: number;
  }>;
  getActiveCombatZones: () => Array<{
    id: string;
    type: 'skirmish' | 'battle' | 'siege';
    participants: number;
    intensity: number;
    duration: number;
  }>;
}

export function useDebugOverlay() {
  const [visible, setVisible] = useState(false);
  const [debugStates, setDebugStates] = useState<Record<string, DebugState>>({});
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(true);
  const [showCombatMetrics, setShowCombatMetrics] = useState(true);
  const [showSystemMetrics, setShowSystemMetrics] = useState(true);
  const [logLevel, setLogLevel] = useState<'error' | 'warn' | 'info' | 'debug'>('warn');
  const [networkStats, setNetworkStats] = useState<{
    latency: number;
    drops: number;
  }>({ latency: 0, drops: 0 });
  const [gcStats, setGCStats] = useState<{ time: number; count: number }>({
    time: 0,
    count: 0,
  });

  // Enhanced performance monitoring
  const measurePerformance = useCallback(() => {
    const start = performance.now();
    const memory = performance.memory?.usedJSHeapSize ?? 0;
    const fps = 1000 / (performance.now() - start);

    // Network performance
    const networkLatency = networkStats.latency;
    const frameDrops = networkStats.drops;

    // GC metrics
    const gcTime = gcStats.time;

    return {
      updateTime: performance.now() - start,
      fps,
      memory,
      networkLatency,
      frameDrops,
      gcTime,
    };
  }, [networkStats, gcStats]);

  // Enhanced system metrics collection
  const collectSystemMetrics = useCallback((): {
    activeUnits: number;
    activeProjectiles: number;
    activeCombatZones: number;
    memory: number;
    networkLatency: number;
    frameDrops: number;
    gcTime: number;
    projectiles: ProjectileMetrics[];
    combatZones: CombatZoneMetrics[];
  } => {
    const activeUnits = Array.from(getCombatManager().getUnitsInRange({ x: 0, y: 0 }, 2000)).length;
    const extendedManager = getCombatManager() as unknown as ExtendedCombatManager;

    // Get active projectiles with null check
    const projectiles = extendedManager.getActiveProjectiles?.() ?? [];
    const activeProjectiles = projectiles.length;

    // Get combat zones with null check
    const combatZones = extendedManager.getActiveCombatZones?.() ?? [];
    const activeCombatZones = combatZones.length;

    // Performance metrics
    const memory = performance.memory
      ? Math.round(performance.memory.usedJSHeapSize / (1024 * 1024))
      : 0;
    const networkLatency = window.performance.getEntriesByType('navigation')[0]?.duration ?? 0;
    const frameDrops = window.performance
      .getEntriesByType('frame')
      .filter(entry => entry.duration > 16.67).length;
    const gcTime = window.performance
      .getEntriesByType('gc')
      .reduce((total, entry) => total + entry.duration, 0);

    // Projectile metrics
    const projectileMetrics = projectiles.map(p => ({
      id: p.id,
      type: p.type,
      source: p.sourceId,
      damage: p.damage,
      accuracy: p.accuracy,
      lifetime: p.lifetime,
    }));

    return {
      activeUnits,
      activeProjectiles,
      activeCombatZones,
      memory,
      networkLatency,
      frameDrops,
      gcTime,
      projectiles: projectileMetrics,
      combatZones,
    };
  }, []);

  // Network monitoring
  useEffect(() => {
    let lastFrameTime = performance.now();
    let drops = 0;

    const monitorNetwork = () => {
      const now = performance.now();
      const frameDelta = now - lastFrameTime;

      // Detect frame drops (threshold: 32ms ~ 30fps)
      if (frameDelta > 32) {
        drops++;
      }

      // Simulate network latency check (replace with actual network check)
      const latency = Math.random() * 50 + 20; // 20-70ms latency simulation

      setNetworkStats({ latency, drops });
      lastFrameTime = now;
    };

    const networkInterval = setInterval(monitorNetwork, 1000);
    return () => clearInterval(networkInterval);
  }, []);

  // GC monitoring (if available)
  useEffect(() => {
    if ('gc' in window) {
      const gcObserver = new PerformanceObserver(list => {
        const gcEntries = list.getEntries();
        const totalTime = gcEntries.reduce((sum, entry) => sum + entry.duration, 0);
        setGCStats(prev => ({
          time: totalTime,
          count: prev.count + gcEntries.length,
        }));
      });

      gcObserver.observe({ entryTypes: ['gc'] });
      return () => gcObserver.disconnect();
    }
  }, []);

  // Combat metrics collection
  const collectCombatMetrics = useCallback((unit: Unit): CombatStats => {
    const weaponEffects = unit.weapons.map(weapon => ({
      type: weapon.type as 'machineGun' | 'railGun' | 'gaussCannon' | 'rockets',
      status: weapon.status,
      damage: weapon.damage,
      accuracy: weapon.stats
        ? weapon.stats.hits
          ? weapon.stats.hits / (weapon.stats.hits + weapon.stats.misses)
          : 0
        : 0,
      firing: weapon.status === 'firing',
    }));

    const shieldStatus = {
      active: unit.shield > 0,
      health: unit.shield / unit.maxShield,
      impact: unit.lastHitPosition
        ? {
            x: unit.lastHitPosition.x,
            y: unit.lastHitPosition.y,
            intensity: unit.lastHitDamage ? unit.lastHitDamage / unit.maxShield : 0,
          }
        : undefined,
    };

    return {
      damageDealt: weaponEffects.reduce((total, w) => total + (w.firing ? w.damage : 0), 0),
      damageReceived: unit.maxHealth - unit.health + (unit.maxShield - unit.shield),
      accuracy: weaponEffects.reduce((sum, w) => sum + w.accuracy, 0) / weaponEffects.length,
      evasion: unit.specialAbilities?.find(a => a.name === 'evasion')?.effectiveness ?? 0,
      killCount: unit.combatStats?.kills ?? 0,
      assistCount: unit.combatStats?.assists ?? 0,
      weaponEffects,
      shieldStatus,
      thrusterIntensity: unit.speed / unit.maxSpeed,
    };
  }, []);

  useEffect(() => {
    const updateInterval = setInterval(() => {
      if (!visible) {
        return;
      }

      const perfStart = performance.now();
      const states: Record<string, DebugState> = {};

      // Get all active units
      const units = Array.from(getCombatManager().getUnitsInRange({ x: 0, y: 0 }, 1000));
      units.forEach(combatUnit => {
        const unit = combatUnit as unknown as Unit;
        // Get unit's faction information
        const factionState = factionManager.getFactionState(unit.faction);

        // Get unit's status
        const unitStatus = getCombatManager().getUnitStatus(unit.id);

        if (unitStatus) {
          const threatLevel =
            factionState?.relationshipWithPlayer !== undefined
              ? factionState.relationshipWithPlayer < 0
                ? 1
                : 0
              : 0;

          const { updateTime, fps, memory } = measurePerformance();
          const systemMetrics = collectSystemMetrics();
          const combatStats = collectCombatMetrics(unit);

          states[unit.id] = {
            aiState: {
              behaviorState: unit.status,
              targetId: unit.target,
              fleetStrength: factionState?.fleetStrength ?? 0,
              threatLevel,
              lastAction: unitStatus.status || 'none',
              nextAction: unit.target ? 'engage' : 'patrol',
              cooldowns: unit.weapons.reduce(
                (acc, w) => ({
                  ...acc,
                  [w.id]: w.cooldown,
                }),
                {}
              ),
            },
            formation: unit.specialAbilities?.find(a => a.name === 'formation')?.active
              ? {
                  type: 'standard',
                  spacing: 50,
                  facing: 0,
                  cohesion: 1,
                  leaderUnit: unit.target,
                }
              : undefined,
            position: unit.position,
            faction: unit.faction,
            performance: {
              fps,
              updateTime,
              renderTime: performance.now() - perfStart,
              activeEffects: [
                unit.weapons.filter(w => w.status === 'firing').length,
                unit.shield > 0 ? 1 : 0,
                unit.speed > 0 ? 1 : 0,
                unit.smokeTrail ? 1 : 0,
                unit.explosions?.length ?? 0,
              ].reduce((a, b) => a + b, 0),
            },
            combatStats,
            systemState: {
              memory,
              activeUnits: systemMetrics.activeUnits,
              activeProjectiles: systemMetrics.activeProjectiles,
              activeCombatZones: systemMetrics.activeCombatZones,
            },
            warnings: [
              ...(unit.health < unit.maxHealth * 0.3 ? ['Low Health'] : []),
              ...(unit.shield < unit.maxShield * 0.2 ? ['Shield Critical'] : []),
              ...unit.weapons.filter(w => w.status === 'cooling').map(w => `${w.type} Cooling`),
              ...(unit.smokeTrail ? ['Engine Damage'] : []),
              ...(unit.explosions?.length ? ['Hull Breach'] : []),
            ],
          };
        }
      });

      setDebugStates(states);
    }, 250);

    return () => clearInterval(updateInterval);
  }, [visible, measurePerformance, collectSystemMetrics, collectCombatMetrics]);

  const toggleVisibility = () => setVisible(prev => !prev);
  const selectUnit = (unitId: string) => setSelectedUnitId(unitId);
  const togglePerformanceMetrics = () => setShowPerformanceMetrics(prev => !prev);
  const toggleCombatMetrics = () => setShowCombatMetrics(prev => !prev);
  const toggleSystemMetrics = () => setShowSystemMetrics(prev => !prev);
  const setDebugLogLevel = (level: 'error' | 'warn' | 'info' | 'debug') => setLogLevel(level);

  return {
    visible,
    debugStates,
    selectedUnitId,
    showPerformanceMetrics,
    showCombatMetrics,
    showSystemMetrics,
    logLevel,
    toggleVisibility,
    selectUnit,
    togglePerformanceMetrics,
    toggleCombatMetrics,
    toggleSystemMetrics,
    setDebugLogLevel,
  };
}
