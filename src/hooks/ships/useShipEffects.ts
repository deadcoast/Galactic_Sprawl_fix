import { useCallback } from "react";
import { BaseEffect } from "../../effects/types_effects/EffectTypes";
import { useShipState } from "../../contexts/ShipContext";
import { shipActions } from "../../contexts/ShipContext";

export function useShipEffects() {
  const { state, dispatch } = useShipState();

  const addEffect = useCallback(
    (effect: BaseEffect) => {
      dispatch(shipActions.addEffect(effect));
    },
    [dispatch]
  );

  const removeEffect = useCallback(
    (effectId: string) => {
      dispatch(shipActions.removeEffect(effectId));
    },
    [dispatch]
  );

  const hasEffect = useCallback(
    (effectId: string) => {
      return state.effects.effects.some((e) => e.id === effectId);
    },
    [state.effects]
  );

  const getEffectsByType = useCallback(
    (type: string) => {
      return state.effects.effects.filter((e) => e.type === type);
    },
    [state.effects]
  );

  const getActiveEffects = useCallback(() => {
    const now = Date.now();
    return state.effects.effects.filter((effect) => {
      if (!effect.active) return false;
      if (!effect.duration) return true;

      const appliedEntry = state.effects.history
        .filter(
          (entry) =>
            entry.effectId === effect.id && entry.action === "applied"
        )
        .pop();

      if (!appliedEntry) return false;

      return (
        now - appliedEntry.timestamp < effect.duration * 1000
      );
    });
  }, [state.effects]);

  const clearExpiredEffects = useCallback(() => {
    const now = Date.now();
    state.effects.effects.forEach((effect) => {
      if (!effect.duration) return;

      const appliedEntry = state.effects.history
        .filter(
          (entry) =>
            entry.effectId === effect.id && entry.action === "applied"
        )
        .pop();

      if (!appliedEntry) return;

      if (now - appliedEntry.timestamp >= effect.duration * 1000) {
        dispatch(shipActions.removeEffect(effect.id));
      }
    });
  }, [state.effects, dispatch]);

  return {
    effects: state.effects,
    activeEffects: getActiveEffects(),
    addEffect,
    removeEffect,
    hasEffect,
    getEffectsByType,
    clearExpiredEffects,
  };
} 