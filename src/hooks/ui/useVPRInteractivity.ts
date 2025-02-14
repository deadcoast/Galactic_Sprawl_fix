import { useCallback, useEffect } from 'react';

interface InteractivityOptions {
  onModuleSelect?: (moduleId: string | null) => void;
  onUpgradeStart?: (moduleId: string) => void;
  onUpgradeComplete?: (moduleId: string) => void;
}

export function useVPRInteractivity({
  onModuleSelect,
  onUpgradeStart,
  onUpgradeComplete,
}: InteractivityOptions) {
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // ESC to deselect
      if (e.key === 'Escape') {
        onModuleSelect?.(null);
      }

      // Number keys 1-5 for quick module selection
      if (['1', '2', '3', '4', '5'].includes(e.key)) {
        const moduleMap = {
          '1': 'mothership',
          '2': 'colony',
          '3': 'planet',
          '4': 'exploration',
          '5': 'mining',
        } as const;
        onModuleSelect?.(moduleMap[e.key as keyof typeof moduleMap]);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onModuleSelect]);

  // Mouse interaction handlers
  const handleModuleHover = useCallback((moduleId: string, position: { x: number; y: number }) => {
    // Show tooltip with module info
    const tooltip = document.createElement('div');
    tooltip.className =
      'fixed z-50 px-3 py-2 bg-gray-800/90 rounded-lg border border-gray-700 text-sm text-white';
    tooltip.style.left = `${position.x + 10}px`;
    tooltip.style.top = `${position.y + 10}px`;
    document.body.appendChild(tooltip);

    return () => tooltip.remove();
  }, []);

  const handleModuleClick = useCallback(
    (moduleId: string) => {
      onModuleSelect?.(moduleId);
    },
    [onModuleSelect]
  );

  const handleUpgradeInteraction = useCallback(
    (moduleId: string, progress: number) => {
      if (progress === 0) {
        onUpgradeStart?.(moduleId);
      } else if (progress >= 1) {
        onUpgradeComplete?.(moduleId);
      }
    },
    [onUpgradeStart, onUpgradeComplete]
  );

  return {
    handleModuleHover,
    handleModuleClick,
    handleUpgradeInteraction,
  };
}
