import { EventEmitter } from "../utils/EventEmitter";
import { moduleEventBus } from "../modules/ModuleEvents";
import { ModuleType } from "../../types/buildings/ModuleTypes";
import { techTreeManager } from "../game/techTreeManager";

// Types
export type OfficerRole = "Squad Leader" | "Captain";
export type OfficerSpecialization = "War" | "Recon" | "Mining";
export type OfficerStatus = "available" | "training" | "assigned";
export type OfficerTier = 1 | 2 | 3;

export interface OfficerSkills {
  combat: number;
  leadership: number;
  technical: number;
}

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

class OfficerManagerImpl extends EventEmitter {
  private officers: Map<string, Officer> = new Map();
  private squads: Map<string, Squad> = new Map();
  private trainingPrograms: Map<string, TrainingProgram> = new Map();
  private tier: OfficerTier = 1;

  constructor() {
    super();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for tech tree unlocks that affect the academy
    techTreeManager.on("nodeUnlocked", (event: { nodeId: string; node: any }) => {
      if (event.nodeId === "refugee-market") {
        this.tier = 2;
        this.emit("tierUpgraded", { tier: 2 });
      } else if (event.nodeId === "indoctrination") {
        this.tier = 3;
        this.emit("tierUpgraded", { tier: 3 });
      }
    });

    // Listen for module events
    moduleEventBus.subscribe("MODULE_ACTIVATED", (event) => {
      if (event.moduleType === "academy") {
        this.emit("academyActivated", { moduleId: event.moduleId });
      }
    });
  }

  // Officer Management
  public hireOfficer(role: OfficerRole, specialization: OfficerSpecialization): Officer {
    const officer: Officer = {
      id: `officer-${Date.now()}`,
      name: this.generateOfficerName(),
      portrait: this.generatePortrait(),
      level: 1,
      xp: 0,
      nextLevelXp: 1000,
      role,
      status: "available",
      specialization,
      skills: this.generateInitialSkills(specialization),
      traits: this.generateTraits(specialization),
      stats: {
        combat: 0,
        leadership: 0,
        technical: 0
      }
    };

    this.officers.set(officer.id, officer);
    this.emit("officerHired", { officer });
    moduleEventBus.emit({
      type: "MODULE_ACTIVATED",
      moduleId: officer.id,
      moduleType: "academy" as ModuleType,
      timestamp: Date.now(),
      data: { officer }
    });

    return officer;
  }

  public startTraining(officerId: string, specialization: OfficerSpecialization): void {
    const officer = this.officers.get(officerId);
    if (!officer || officer.status !== "available") {
      return;
    }

    const program: TrainingProgram = {
      id: `training-${Date.now()}`,
      officerId,
      specialization,
      progress: 0,
      startTime: Date.now(),
      duration: this.calculateTrainingDuration(officer, specialization),
      bonuses: this.calculateTrainingBonuses(officer, specialization)
    };

    officer.status = "training";
    officer.trainingProgress = 0;
    this.trainingPrograms.set(program.id, program);

    this.emit("trainingStarted", { officerId, program });
    moduleEventBus.emit({
      type: "AUTOMATION_STARTED",
      moduleId: officerId,
      moduleType: "academy" as ModuleType,
      timestamp: Date.now(),
      data: { program }
    });
  }

  public assignOfficer(officerId: string, assignmentId: string): void {
    const officer = this.officers.get(officerId);
    if (!officer || officer.status !== "available") {
      return;
    }

    officer.status = "assigned";
    officer.assignedTo = assignmentId;

    this.emit("officerAssigned", { officerId, assignmentId });
    moduleEventBus.emit({
      type: "STATUS_CHANGED",
      moduleId: officerId,
      moduleType: "academy" as ModuleType,
      timestamp: Date.now(),
      data: { status: "assigned", assignmentId }
    });
  }

