import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge multiple class names together,
 * resolving unknown conflicts through Tailwind's merge utility.
 *
 * @param inputs - The class names to merge
 * @returns A single merged class name string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
