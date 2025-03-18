import { ShipType } from '../../types/ships/CommonShipTypes';

export type SalvageRarity = 'common' | 'rare' | 'epic';
export type SalvageType = 'resources' | 'components' | 'technology';

export interface Salvage {
  id: string;
  type: SalvageType;
  name: string;
  amount: number;
  rarity: SalvageRarity;
  position: { x: number; y: number };
  collected: boolean;
}

export interface SalvageCapability {
  canSalvage: boolean;
  reason?: 'mining-ship' | 'recon-ship' | 'cutting-laser' | 'none';
}

export interface SalvageDropConfig {
  baseDropRate: number;
  rarityWeights: {
    common: number;
    rare: number;
    epic: number;
  };
  typeWeights: {
    resources: number;
    components: number;
    technology: number;
  };
}

export interface SalvageManager {
  checkSalvageCapability: (ship: ShipType) => SalvageCapability;
  generateSalvageDrops: (position: { x: number; y: number }, tier: number) => Salvage[];
  collectSalvage: (salvageId: string, shipId: string) => void;
  getActiveSalvage: () => Salvage[];
}
