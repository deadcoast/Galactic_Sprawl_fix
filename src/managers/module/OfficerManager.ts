import { v4 as uuidv4 } from 'uuid';
import { OFFICER_TRAITS, SQUAD_CONFIG, TRAINING_CONFIG } from '../../config/OfficerConfig';
import { TypedEventEmitter } from '../../lib/events/EventEmitter';
import { ModuleEvent, moduleEventBus, ModuleEventType } from '../../lib/modules/ModuleEvents';
import { TechTreeManager } from '../../managers/game/techTreeManager';
import type { ModuleType } from '../../types/buildings/ModuleTypes';
import type {
  OfficerManager as IOfficerManager,
  Officer,
  OfficerEvents,
  OfficerRole,
  OfficerSkills,
  OfficerSpecialization,
  OfficerTier,
  Squad,
  TrainingProgram,
} from '../../types/officers/OfficerTypes';

type TechNodeUnlockedEvent = {
  nodeId: string;
  node: {
    type: string;
    tier: number;
  };
};

/**
 * Implementation of the Officer Manager
 * Handles officer hiring, training, assignment, squad management, and progression
 */
export class OfficerManager extends TypedEventEmitter<OfficerEvents> implements IOfficerManager {
  private officers: Map<string, Officer> = new Map();
  private squads: Map<string, Squad> = new Map();
  private trainingPrograms: Map<string, TrainingProgram> = new Map();
  private currentTier: OfficerTier = 1;
  private moduleId: string = 'academy'; // Default module ID for academy

  constructor() {
    super();
    this.setupEventListeners();
  }

  /**
   * Set up event listeners for tech tree unlocks and other relevant events
   */
  private setupEventListeners(): void {
    const techTreeInstance = TechTreeManager.getInstance();
    if (techTreeInstance) {
      techTreeInstance.on('nodeUnlocked', ((event: TechNodeUnlockedEvent) => {
        if (event?.node.type === 'academy') {
          this.handleAcademyUpgrade(event?.node.tier as OfficerTier);
        }
      }) as (data: unknown) => void);
    }

    moduleEventBus.subscribe('MODULE_ACTIVATED', (event: ModuleEvent) => {
      if (event?.moduleType === 'academy') {
        this.moduleId = event?.moduleId;
        this.emit('academyActivated', { moduleId: event?.moduleId });
      }
    });
  }

  /**
   * Handle academy tier upgrades
   */
  private handleAcademyUpgrade(tier: OfficerTier): void {
    if (tier > this.currentTier) {
      this.currentTier = tier;
      this.emit('tierUpgraded', { tier });
      moduleEventBus.emit({
        type: 'MODULE_UPGRADED',
        moduleId: this.moduleId,
        moduleType: 'academy' as ModuleType,
        timestamp: Date.now(),
        data: { tier },
      });
    }
  }

  /**
   * Generate base stats for a new officer based on role and specialization
   */
  private generateBaseStats(
    role: OfficerRole,
    specialization: OfficerSpecialization
  ): OfficerSkills {
    const baseStats: OfficerSkills = {
      combat: 1,
      leadership: 1,
      technical: 1,
    };

    // Adjust based on role
    if (role === 'Squad Leader') {
      baseStats.leadership += 2;
    }

    // Adjust based on specialization
    switch (specialization) {
      case 'War':
        baseStats.combat += 2;
        break;
      case 'Recon':
        baseStats.technical += 1;
        baseStats.combat += 1;
        break;
      case 'Mining':
        baseStats.technical += 2;
        break;
    }

    return baseStats;
  }

  /**
   * Generate random traits for a new officer
   */
  private generateTraits(): string[] {
    const numTraits = Math.floor(Math.random() * 2) + 1; // 1-2 traits
    const availableTraits = [...OFFICER_TRAITS];
    const selectedTraits: string[] = [];

    for (let i = 0; i < numTraits; i++) {
      if (availableTraits.length === 0) {
        break;
      }
      const index = Math.floor(Math.random() * availableTraits.length);
      selectedTraits.push(availableTraits[index].id);
      availableTraits.splice(index, 1);
    }

    return selectedTraits;
  }

  /**
   * Apply trait effects to an officer's stats
   */
  private applyTraitEffects(officer: Officer): void {
    officer.traits.forEach(traitId => {
      const trait = OFFICER_TRAITS.find(t => t.id === traitId);
      if (trait?.effects.skills) {
        Object.entries(trait.effects.skills).forEach(([skill, value]) => {
          officer.skills[skill as keyof typeof officer.skills] += value;
        });
      }
    });
  }

