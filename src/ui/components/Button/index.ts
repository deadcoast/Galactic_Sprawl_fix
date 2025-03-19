export * from './Button';
export * from './variants/AbilityButton';

// Re-export the default exports
import Button from './Button';
import AbilityButton from './variants/AbilityButton';

export { AbilityButton, Button };

/**
 * Button Component System
 *
 * This module provides a flexible and consistent button system for the application.
 * It follows a component composition pattern where specialized buttons are built
 * on top of a common base Button component.
 *
 * Features:
 * - Base Button with consistent styling, sizes, and variants
 * - Specialized buttons for specific use cases (AbilityButton, etc.)
 * - Support for icons, loading states, tooltips, and more
 * - Fully typed with TypeScript
 * - Accessible by default
 *
 * Example usage:
 *
 * ```tsx
 * // Basic button
 * <Button variant="primary" size="md">Click Me</Button>
 *
 * // Button with icon
 * <Button
 *   variant="secondary"
 *   leadingIcon={<Icon name="settings" />}
 * >
 *   Settings
 * </Button>
 *
 * // Specialized ability button
 * <AbilityButton
 *   ability={fireball}
 *   cooldownRemaining={2.5}
 *   hasResources={true}
 *   keybinding="Q"
 *   onUse={handleAbilityUse}
 * />
 * ```
 */
