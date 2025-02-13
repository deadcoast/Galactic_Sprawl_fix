import { useTooltip } from "../../hooks/ui/useTooltip";
import { createContext, useContext } from "react";

const TooltipContext = createContext<ReturnType<typeof useTooltip> | null>(
  null,
);

export function useTooltipContext() {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error("useTooltipContext must be used within a TooltipProvider");
  }
  return context;
}

export { TooltipContext };
