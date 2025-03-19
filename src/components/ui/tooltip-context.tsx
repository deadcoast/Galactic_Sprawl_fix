import { AnimatePresence, motion } from 'framer-motion';
import * as React from 'react';
import { createContext, ReactNode, useContext, useState } from 'react';

interface TooltipPosition {
  x: number;
  y: number;
}

interface TooltipContextType {
  showTooltip: (content: ReactNode, position: TooltipPosition) => void;
  hideTooltip: () => void;
}

const TooltipContext = createContext<TooltipContextType>({
  showTooltip: () => {},
  hideTooltip: () => {},
});

export const useTooltipContext = () => useContext(TooltipContext);

interface TooltipProviderProps {
  children: ReactNode;
}

export const TooltipProvider: React.FC<TooltipProviderProps> = ({ children }) => {
  const [tooltipContent, setTooltipContent] = useState<ReactNode | null>(null);
  const [position, setPosition] = useState<TooltipPosition>({ x: 0, y: 0 });

  const showTooltip = (content: ReactNode, pos: TooltipPosition) => {
    setTooltipContent(content);
    setPosition(pos);
  };

  const hideTooltip = () => {
    setTooltipContent(null);
  };

  return (
    <TooltipContext.Provider value={{ showTooltip, hideTooltip }}>
      {children}
      <div
        className="tooltip-container"
        style={{ position: 'fixed', zIndex: 9999, pointerEvents: 'none' }}
      >
        <AnimatePresence>
          {tooltipContent && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'absolute',
                left: position.x,
                top: position.y + 10,
                transform: 'translateX(-50%)',
              }}
            >
              {tooltipContent}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipContext.Provider>
  );
};

export default TooltipProvider;
