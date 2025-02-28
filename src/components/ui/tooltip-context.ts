import { createContext, ReactNode, useContext } from 'react';

interface TooltipContextValue {
  tooltip: {
    content: ReactNode | null;
    position: { x: number; y: number };
    visible: boolean;
  };
  showTooltip: (content: ReactNode, position?: { x: number; y: number }) => void;
  hideTooltip: () => void;
  updatePosition: (position: { x: number; y: number }) => void;
}

const TooltipContext = createContext<TooltipContextValue | null>(null);

export function useTooltipContext() {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error('useTooltipContext must be used within a TooltipProvider');
  }
  return context;
}

export { TooltipContext };
