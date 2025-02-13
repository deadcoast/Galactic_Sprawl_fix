import {
  EquatorHorizonConfig,
  FactionConfig,
  LostNovaConfig,
  SpaceRatsConfig,
} from "../../types/factions/FactionTypes";
import {
  EquatorHorizonShipClass,
  LostNovaShipClass,
  SpaceRatsShipClass,
} from "../../types/ships/CommonShipTypes";

export const spaceRatsConfig: SpaceRatsConfig = {
  id: "spaceRats",
  name: "Space Rats",
  banner: {
    primaryColor: "#FF0000", // Red
    secondaryColor: "#000000", // Black
    sigil: "rat-skull",
  },
  defaultBehavior: "aggressive",
  spawnConditions: {
    minThreatLevel: 0, // Always hostile
    maxShipsPerFleet: 8,
    territoryPreference: ["asteroid-fields", "trade-routes", "mining-sectors"],
  },
  pirateFleetComposition: {
    flagshipType: "ratKing",
    supportShips: [
      "asteroidMarauder",
      "rogueNebula",
      "darkSectorCorsair",
      "wailingWreck",
    ],
  },
};

export const lostNovaConfig: LostNovaConfig = {
  id: "lostNova",
  name: "Lost Nova",
  banner: {
    primaryColor: "#00FFFF", // Teal
    secondaryColor: "#800080", // Purple
    sigil: "broken-star",
  },
  defaultBehavior: "stealth",
  spawnConditions: {
    minThreatLevel: 0.3, // Only appears when somewhat threatened
    maxShipsPerFleet: 6,
    territoryPreference: ["dark-sectors", "nebulae", "void-regions"],
  },
  forbiddenTech: {
    darkMatterLevel: 3,
    geneticModifications: [
      "neural-enhancement",
      "void-adaptation",
      "temporal-shifting",
    ],
  },
};

export const equatorHorizonConfig: EquatorHorizonConfig = {
  id: "equatorHorizon",
  name: "Equator Horizon",
  banner: {
    primaryColor: "#FFD700", // Gold
    secondaryColor: "#4B0082", // Indigo
    sigil: "ancient-wheel",
  },
  defaultBehavior: "balance",
  spawnConditions: {
    minThreatLevel: 0.7, // Only appears when player is powerful
    maxShipsPerFleet: 10,
    territoryPreference: [
      "ancient-ruins",
      "stellar-anomalies",
      "temporal-rifts",
    ],
  },
  balanceThresholds: {
    playerExpansion: 0.7, // 70% of available systems
    resourceControl: 0.6, // 60% of total resources
    techLevel: 3, // Tier 3 technology
  },
};

// Ship class configurations
export const shipClassConfigs = {
  spaceRats: {
    classes: [
      "ratKing",
      "asteroidMarauder",
      "rogueNebula",
      "ratsRevenge",
      "darkSectorCorsair",
      "wailingWreck",
      "galacticScourge",
      "plasmaFang",
      "verminVanguard",
      "blackVoidBuccaneer",
    ] as SpaceRatsShipClass[],
  },
  lostNova: {
    classes: [
      "eclipseScythe",
      "nullsRevenge",
      "darkMatterReaper",
      "quantumPariah",
      "entropyScale",
      "voidRevenant",
      "scytheOfAndromeda",
      "nebularPersistence",
      "oblivionsWake",
      "forbiddenVanguard",
    ] as LostNovaShipClass[],
  },
  equatorHorizon: {
    classes: [
      "celestialArbiter",
      "etherealGalleon",
      "stellarEquinox",
      "chronosSentinel",
      "nebulasJudgement",
      "aetherialHorizon",
      "cosmicCrusader",
      "balancekeepersWrath",
      "eclipticWatcher",
      "harmonysVanguard",
    ] as EquatorHorizonShipClass[],
  },
};

export const factionIds = ["space-rats", "lost-nova", "equator-horizon"] as const;

export const factionConfigs: Record<typeof factionIds[number], FactionConfig> = {
  "space-rats": spaceRatsConfig,
  "lost-nova": lostNovaConfig,
  "equator-horizon": equatorHorizonConfig,
};
