import { ReactNode, useCallback, useState } from "react";

interface TooltipState {
  content: ReactNode | null;
  position: { x: number; y: number };
  visible: boolean;
}

export function useTooltip() {
  const [tooltip, setTooltip] = useState<TooltipState>({
    content: null,
    position: { x: 0, y: 0 },
    visible: false,
  });

  const showTooltip = useCallback(
    (content: ReactNode, position?: { x: number; y: number }) => {
      setTooltip({
        content,
        position: position || { x: 0, y: 0 },
        visible: true,
      });
    },
    [],
  );

  const hideTooltip = useCallback(() => {
    setTooltip((prev) => ({
      ...prev,
      visible: false,
    }));
  }, []);

  const updatePosition = useCallback((position: { x: number; y: number }) => {
    setTooltip((prev) => ({
      ...prev,
      position,
    }));
  }, []);

  return {
    tooltip,
    showTooltip,
    hideTooltip,
    updatePosition,
  };
}
