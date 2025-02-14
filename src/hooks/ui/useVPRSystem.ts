import { useScalingSystem } from '../game/useScalingSystem';
import { useCallback, useEffect, useState } from 'react';

interface VPRSystemState {
  modules: {
    id: string;
    type: 'mothership' | 'colony' | 'planet' | 'exploration' | 'mining';
    tier: 1 | 2 | 3;
    status: 'active' | 'upgrading' | 'disabled';
    progress?: number;
  }[];
  upgrades: {
    moduleId: string;
    fromTier: 1 | 2;
    toTier: 2 | 3;
    progress: number;
  }[];
  alerts: {
    moduleId: string;
    type: 'warning' | 'info';
    message: string;
  }[];
}

export function useVPRSystem() {
  const [systemState, setSystemState] = useState<VPRSystemState>({
    modules: [],
    upgrades: [],
    alerts: [],
  });

  const scaling = useScalingSystem();

  // Memoized update handlers
  const handleModuleUpdate = useCallback((moduleId: string, data: any) => {
    setSystemState(prev => ({
      ...prev,
      modules: prev.modules.map(mod => (mod.id === moduleId ? { ...mod, ...data } : mod)),
    }));
  }, []);

  const handleUpgradeProgress = useCallback((moduleId: string, progress: number) => {
    setSystemState(prev => ({
      ...prev,
      upgrades: prev.upgrades.map(upgrade =>
        upgrade.moduleId === moduleId ? { ...upgrade, progress } : upgrade
      ),
    }));
  }, []);

  // Alert management
  const addAlert = useCallback((moduleId: string, type: 'warning' | 'info', message: string) => {
    setSystemState(prev => ({
      ...prev,
      alerts: [...prev.alerts, { moduleId, type, message }],
    }));
  }, []);

  const clearAlert = useCallback((moduleId: string) => {
    setSystemState(prev => ({
      ...prev,
      alerts: prev.alerts.filter(alert => alert.moduleId !== moduleId),
    }));
  }, []);

  // Performance optimization
  useEffect(() => {
    const updateInterval = scaling.performance.fps > 30 ? 16 : 32;

    const interval = setInterval(() => {
      setSystemState(prev => {
        // Update upgrade progress
        const updatedUpgrades = prev.upgrades.map(upgrade => ({
          ...upgrade,
          progress: Math.min(1, upgrade.progress + 0.01),
        }));

        // Remove completed upgrades
        const completedUpgrades = updatedUpgrades.filter(u => u.progress >= 1);
        const activeUpgrades = updatedUpgrades.filter(u => u.progress < 1);

        // Update module tiers for completed upgrades
        const updatedModules = prev.modules.map(mod => {
          const completedUpgrade = completedUpgrades.find(u => u.moduleId === mod.id);
          if (completedUpgrade) {
            return {
              ...mod,
              tier: completedUpgrade.toTier,
              status: 'active' as const,
            };
          }
          return mod;
        });

        return {
          ...prev,
          modules: updatedModules,
          upgrades: activeUpgrades,
        };
      });
    }, updateInterval);

    return () => clearInterval(interval);
  }, [scaling.performance.fps]);

  // Error boundary fallback
  const handleError = useCallback((error: Error, moduleId: string) => {
    console.error(`VPR System Error in module ${moduleId}:`, error);

    setSystemState(prev => ({
      ...prev,
      modules: prev.modules.map(mod =>
        mod.id === moduleId ? { ...mod, status: 'disabled' } : mod
      ),
      alerts: [
        ...prev.alerts,
        {
          moduleId,
          type: 'warning',
          message: 'Module encountered an error and has been disabled',
        },
      ],
    }));
  }, []);

  return {
    systemState,
    handleModuleUpdate,
    handleUpgradeProgress,
    addAlert,
    clearAlert,
    handleError,
  };
}
