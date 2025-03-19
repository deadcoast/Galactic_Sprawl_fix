// Export all component systems
export * from './Badge';
export * from './Button';
export * from './Card';

/**
 * UI Component Library
 *
 * This module provides a comprehensive set of UI components for the application.
 * Components are organized in a hierarchical structure where specialized
 * components are built on top of base components using composition.
 *
 * Each component follows these principles:
 *
 * 1. Consistency: All components share common styling patterns and behavior
 * 2. Composition: Specialized components are built on top of base components
 * 3. Flexibility: Components accept customization through props
 * 4. Accessibility: Components are designed to be accessible by default
 * 5. Performance: Components are optimized for render performance
 *
 * Component Organization:
 *
 * - Button/            Base button and specialized buttons
 *   - Button.tsx       Base button component
 *   - variants/        Specialized button variants
 *     - AbilityButton.tsx  Game ability button
 *     - ...
 * - Card/              Base card and specialized cards
 *   - Card.tsx         Base card component
 *   - variants/        Specialized card variants
 *     - ModuleCard.tsx Ship module card
 *     - ...
 * - Badge/             Base badge and specialized badges
 *   - Badge.tsx        Base badge component
 *   - variants/        Specialized badge variants
 *     - StatusBadge.tsx  Status indicator badge
 *     - ...
 *
 * Usage:
 *
 * ```tsx
 * import { Button, AbilityButton, Card, ModuleCard, Badge } from 'ui/components';
 *
 * function MyComponent() {
 *   return (
 *     <div>
 *       <Button variant="primary">Click Me</Button>
 *       <Card title="Example Card">
 *         Card content
 *         <Badge variant="success">New</Badge>
 *       </Card>
 *     </div>
 *   );
 * }
 * ```
 */
