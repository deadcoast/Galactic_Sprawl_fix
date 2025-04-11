import {
  Officer,
  OfficerSkills,
  OfficerSpecialization,
  OfficerTier,
  Squad,
  TrainingProgram,
} from '../officers/OfficerTypes';

/**
 * Defines the events emitted by the OfficerManager
 */
export interface OfficerManagerEvents {
  /** Emitted when the officer academy module is activated */
  officerAcademyActivated: {
    moduleId: string;
  };

  /** Emitted when the officer academy tier is upgraded */
  officerTierUpgraded: {
    tier: OfficerTier;
  };

  /** Emitted when a new officer is hired */
  officerHired: {
    officer: Officer;
  };

  /** Emitted when officer training starts */
  officerTrainingStarted: {
    officerId: string;
    program: TrainingProgram;
  };

  /** Emitted when an officer is assigned */
  officerAssigned: {
    officerId: string;
    assignmentId: string;
  };

  /** Emitted when a new squad is created */
  squadCreated: {
    squad: Squad;
  };

  /** Emitted when a squad is updated (e.g., officer assigned) */
  squadUpdated: {
    squadId: string;
    officerId?: string; // Officer added/removed
    // Add other potential update fields like bonuses if needed
  };

  /** Emitted when an officer gains experience */
  officerExperienceGained: {
    officerId: string;
    amount: number;
    newTotal: number;
    nextLevel: number;
  };

  /** Emitted when an officer levels up */
  officerLeveledUp: {
    officerId: string;
    newLevel: number;
    skills: OfficerSkills;
  };

  /** Emitted when officer training completes */
  officerTrainingCompleted: {
    officerId: string;
    specialization: OfficerSpecialization;
    skills: OfficerSkills;
  };

  // Index signature for compatibility
  [key: string]: unknown;
}

// Optional corresponding enum (can help with event names)
export enum OfficerEventType {
  ACADEMY_ACTIVATED = 'officerAcademyActivated',
  TIER_UPGRADED = 'officerTierUpgraded',
  OFFICER_HIRED = 'officerHired',
  TRAINING_STARTED = 'officerTrainingStarted',
  OFFICER_ASSIGNED = 'officerAssigned',
  SQUAD_CREATED = 'squadCreated',
  SQUAD_UPDATED = 'squadUpdated',
  XP_GAINED = 'officerExperienceGained',
  LEVELED_UP = 'officerLeveledUp',
  TRAINING_COMPLETED = 'officerTrainingCompleted',
}
