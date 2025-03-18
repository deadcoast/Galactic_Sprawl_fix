import { BaseTypedEventEmitter } from '../../lib/modules/BaseTypedEventEmitter';
import { moduleEventBus } from '../../lib/modules/ModuleEvents';
import {
  CombatWeaponStats,
  WeaponCategory,
  WeaponInstance,
  WeaponUpgrade,
  WeaponUpgradeType,
} from '../../types/weapons/WeaponTypes';
import { ResourceType } from './../../types/resources/ResourceTypes';

interface WeaponUpgradeEvents {
  upgradeApplied: { weaponId: string; upgradeId: string };
  upgradeRemoved: { weaponId: string; upgradeId: string };
  statsUpdated: { weaponId: string; stats: CombatWeaponStats };
  specializationUnlocked: { weaponId: string; specializationType: string };
  experienceGained: { weaponId: string; amount: number };
  [key: string]: unknown;
}

interface WeaponSpecialization {
  id: string;
  name: string;
  description: string;
  requirements: {
    level: number;
    upgrades: string[];
    experience: number;
  };
  bonuses: Partial<CombatWeaponStats>;
  unlocked: boolean;
}

type UpgradeTree = {
  [key in WeaponCategory]: {
    upgrades: WeaponUpgrade[];
    specializations: WeaponSpecialization[];
  };
};

const WEAPON_CATEGORIES: WeaponCategory[] = [
  'machineGun',
  'gaussCannon',
  'railGun',
  'mgss',
  'rockets',
  'pointDefense',
  'flakCannon',
  'capitalLaser',
  'torpedoes',
  'harmonicCannon',
  'temporalCannon',
  'quantumCannon',
  'plasmaCannon',
  'beamWeapon',
  'pulseWeapon',
  'disruptor',
  'ionCannon',
];

export class WeaponUpgradeManager extends BaseTypedEventEmitter<WeaponUpgradeEvents> {
  private static instance: WeaponUpgradeManager;
  private upgradeTrees: UpgradeTree;
  private weaponExperience: Map<string, number> = new Map();
  private appliedUpgrades: Map<string, Set<string>> = new Map();

  private constructor() {
    super();
    this.upgradeTrees = this.initializeUpgradeTrees();
  }

  public static getInstance(): WeaponUpgradeManager {
    if (!WeaponUpgradeManager.instance) {
      WeaponUpgradeManager.instance = new WeaponUpgradeManager();
    }
    return WeaponUpgradeManager.instance;
  }

  private initializeUpgradeTrees(): UpgradeTree {
    const trees = {} as UpgradeTree;

    // Initialize upgrade trees for each weapon category
    WEAPON_CATEGORIES.forEach(category => {
      trees[category] = {
        upgrades: this.createUpgradesForCategory(category),
        specializations: this.createSpecializationsForCategory(category),
      };
    });

    return trees;
  }

  private createUpgradesForCategory(category: WeaponCategory): WeaponUpgrade[] {
    const baseUpgrades: WeaponUpgrade[] = [
      {
        id: `${category}-damage-1`,
        name: 'Enhanced Damage',
        type: 'damage' as WeaponUpgradeType,
        description: 'Increases weapon damage output',
        stats: {
          damage: 1.2,
          effects: [], // Maintain the effects array
        },
        requirements: { tech: [], resources: [] },
        unlocked: true,
      },
      {
        id: `${category}-rate-1`,
        name: 'Rapid Fire',
        type: 'rate' as WeaponUpgradeType,
        description: 'Increases rate of fire',
        stats: {
          rateOfFire: 1.2,
          effects: [], // Maintain the effects array
        },
        requirements: { tech: [], resources: [] },
        unlocked: true,
      },
      {
        id: `${category}-accuracy-1`,
        name: 'Targeting Enhancement',
        type: 'accuracy' as WeaponUpgradeType,
        description: 'Improves weapon accuracy',
        stats: {
          accuracy: 1.15,
          effects: [], // Maintain the effects array
        },
        requirements: { tech: [], resources: [] },
        unlocked: true,
      },
    ];

    // Add category-specific upgrades
    switch (category) {
      case 'plasmaCannon':
        baseUpgrades.push({
          id: `${category}-plasma-overcharge`,
          name: 'Plasma Overcharge',
          type: ResourceType.PLASMA as WeaponUpgradeType,
          description: 'Enhances plasma damage and penetration',
          stats: {
            damage: 1.3,
            effects: [], // Maintain the effects array
            special: { armorPenetration: 0.4 },
          },
          requirements: { tech: [], resources: [] },
          unlocked: false,
        });
        break;
      case 'beamWeapon':
        baseUpgrades.push({
          id: `${category}-beam-focus`,
          name: 'Beam Focus',
          type: 'beam' as WeaponUpgradeType,
          description: 'Increases beam weapon range and accuracy',
          stats: {
            range: 1.25,
            accuracy: 1.2,
            effects: [], // Maintain the effects array
          },
          requirements: { tech: [], resources: [] },
          unlocked: false,
        });
        break;
      // Add more category-specific upgrades
    }

    return baseUpgrades;
  }

