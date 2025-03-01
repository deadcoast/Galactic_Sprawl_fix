// Combat Web Worker
import { QuadTree } from '../lib/optimization/QuadTree';
import { CombatUnit } from '../types/combat/CombatTypes';
import { Hazard } from '../types/combat/HazardTypes';
import { Position } from '../types/core/GameTypes';

interface WorkerMessage {
  type: string;
  units: CombatUnit[];
  hazards: Hazard[];
  worldBounds: { width: number; height: number };
}

interface BatchedUpdate {
  weaponFires: Array<{
    weaponId: string;
    targetId: string;
    weaponType: string;
  }>;
  unitMoves: Array<{
    unitId: string;
    position: Position;
  }>;
}

// Type guard for Hazard
function _isHazard(obj: unknown): obj is Hazard {
  return (
    obj !== null &&
    obj !== undefined &&
    typeof obj === 'object' &&
    'id' in obj &&
    'position' in obj &&
    'radius' in obj &&
    'type' in obj
  );
}

// Combat state
let quadTree: QuadTree;
let lastUpdate = 0;
const UPDATE_INTERVAL = 16; // ~60fps
const BATCH_SIZE = 10;
let pendingUpdates: BatchedUpdate = {
  weaponFires: [],
  unitMoves: [],
};

// Handle combat calculations
self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type, units, hazards, worldBounds } = e.data;

  if (type === 'UPDATE') {
    const now = performance.now();
    if (now - lastUpdate < UPDATE_INTERVAL) {
      return; // Skip update if too soon
    }
    lastUpdate = now;

    // Initialize or clear quadtree
    if (!quadTree) {
      quadTree = new QuadTree({ x: 0, y: 0, width: worldBounds.width, height: worldBounds.height });
    } else {
      quadTree.clear();
    }

    // Insert units into quadtree
    units.forEach(unit => {
      quadTree.insert({
        id: unit.id,
        position: unit.position,
      });
    });

    // Process units in batches
    for (let i = 0; i < units.length; i += BATCH_SIZE) {
      const batch = units.slice(i, i + BATCH_SIZE);
      processBatch(batch, hazards);
    }

    // Send batched updates
    if (pendingUpdates.weaponFires.length > 0 || pendingUpdates.unitMoves.length > 0) {
      self.postMessage({
        type: 'BATCH_UPDATE',
        updates: pendingUpdates,
      });

      // Clear pending updates
      pendingUpdates = {
        weaponFires: [],
        unitMoves: [],
      };
    }
  }
};

function processBatch(units: CombatUnit[], hazards: Hazard[]): void {
  units.forEach(unit => {
    // Check if unit status is an object with a main property
    if (typeof unit.status === 'object' && unit.status.main === 'active') {
      processEngagingUnit(unit, hazards);
    }
  });
}

function processEngagingUnit(unit: CombatUnit, hazards: Hazard[]): void {
  // Find nearby hazards using quadtree
  const searchBounds = {
    x: unit.position.x - 500,
    y: unit.position.y - 500,
    width: 1000,
    height: 1000,
  };

  const nearbyObjects = quadTree.retrieve(searchBounds) as Array<{
    id: string;
    position: Position;
  }>;

  // Create a filtered array of hazards instead of using Set
  const nearbyHazards: Hazard[] = [];

  hazards.forEach(hazard => {
    if (
      nearbyObjects.some(
        obj =>
          Math.abs(obj.position.x - hazard.position.x) < hazard.radius &&
          Math.abs(obj.position.y - hazard.position.y) < hazard.radius
      )
    ) {
      nearbyHazards.push(hazard);
    }
  });

  // Find nearest hazard
  let nearestHazard: Hazard | null = null;
  let nearestDistance = Infinity;

  // Iterate over the array directly
  for (let i = 0; i < nearbyHazards.length; i++) {
    const hazard = nearbyHazards[i];
    const distance = calculateDistance(unit.position, hazard.position);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestHazard = hazard;
    }
  }

  // Check if we found a hazard
  if (nearestHazard) {
    // Check for ready weapon
    const readyWeapon = unit.weapons.find(
      weapon => weapon.status === 'ready' && nearestDistance <= weapon.range
    );

    if (readyWeapon) {
      pendingUpdates.weaponFires.push({
        weaponId: readyWeapon.id,
        targetId: nearestHazard.id,
        weaponType: readyWeapon.type,
      });
    }

    // Calculate new position with smooth movement
    const newPosition = calculateNewPosition(unit.position, nearestHazard.position);
    pendingUpdates.unitMoves.push({
      unitId: unit.id,
      position: newPosition,
    });
  }
}

function calculateDistance(pos1: Position, pos2: Position): number {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function calculateNewPosition(current: Position, target: Position): Position {
  const dx = target.x - current.x;
  const dy = target.y - current.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Smooth movement with easing
  const speed = 0.1;
  const easing = 1 - Math.pow(0.95, distance);

  return {
    x: current.x + dx * speed * easing,
    y: current.y + dy * speed * easing,
  };
}

// Prevent TypeScript error about missing self
export {};
