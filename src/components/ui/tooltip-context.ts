import { createContext, useContext } from 'react';
import { useTooltip } from '../../hooks/useTooltip';

const TooltipContext = createContext<ReturnType<typeof useTooltip> | null>(null);

export function useTooltipContext() {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error('useTooltipContext must be used within a TooltipProvider');
  }
  return context;
}

export { TooltipContext }; 