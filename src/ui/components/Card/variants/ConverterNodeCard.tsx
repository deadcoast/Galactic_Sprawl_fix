import React, { forwardRef, MouseEventHandler, useMemo } from 'react';
import
  {
    errorLoggingService,
    ErrorSeverity,
    ErrorType,
  } from '../../../../services/logging/ErrorLoggingService';
import type { ConverterFlowNode } from '../../../../types/resources/ResourceConversionTypes'; // Import the specific type
import { Text } from '../../typography/Text'; // Assuming path
import { Card, CardProps } from '../Card';

/**
 * @context: ui-system, component-library, card-variants
 *
 * Props for the ConverterNodeCard
 * Extends base CardProps and adds the specific converter data.
 */
export interface ConverterNodeCardProps extends Omit<CardProps, 'title' | 'children'> {
  /** The converter data to display */
  converter: ConverterFlowNode;
  /** Is this card currently selected? */
  selected?: boolean;
  /** Optional click handler - receives the standard React MouseEvent */
  onClick?: MouseEventHandler<HTMLDivElement>;
}

/**
 * ConverterNodeCard Component
 *
 * A specific Card variant designed to display summary information about a resource converter node.
 */
export const ConverterNodeCard = forwardRef<HTMLDivElement, ConverterNodeCardProps>(
  (
    {
      converter,
      selected = false,
      onClick,
      className,
      // Default base card props for this variant
      variant = 'default', // Or choose another default like 'bordered'
      hoverable = true,
      selectable = true,
      ...props // Pass any other standard CardProps (like style, id etc.)
    },
    ref
  ) => {
    const utilization = useMemo(() => {
      const activeCount = converter.activeProcessIds?.length ?? 0;
      const maxCount = converter.configuration?.maxConcurrentProcesses;
      if (typeof maxCount !== 'number' || maxCount <= 0) {
        return 'N/A'; // Cannot calculate if max is unknown or zero
      }
      return `${((activeCount / maxCount) * 100).toFixed(0)}%`;
    }, [converter.activeProcessIds, converter.configuration]);

    const supportedRecipesCount = converter.supportedRecipeIds?.length ?? 0;

    // Validate the title prop before passing it to the base Card
    let cardTitle: React.ReactNode = null; // Default to null
    const potentialTitle = converter.name ?? `Converter ${converter.id}`;

    if (
      typeof potentialTitle === 'string' ||
      potentialTitle === null ||
      potentialTitle === undefined
    ) {
      cardTitle = potentialTitle;
    } else if (React.isValidElement(potentialTitle)) {
      cardTitle = potentialTitle;
    } else {
      errorLoggingService.logWarn(
        `[ConverterNodeCard] Unexpected type for title prop: ${String('[potentialTitle]')}. Defaulting to ID.`,
        {
          component: 'ConverterNodeCard',
          converterId: converter.id,
          warningType: ErrorType.UI_WARNING,
          severity: ErrorSeverity.LOW,
        }
      );
      cardTitle = `Converter ${converter.id}`; // Fallback to ID string
    }

    return (
      <Card
        ref={ref}
        className={className} // Allow overriding classes
        variant={variant}
        hoverable={hoverable}
        selectable={selectable}
        selected={selected}
        title={cardTitle} // Use the validated title
        onClick={onClick}
        {...props}
      >
        {/* Content structure specific to displaying converter info */}
        <Text className="mb-1 text-sm text-gray-600 dark:text-gray-400">
          Status:{' '}
          {converter.activeProcessIds && converter.activeProcessIds.length > 0 ? 'Active' : 'Idle'}{' '}
          ({converter.activeProcessIds?.length ?? 0} processes)
        </Text>
        <Text className="mb-1 text-sm text-gray-600 dark:text-gray-400">
          Utilization: {utilization}
        </Text>
        <Text className="mb-1 text-sm text-gray-600 dark:text-gray-400">
          Efficiency: {(converter.efficiency * 100).toFixed(1)}%
        </Text>
        <Text className="text-sm text-gray-600 dark:text-gray-400">
          Supported Recipes: {supportedRecipesCount}
        </Text>
        {/* Add more details from converter if needed */}
      </Card>
    );
  }
);

ConverterNodeCard.displayName = 'ConverterNodeCard';

// Default export for ease of use
export default ConverterNodeCard;
