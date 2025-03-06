/**
 * Recon ship types
 */
export type ReconShipType = 'AC27G' | 'PathFinder' | 'VoidSeeker';

/**
 * Recon ship status
 */
export type ReconShipStatus = 'idle' | 'scanning' | 'investigating' | 'returning';

/**
 * Recon ship specialization
 */
export type ReconShipSpecialization = 'mapping' | 'anomaly' | 'resource';

/**
 * Recon ship formation role
 */
export type FormationRole = 'leader' | 'support' | 'scout';

/**
 * Recon ship interface
 */
export interface ReconShip {
  id: string;
  name: string;
  type: ReconShipType;
  status: ReconShipStatus;
  experience: number;
  specialization: ReconShipSpecialization;
  efficiency: number;
  position: { x: number; y: number };
  formationId?: string;
  formationRole?: FormationRole;
  coordinationBonus?: number;
}

/**
 * Sector status
 */
export type SectorStatus = 'unmapped' | 'mapped' | 'scanning' | 'analyzed';

/**
 * Sector interface
 */
export interface Sector {
  id: string;
  name: string;
  status: SectorStatus;
  coordinates: { x: number; y: number };
  resourcePotential: number;
  habitabilityScore: number;
}

/**
 * Fleet formation type
 */
export type FleetFormationType = 'exploration' | 'survey' | 'defensive';

/**
 * Fleet formation interface
 */
export interface FleetFormation {
  id: string;
  name: string;
  type: FleetFormationType;
  shipIds: string[];
  leaderId: string;
  position: { x: number; y: number };
  scanBonus: number;
  detectionBonus: number;
  stealthBonus: number;
  createdAt: number;
}

/**
 * Sample recon ships for testing
 */
export const reconShips: ReconShip[] = [
  {
    id: 'ship1',
    name: 'Explorer I',
    type: 'PathFinder',
    status: 'idle',
    experience: 120,
    specialization: 'mapping',
    efficiency: 0.85,
    position: { x: 150, y: 200 },
  },
  {
    id: 'ship2',
    name: 'Voyager II',
    type: 'AC27G',
    status: 'scanning',
    experience: 350,
    specialization: 'resource',
    efficiency: 0.92,
    position: { x: 180, y: 220 },
    formationId: 'formation1',
    formationRole: 'leader',
    coordinationBonus: 0.15,
  },
  {
    id: 'ship3',
    name: 'Seeker III',
    type: 'VoidSeeker',
    status: 'investigating',
    experience: 210,
    specialization: 'anomaly',
    efficiency: 0.78,
    position: { x: 190, y: 210 },
    formationId: 'formation1',
    formationRole: 'scout',
    coordinationBonus: 0.08,
  },
];

/**
 * Sample sectors for testing
 */
export const sectors: Sector[] = [
  {
    id: 'sector1',
    name: 'Alpha Quadrant',
    status: 'unmapped',
    coordinates: { x: 100, y: 100 },
    resourcePotential: 0.7,
    habitabilityScore: 0.2,
  },
  {
    id: 'sector2',
    name: 'Beta Quadrant',
    status: 'mapped',
    coordinates: { x: 200, y: 200 },
    resourcePotential: 0.4,
    habitabilityScore: 0.6,
  },
  {
    id: 'sector3',
    name: 'Gamma Quadrant',
    status: 'scanning',
    coordinates: { x: 300, y: 300 },
    resourcePotential: 0.9,
    habitabilityScore: 0.1,
  },
  {
    id: 'sector4',
    name: 'Delta Quadrant',
    status: 'analyzed',
    coordinates: { x: 400, y: 400 },
    resourcePotential: 0.3,
    habitabilityScore: 0.8,
  },
];

/**
 * Sample fleet formations for testing
 */
export const fleetFormations: FleetFormation[] = [
  {
    id: 'formation1',
    name: 'Alpha Squadron',
    type: 'exploration',
    shipIds: ['ship2', 'ship3'],
    leaderId: 'ship2',
    position: { x: 185, y: 215 },
    scanBonus: 0.2,
    detectionBonus: 0.15,
    stealthBonus: 0.1,
    createdAt: Date.now() - 86400000, // 1 day ago
  },
  {
    id: 'formation2',
    name: 'Beta Squadron',
    type: 'survey',
    shipIds: [],
    leaderId: '',
    position: { x: 250, y: 250 },
    scanBonus: 0.1,
    detectionBonus: 0.25,
    stealthBonus: 0.05,
    createdAt: Date.now() - 43200000, // 12 hours ago
  },
];

/**
 * Sample task types for testing
 */
export type ExplorationTaskType = 'explore' | 'investigate' | 'evade';

/**
 * Sample exploration tasks for testing
 */
export interface ExplorationTask {
  id: string;
  type: ExplorationTaskType;
  sectorId: string;
  shipIds: string[];
  priority: number;
  estimatedDuration: number;
  startTime?: number;
  endTime?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

/**
 * Sample exploration tasks for testing
 */
export const explorationTasks: ExplorationTask[] = [
  {
    id: 'task1',
    type: 'explore',
    sectorId: 'sector1',
    shipIds: ['ship1'],
    priority: 1,
    estimatedDuration: 3600000, // 1 hour
    status: 'pending',
  },
  {
    id: 'task2',
    type: 'investigate',
    sectorId: 'sector3',
    shipIds: ['ship2', 'ship3'],
    priority: 2,
    estimatedDuration: 7200000, // 2 hours
    startTime: Date.now() - 1800000, // Started 30 minutes ago
    endTime: Date.now() + 5400000, // Will end in 1.5 hours
    status: 'in_progress',
  },
];