  /**
   * Calculate training duration based on officer and program
   */
  private calculateTrainingDuration(
    officer: Officer,
    specialization: OfficerSpecialization
  ): number {
    let duration = TRAINING_CONFIG.baseTime;

    // Apply level modifier
    duration *= 1 - (officer.level - 1) * TRAINING_CONFIG.levelModifier;

    // Apply specialization modifier
    if (officer.specialization === specialization) {
      duration *= 1 - TRAINING_CONFIG.specializationModifier;
    }

    // Apply trait modifiers
    officer.traits.forEach(traitId => {
      const trait = OFFICER_TRAITS.find(t => t.id === traitId);
      if (trait?.effects.bonuses?.trainingSpeed) {
        duration *= 1 - trait.effects.bonuses.trainingSpeed;
      }
    });

    return Math.max(duration, TRAINING_CONFIG.baseTime * 0.5); // Minimum 50% of base time
  }

  /**
   * Calculate XP multiplier based on officer traits and current activity
   */
  private calculateXpMultiplier(officer: Officer, activity?: string): number {
    let multiplier = TRAINING_CONFIG.xpMultiplier;

    // Apply trait bonuses
    officer.traits.forEach(traitId => {
      const trait = OFFICER_TRAITS.find(t => t.id === traitId);
      if (trait?.effects.bonuses?.xpGain) {
        multiplier *= 1 + trait.effects.bonuses.xpGain;
      }
    });

    // Apply activity-specific bonuses
    if (activity === 'training') {
      multiplier *= 1.5; // 50% bonus XP during training
    } else if (activity === 'combat') {
      multiplier *= 2.0; // 100% bonus XP during combat
    }

    return multiplier;
  }

  /**
   * Calculate next level XP requirement using a progressive scale
   */
  private calculateNextLevelXp(currentLevel: number): number {
    return Math.floor(100 * Math.pow(1.5, currentLevel - 1));
  }

  /**
   * Improve officer skills based on level up and specialization
   */
  private improveSkills(officer: Officer): void {
    // Base skill improvements
    const improvements: OfficerSkills = {
      combat: 0,
      leadership: 0,
      technical: 0,
    };

    // Specialization-based improvements
    switch (officer.specialization) {
      case 'War':
        improvements.combat += 2;
        improvements.leadership += 1;
        break;
      case 'Recon':
        improvements.technical += 1;
        improvements.combat += 1;
        improvements.leadership += 1;
        break;
      case 'Mining':
        improvements.technical += 2;
        improvements.leadership += 1;
        break;
    }

    // Role-based improvements
    if (officer.role === 'Squad Leader') {
      improvements.leadership += 1;
    }

    // Apply improvements
    Object.entries(improvements).forEach(([skill, value]) => {
      officer.skills[skill as keyof OfficerSkills] += value;
    });

    // Update stats to match skills
    officer.stats = { ...officer.skills };
  }

  /**
   * Hire a new officer
   */
  public hireOfficer(role: OfficerRole, specialization: OfficerSpecialization): Officer {
    const id = uuidv4();
    const baseStats = this.generateBaseStats(role, specialization);
    const traits = this.generateTraits();

    const officer: Officer = {
      id,
      name: `Officer-${id.substring(0, 4)}`, // Temporary name generation
      portrait: '', // TODO: Implement portrait generation
      level: 1,
      xp: 0,
      nextLevelXp: 100,
      role,
      status: 'available',
      specialization,
      skills: { ...baseStats },
      traits,
      stats: { ...baseStats },
    };

    this.applyTraitEffects(officer);
    this.officers.set(id, officer);
    this.emit('officerHired', { officer });
    this.emitModuleEvent('MODULE_CREATED', { officer });
    return officer;
  }

  /**
   * Start training an officer
   */
  public startTraining(officerId: string, specialization: OfficerSpecialization): void {
    const officer = this.officers.get(officerId);
    if (!officer || officer.status !== 'available') {
      return;
    }

    const duration = this.calculateTrainingDuration(officer, specialization);
    const program: TrainingProgram = {
      id: uuidv4(),
      officerId,
      specialization,
      progress: 0,
      startTime: Date.now(),
      duration,
      bonuses: {
        xpMultiplier: this.calculateXpMultiplier(officer, 'training'),
        skillGainRate: TRAINING_CONFIG.skillGainRate,
      },
    };

    officer.status = 'training';
    officer.trainingProgress = 0;
    this.trainingPrograms.set(program.id, program);
    this.officers.set(officerId, officer);

    this.emit('trainingStarted', {
      officerId,
      program,
    });
    this.emitModuleEvent('AUTOMATION_STARTED', { officerId, program });
  }