  // Squad Management
  public createSquad(name: string, specialization: OfficerSpecialization): Squad {
    const squad: Squad = {
      id: `squad-${Date.now()}`,
      name,
      members: [],
      specialization,
      bonuses: {
        combat: 0,
        efficiency: 0,
        survival: 0
      }
    };

    this.squads.set(squad.id, squad);
    this.emit("squadCreated", { squad });
    return squad;
  }

  public assignToSquad(officerId: string, squadId: string): void {
    const officer = this.officers.get(officerId);
    const squad = this.squads.get(squadId);
    if (!officer || !squad || officer.status !== "available") {
      return;
    }

    // If officer is Squad Leader and squad has no leader
    if (officer.role === "Squad Leader" && !squad.leader) {
      squad.leader = officer;
    }
    
    squad.members.push(officer);
    officer.status = "assigned";
    officer.assignedTo = squadId;

    this.updateSquadBonuses(squadId);
    this.emit("squadUpdated", { squadId, officer: officerId });
  }

  // Experience & Leveling
  public addExperience(officerId: string, amount: number): void {
    const officer = this.officers.get(officerId);
    if (!officer) {
      return;
    }

    officer.xp += amount;
    while (officer.xp >= officer.nextLevelXp) {
      this.levelUp(officer);
    }

    this.emit("experienceGained", { officerId, amount });
  }

  private levelUp(officer: Officer): void {
    officer.xp -= officer.nextLevelXp;
    officer.level += 1;
    officer.nextLevelXp = this.calculateNextLevelXp(officer.level);

    // Improve skills based on specialization
    this.improveSkills(officer);

    this.emit("officerLeveledUp", { 
      officerId: officer.id, 
      newLevel: officer.level,
      skills: officer.skills 
    });
  }

  // Update Loop
  public update(deltaTime: number): void {
    // Update training programs
    this.trainingPrograms.forEach((program, programId) => {
      const officer = this.officers.get(program.officerId);
      if (!officer) {
        return;
      }

      const elapsed = Date.now() - program.startTime;
      const newProgress = Math.min(1, elapsed / program.duration);
      
      program.progress = newProgress;
      officer.trainingProgress = newProgress;

      if (newProgress >= 1) {
        this.completeTraining(programId);
      }
    });

    // Update squad bonuses
    this.squads.forEach(squad => {
      this.updateSquadBonuses(squad.id);
    });
  }

  // Helper Methods
  private completeTraining(programId: string): void {
    const program = this.trainingPrograms.get(programId);
    if (!program) {
      return;
    }

    const officer = this.officers.get(program.officerId);
    if (!officer) {
      return;
    }

    // Apply training results
    officer.specialization = program.specialization;
    officer.status = "available";
    officer.trainingProgress = undefined;

    // Grant experience
    const baseXP = 1000;
    const xpGained = baseXP * program.bonuses.xpMultiplier;
    this.addExperience(officer.id, xpGained);

    // Cleanup
    this.trainingPrograms.delete(programId);

    this.emit("trainingCompleted", { 
      officerId: officer.id, 
      specialization: program.specialization,
      xpGained 
    });

    moduleEventBus.emit({
      type: "AUTOMATION_CYCLE_COMPLETE",
      moduleId: officer.id,
      moduleType: "academy" as ModuleType,
      timestamp: Date.now(),
      data: { program, xpGained }
    });
  }

  private updateSquadBonuses(squadId: string): void {
    const squad = this.squads.get(squadId);
    if (!squad) {
      return;
    }

    const leaderBonus = squad.leader ? this.calculateLeaderBonus(squad.leader) : 0;
    const memberBonus = squad.members.reduce((total, member) => {
      return total + this.calculateMemberBonus(member);
    }, 0);

    squad.bonuses = {
      combat: leaderBonus * 0.5 + memberBonus * 0.2,
      efficiency: leaderBonus * 0.3 + memberBonus * 0.3,
      survival: leaderBonus * 0.2 + memberBonus * 0.5
    };

    this.emit("squadBonusesUpdated", { squadId, bonuses: squad.bonuses });
  }

