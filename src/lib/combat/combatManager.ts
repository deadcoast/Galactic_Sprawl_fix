import { factionManager } from "../../lib/factions/factionManager";

export interface Fleet {
  units: CombatUnit[];
}

export interface CombatManager {
  getFleetStatus: (fleetId: string) => Fleet | undefined;
  getUnitsInRange: (
    position: { x: number; y: number },
    range: number,
  ) => CombatUnit[];
  getThreatsInRange: (
    position: { x: number; y: number },
    range: number,
  ) => Threat[];
  moveUnit: (unitId: string, position: { x: number; y: number }) => void;
  removeUnit: (unitId: string) => void;
}

export interface Threat {
  id: string;
  position: { x: number; y: number };
  severity: "low" | "medium" | "high";
  type: string;
}

export interface CombatUnit {
  id: string;
  faction: string;
  type:
    | "spitflare"
    | "starSchooner"
    | "orionFrigate"
    | "harbringerGalleon"
    | "midwayCarrier"
    | "motherEarthRevenge";
  tier: 1 | 2 | 3;
  position: { x: number; y: number };
  status:
    | "idle"
    | "patrolling"
    | "engaging"
    | "returning"
    | "damaged"
    | "retreating"
    | "disabled";
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  target?: string;
  weapons: {
    id: string;
    type: "machineGun" | "gaussCannon" | "railGun" | "mgss" | "rockets";
    range: number;
    damage: number;
    cooldown: number;
    status: "ready" | "charging" | "cooling";
    lastFired?: number;
  }[];
  specialAbilities?: {
    name: string;
    description: string;
    cooldown: number;
    active: boolean;
  }[];
}

interface CombatZone {
  id: string;
  position: { x: number; y: number };
  radius: number;
  units: CombatUnit[];
  threatLevel: number;
}

class CombatManagerImpl implements CombatManager {
  private combatZones: Map<string, CombatZone> = new Map();
  private units: Map<string, CombatUnit> = new Map();
  private autoDispatchEnabled: boolean = true;
  private threats: Map<string, Threat> = new Map();

  // Combat Thresholds
  private readonly ENGAGEMENT_RANGE = 500; // Units within this range will engage
  private readonly RETREAT_HEALTH_THRESHOLD = 0.3; // Units retreat at 30% health
  private readonly REINFORCEMENT_THRESHOLD = 0.5; // Call reinforcements at 50% fleet strength
  private readonly MAX_UNITS_PER_ZONE = 10; // Maximum units in a combat zone

  constructor() {
    this.startCombatLoop();
  }

  private startCombatLoop() {
    setInterval(() => {
      this.updateCombatZones();
      this.processAutoDispatch();
      this.updateUnitBehaviors();
    }, 1000);
  }

  private updateCombatZones() {
    this.combatZones.forEach((zone) => {
      // Update threat level based on hostile units
      zone.threatLevel = this.calculateZoneThreatLevel(zone);

      // Merge nearby zones if they overlap
      this.combatZones.forEach((otherZone) => {
        if (zone.id !== otherZone.id && this.zonesOverlap(zone, otherZone)) {
          this.mergeZones(zone, otherZone);
        }
      });

      // Remove empty zones
      if (zone.units.length === 0) {
        this.combatZones.delete(zone.id);
      }
    });
  }

  private calculateZoneThreatLevel(zone: CombatZone): number {
    let threat = 0;
    const hostileUnits = zone.units.filter(
      (unit) => factionManager.getFactionBehavior(unit.faction)?.isHostile,
    );

    hostileUnits.forEach((unit) => {
      threat +=
        (unit.health / unit.maxHealth) *
        (unit.weapons.reduce((sum, w) => sum + w.damage, 0) / 100);
    });

    return Math.min(1, threat / this.MAX_UNITS_PER_ZONE);
  }

  private zonesOverlap(zone1: CombatZone, zone2: CombatZone): boolean {
    const dx = zone1.position.x - zone2.position.x;
    const dy = zone1.position.y - zone2.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < zone1.radius + zone2.radius;
  }

