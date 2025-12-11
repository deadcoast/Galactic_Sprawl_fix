// Use type-only import to break circular dependency
import type { ResourceType } from "./ResourceTypes";

export enum ProcessStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  FAILED = "failed",
  PAUSED = "paused",
}

export enum ChainProcessingStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  FAILED = "failed",
  PAUSED = "paused",
}

export enum ResourceTransferStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
}

/**
 * Represents the status of a single step within a production chain.
 */
export interface ChainStepStatus {
  recipeId: string;
  converterId: string;
  processId?: string;
  status: ProcessStatus;
  startTime?: number;
  endTime?: number;
}

/**
 * Represents the status of a resource transfer between chain steps.
 */
export interface ChainResourceTransferStatus {
  type: ResourceType;
  amount: number;
  fromStep: number;
  toStep: number;
  status: ResourceTransferStatus;
}

/**
 * Represents the overall status and progress of a multi-step production chain.
 */
export interface ProductionChainStatus {
  chainId: string;
  currentStepIndex: number;
  recipeIds: string[]; // The sequence of recipes in the chain
  startTime: number;
  estimatedEndTime?: number; // Optional: Might not always be calculable
  progress: number; // Overall chain progress (0 to 1)
  stepStatus: ChainStepStatus[];
  resourceTransfers: ChainResourceTransferStatus[];
  active: boolean;
  paused: boolean;
  completed: boolean;
  failed: boolean;
  errorMessage?: string;
}
