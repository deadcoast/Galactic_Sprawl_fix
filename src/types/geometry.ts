/**
 * Core geometry types used throughout the application
 */

/**
 * Represents a 2D position in the game world
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Represents a 2D vector with magnitude and direction
 */
export interface Vector {
  x: number;
  y: number;
}

/**
 * Represents a 2D size dimension
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * Represents a rectangle in 2D space
 */
export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Represents a circle in 2D space
 */
export interface Circle {
  x: number;
  y: number;
  radius: number;
}

/**
 * Represents rotation in degrees
 */
export type Rotation = number;

/**
 * Represents a transform with position and rotation
 */
export interface Transform {
  position: Position;
  rotation: Rotation;
}

/**
 * Represents a transform with position, rotation, and scale
 */
export interface FullTransform extends Transform {
  scale: Vector;
}