  /**
   * Assign an officer to a task or location
   */
  public assignOfficer(officerId: string, assignmentId: string): void {
    const officer = this.officers.get(officerId);
    if (!officer || officer.status !== 'available') {
      return;
    }

    officer.status = 'assigned';
    officer.assignedTo = assignmentId;
    this.officers.set(officerId, officer);

    this.emit('officerAssigned', {
      officerId,
      assignmentId,
    });
    this.emitModuleEvent('STATUS_CHANGED', { officerId, assignmentId, status: 'assigned' });
  }

  /**
   * Create a new squad
   */
  public createSquad(name: string, specialization: OfficerSpecialization): Squad {
    const squad: Squad = {
      id: uuidv4(),
      name,
      members: [],
      specialization,
      bonuses: {
        combat: 0,
        efficiency: 0,
        survival: 0,
      },
    };

    this.squads.set(squad.id, squad);
    this.emit('squadCreated', { squad });
    this.emitModuleEvent('MODULE_CREATED', { squad });
    return squad;
  }

  /**
   * Assign an officer to a squad
   */
  public assignToSquad(officerId: string, squadId: string): void {
    const officer = this.officers.get(officerId);
    const squad = this.squads.get(squadId);

    if (!officer || !squad || officer.status !== 'available') {
      return;
    }

    // Check squad size limit
    if (squad.members.length >= SQUAD_CONFIG.maxSize) {
      return;
    }

    // If officer is Squad Leader and squad has no leader
    if (officer.role === 'Squad Leader' && !squad.leader) {
      squad.leader = officer;
    }

    squad.members.push(officer);
    officer.status = 'assigned';
    officer.assignedTo = squadId;

    this.updateSquadBonuses(squad);
    this.emit('squadUpdated', { squadId, officer: officerId });
    this.emitModuleEvent('STATUS_CHANGED', { squadId, officer: officerId });
  }

  /**
   * Update squad bonuses based on member skills and traits
   */
  private updateSquadBonuses(squad: Squad): void {
    const baseBonuses = {
      combat: 0,
      efficiency: 0,
      survival: 0,
    };

    // Add leader bonuses if present
    if (squad.leader) {
      const leaderBonus = this.calculateLeaderBonus(squad.leader);
      baseBonuses.combat += leaderBonus;
      baseBonuses.efficiency += leaderBonus;
      baseBonuses.survival += leaderBonus;
    }

    // Add member bonuses
    squad.members.forEach(member => {
      if (member !== squad.leader) {
        const memberBonus = this.calculateMemberBonus(member);
        baseBonuses.combat += memberBonus;
        baseBonuses.efficiency += memberBonus;
        baseBonuses.survival += memberBonus;
      }
    });

    // Apply multipliers
    squad.bonuses = {
      combat: baseBonuses.combat * SQUAD_CONFIG.bonusMultipliers.combat,
      efficiency: baseBonuses.efficiency * SQUAD_CONFIG.bonusMultipliers.efficiency,
      survival: baseBonuses.survival * SQUAD_CONFIG.bonusMultipliers.survival,
    };

    // Update squad in storage
    this.squads.set(squad.id, squad);
    this.emitModuleEvent('STATUS_CHANGED', { squadId: squad.id, bonuses: squad.bonuses });
  }

  /**
   * Calculate leadership bonus for squad leader
   */
  private calculateLeaderBonus(officer: Officer): number {
    let bonus = officer.skills.leadership * SQUAD_CONFIG.leadershipBonus;

    // Apply trait bonuses
    officer.traits.forEach(traitId => {
      const trait = OFFICER_TRAITS.find(t => t.id === traitId);
      if (trait?.effects.bonuses?.squadBonus) {
        bonus *= 1 + trait.effects.bonuses.squadBonus;
      }
    });

    return bonus;
  }

  /**
   * Calculate bonus contribution from squad member
   */
  private calculateMemberBonus(officer: Officer): number {
    let bonus = 0;

    // Add skill contributions
    switch (officer.specialization) {
      case 'War':
        bonus += officer.skills.combat * 0.5;
        break;
      case 'Recon':
        bonus += (officer.skills.combat + officer.skills.technical) * 0.25;
        break;
      case 'Mining':
        bonus += officer.skills.technical * 0.5;
        break;
    }

    // Apply trait bonuses
    officer.traits.forEach(traitId => {
      const trait = OFFICER_TRAITS.find(t => t.id === traitId);
      if (trait?.effects.bonuses?.squadBonus) {
        bonus *= 1 + trait.effects.bonuses.squadBonus;
      }
    });

    return bonus;
  }