  private createSpecializationsForCategory(category: WeaponCategory): WeaponSpecialization[] {
    const baseSpecializations: WeaponSpecialization[] = [
      {
        id: `${category}-specialist`,
        name: 'Weapon Specialist',
        description: 'Master of this weapon type',
        requirements: {
          level: 3,
          upgrades: [`${category}-damage-1`, `${category}-accuracy-1`],
          experience: 1000,
        },
        bonuses: {
          damage: 1.5,
          accuracy: 1.3,
          rateOfFire: 1.2,
        },
        unlocked: false,
      },
    ];

    // Add category-specific specializations
    switch (category) {
      case 'plasmaCannon':
        baseSpecializations.push({
          id: `${category}-plasma-master`,
          name: 'Plasma Master',
          description: 'Expert in plasma weapon systems',
          requirements: {
            level: 5,
            upgrades: [`${category}-plasma-overcharge`],
            experience: 2000,
          },
          bonuses: {
            damage: 2.0,
            special: {
              armorPenetration: 0.6,
              shieldDamageBonus: 0.4,
            },
          },
          unlocked: false,
        });
        break;
      // Add more category-specific specializations
    }

    return baseSpecializations;
  }

  public applyUpgrade(weapon: WeaponInstance, upgradeId: string): boolean {
    const { category } = weapon.config;
    const upgrade = this.upgradeTrees[category].upgrades.find(u => u.id === upgradeId);

    if (!upgrade || !upgrade.unlocked) {
      return false;
    }

    // Get or create the set of applied upgrades for this weapon
    let weaponUpgrades = this.appliedUpgrades.get(weapon.config.id);
    if (!weaponUpgrades) {
      weaponUpgrades = new Set();
      this.appliedUpgrades.set(weapon.config.id, weaponUpgrades);
    }

    // Apply the upgrade
    weaponUpgrades.add(upgradeId);
    const updatedStats = this.calculateUpdatedStats(weapon, Array.from(weaponUpgrades));

    // Emit events
    this.emit('upgradeApplied', { weaponId: weapon.config.id, upgradeId });
    this.emit('statsUpdated', { weaponId: weapon.config.id, stats: updatedStats });

    // Check for specialization unlocks
    this.checkSpecializationUnlocks(weapon);

    return true;
  }

