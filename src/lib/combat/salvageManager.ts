import {
  Salvage,
  SalvageCapability,
  SalvageDropConfig,
  SalvageManager,
} from "../../types/combat/SalvageTypes";
import { ShipType } from "../../types/ships/CommonShipTypes";
import { v4 as uuidv4 } from "uuid";

const DEFAULT_DROP_CONFIG: SalvageDropConfig = {
  baseDropRate: 0.5,
  rarityWeights: {
    common: 0.7,
    rare: 0.25,
    epic: 0.05,
  },
  typeWeights: {
    resources: 0.6,
    components: 0.3,
    technology: 0.1,
  },
};

class SalvageManagerImpl implements SalvageManager {
  private activeSalvage: Salvage[] = [];
  private dropConfig: SalvageDropConfig;
  private techTree: { unlockedNodes: Set<string> };

  constructor(
    dropConfig = DEFAULT_DROP_CONFIG,
    techTree: { unlockedNodes: Set<string> },
  ) {
    this.dropConfig = dropConfig;
    this.techTree = techTree;
  }

  checkSalvageCapability(ship: ShipType): SalvageCapability {
    // Mining ships can always salvage
    if (ship.type.includes("mining")) {
      return { canSalvage: true, reason: "mining-ship" };
    }

    // Recon ships can always salvage
    if (ship.type.includes("recon")) {
      return { canSalvage: true, reason: "recon-ship" };
    }

    // War ships can salvage if they have the cutting laser upgrade
    if (this.techTree.unlockedNodes.has("cutting-laser")) {
      return { canSalvage: true, reason: "cutting-laser" };
    }

    return { canSalvage: false, reason: "none" };
  }

  generateSalvageDrops(
    position: { x: number; y: number },
    tier: number,
  ): Salvage[] {
    if (Math.random() > this.dropConfig.baseDropRate) {
      return [];
    }

    const numDrops = Math.floor(Math.random() * 3) + 1; // 1-3 drops
    const drops: Salvage[] = [];

    for (let i = 0; i < numDrops; i++) {
      // Determine rarity
      const rarityRoll = Math.random();
      let rarity: Salvage["rarity"];
      if (rarityRoll < this.dropConfig.rarityWeights.epic) {
        rarity = "epic";
      } else if (
        rarityRoll <
        this.dropConfig.rarityWeights.epic + this.dropConfig.rarityWeights.rare
      ) {
        rarity = "rare";
      } else {
        rarity = "common";
      }

      // Determine type
      const typeRoll = Math.random();
      let type: Salvage["type"];
      if (typeRoll < this.dropConfig.typeWeights.technology) {
        type = "technology";
      } else if (
        typeRoll <
        this.dropConfig.typeWeights.technology +
          this.dropConfig.typeWeights.components
      ) {
        type = "components";
      } else {
        type = "resources";
      }

      // Generate salvage item
      const salvage: Salvage = {
        id: uuidv4(),
        type,
        name: this.generateSalvageName(type, rarity, tier),
        amount: this.calculateAmount(type, rarity, tier),
        rarity,
        position: {
          x: position.x + (Math.random() - 0.5) * 50, // Spread drops slightly
          y: position.y + (Math.random() - 0.5) * 50,
        },
        collected: false,
      };

      drops.push(salvage);
    }

    this.activeSalvage.push(...drops);
    return drops;
  }

  collectSalvage(salvageId: string, shipId: string): void {
    const salvageIndex = this.activeSalvage.findIndex(
      (s) => s.id === salvageId,
    );
    if (salvageIndex >= 0) {
      this.activeSalvage[salvageIndex].collected = true;
    }
  }

  getActiveSalvage(): Salvage[] {
    return this.activeSalvage.filter((s) => !s.collected);
  }

  private generateSalvageName(
    type: Salvage["type"],
    rarity: Salvage["rarity"],
    tier: number,
  ): string {
    const prefix =
      rarity === "epic"
        ? "Ancient"
        : rarity === "rare"
          ? "Advanced"
          : "Standard";

    switch (type) {
      case "resources":
        return `${prefix} ${tier === 3 ? "Dark Matter" : tier === 2 ? "Plasma" : "Metal"} Crystal`;
      case "components":
        return `${prefix} ${tier === 3 ? "Quantum" : tier === 2 ? "Enhanced" : "Basic"} Components`;
      case "technology":
        return `${prefix} ${tier === 3 ? "Forbidden" : tier === 2 ? "Experimental" : "Prototype"} Tech`;
    }
  }

  private calculateAmount(
    type: Salvage["type"],
    rarity: Salvage["rarity"],
    tier: number,
  ): number {
    const baseAmount =
      type === "resources" ? 100 : type === "components" ? 50 : 25;
    const rarityMultiplier = rarity === "epic" ? 3 : rarity === "rare" ? 2 : 1;
    const tierMultiplier = tier;

    return Math.floor(baseAmount * rarityMultiplier * tierMultiplier);
  }
}

export const salvageManager = new SalvageManagerImpl(DEFAULT_DROP_CONFIG, {
  unlockedNodes: new Set(),
});
