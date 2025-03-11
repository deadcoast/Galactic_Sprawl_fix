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

export function vectorScale(vector: Vector, scale: number): Vector {
  if (isVector2D(vector)) {
    return {
      x: vector.x * scale,
      y: vector.y * scale,
    };
  }
  if (isVector3D(vector)) {
    return {
      x: vector.x * scale,
      y: vector.y * scale,
      z: vector.z * scale,
    };
  }
  if (isVector4D(vector)) {
    return {
      x: vector.x * scale,
      y: vector.y * scale,
      z: vector.z * scale,
      w: vector.w * scale,
    };
  }
  throw new Error('Invalid vector type');
}

export function vectorNormalize(vector: Vector): Vector {
  const magnitude = vectorMagnitude(vector);
  if (magnitude === 0) {
    return vector;
  }
  return vectorScale(vector, 1 / magnitude);
}

export function vectorMagnitude(vector: Vector): number {
  if (isVector2D(vector)) {
    return Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2));
  }
  if (isVector3D(vector)) {
    return Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2) + Math.pow(vector.z, 2));
  }
  if (isVector4D(vector)) {
    return Math.sqrt(
      Math.pow(vector.x, 2) + Math.pow(vector.y, 2) + Math.pow(vector.z, 2) + Math.pow(vector.w, 2)
    );
  }
  throw new Error('Invalid vector type');
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
