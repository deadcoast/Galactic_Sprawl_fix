/**
 * Generates a unique identifier for VoidDredger instances
 * @param prefix - Optional prefix for the ID (defaults to 'vd' for VoidDredger)
 * @returns A string in the format `${prefix}-${randomString}`
 * @example
 * const dredgerId = generateVoidDredgerId(); // Returns "vd-x7f3g2p1m"
 * const customDredgerId = generateVoidDredgerId('custom'); // Returns "custom-x7f3g2p1m"
 */
export function generateVoidDredgerId(prefix: string = "vd"): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}
