/**
 * Represents a 2D position
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Represents a 3D position
 */
export interface Position3D extends Position {
  z: number;
}

/**
 * Utility functions for positions
 */
export const PositionUtils = {
  /**
   * Calculate distance between two positions
   */
  distance(a: Position, b: Position): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  },

  /**
   * Calculate distance between two 3D positions
   */
  distance3D(a: Position3D, b: Position3D): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dz = b.z - a.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  },

  /**
   * Calculate angle between two positions in radians
   */
  angle(a: Position, b: Position): number {
    return Math.atan2(b.y - a.y, b.x - a.x);
  },

  /**
   * Calculate midpoint between two positions
   */
  midpoint(a: Position, b: Position): Position {
    return {
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2
    };
  },

  /**
   * Calculate midpoint between two 3D positions
   */
  midpoint3D(a: Position3D, b: Position3D): Position3D {
    return {
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
      z: (a.z + b.z) / 2
    };
  },

  /**
   * Interpolate between two positions
   */
  lerp(a: Position, b: Position, t: number): Position {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t
    };
  },

  /**
   * Interpolate between two 3D positions
   */
  lerp3D(a: Position3D, b: Position3D, t: number): Position3D {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      z: a.z + (b.z - a.z) * t
    };
  }
}; 