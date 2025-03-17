import { ResourceType } from "./../resources/ResourceTypes";export interface Ship {
  id: string;
  name: string;
  type: 'recon' | 'mining' | 'war' | ResourceType.ENERGY;
  currentTask?: string;
  completedMissions?: number;
  capabilities: {
    speed: number;
    range: number;
    cargo?: number;
    weapons?: number;
    stealth?: number;
  };
  status: 'idle' | 'scanning' | 'investigating' | 'returning';
  experience: number;
  stealthActive: boolean;
  position: {
    x: number;
    y: number;
  };
  destination?: {
    x: number;
    y: number;
  };
}
