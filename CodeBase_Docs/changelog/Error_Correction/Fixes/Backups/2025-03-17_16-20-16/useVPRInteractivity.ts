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

    // Get module-specific information based on moduleId
    const moduleInfo = getModuleInfo(moduleId);
    tooltip.innerHTML = `
      <div class="font-medium">${moduleInfo.name}</div>
      <div class="text-xs text-gray-400">${moduleInfo.type}</div>
      <div class="mt-1 text-xs">Status: <span class="${moduleInfo.statusColor}">${moduleInfo.status}</span></div>
      ${moduleInfo.upgradeAvailable ? '<div class="mt-1 text-xs text-teal-400">Upgrade Available</div>' : ''}
    `;

    document.body.appendChild(tooltip);

    return () => tooltip.remove();
  }, []);

  // Helper function to get module information based on moduleId
  const getModuleInfo = (moduleId: string) => {
    // This would typically fetch data from a module manager or context
    // For now, we'll use a simple mapping for demonstration
    const moduleTypes: Record<
      string,
      { name: string; type: string; status: string; statusColor: string; upgradeAvailable: boolean }
    > = {
      mothership: {
        name: 'Mothership Core',
        type: 'Command Center',
        status: 'Active',
        statusColor: 'text-green-400',
        upgradeAvailable: false,
      },
      colony: {
        name: 'Colony Hub',
        type: 'Resource Management',
        status: 'Active',
        statusColor: 'text-green-400',
        upgradeAvailable: true,
      },
      planet: {
        name: 'Planetary Operations',
        type: 'Resource Extraction',
        status: 'Idle',
        statusColor: 'text-yellow-400',
        upgradeAvailable: false,
      },
      exploration: {
        name: 'Exploration Hub',
        type: 'Discovery',
        status: 'Active',
        statusColor: 'text-green-400',
        upgradeAvailable: true,
      },
      mining: {
        name: 'Mining Operations',
        type: 'Resource Extraction',
        status: 'Active',
        statusColor: 'text-green-400',
        upgradeAvailable: false,
      },
    };

    // Return module info if found, or a default object if not
    return (
      moduleTypes[moduleId] || {
        name: `Module ${moduleId}`,
        type: 'Unknown',
        status: 'Unknown',
        statusColor: 'text-gray-400',
        upgradeAvailable: false,
      }
    );
  };

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
