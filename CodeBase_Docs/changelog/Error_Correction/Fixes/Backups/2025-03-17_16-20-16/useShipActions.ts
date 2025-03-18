import { useCallback } from 'react';
import { shipActions, ShipStatus, useShipState } from '../../contexts/ShipContext';
import { CommonShipStats } from '../../types/ships/CommonShipTypes';
import { WeaponMount } from '../../types/weapons/WeaponTypes';

export function useShipActions() {
  const { state, dispatch } = useShipState();

  const updateStatus = useCallback(
    (status: ShipStatus) => {
      dispatch(shipActions.updateStatus(status));
    },
    [dispatch]
  );

  const updateHealth = useCallback(
    (health: number) => {
      dispatch(shipActions.updateHealth(health));
    },
    [dispatch]
  );

  const updateShield = useCallback(
    (shield: number) => {
      dispatch(shipActions.updateShield(shield));
    },
    [dispatch]
  );

  const updateStats = useCallback(
    (stats: Partial<CommonShipStats>) => {
      dispatch(shipActions.updateStats(stats));
    },
    [dispatch]
  );

  const fireWeapon = useCallback(
    (weaponId: string) => {
      const weapon = state.weapons.find(w => w.id === weaponId);
      if (!weapon?.currentWeapon) return;

      // Fire weapon (sets status to cooling)
      dispatch(shipActions.fireWeapon(weaponId));

      // Auto-update weapon state to ready after cooldown
      setTimeout(() => {
        dispatch(
          shipActions.updateWeaponState(weaponId, {
            status: 'ready',
          })
        );
      }, weapon.currentWeapon.config.baseStats.cooldown * 1000);
    },
    [state.weapons, dispatch]
  );

  const updateWeapon = useCallback(
    (weaponId: string, updates: Partial<WeaponMount>) => {
      dispatch(shipActions.updateWeapon(weaponId, updates));
    },
    [dispatch]
  );

  const resetState = useCallback(() => {
    dispatch(shipActions.resetState());
  }, [dispatch]);

  const engage = useCallback(() => {
    if (state.status === 'disabled') return;
    updateStatus('engaging');
  }, [state.status, updateStatus]);

  const retreat = useCallback(() => {
    if (state.status === 'disabled') return;
    updateStatus('retreating');
  }, [state.status, updateStatus]);

  const patrol = useCallback(() => {
    if (state.status === 'disabled') return;
    updateStatus('patrolling');
  }, [state.status, updateStatus]);

  const disable = useCallback(() => {
    updateStatus('disabled');
  }, [updateStatus]);

  const damage = useCallback(
    (amount: number) => {
      // First apply to shields
      const remainingShield = Math.max(0, state.shield - amount);
      const shieldDamage = state.shield - remainingShield;
      const remainingDamage = amount - shieldDamage;

      updateShield(remainingShield);

      // Then apply to health if damage remains
      if (remainingDamage > 0) {
        const newHealth = Math.max(0, state.health - remainingDamage);
        updateHealth(newHealth);

        // Update status if heavily damaged
        if (newHealth <= state.maxHealth * 0.25) {
          updateStatus('damaged');
        }
      }
    },
    [state.shield, state.health, state.maxHealth, updateShield, updateHealth, updateStatus]
  );

  const heal = useCallback(
    (amount: number) => {
      updateHealth(Math.min(state.maxHealth, state.health + amount));
    },
    [state.health, state.maxHealth, updateHealth]
  );

  const rechargeShield = useCallback(
    (amount: number) => {
      updateShield(Math.min(state.maxShield, state.shield + amount));
    },
    [state.shield, state.maxShield, updateShield]
  );

  return {
    updateStatus,
    updateHealth,
    updateShield,
    updateStats,
    fireWeapon,
    updateWeapon,
    resetState,
    engage,
    retreat,
    patrol,
    disable,
    damage,
    heal,
    rechargeShield,
  };
}
