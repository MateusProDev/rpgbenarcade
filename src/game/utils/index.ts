/** Game utility helpers */

/**
 * Clamps a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Generates a simple hash-based ID for non-crypto contexts.
 */
export function simpleId(): string {
  return crypto.randomUUID();
}

/**
 * Deep clones a serializable object.
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}
