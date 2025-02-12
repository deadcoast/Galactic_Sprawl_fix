import { combatManager } from "../../lib/combat/combatManager";
import { useEffect, useState } from "react";

export function useCombatSystem(zoneId: string) {
  const [zoneStatus, setZoneStatus] = useState(
    combatManager.getZoneStatus(zoneId),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const status = combatManager.getZoneStatus(zoneId);
      setZoneStatus(status);
    }, 1000);

    return () => clearInterval(interval);
  }, [zoneId]);

  return {
    threatLevel: zoneStatus?.threatLevel || 0,
    activeUnits: zoneStatus?.units.length || 0,
    isActive: !!zoneStatus,
  };
}

export function useUnitCombat(unitId: string) {
  const [unitStatus, setUnitStatus] = useState(
    combatManager.getUnitStatus(unitId),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const status = combatManager.getUnitStatus(unitId);
      setUnitStatus(status);
    }, 250); // More frequent updates for combat units

    return () => clearInterval(interval);
  }, [unitId]);

  return {
    status: unitStatus?.status || "idle",
    health: unitStatus?.health || 0,
    shield: unitStatus?.shield || 0,
    target: unitStatus?.target,
    position: unitStatus?.position,
  };
}
