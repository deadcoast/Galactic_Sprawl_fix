import { useEffect, useState } from 'react';
import { WeaponInstance, WeaponUpgrade } from '../../types/weapons/WeaponTypes';
import { weaponUpgradeManager } from '../../managers/weapons/WeaponUpgradeManager';
import { Shield, Zap, Target, Award } from 'lucide-react';
import { WEAPON_COLORS } from '../../types/weapons/WeaponTypes';

interface WeaponSpecializationProps {
  weapon: WeaponInstance;
  onSpecializationUnlock?: (specializationType: string) => void;
}

export function WeaponSpecialization({ weapon, onSpecializationUnlock }: WeaponSpecializationProps) {
  const [specializations, setSpecializations] = useState(weaponUpgradeManager.getSpecializations(weapon));
  const [availableUpgrades, setAvailableUpgrades] = useState<WeaponUpgrade[]>([]);
  const color = WEAPON_COLORS[weapon.config.category];

  useEffect(() => {
    // Update available upgrades
    setAvailableUpgrades(weaponUpgradeManager.getAvailableUpgrades(weapon));

    // Subscribe to upgrade events
    const subscription = weaponUpgradeManager.subscribe('specializationUnlocked', ({ weaponId, specializationType }) => {
      if (weaponId === weapon.config.id) {
        setSpecializations(weaponUpgradeManager.getSpecializations(weapon));
        onSpecializationUnlock?.(specializationType);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [weapon, onSpecializationUnlock]);

  const getSpecializationIcon = (specializationType: string) => {
    if (specializationType.includes('damage')) return <Zap className="w-5 h-5" />;
    if (specializationType.includes('shield')) return <Shield className="w-5 h-5" />;
    if (specializationType.includes('accuracy')) return <Target className="w-5 h-5" />;
    return <Award className="w-5 h-5" />;
  };

  return (
    <div className="space-y-4">
      {/* Specialization Trees */}
      <div className="grid grid-cols-1 gap-4">
        {specializations.map(spec => (
          <div
            key={spec.id}
            className={`p-4 rounded-lg border ${
              spec.unlocked
                ? `bg-${color}-900/20 border-${color}-500/30`
                : 'bg-gray-800/50 border-gray-700/30'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div
                className={`p-2 rounded-lg ${
                  spec.unlocked ? `bg-${color}-900/30` : 'bg-gray-700/30'
                }`}
              >
                {getSpecializationIcon(spec.id)}
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">{spec.name}</h3>
                <p className="text-sm text-gray-400">{spec.description}</p>

                {/* Requirements */}
                <div className="mt-3 space-y-1">
                  <div className="text-sm text-gray-400">Requirements:</div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-gray-500">Level:</span>
                    <span
                      className={
                        weapon.config.tier >= spec.requirements.level
                          ? 'text-green-400'
                          : 'text-red-400'
                      }
                    >
                      {spec.requirements.level}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-gray-500">Experience:</span>
                    <span
                      className={
                        weaponUpgradeManager.getWeaponExperience(weapon.config.id) >=
                        spec.requirements.experience
                          ? 'text-green-400'
                          : 'text-red-400'
                      }
                    >
                      {spec.requirements.experience}
                    </span>
                  </div>
                </div>

                {/* Required Upgrades */}
                {spec.requirements.upgrades.length > 0 && (
                  <div className="mt-3">
                    <div className="text-sm text-gray-400 mb-2">Required Upgrades:</div>
                    <div className="grid grid-cols-2 gap-2">
                      {spec.requirements.upgrades.map(upgradeId => {
                        const upgrade = availableUpgrades.find(u => u.id === upgradeId);
                        const isUnlocked = upgrade?.unlocked || false;
                        return (
                          <div
                            key={upgradeId}
                            className={`px-2 py-1 rounded text-sm ${
                              isUnlocked
                                ? `bg-${color}-900/20 text-${color}-400`
                                : 'bg-gray-800 text-gray-400'
                            }`}
                          >
                            {upgrade?.name || upgradeId}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Bonuses */}
                {spec.unlocked && (
                  <div className="mt-4">
                    <div className="text-sm text-gray-400 mb-2">Active Bonuses:</div>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(spec.bonuses).map(([key, value]) => (
                        <div
                          key={key}
                          className={`px-2 py-1 rounded bg-${color}-900/20 text-${color}-400 text-sm`}
                        >
                          {key}: +{((value as number - 1) * 100).toFixed(0)}%
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 