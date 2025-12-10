/**
 * @context: ui-system, component-bridge
 *
 * Re-exports layout components from the ui design system.
 * This file provides backward compatibility for imports from components/ui/layout/
 */

// Re-export core layout components from ui design system
export { Container } from '../../../ui/components/layout/Container';
export { Grid } from '../../../ui/components/layout/Grid';
export { Flex } from '../../../ui/components/layout/Flex';
export { Stack } from '../../../ui/components/layout/Stack';
export { Spacer } from '../../../ui/components/layout/Spacer';

// Re-export types if available
export type { ContainerProps } from '../../../ui/components/layout/Container';
export type { GridProps } from '../../../ui/components/layout/Grid';
export type { FlexProps } from '../../../ui/components/layout/Flex';
export type { StackProps } from '../../../ui/components/layout/Stack';
export type { SpacerProps } from '../../../ui/components/layout/Spacer';

// Also export local layout components
export { ResponsiveLayout } from './ResponsiveLayout';
