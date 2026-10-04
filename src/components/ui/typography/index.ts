/**
 * @context: ui-system, component-bridge
 *
 * Re-exports typography components from the ui design system.
 * This file provides backward compatibility for imports from components/ui/typography/
 */

export { Heading } from '../../../ui/components/typography/Heading';
export { Text } from '../../../ui/components/typography/Text';
export { Label } from '../../../ui/components/typography/Label';

// Re-export types if available
export type { HeadingProps } from '../../../ui/components/typography/Heading';
export type { TextProps } from '../../../ui/components/typography/Text';
export type { LabelProps } from '../../../ui/components/typography/Label';