  /**
   * Add experience to an officer and handle level ups
   */
  public addExperience(officerId: string, amount: number, activity?: string): void {
    const officer = this.officers.get(officerId);
    if (!officer) {
      return;
    }

    const multiplier = this.calculateXpMultiplier(officer, activity);
    const adjustedAmount = Math.floor(amount * multiplier);

    officer.xp += adjustedAmount;

    // Handle level ups
    while (officer.xp >= officer.nextLevelXp) {
      officer.xp -= officer.nextLevelXp;
      officer.level += 1;
      officer.nextLevelXp = this.calculateNextLevelXp(officer.level);
      this.improveSkills(officer);

      // Emit level up event
      this.emit('officerLeveledUp', {
        officerId,
        newLevel: officer.level,
        skills: officer.skills,
      });
    }

    // Update officer in storage
    this.officers.set(officerId, officer);

    // Emit experience gained event
    this.emit('experienceGained', {
      officerId,
      amount: adjustedAmount,
      newTotal: officer.xp,
      nextLevel: officer.nextLevelXp,
    });
    this.emitModuleEvent('STATUS_CHANGED', {
      officerId,
      amount: adjustedAmount,
      newTotal: officer.xp,
      nextLevel: officer.nextLevelXp,
    });
  }

  /**
   * Update training programs and apply experience
   */
  public update(deltaTime: number): void {
    // Update training programs
    this.trainingPrograms.forEach((program, programId) => {
      const officer = this.officers.get(program.officerId);
      if (!officer) {
        this.trainingPrograms.delete(programId);
        return;
      }

      program.progress += deltaTime;
      if (program.progress >= program.duration) {
        this.completeTraining(programId);
      } else {
        // Update training progress
        officer.trainingProgress = program.progress / program.duration;
        this.officers.set(officer.id, officer);
      }
    });

    // Update squad bonuses
    this.squads.forEach(squad => {
      this.updateSquadBonuses(squad);
    });
  }

  /**
   * Complete a training program
   */
  private completeTraining(programId: string): void {
    const program = this.trainingPrograms.get(programId);
    if (!program) {
      return;
    }

    const officer = this.officers.get(program.officerId);
    if (!officer) {
      this.trainingPrograms.delete(programId);
      return;
    }

    // Apply training results
    officer.status = 'available';
    officer.trainingProgress = undefined;

    // Improve skills based on training
    const skillImprovement = Math.floor(
      (program.duration * program.bonuses.skillGainRate) / TRAINING_CONFIG.baseTime
    );

    switch (program.specialization) {
      case 'War':
        officer.skills.combat += skillImprovement;
        break;
      case 'Recon':
        officer.skills.combat += Math.floor(skillImprovement / 2);
        officer.skills.technical += Math.floor(skillImprovement / 2);
        break;
      case 'Mining':
        officer.skills.technical += skillImprovement;
        break;
    }

    // Update stats
    officer.stats = { ...officer.skills };

    // Add experience
    this.addExperience(officer.id, 100, 'training');

    // Update storage
    this.officers.set(officer.id, officer);
    this.trainingPrograms.delete(programId);

    // Emit completion event
    this.emit('trainingCompleted', {
      officerId: officer.id,
      specialization: program.specialization,
      skills: officer.skills,
    });
    this.emitModuleEvent('AUTOMATION_CYCLE_COMPLETE', {
      officerId: officer.id,
      specialization: program.specialization,
      skills: officer.skills,
    });
  }

  /**
   * Get an officer by ID
   */
  public getOfficer(id: string): Officer | undefined {
    return this.officers.get(id);
  }

  /**
   * Get a squad by ID
   */
  public getSquad(id: string): Squad | undefined {
    return this.squads.get(id);
  }

  /**
   * Get all available officers
   */
  public getAvailableOfficers(): Officer[] {
    return Array.from(this.officers.values()).filter(officer => officer.status === 'available');
  }

  /**
   * Get all squads of a specific specialization
   */
  public getSquadsBySpecialization(specialization: OfficerSpecialization): Squad[] {
    return Array.from(this.squads.values()).filter(
      squad => squad.specialization === specialization
    );
  }

  /**
   * Get current academy tier
   */
  public getCurrentTier(): OfficerTier {
    return this.currentTier;
  }

  private emitModuleEvent(type: ModuleEventType, data: Record<string, unknown>): void {
    moduleEventBus.emit({
      type,
      moduleId: 'officer-manager',
      moduleType: 'academy' as ModuleType,
      timestamp: Date.now(),
      data,
    });
  }
}
