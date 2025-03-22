export interface Vector2D {
  x: number;
  y: number;
}

export interface BoundingBox {
  min: Vector2D;
  max: Vector2D;
}

/**
 * Calculate the Euclidean distance between two points
 */
export function getDistance(a: Vector2D, b: Vector2D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate the angle between two points in radians
 */
export function getAngle(a: Vector2D, b: Vector2D): number {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

/**
 * Get a point at a given distance and angle from another point
 */
export function getPointAtDistance(start: Vector2D, angle: number, distance: number): Vector2D {
  return {
    x: start.x + Math.cos(angle) * distance,
    y: start.y + Math.sin(angle) * distance,
  };
}

/**
 * Check if a point is within a radius of another point
 */
export function isWithinRadius(center: Vector2D, point: Vector2D, radius: number): boolean {
  return getDistance(center, point) <= radius;
}

/**
 * Get points in a circular formation around a center point
 */
export function getCircularFormationPoints(
  center: Vector2D,
  radius: number,
  count: number,
  startAngle = 0
): Vector2D[] {
  const points: Vector2D[] = [];
  for (let i = 0; i < count; i++) {
    const angle = startAngle + (i / count) * Math.PI * 2;
    points.push(getPointAtDistance(center, angle, radius));
  }
  return points;
}

export function normalizeVector(vector: Vector2D): Vector2D {
  const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  if (length === 0) {
    return { x: 0, y: 0 };
  }
  return {
    x: vector.x / length,
    y: vector.y / length,
  };
}

export function scaleVector(vector: Vector2D, scale: number): Vector2D {
  return {
    x: vector.x * scale,
    y: vector.y * scale,
  };
}

export function addVectors(a: Vector2D, b: Vector2D): Vector2D {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
  };
}

export function isPointInBox(point: Vector2D, box: BoundingBox): boolean {
  return (
    point.x >= box.min.x && point.x <= box.max.x && point.y >= box.min.y && point.y <= box.max.y
  );
}

export function rotatePoint(point: Vector2D, center: Vector2D, angle: number): Vector2D {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

export function interpolatePosition(start: Vector2D, end: Vector2D, t: number): Vector2D {
  return {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t,
  };
}