  private mergeZones(zone1: CombatZone, zone2: CombatZone) {
    // Create new zone encompassing both
    const newZone: CombatZone = {
      id: `merged-${Date.now()}`,
      position: {
        x: (zone1.position.x + zone2.position.x) / 2,
        y: (zone1.position.y + zone2.position.y) / 2,
      },
      radius: Math.max(
        zone1.radius,
        zone2.radius,
        this.getDistance(zone1.position, zone2.position) / 2,
      ),
      units: [...zone1.units, ...zone2.units],
      threatLevel: Math.max(zone1.threatLevel, zone2.threatLevel),
    };

    this.combatZones.delete(zone1.id);
    this.combatZones.delete(zone2.id);
    this.combatZones.set(newZone.id, newZone);
  }

  private processAutoDispatch() {
    if (!this.autoDispatchEnabled) {
      return;
    }

    this.combatZones.forEach((zone) => {
      if (zone.threatLevel > this.REINFORCEMENT_THRESHOLD) {
        const nearbyAllies = this.findNearbyAllies(zone);
        nearbyAllies.forEach((ally) => {
          if (this.shouldDispatchUnit(ally, zone)) {
            this.dispatchUnitToZone(ally, zone);
          }
        });
      }
    });
  }

  private findNearbyAllies(zone: CombatZone): CombatUnit[] {
    return Array.from(this.units.values()).filter((unit) => {
      if (unit.status !== "idle") {
        return false;
      }
      const distance = this.getDistance(unit.position, zone.position);
      return distance <= this.ENGAGEMENT_RANGE;
    });
  }

  private shouldDispatchUnit(unit: CombatUnit, zone: CombatZone): boolean {
    // Check if unit is available and healthy
    if (unit.status !== "idle" || unit.health < unit.maxHealth * 0.8) {
      return false;
    }

    // Check if zone needs reinforcements
    const alliedUnits = zone.units.filter((u) => u.faction === unit.faction);
    if (alliedUnits.length >= this.MAX_UNITS_PER_ZONE / 2) {
      return false;
    }

    return true;
  }

  private dispatchUnitToZone(unit: CombatUnit, zone: CombatZone) {
    unit.status = "engaging";
    zone.units.push(unit);

    // Find suitable target
    const target = this.findBestTarget(unit, zone);
    if (target) {
      unit.target = target.id;
    }
  }

  private findBestTarget(
    unit: CombatUnit,
    zone: CombatZone,
  ): CombatUnit | null {
    const hostileUnits = zone.units.filter(
      (u) => factionManager.getFactionBehavior(u.faction)?.isHostile,
    );

    if (hostileUnits.length === 0) {
      return null;
    }

    // Prioritize targets based on threat and distance
    return hostileUnits.reduce(
      (best, current) => {
        if (!best) {
          return current;
        }

        const bestScore = this.calculateTargetScore(unit, best);
        const currentScore = this.calculateTargetScore(unit, current);

        return currentScore > bestScore ? current : best;
      },
      null as CombatUnit | null,
    );
  }

  private calculateTargetScore(unit: CombatUnit, target: CombatUnit): number {
    const distance = this.getDistance(unit.position, target.position);
    const healthFactor = target.health / target.maxHealth;
    const threatFactor =
      target.weapons.reduce((sum, w) => sum + w.damage, 0) / 100;

    return (threatFactor * 0.4 + (1 - healthFactor) * 0.3) / (distance * 0.3);
  }

  private updateUnitBehaviors() {
    this.units.forEach((unit) => {
      if (unit.status === "disabled") {
        return;
      }

      // Check for retreat conditions
      if (this.shouldRetreat(unit)) {
        this.initiateRetreat(unit);
        return;
      }

      // Update combat behavior
      if (unit.status === "engaging" && unit.target) {
        const target = this.units.get(unit.target);
        if (target) {
          this.updateCombat(unit, target);
        } else {
          unit.target = undefined;
        }
      }
    });
  }

  private shouldRetreat(unit: CombatUnit): boolean {
    // Check health threshold
    if (unit.health < unit.maxHealth * this.RETREAT_HEALTH_THRESHOLD) {
      return true;
    }

    // Check if outnumbered significantly
    const zone = this.findUnitZone(unit);
    if (zone) {
      const allies = zone.units.filter(
        (u) => u.faction === unit.faction,
      ).length;
      const enemies = zone.units.filter(
        (u) => u.faction !== unit.faction,
      ).length;
      if (enemies > allies * 2) {
        return true;
      }
    }

    return false;
  }