  private calculateUpdatedStats(
    weapon: WeaponInstance,
    appliedUpgradeIds: string[]
  ): CombatWeaponStats {
    // Create a new stats object with all required properties
    const updatedStats: CombatWeaponStats = {
      damage: weapon.config.baseStats.damage,
      range: weapon.config.baseStats.range,
      accuracy: weapon.config.baseStats.accuracy,
      rateOfFire: weapon.config.baseStats.rateOfFire,
      energyCost: weapon.config.baseStats.energyCost,
      cooldown: weapon.config.baseStats.cooldown,
      effects: [...weapon.config.baseStats.effects],
      special: { ...weapon.config.baseStats.special },
    };

    const { category } = weapon.config;

    // Get all applied upgrades
    const appliedUpgrades = appliedUpgradeIds
      .map(id => this.upgradeTrees[category].upgrades.find(u => u.id === id))
      .filter((u): u is WeaponUpgrade => u !== undefined);

    // Apply upgrades
    appliedUpgrades.forEach(upgrade => {
      Object.entries(upgrade.stats).forEach(([key, value]) => {
        if (key === 'special' && value && typeof value === 'object') {
          updatedStats.special = {
            ...updatedStats.special,
            ...value,
          };
        } else if (key === 'effects' && Array.isArray(value)) {
          updatedStats.effects = [...updatedStats.effects, ...value];
        } else if (key !== 'special' && key !== 'effects') {
          const numericValue = value as number;
          // Handle each property explicitly
          if (key === 'damage' && 'damage' in updatedStats) {
            updatedStats.damage *= numericValue;
          } else if (key === 'range' && 'range' in updatedStats) {
            updatedStats.range *= numericValue;
          } else if (key === 'accuracy' && 'accuracy' in updatedStats) {
            updatedStats.accuracy *= numericValue;
          } else if (key === 'rateOfFire' && 'rateOfFire' in updatedStats) {
            updatedStats.rateOfFire *= numericValue;
          } else if (key === 'energyCost' && 'energyCost' in updatedStats) {
            updatedStats.energyCost *= numericValue;
          } else if (key === 'cooldown' && 'cooldown' in updatedStats) {
            updatedStats.cooldown *= numericValue;
          }
        }
      });
    });

    return updatedStats;
  }

  public addExperience(weaponId: string, amount: number): void {
    const currentExp = this.weaponExperience.get(weaponId) ?? 0;
    this.weaponExperience.set(weaponId, currentExp + amount);

    // Emit event through module event bus
    moduleEventBus.emit({
      type: 'MODULE_UPGRADED',
      moduleId: weaponId,
      moduleType: 'hangar', // Changed from 'weapon' to 'hangar' as it's a valid ModuleType
      timestamp: Date.now(),
      data: { experience: currentExp + amount },
    });
  }

  private checkSpecializationUnlocks(weapon: WeaponInstance): void {
    const { category } = weapon.config;
    const weaponId = weapon.config.id;
    const experience = this.weaponExperience.get(weaponId) ?? 0;
    const appliedUpgrades = Array.from(this.appliedUpgrades.get(weaponId) ?? []);

    this.upgradeTrees[category].specializations.forEach(spec => {
      if (!spec.unlocked && this.canUnlockSpecialization(spec, experience, appliedUpgrades)) {
        spec.unlocked = true;
        this.emit('specializationUnlocked', {
          weaponId,
          specializationType: spec.id,
        });
      }
    });
  }

  private canUnlockSpecialization(
    spec: WeaponSpecialization,
    experience: number,
    appliedUpgrades: string[]
  ): boolean {
    return (
      experience >= spec.requirements.experience &&
      spec.requirements.upgrades.every(required => appliedUpgrades.includes(required))
    );
  }

  public getAvailableUpgrades(weapon: WeaponInstance): WeaponUpgrade[] {
    const { category } = weapon.config;
    return this.upgradeTrees[category].upgrades.filter(upgrade => upgrade.unlocked);
  }

  public getSpecializations(weapon: WeaponInstance): WeaponSpecialization[] {
    const { category } = weapon.config;
    return this.upgradeTrees[category].specializations;
  }

  public cleanup(): void {
    this.weaponExperience.clear();
    this.appliedUpgrades.clear();
  }

  public subscribe<K extends keyof WeaponUpgradeEvents>(
    event: K,
    handler: (data: WeaponUpgradeEvents[K]) => void
  ) {
    this.on(event, handler);
    return {
      unsubscribe: () => {
        this.off(event, handler);
      },
    };
  }

  public getWeaponExperience(weaponId: string): number {
    return this.weaponExperience.get(weaponId) ?? 0;
  }

  public addWeaponExperience(weaponId: string, amount: number): void {
    const currentExp = this.getWeaponExperience(weaponId);
    this.weaponExperience.set(weaponId, currentExp + amount);
    this.emit('experienceGained', { weaponId, amount });
  }
}

export const weaponUpgradeManager = WeaponUpgradeManager.getInstance();
