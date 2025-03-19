export * from './Card';
export * from './variants/ModuleCard';

// Re-export the default exports
import Card from './Card';
import ModuleCard from './variants/ModuleCard';

export { Card, ModuleCard };

/**
 * Card Component System
 *
 * This module provides a flexible and consistent card system for the application.
 * It follows a component composition pattern where specialized cards are built
 * on top of a common base Card component.
 *
 * Features:
 * - Base Card with consistent styling and variants
 * - Specialized cards for specific use cases (ModuleCard, etc.)
 * - Support for headers, footers, titles, and customizable content
 * - Fully typed with TypeScript
 * - Consistent hover and interaction states
 *
 * Example usage:
 *
 * ```tsx
 * // Basic card
 * <Card
 *   title="Card Title"
 *   subtitle="Card subtitle"
 * >
 *   Card content goes here
 * </Card>
 *
 * // Card with header and footer
 * <Card
 *   header={<div>Header Content</div>}
 *   footer={<div>Footer Content</div>}
 *   variant="elevated"
 * >
 *   Main content
 * </Card>
 *
 * // Specialized module card
 * <ModuleCard
 *   module={engineModule}
 *   showLevel={true}
 *   showEnergy={true}
 *   selectable
 *   onSelect={handleModuleSelect}
 *   onUpgrade={handleModuleUpgrade}
 * />
 * ```
 */
