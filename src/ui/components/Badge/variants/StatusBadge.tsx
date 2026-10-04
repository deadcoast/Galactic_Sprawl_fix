import { forwardRef } from 'react';
import { cn } from '../../../../utils/cn';
import { Badge, BadgeProps } from '../Badge';

/**
 * Status types for the game
 */
export type StatusType =
  | 'online'
  | 'offline'
  | 'idle'
  | 'busy'
  | 'away'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'active'
  | 'inactive'
  | 'damaged'
  | 'critical'
  | 'warning'
  | 'normal'
  | 'locked'
  | 'unlocked'
  | 'processing';

/**
 * StatusBadge props
 */
export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  /** The status to display */
  status: StatusType;
  /** Whether to pulse the badge for certain statuses */
  pulseEffect?: boolean;
  /** Whether to show the status text */
  showText?: boolean;
  /** Override the default status text */
  customText?: string;
}

/**
 * Map of status types to badge variants and colors
 */
const STATUS_MAPPINGS: Record<
  StatusType,
  { variant: BadgeProps['variant']; dotColor?: string; pulseByDefault?: boolean }
> = {
  online: { variant: 'success', dotColor: 'green-500', pulseByDefault: false },
  offline: { variant: 'default', dotColor: 'gray-500', pulseByDefault: false },
  idle: { variant: 'warning', dotColor: 'yellow-500', pulseByDefault: false },
  busy: { variant: 'danger', dotColor: 'red-500', pulseByDefault: false },
  away: { variant: 'secondary', dotColor: 'purple-500', pulseByDefault: false },
  pending: { variant: 'info', dotColor: 'blue-500', pulseByDefault: true },
  approved: { variant: 'success', dotColor: 'green-500', pulseByDefault: false },
  rejected: { variant: 'danger', dotColor: 'red-500', pulseByDefault: false },
  active: { variant: 'success', dotColor: 'green-500', pulseByDefault: false },
  inactive: { variant: 'default', dotColor: 'gray-500', pulseByDefault: false },
  damaged: { variant: 'warning', dotColor: 'yellow-500', pulseByDefault: true },
  critical: { variant: 'danger', dotColor: 'red-500', pulseByDefault: true },
  warning: { variant: 'warning', dotColor: 'yellow-500', pulseByDefault: true },
  normal: { variant: 'success', dotColor: 'green-500', pulseByDefault: false },
  locked: { variant: 'danger', dotColor: 'red-500', pulseByDefault: false },
  unlocked: { variant: 'success', dotColor: 'green-500', pulseByDefault: false },
  processing: { variant: 'info', dotColor: 'blue-500', pulseByDefault: true },
};

/**
 * Map of statuses to display text
 */
const STATUS_TEXT: Record<StatusType, string> = {
  online: 'Online',
  offline: 'Offline',
  idle: 'Idle',
  busy: 'Busy',
  away: 'Away',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  active: 'Active',
  inactive: 'Inactive',
  damaged: 'Damaged',
  critical: 'Critical',
  warning: 'warning',
  normal: 'Normal',
  locked: 'Locked',
  unlocked: 'Unlocked',
  processing: 'Processing',
};

/**
 * StatusBadge component
 *
 * A specialized badge for displaying system statuses with appropriate colors,
 * indicator dots, and optional pulse effects for dynamic statuses.
 */
export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, pulseEffect, showText = true, customText, className, ...props }, ref) => {
    const { variant, dotColor, pulseByDefault } = STATUS_MAPPINGS[status] || STATUS_MAPPINGS.normal;
    const shouldPulse = pulseEffect ?? pulseByDefault;

    // Pulse animation class
    const pulseClass = shouldPulse ? 'animate-pulse' : '';

    return (
      <Badge
        ref={ref}
        variant={variant}
        withDot={true}
        dotColor={dotColor}
        className={cn(pulseClass, className)}
        {...props}
      >
        {showText && (customText ?? STATUS_TEXT[status])}
      </Badge>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';

export default StatusBadge;
