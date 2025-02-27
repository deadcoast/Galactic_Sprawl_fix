export interface Ship {
  id: string;
  name: string;
  type: 'recon' | 'mining' | 'war' | 'energy';
  currentTask?: string;
  completedMissions?: number;
  capabilities: {
    speed: number;
    range: number;
    cargo?: number;
    weapons?: number;
    stealth?: number;
  };
  status: {
    position: {
      x: number;
      y: number;
    };
    destination?: {
      x: number;
      y: number;
    };
  };
} 