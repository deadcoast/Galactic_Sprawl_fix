/**
 * @context: ui-system, component-bridge
 *
 * Re-exports input components from the ui design system.
 * This file provides backward compatibility for imports from components/ui/inputs/
 */

export { Input } from '../../../ui/components/inputs/Input';
export { Checkbox } from '../../../ui/components/inputs/Checkbox';
export { Radio } from '../../../ui/components/inputs/Radio';
export { Select } from '../../../ui/components/inputs/Select';
export { Slider } from '../../../ui/components/inputs/Slider';
export { Switch } from '../../../ui/components/inputs/Switch';

// Re-export types if available
export type { InputProps } from '../../../ui/components/inputs/Input';
export type { CheckboxProps } from '../../../ui/components/inputs/Checkbox';
export type { RadioProps } from '../../../ui/components/inputs/Radio';
export type { SelectProps } from '../../../ui/components/inputs/Select';
export type { SliderProps } from '../../../ui/components/inputs/Slider';
export type { SwitchProps } from '../../../ui/components/inputs/Switch';
