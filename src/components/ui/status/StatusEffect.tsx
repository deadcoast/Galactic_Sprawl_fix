import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface StatusEffectProps {
  /**
   * Whether the status effect is currently active
   */
  active: boolean;

  /**
   * The icon to display for the status effect
   */
  icon: LucideIcon;

  /**
   * The label text to display next to the icon
   */
  label: string;

  /**
   * Optional color theme for the status effect
   * @default "blue"
   */
  color?: 'blue' | 'red' | 'yellow' | 'green' | 'purple' | 'cyan' | 'amber' | 'indigo' | 'teal';

  /**
   * Optional additional content to render
   */
  children?: ReactNode;

  /**
   * Optional additional CSS classes
   */
  className?: string;
}

/**
 * StatusEffect Component
 *
 * Displays a status effect with an icon, label, and optional additional content.
 * Used for showing active abilities, buffs, debuffs, etc.
 */
export function StatusEffect({
  active,
  icon: Icon,
  label,
  color = 'blue',
  children,
  className = '',
}: StatusEffectProps) {
  if (!active) {
    return null;
  }

  return (
    <div className={`status-effect ${className}`}>
      <div
        className={`px-2 py-1 bg-${color}-500/20 text-${color}-300 flex items-center gap-2 rounded-lg text-sm`}
      >
        <Icon className="icon h-4 w-4" />
        <span>{label}</span>
        {children}
      </div>
    </div>
  );
}

/**
 * StatusEffectContainer Component
 *
 * Container for grouping multiple status effects.
 * Handles layout and spacing of effects.
 */
export function StatusEffectContainer({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`status-effects flex flex-col gap-2 ${className}`}>{children}</div>;
}