  private initiateRetreat(unit: CombatUnit) {
    unit.status = "retreating";
    unit.target = undefined;

    // Remove from combat zone
    const zone = this.findUnitZone(unit);
    if (zone) {
      zone.units = zone.units.filter((u) => u.id !== unit.id);
    }
  }

  private updateCombat(unit: CombatUnit, target: CombatUnit) {
    // Check if weapons are in range and ready
    unit.weapons.forEach((weapon) => {
      const distance = this.getDistance(unit.position, target.position);
      if (distance <= weapon.range && this.canFireWeapon(weapon)) {
        this.fireWeapon(unit, target, weapon);
      }
    });
  }

  private canFireWeapon(weapon: CombatUnit["weapons"][0]): boolean {
    const now = Date.now();
    return (
      weapon.status === "ready" &&
      (!weapon.lastFired || now - weapon.lastFired >= weapon.cooldown * 1000)
    );
  }

  private updateWeaponStatus(weapon: CombatUnit["weapons"][0]): void {
    if (this.canFireWeapon(weapon)) {
      weapon.status = "charging";
      weapon.lastFired = Date.now();
    }
  }

  private fireWeapon(
    unit: CombatUnit,
    target: CombatUnit,
    weapon: CombatUnit["weapons"][0],
  ) {
    // Skip if unit is disabled
    if (unit.status === "disabled") {
      return;
    }

    weapon.lastFired = Date.now();
    this.updateWeaponStatus(weapon);

    // Calculate damage considering shields
    let { damage } = weapon;
    if (target.shield > 0) {
      const shieldDamage = Math.min(target.shield, damage * 0.7);
      target.shield -= shieldDamage;
      damage -= shieldDamage;
    }

    target.health = Math.max(0, target.health - damage);

    // Check if target is disabled
    if (target.health === 0) {
      target.status = "disabled";
      target.target = undefined;
    }
  }

  private findUnitZone(unit: CombatUnit): CombatZone | null {
    for (const zone of this.combatZones.values()) {
      if (zone.units.some((u) => u.id === unit.id)) {
        return zone;
      }
    }
    return null;
  }

  private getDistance(
    pos1: { x: number; y: number },
    pos2: { x: number; y: number },
  ): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Public API
  public addUnit(unit: CombatUnit) {
    this.units.set(unit.id, unit);
  }

  public removeUnit(unitId: string) {
    this.units.delete(unitId);
  }

  public createCombatZone(position: { x: number; y: number }): string {
    const zone: CombatZone = {
      id: `zone-${Date.now()}`,
      position,
      radius: 100,
      units: [],
      threatLevel: 0,
    };
    this.combatZones.set(zone.id, zone);
    return zone.id;
  }

  public setAutoDispatch(enabled: boolean) {
    this.autoDispatchEnabled = enabled;
  }

  public getZoneStatus(zoneId: string) {
    return this.combatZones.get(zoneId);
  }

  public getUnitStatus(unitId: string) {
    return this.units.get(unitId);
  }

  getFleetStatus(fleetId: string) {
    const fleetUnits = Array.from(this.units.values()).filter(
      (unit) => unit.faction === fleetId,
    );
    return fleetUnits.length > 0 ? { units: fleetUnits } : undefined;
  }

  getUnitsInRange(
    position: { x: number; y: number },
    range: number,
  ): CombatUnit[] {
    return Array.from(this.units.values()).filter((unit) => {
      const dx = unit.position.x - position.x;
      const dy = unit.position.y - position.y;
      return Math.sqrt(dx * dx + dy * dy) <= range;
    });
  }

  getThreatsInRange(
    position: { x: number; y: number },
    range: number,
  ): Threat[] {
    return Array.from(this.threats.values()).filter((threat) => {
      const dx = threat.position.x - position.x;
      const dy = threat.position.y - position.y;
      return Math.sqrt(dx * dx + dy * dy) <= range;
    });
  }

  moveUnit(unitId: string, position: { x: number; y: number }): void {
    const unit = this.units.get(unitId);
    if (unit) {
      unit.position = position;
    }
  }
}

export const combatManager = new CombatManagerImpl();
