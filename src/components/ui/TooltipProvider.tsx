import { ReactNode } from 'react';
import { useTooltip } from '../../hooks/ui/useTooltip';
import { TooltipContext } from './tooltip-context';

interface TooltipProviderProps {
  children: ReactNode;
}

export function TooltipProvider({ children }: TooltipProviderProps) {
  const tooltipState = useTooltip();

  return (
    <TooltipContext.Provider value={tooltipState}>
      {children}
      {tooltipState.tooltip.visible && tooltipState.tooltip.content && (
        <div
          className="pointer-events-none fixed z-50"
          style={{
            left: tooltipState.tooltip.position.x,
            top: tooltipState.tooltip.position.y,
            transform: 'translate(-50%, -100%) translateY(-8px)',
          }}
        >
          {tooltipState.tooltip.content}
        </div>
      )}
    </TooltipContext.Provider>
  );
}
