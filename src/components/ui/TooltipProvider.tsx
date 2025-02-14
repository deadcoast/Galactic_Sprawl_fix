import { TooltipContext } from './tooltip-context';
import { useTooltip } from '../../hooks/ui/useTooltip';
import { ReactNode } from 'react';

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
          className="fixed z-50 pointer-events-none"
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