  private calculateLeaderBonus(officer: Officer): number {
    return (
      officer.skills.leadership * 1.5 +
      officer.skills.combat * 0.8 +
      officer.skills.technical * 0.7
    ) * (1 + (officer.level - 1) * 0.1);
  }

  private calculateMemberBonus(officer: Officer): number {
    return (
      officer.skills.combat +
      officer.skills.technical +
      officer.skills.leadership * 0.5
    ) * (1 + (officer.level - 1) * 0.05);
  }

  private calculateTrainingDuration(officer: Officer, specialization: OfficerSpecialization): number {
    const baseTime = 300000; // 5 minutes base
    const levelModifier = 1 - (officer.level - 1) * 0.05; // 5% faster per level
    const specializationModifier = officer.specialization === specialization ? 0.8 : 1.2;
    return baseTime * levelModifier * specializationModifier;
  }

  private calculateTrainingBonuses(officer: Officer, specialization: OfficerSpecialization): TrainingProgram["bonuses"] {
    const baseMultiplier = 1.0;
    const levelBonus = (officer.level - 1) * 0.1;
    const specializationBonus = officer.specialization === specialization ? 0.2 : 0;
    
    return {
      xpMultiplier: baseMultiplier + levelBonus + specializationBonus,
      skillGainRate: baseMultiplier + levelBonus * 0.5 + specializationBonus
    };
  }

  private improveSkills(officer: Officer): void {
    const baseImprovement = 2;
    const specializationBonus = 1;

    switch (officer.specialization) {
      case "War":
        officer.skills.combat += baseImprovement + specializationBonus;
        officer.skills.leadership += baseImprovement;
        officer.skills.technical += baseImprovement - 1;
        break;
      case "Recon":
        officer.skills.combat += baseImprovement;
        officer.skills.leadership += baseImprovement - 1;
        officer.skills.technical += baseImprovement + specializationBonus;
        break;
      case "Mining":
        officer.skills.combat += baseImprovement - 1;
        officer.skills.leadership += baseImprovement;
        officer.skills.technical += baseImprovement + specializationBonus;
        break;
    }
  }

  private calculateNextLevelXp(currentLevel: number): number {
    return Math.floor(1000 * Math.pow(1.5, currentLevel - 1));
  }

  private generateInitialSkills(specialization: OfficerSpecialization): OfficerSkills {
    const baseSkill = 5;
    const specializationBonus = 3;

    switch (specialization) {
      case "War":
        return {
          combat: baseSkill + specializationBonus,
          leadership: baseSkill,
          technical: baseSkill - 1
        };
      case "Recon":
        return {
          combat: baseSkill,
          leadership: baseSkill - 1,
          technical: baseSkill + specializationBonus
        };
      case "Mining":
        return {
          combat: baseSkill - 1,
          leadership: baseSkill,
          technical: baseSkill + specializationBonus
        };
    }
  }

  private generateTraits(specialization: OfficerSpecialization): string[] {
    // Implementation would randomly select from specialization-appropriate traits
    return ["Determined", "Skilled Tactician"];
  }

  private generateOfficerName(): string {
    // Implementation would generate a random name
    return "Officer " + Math.floor(Math.random() * 1000);
  }

  private generatePortrait(): string {
    // Implementation would select/generate a portrait
    return "default_portrait";
  }

  // Getters
  public getOfficer(id: string): Officer | undefined {
    return this.officers.get(id);
  }

  public getSquad(id: string): Squad | undefined {
    return this.squads.get(id);
  }

  public getAvailableOfficers(): Officer[] {
    return Array.from(this.officers.values()).filter(
      officer => officer.status === "available"
    );
  }

  public getSquadsBySpecialization(specialization: OfficerSpecialization): Squad[] {
    return Array.from(this.squads.values()).filter(
      squad => squad.specialization === specialization
    );
  }

  public getCurrentTier(): OfficerTier {
    return this.tier;
  }
}

// Export singleton instance
export const officerManager = new OfficerManagerImpl(); 