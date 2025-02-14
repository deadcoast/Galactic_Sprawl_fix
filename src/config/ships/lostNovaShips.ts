import { LostNovaShipClass, FactionShipStats } from '../../types/ships/FactionShipTypes';
import {
  WeaponMount,
  WeaponMountSize,
  WeaponMountPosition,
  WeaponStatus,
  WeaponInstance,
} from '../../types/weapons/WeaponTypes';
import {
  PLASMA_EFFECT,
  GAUSS_EFFECT,
  EXPLOSIVE_EFFECT,
  DAMAGE_BOOST_EFFECT,
  SPEED_BOOST_EFFECT,
  STEALTH_EFFECT,
  SPEED_REDUCTION_EFFECT,
  SHIELD_FIELD_EFFECT,
} from '../../effects/types_effects/shipEffects';

export const LOST_NOVA_SHIPS: Record<LostNovaShipClass, FactionShipStats> = {
  eclipseScythe: {
    health: 800,
    maxHealth: 800,
    shield: 800,
    maxShield: 800,
    energy: 600,
    maxEnergy: 600,
    speed: 150,
    turnRate: 3,
    cargo: 250,
    tier: 3,
    faction: 'lost-nova',
    weapons: [
      {
        id: 'gauss-1',
        size: 'medium' as WeaponMountSize,
        position: 'turret' as WeaponMountPosition,
        rotation: 0,
        allowedCategories: ['gaussCannon'],
        currentWeapon: {
          config: {
            id: 'gauss-cannon',
            name: 'Gauss Cannon',
            category: 'gaussCannon',
            tier: 2,
            baseStats: {
              damage: 150,
              range: 1000,
              accuracy: 0.9,
              rateOfFire: 4,
              energyCost: 15,
              cooldown: 2,
              effects: [GAUSS_EFFECT],
            },
            visualAsset: 'weapons/gauss/basic',
            mountRequirements: {
              size: 'medium' as WeaponMountSize,
              power: 35,
            },
          },
          state: {
            status: 'ready' as WeaponStatus,
            currentStats: {
              damage: 150,
              range: 1000,
              accuracy: 0.9,
              rateOfFire: 4,
              energyCost: 15,
              cooldown: 2,
              effects: [GAUSS_EFFECT],
            },
            effects: [GAUSS_EFFECT],
          },
        } as WeaponInstance,
      },
    ],
    defense: {
      armor: 200,
      shield: 800,
      evasion: 0.4,
      regeneration: 6,
    },
    mobility: {
      speed: 150,
      turnRate: 3,
      acceleration: 75,
    },
    abilities: [
      {
        name: 'Phase Shift',
        description: 'Temporarily becomes untargetable',
        cooldown: 20,
        duration: 5,
        active: false,
        effect: STEALTH_EFFECT,
      },
    ],
  },
  nullsRevenge: {
    health: 1100,
    maxHealth: 1100,
    shield: 900,
    maxShield: 900,
    energy: 700,
    maxEnergy: 700,
    speed: 100,
    turnRate: 3,
    cargo: 250,
    tier: 3,
    faction: 'lost-nova',
    weapons: [
      {
        id: 'rail-1',
        size: 'large' as WeaponMountSize,
        position: 'front' as WeaponMountPosition,
        rotation: 0,
        allowedCategories: ['railGun'],
        currentWeapon: {
          config: {
            id: 'heavy-railgun',
            name: 'Heavy Railgun',
            category: 'railGun',
            tier: 3,
            baseStats: {
              damage: 180,
              range: 1200,
              accuracy: 0.85,
              rateOfFire: 3,
              energyCost: 15,
              cooldown: 3,
              effects: [GAUSS_EFFECT],
            },
            visualAsset: 'weapons/railgun/heavy',
            mountRequirements: {
              size: 'large' as WeaponMountSize,
              power: 35,
            },
          },
          state: {
            status: 'ready' as WeaponStatus,
            currentStats: {
              damage: 180,
              range: 1200,
              accuracy: 0.85,
              rateOfFire: 3,
              energyCost: 15,
              cooldown: 3,
              effects: [GAUSS_EFFECT],
            },
            effects: [GAUSS_EFFECT],
          },
        } as WeaponInstance,
      },
    ],
    defense: {
      armor: 300,
      shield: 900,
      evasion: 0.3,
      regeneration: 8,
    },
    mobility: {
      speed: 100,
      turnRate: 3,
      acceleration: 50,
    },
    abilities: [
      {
        name: 'Null Field',
        description: 'Creates a powerful shield field',
        cooldown: 35,
        duration: 8,
        active: false,
        effect: SHIELD_FIELD_EFFECT,
      },
    ],
  },
  darkMatterReaper: {
    health: 900,
    maxHealth: 900,
    shield: 700,
    maxShield: 700,
    energy: 600,
    maxEnergy: 600,
    speed: 120,
    turnRate: 3,
    cargo: 300,
    tier: 3,
    faction: 'lost-nova',
    weapons: [
      {
        id: 'mgss-1',
        size: 'medium' as WeaponMountSize,
        position: 'turret' as WeaponMountPosition,
        rotation: 0,
        allowedCategories: ['mgss'],
        currentWeapon: {
          config: {
            id: 'mgss-cannon',
            name: 'MGSS Cannon',
            category: 'mgss',
            tier: 2,
            baseStats: {
              damage: 60,
              range: 900,
              accuracy: 0.8,
              rateOfFire: 6,
              energyCost: 8,
              cooldown: 3,
              effects: [PLASMA_EFFECT],
            },
            visualAsset: 'weapons/mgss/basic',
            mountRequirements: {
              size: 'medium' as WeaponMountSize,
              power: 25,
            },
          },
          state: {
            status: 'ready' as WeaponStatus,
            currentStats: {
              damage: 60,
              range: 900,
              accuracy: 0.8,
              rateOfFire: 6,
              energyCost: 8,
              cooldown: 3,
              effects: [PLASMA_EFFECT],
            },
            effects: [PLASMA_EFFECT],
          },
        } as WeaponInstance,
      },
    ],
    defense: {
      armor: 250,
      shield: 700,
      evasion: 0.35,
      regeneration: 7,
    },
    mobility: {
      speed: 120,
      turnRate: 3,
      acceleration: 60,
    },
    abilities: [
      {
        name: 'Dark Matter Burst',
        description: 'Unleashes a burst of dark matter energy',
        cooldown: 30,
        duration: 6,
        active: false,
        effect: DAMAGE_BOOST_EFFECT,
      },
    ],
  },
  quantumPariah: {
    health: 600,
    maxHealth: 600,
    shield: 600,
    maxShield: 600,
    energy: 500,
    maxEnergy: 500,
    speed: 170,
    turnRate: 3,
    cargo: 150,
    tier: 2,
    faction: 'lost-nova',
    weapons: [
      {
        id: 'gauss-1',
        size: 'medium' as WeaponMountSize,
        position: 'front' as WeaponMountPosition,
        rotation: 0,
        allowedCategories: ['gaussCannon'],
        currentWeapon: {
          config: {
            id: 'gauss-cannon',
            name: 'Gauss Cannon',
            category: 'gaussCannon',
            tier: 2,
            baseStats: {
              damage: 100,
              range: 800,
              accuracy: 0.95,
              rateOfFire: 4,
              energyCost: 10,
              cooldown: 2,
              effects: [GAUSS_EFFECT],
            },
            visualAsset: 'weapons/gauss/basic',
            mountRequirements: {
              size: 'medium' as WeaponMountSize,
              power: 25,
            },
          },
          state: {
            status: 'ready' as WeaponStatus,
            currentStats: {
              damage: 100,
              range: 800,
              accuracy: 0.95,
              rateOfFire: 4,
              energyCost: 10,
              cooldown: 2,
              effects: [GAUSS_EFFECT],
            },
            effects: [GAUSS_EFFECT],
          },
        } as WeaponInstance,
      },
    ],
    defense: {
      armor: 150,
      shield: 600,
      evasion: 0.5,
      regeneration: 6,
    },
    mobility: {
      speed: 170,
      turnRate: 3,
      acceleration: 85,
    },
    abilities: [
      {
        name: 'Quantum Cloak',
        description: 'Activates advanced stealth technology',
        cooldown: 25,
        duration: 7,
        active: false,
        effect: STEALTH_EFFECT,
      },
    ],
  },
  entropyScale: {
    health: 850,
    maxHealth: 850,
    shield: 850,
    maxShield: 850,
    energy: 600,
    maxEnergy: 600,
    speed: 110,
    turnRate: 3,
    cargo: 200,
    tier: 3,
    faction: 'lost-nova',
    weapons: [
      {
        id: 'rail-1',
        size: 'medium' as WeaponMountSize,
        position: 'front' as WeaponMountPosition,
        rotation: 0,
        allowedCategories: ['railGun'],
        currentWeapon: {
          config: {
            id: 'railgun',
            name: 'Railgun',
            category: 'railGun',
            tier: 2,
            baseStats: {
              damage: 160,
              range: 1100,
              accuracy: 0.88,
              rateOfFire: 4,
              energyCost: 12,
              cooldown: 2,
              effects: [GAUSS_EFFECT],
            },
            visualAsset: 'weapons/railgun/basic',
            mountRequirements: {
              size: 'medium' as WeaponMountSize,
              power: 30,
            },
          },
          state: {
            status: 'ready' as WeaponStatus,
            currentStats: {
              damage: 160,
              range: 1100,
              accuracy: 0.88,
              rateOfFire: 4,
              energyCost: 12,
              cooldown: 2,
              effects: [GAUSS_EFFECT],
            },
            effects: [GAUSS_EFFECT],
          },
        } as WeaponInstance,
      },
    ],
    defense: {
      armor: 280,
      shield: 850,
      evasion: 0.35,
      regeneration: 7,
    },
    mobility: {
      speed: 110,
      turnRate: 3,
      acceleration: 55,
    },
    abilities: [
      {
        name: 'Entropy Field',
        description: 'Creates a field that slows enemies',
        cooldown: 28,
        duration: 9,
        active: false,
        effect: SPEED_REDUCTION_EFFECT,
      },
    ],
  },
  voidRevenant: {
    health: 750,
    maxHealth: 750,
    shield: 750,
    maxShield: 750,
    energy: 500,
    maxEnergy: 500,
    speed: 140,
    turnRate: 3,
    cargo: 180,
    tier: 2,
    faction: 'lost-nova',
    weapons: [
      {
        id: 'mgss-1',
        size: 'medium' as WeaponMountSize,
        position: 'front' as WeaponMountPosition,
        rotation: 0,
        allowedCategories: ['mgss'],
        currentWeapon: {
          config: {
            id: 'mgss-cannon',
            name: 'MGSS Cannon',
            category: 'mgss',
            tier: 2,
            baseStats: {
              damage: 45,
              range: 850,
              accuracy: 0.85,
              rateOfFire: 6,
              energyCost: 8,
              cooldown: 2,
              effects: [PLASMA_EFFECT],
            },
            visualAsset: 'weapons/mgss/basic',
            mountRequirements: {
              size: 'medium' as WeaponMountSize,
              power: 20,
            },
          },
          state: {
            status: 'ready' as WeaponStatus,
            currentStats: {
              damage: 45,
              range: 850,
              accuracy: 0.85,
              rateOfFire: 6,
              energyCost: 8,
              cooldown: 2,
              effects: [PLASMA_EFFECT],
            },
            effects: [PLASMA_EFFECT],
          },
        } as WeaponInstance,
      },
    ],
    defense: {
      armor: 200,
      shield: 750,
      evasion: 0.4,
      regeneration: 6,
    },
    mobility: {
      speed: 140,
      turnRate: 3,
      acceleration: 70,
    },
    abilities: [
      {
        name: 'Void Jump',
        description: 'Enables short-range teleportation',
        cooldown: 22,
        duration: 4,
        active: false,
        effect: STEALTH_EFFECT,
      },
    ],
  },
  scytheOfAndromeda: {
    health: 1000,
    maxHealth: 1000,
    shield: 1000,
    maxShield: 1000,
    energy: 700,
    maxEnergy: 700,
    speed: 130,
    turnRate: 3,
    cargo: 250,
    tier: 3,
    faction: 'lost-nova',
    weapons: [
      {
        id: 'rail-1',
        size: 'large' as WeaponMountSize,
        position: 'front' as WeaponMountPosition,
        rotation: 0,
        allowedCategories: ['railGun'],
        currentWeapon: {
          config: {
            id: 'heavy-railgun',
            name: 'Heavy Railgun',
            category: 'railGun',
            tier: 3,
            baseStats: {
              damage: 200,
              range: 1300,
              accuracy: 0.92,
              rateOfFire: 3,
              energyCost: 18,
              cooldown: 3,
              effects: [GAUSS_EFFECT],
            },
            visualAsset: 'weapons/railgun/heavy',
            mountRequirements: {
              size: 'large' as WeaponMountSize,
              power: 40,
            },
          },
          state: {
            status: 'ready' as WeaponStatus,
            currentStats: {
              damage: 200,
              range: 1300,
              accuracy: 0.92,
              rateOfFire: 3,
              energyCost: 18,
              cooldown: 3,
              effects: [GAUSS_EFFECT],
            },
            effects: [GAUSS_EFFECT],
          },
        } as WeaponInstance,
      },
    ],
    defense: {
      armor: 350,
      shield: 1000,
      evasion: 0.35,
      regeneration: 8,
    },
    mobility: {
      speed: 130,
      turnRate: 3,
      acceleration: 65,
    },
    abilities: [
      {
        name: 'Star Tear',
        description: 'Unleashes a devastating area attack',
        cooldown: 45,
        duration: 10,
        active: false,
        effect: DAMAGE_BOOST_EFFECT,
      },
    ],
  },
  nebularPersistence: {
    health: 950,
    maxHealth: 950,
    shield: 950,
    maxShield: 950,
    energy: 600,
    maxEnergy: 600,
    speed: 90,
    turnRate: 3,
    cargo: 200,
    tier: 3,
    faction: 'lost-nova',
    weapons: [
      {
        id: 'rocket-1',
        size: 'large' as WeaponMountSize,
        position: 'front' as WeaponMountPosition,
        rotation: 0,
        allowedCategories: ['rockets'],
        currentWeapon: {
          config: {
            id: 'heavy-rockets',
            name: 'Heavy Rockets',
            category: 'rockets',
            tier: 3,
            baseStats: {
              damage: 180,
              range: 1000,
              accuracy: 0.8,
              rateOfFire: 2,
              energyCost: 15,
              cooldown: 4,
              effects: [EXPLOSIVE_EFFECT],
            },
            visualAsset: 'weapons/rockets/heavy',
            mountRequirements: {
              size: 'large' as WeaponMountSize,
              power: 35,
            },
          },
          state: {
            status: 'ready' as WeaponStatus,
            currentStats: {
              damage: 180,
              range: 1000,
              accuracy: 0.8,
              rateOfFire: 2,
              energyCost: 15,
              cooldown: 4,
              effects: [EXPLOSIVE_EFFECT],
            },
            effects: [EXPLOSIVE_EFFECT],
          },
        } as WeaponInstance,
      },
    ],
    defense: {
      armor: 300,
      shield: 950,
      evasion: 0.3,
      regeneration: 8,
    },
    mobility: {
      speed: 90,
      turnRate: 3,
      acceleration: 45,
    },
    abilities: [
      {
        name: 'Nebula Shield',
        description: 'Creates a powerful shield field',
        cooldown: 32,
        duration: 12,
        active: false,
        effect: SHIELD_FIELD_EFFECT,
      },
    ],
  },
  oblivionsWake: {
    health: 800,
    maxHealth: 800,
    shield: 800,
    maxShield: 800,
    energy: 500,
    maxEnergy: 500,
    speed: 160,
    turnRate: 3,
    cargo: 180,
    tier: 3,
    faction: 'lost-nova',
    weapons: [
      {
        id: 'gauss-1',
        size: 'medium' as WeaponMountSize,
        position: 'front' as WeaponMountPosition,
        rotation: 0,
        allowedCategories: ['gaussCannon'],
        currentWeapon: {
          config: {
            id: 'gauss-cannon',
            name: 'Gauss Cannon',
            category: 'gaussCannon',
            tier: 3,
            baseStats: {
              damage: 140,
              range: 950,
              accuracy: 0.9,
              rateOfFire: 4,
              energyCost: 12,
              cooldown: 3,
              effects: [GAUSS_EFFECT],
            },
            visualAsset: 'weapons/gauss/basic',
            mountRequirements: {
              size: 'medium' as WeaponMountSize,
              power: 30,
            },
          },
          state: {
            status: 'ready' as WeaponStatus,
            currentStats: {
              damage: 140,
              range: 950,
              accuracy: 0.9,
              rateOfFire: 4,
              energyCost: 12,
              cooldown: 3,
              effects: [GAUSS_EFFECT],
            },
            effects: [GAUSS_EFFECT],
          },
        } as WeaponInstance,
      },
    ],
    defense: {
      armor: 250,
      shield: 800,
      evasion: 0.4,
      regeneration: 7,
    },
    mobility: {
      speed: 160,
      turnRate: 3,
      acceleration: 80,
    },
    abilities: [
      {
        name: 'Wake of Destruction',
        description: 'Creates a destructive field',
        cooldown: 38,
        duration: 8,
        active: false,
        effect: DAMAGE_BOOST_EFFECT,
      },
    ],
  },
  forbiddenVanguard: {
    health: 1200,
    maxHealth: 1200,
    shield: 1200,
    maxShield: 1200,
    energy: 700,
    maxEnergy: 700,
    speed: 120,
    turnRate: 3,
    cargo: 280,
    tier: 3,
    faction: 'lost-nova',
    weapons: [
      {
        id: 'mgss-1',
        size: 'medium' as WeaponMountSize,
        position: 'front' as WeaponMountPosition,
        rotation: 0,
        allowedCategories: ['mgss'],
        currentWeapon: {
          config: {
            id: 'mgss-cannon',
            name: 'MGSS Cannon',
            category: 'mgss',
            tier: 3,
            baseStats: {
              damage: 70,
              range: 1100,
              accuracy: 0.88,
              rateOfFire: 5,
              energyCost: 10,
              cooldown: 3,
              effects: [PLASMA_EFFECT],
            },
            visualAsset: 'weapons/mgss/advanced',
            mountRequirements: {
              size: 'medium' as WeaponMountSize,
              power: 25,
            },
          },
          state: {
            status: 'ready' as WeaponStatus,
            currentStats: {
              damage: 70,
              range: 1100,
              accuracy: 0.88,
              rateOfFire: 5,
              energyCost: 10,
              cooldown: 3,
              effects: [PLASMA_EFFECT],
            },
            effects: [PLASMA_EFFECT],
          },
        } as WeaponInstance,
      },
    ],
    defense: {
      armor: 400,
      shield: 1200,
      evasion: 0.3,
      regeneration: 10,
    },
    mobility: {
      speed: 120,
      turnRate: 3,
      acceleration: 60,
    },
    abilities: [
      {
        name: 'Forbidden Technology',
        description: 'Unleashes devastating area damage',
        cooldown: 50,
        duration: 15,
        active: false,
        effect: DAMAGE_BOOST_EFFECT,
      },
    ],
  },
} as const;
