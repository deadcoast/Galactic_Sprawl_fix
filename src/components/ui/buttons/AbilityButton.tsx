import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface AbilityButtonProps {
  /**
   * Whether the ability is currently active
   */
  active: boolean;

  /**
   * Whether the button is disabled
   */
  disabled?: boolean;

  /**
   * The icon to display on the button
   */
  icon: LucideIcon;

  /**
   * The label text to display on the button
   */
  label: string;

  /**
   * Optional color theme for the button
   * @default "blue"
   */
  color?: "blue" | "red" | "yellow" | "green" | "purple" | "cyan" | "amber" | "indigo" | "teal";

  /**
   * Click handler for the button
   */
  onClick: () => void;

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
 * AbilityButton Component
 * 
 * Button component for ship abilities with consistent styling and behavior.
 * Handles active/inactive states, disabled state, and color themes.
 */
export function AbilityButton({
  active,
  disabled = false,
  icon: Icon,
  label,
  color = "blue",
  onClick,
  children,
  className = "",
}: AbilityButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ability-button
        flex-1 px-4 py-2
        ${active ? `bg-${color}-500/30` : `bg-${color}-500/20`}
        hover:bg-${color}-500/30
        text-${color}-300
        rounded-lg
        flex items-center justify-center gap-2
        text-sm font-medium
        transition-colors
        disabled:opacity-50
        ${className}
      `}
    >
      <Icon className="icon w-4 h-4" />
      <span>{label}</span>
      {children}
    </button>
  );
}

/**
 * AbilityButtonContainer Component
 * 
 * Container for grouping multiple ability buttons.
 * Handles layout and spacing of buttons.
 */
export function AbilityButtonContainer({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`action-buttons flex gap-2 ${className}`}>
      {children}
    </div>
  );
} 