/**
 * @context: ui-system, component-library, module-registry
 *
 * ModuleStatusIndicator component for displaying module status with appropriate styling
 */
import { useModuleStatus } from '../../../hooks/modules/useModuleStatus';
import { ExtendedModuleStatus } from '../../../managers/module/ModuleStatusManager';
import { Badge } from '../common/Badge';

/**
 * Status icon mapping
 */
export const MODULE_STATUS_ICONS: Record<ExtendedModuleStatus, string> = {
  // Basic statuses
  active: '●',
  constructing: '⚙️',
  inactive: '○',
  // Performance statuses
  optimized: '⚡',
  degraded: '↓',
  overloaded: '⚠️',
  // Operational statuses
  maintenance: '🔧',
  upgrading: '↑',
  repairing: '🔨',
  // Error statuses
  error: '⛔',
  critical: '🚨',
  offline: '✕',
  // Special statuses
  standby: '⏸️',
  powersave: '🔋',
  boost: '🚀',
};

interface ModuleStatusIndicatorProps {
  /**
   * Module ID to display status for
   */
  moduleId: string;

  /**
   * Optional override for status (instead of using the hook)
   */
  status?: ExtendedModuleStatus;

  /**
   * Whether to show the status icon
   * @default true
   */
  showIcon?: boolean;

  /**
   * Whether to show the status text
   * @default true
   */
  showText?: boolean;

  /**
   * Custom CSS class name
   */
  className?: string;

  /**
   * Size variant
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';

  /**
   * Click handler
   */
  onClick?: () => void;
}

/**
 * Component that displays a module's status with appropriate styling
 */
export function ModuleStatusIndicator({
  moduleId,
  status: statusOverride,
  showIcon = true,
  showText = true,
  className = '',
  size = 'medium',
  onClick,
}: ModuleStatusIndicatorProps) {
  // Get status data from hook if no override provided
  const { currentStatus, getStatusColor, isLoading, error } = useModuleStatus(moduleId);

  // Use override status if provided, otherwise use status from hook
  const status = statusOverride || currentStatus;

  // Calculate size-based styling
  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'module-status-indicator--small';
      case 'large':
        return 'module-status-indicator--large';
      default:
        return '';
    }
  };

  // Display loading state
  if (isLoading && !statusOverride) {
    return (
      <div
        className={`module-status-indicator module-status-indicator--loading ${getSizeClass()} ${className}`}
      >
        <span className="module-status-indicator__loading">Loading...</span>
      </div>
    );
  }

  // Display error state
  if (error && !statusOverride) {
    return (
      <div
        className={`module-status-indicator module-status-indicator--error ${getSizeClass()} ${className}`}
      >
        <span className="module-status-indicator__error">Error</span>
      </div>
    );
  }

  // Generate display text
  const displayText = showText ? formatStatusText(status) : '';
  const icon = showIcon ? MODULE_STATUS_ICONS[status] : '';
  const displayContent = icon && displayText ? `${icon} ${displayText}` : icon || displayText;

  return (
    <Badge
      text={displayContent}
      color={getStatusColor(status)}
      className={`module-status-indicator ${getSizeClass()} ${className}`}
      onClick={onClick}
      data-testid="module-status-indicator"
      data-status={status}
    />
  );
}

/**
 * Format status text for display (capitalize and replace hyphens with spaces)
 */
function formatStatusText(status: ExtendedModuleStatus): string {
  return status
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
