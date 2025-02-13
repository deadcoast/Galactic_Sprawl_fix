/**
 * Officer system types and interfaces
 * @module OfficerTypes
 */

import { ModuleType } from '../buildings/ModuleTypes';

// Base Types
// ------------------------------------------------------------

/**
 * Officer roles
 */
export type OfficerRole = "Squad Leader" | "Captain";

/**
 * Officer specializations
 */
export type OfficerSpecialization = "War" | "Recon" | "Mining";

/**
 * Officer status
 */
export type OfficerStatus = "available" | "training" | "assigned";

/**
 * Officer tier
 */
export type OfficerTier = 1 | 2 | 3;

/**
 * Officer skills
 */
export interface OfficerSkills {
  combat: number;
  leadership: number;
  technical: number;
}

// Core Interfaces
// ------------------------------------------------------------

/**
 * Base officer interface
 */
export interface Officer {
  id: string;
  name: string;
  portrait: string;
  level: number;
  xp: number;
  nextLevelXp: number;
  role: OfficerRole;
  status: OfficerStatus;
  specialization: OfficerSpecialization;
  skills: OfficerSkills;
  assignedTo?: string;
  trainingProgress?: number;
  traits: string[];
  stats: OfficerSkills;
}

/**
 * Squad interface
 */
export interface Squad {
  id: string;
  name: string;
  leader?: Officer;
  members: Officer[];
  specialization: OfficerSpecialization;
  bonuses: {
    combat: number;
    efficiency: number;
    survival: number;
  };
}

/**
 * Training program interface
 */
export interface TrainingProgram {
  id: string;
  officerId: string;
  specialization: OfficerSpecialization;
  progress: number;
  startTime: number;
  duration: number;
  bonuses: {
    xpMultiplier: number;
    skillGainRate: number;
  };
}

// Event Types
// ------------------------------------------------------------

/**
 * Officer event types
 */
export type OfficerEventType =
  | "officerHired"
  | "officerAssigned"
  | "trainingStarted"
  | "trainingCompleted"
  | "experienceGained"
  | "officerLeveledUp"
  | "squadCreated"
  | "squadUpdated"
  | "squadBonusesUpdated"
  | "tierUpgraded"
  | "academyActivated";

/**
 * Officer event interface
 */
export interface OfficerEvent {
  type: OfficerEventType;
  officerId?: string;
  squadId?: string;
  data?: any;
  timestamp: number;
}

// Manager Interface
// ------------------------------------------------------------

/**
 * Officer manager interface
 */
export interface OfficerManager {
  hireOfficer(role: OfficerRole, specialization: OfficerSpecialization): Officer;
  startTraining(officerId: string, specialization: OfficerSpecialization): void;
  assignOfficer(officerId: string, assignmentId: string): void;
  createSquad(name: string, specialization: OfficerSpecialization): Squad;
  assignToSquad(officerId: string, squadId: string): void;
  addExperience(officerId: string, amount: number, activity?: string): void;
  update(deltaTime: number): void;
  getOfficer(id: string): Officer | undefined;
  getSquad(id: string): Squad | undefined;
  getAvailableOfficers(): Officer[];
  getSquadsBySpecialization(specialization: OfficerSpecialization): Squad[];
  getCurrentTier(): OfficerTier;
}

// Configuration Types
// ------------------------------------------------------------

/**
 * Officer trait configuration
 */
export interface OfficerTrait {
  id: string;
  name: string;
  description: string;
  effects: {
    skills?: Partial<OfficerSkills>;
    bonuses?: {
      xpGain?: number;
      trainingSpeed?: number;
      squadBonus?: number;
    };
  };
}

/**
 * Training configuration
 */
export interface TrainingConfig {
  baseTime: number;
  levelModifier: number;
  specializationModifier: number;
  xpMultiplier: number;
  skillGainRate: number;
}

/**
 * Squad configuration
 */
export interface SquadConfig {
  maxSize: number;
  bonusMultipliers: {
    combat: number;
    efficiency: number;
    survival: number;
  };
  leadershipBonus: number;
}

export interface OfficerEvents {
  officerHired: {
    officer: Officer;
  };
  officerLeveledUp: {
    officerId: string;
    newLevel: number;
    skills: OfficerSkills;
  };
  experienceGained: {
    officerId: string;
    amount: number;
    newTotal: number;
    nextLevel: number;
  };
  trainingStarted: {
    officerId: string;
    program: TrainingProgram;
  };
  trainingCompleted: {
    officerId: string;
    specialization: OfficerSpecialization;
    skills: OfficerSkills;
  };
  officerAssigned: {
    officerId: string;
    assignmentId: string;
  };
  squadCreated: {
    squad: Squad;
  };
  squadUpdated: {
    squadId: string;
    officer: string;
  };
  tierUpgraded: {
    tier: OfficerTier;
  };
  academyActivated: {
    moduleId: string;
  };
} 