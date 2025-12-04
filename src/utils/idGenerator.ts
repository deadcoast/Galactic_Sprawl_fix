/**
 * Generates a unique identifier for VoidDredger instances
 * @param prefix - Optional prefix for the ID (defaults to 'vd' for VoidDredger)
 * @returns A string in the format `${prefix}-${randomString}`
 * @example
 * const dredgerId = generateVoidDredgerId(); // Returns "vd-x7f3g2p1m"
 * const customDredgerId = generateVoidDredgerId('custom'); // Returns "custom-x7f3g2p1m"
 */
export function generateVoidDredgerId(prefix = 'vd'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a anonymous ID for telemetry purposes
 * This ID is designed to avoid capturing personally identifiable information
 * while still providing a consistent identifier for a session
 *
 * @param seed Optional seed string to make IDs more deterministic for testing
 * @returns Anonymous ID string
 */
export function generateAnonymousId(seed?: string): string {
  // Create a base for the ID that includes a timestamp but mixes it up
  const timestamp = Date.now().toString(36);

  // Add randomness based on seed if provided, or use Math.random
  let randomPart: string;
  if (seed) {
    // Generate deterministic "random" value from seed
    let hashCode = 0;
    for (let i = 0; i < seed.length; i++) {
      hashCode = (hashCode << 5) - hashCode + seed.charCodeAt(i);
      hashCode &= hashCode; // Convert to 32bit integer
    }
    randomPart = Math.abs(hashCode).toString(36);
  } else {
    // Use standard random if no seed provided
    randomPart = Math.random().toString(36).substring(2, 10);
  }

  // Add some browser environment info without specific user identifiers
  const envInfo = [
    // Screen ratio (not exact dimensions)
    Math.round((window.screen.width / window.screen.height) * 10).toString(36),
    // Browser language primary code
    (navigator.language || 'en').split('-')[0],
    // Rough timezone hour offset (not exact minute)
    Math.round(new Date().getTimezoneOffset() / 60).toString(36),
  ].join('');

  // Combine parts and ensure consistent length
  return `anon_${timestamp}_${randomPart}_${envInfo}`;
}
