/**
 * @context: type-definitions, vector-math
 * Vector type definitions and utility functions
 */
export interface Vector2D {
  x: number;
  y: number;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Vector4D {
  x: number;
  y: number;
  z: number;
  w: number;
}

export type Vector = Vector2D | Vector3D | Vector4D;

export function isVector2D(vector: Vector): vector is Vector2D {
  return 'x' in vector && 'y' in vector && !('z' in vector);
}

export function isVector3D(vector: Vector): vector is Vector3D {
  return 'x' in vector && 'y' in vector && 'z' in vector && !('w' in vector);
}

export function isVector4D(vector: Vector): vector is Vector4D {
  return 'x' in vector && 'y' in vector && 'z' in vector && 'w' in vector;
}

export function vectorDistance(a: Vector, b: Vector): number {
  if (isVector2D(a) && isVector2D(b)) {
    return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
  }
  if (isVector3D(a) && isVector3D(b)) {
    return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2) + Math.pow(b.z - a.z, 2));
  }
  if (isVector4D(a) && isVector4D(b)) {
    return Math.sqrt(
      Math.pow(b.x - a.x, 2) +
        Math.pow(b.y - a.y, 2) +
        Math.pow(b.z - a.z, 2) +
        Math.pow(b.w - a.w, 2)
    );
  }
  throw new Error('Vectors must be of the same dimension');
}

export function vectorAdd(a: Vector, b: Vector): Vector {
  if (isVector2D(a) && isVector2D(b)) {
    return {
      x: a.x + b.x,
      y: a.y + b.y,
    };
  }
  if (isVector3D(a) && isVector3D(b)) {
    return {
      x: a.x + b.x,
      y: a.y + b.y,
      z: a.z + b.z,
    };
  }
  if (isVector4D(a) && isVector4D(b)) {
    return {
      x: a.x + b.x,
      y: a.y + b.y,
      z: a.z + b.z,
      w: a.w + b.w,
    };
  }
  throw new Error('Vectors must be of the same dimension');
}

/**
 * Scale a 2D vector by a scalar value
 */
function scaleVector2D(vector: Vector2D, scale: number): Vector2D {
  return {
    x: vector.x * scale,
    y: vector.y * scale,
  };
}

/**
 * Scale a 3D vector by a scalar value
 */
function scaleVector3D(vector: Vector3D, scale: number): Vector3D {
  return {
    x: vector.x * scale,
    y: vector.y * scale,
    z: vector.z * scale,
  };
}

/**
 * Scale a 4D vector by a scalar value
 */
function scaleVector4D(vector: Vector4D, scale: number): Vector4D {
  return {
    x: vector.x * scale,
    y: vector.y * scale,
    z: vector.z * scale,
    w: vector.w * scale,
  };
}

/**
 * Scale a vector by a scalar value
 */
export function vectorScale(vector: Vector, scale: number): Vector {
  if (isVector2D(vector)) {
    return scaleVector2D(vector, scale);
  }

  if (isVector3D(vector)) {
    return scaleVector3D(vector, scale);
  }

  if (isVector4D(vector)) {
    return scaleVector4D(vector, scale);
  }

  throw new Error('Unknown vector type');
}

export function vectorNormalize(vector: Vector): Vector {
  const magnitude = vectorMagnitude(vector);
  if (magnitude === 0) {
    return vector;
  }
  return vectorScale(vector, 1 / magnitude);
}

/**
 * Calculate the magnitude of a 2D vector
 */
function magnitudeVector2D(vector: Vector2D): number {
  return Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2));
}

/**
 * Calculate the magnitude of a 3D vector
 */
function magnitudeVector3D(vector: Vector3D): number {
  return Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2) + Math.pow(vector.z, 2));
}

/**
 * Calculate the magnitude of a 4D vector
 */
function magnitudeVector4D(vector: Vector4D): number {
  return Math.sqrt(
    Math.pow(vector.x, 2) + Math.pow(vector.y, 2) + Math.pow(vector.z, 2) + Math.pow(vector.w, 2)
  );
}

/**
 * Calculate the magnitude of a vector
 */
export function vectorMagnitude(vector: Vector): number {
  if (isVector2D(vector)) {
    return magnitudeVector2D(vector);
  }

  if (isVector3D(vector)) {
    return magnitudeVector3D(vector);
  }

  if (isVector4D(vector)) {
    return magnitudeVector4D(vector);
  }

  throw new Error('Unknown vector type');
}

export function vectorDot(a: Vector, b: Vector): number {
  if (isVector2D(a) && isVector2D(b)) {
    return a.x * b.x + a.y * b.y;
  }
  if (isVector3D(a) && isVector3D(b)) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }
  if (isVector4D(a) && isVector4D(b)) {
    return a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
  }
  throw new Error('Vectors must be of the same dimension');
}

export function vectorCross(a: Vector3D, b: Vector3D): Vector3D {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}
