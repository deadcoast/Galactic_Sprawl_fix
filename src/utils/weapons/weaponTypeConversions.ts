import { WeaponCategory, WeaponMount, WeaponSystem } from '../../types/weapons/WeaponTypes';

export type WeaponSystemType = 'machineGun' | 'gaussCannon' | 'railGun' | 'mgss' | 'rockets';

export function isWeaponSystemType(type: string): type is WeaponSystemType {
  return ['machineGun', 'gaussCannon', 'railGun', 'mgss', 'rockets'].includes(type);
}

export function convertWeaponCategoryToSystemType(category: WeaponCategory): WeaponSystemType {
  if (isWeaponSystemType(category)) {
    return category;
  }
  // Map other categories to basic types
  const categoryMap: Record<WeaponCategory, WeaponSystemType> = {
    pointDefense: 'machineGun',
    flakCannon: 'machineGun',
    capitalLaser: 'railGun',
    torpedoes: 'rockets',
    harmonicCannon: 'gaussCannon',
    temporalCannon: 'gaussCannon',
    quantumCannon: 'railGun',
    plasmaCannon: 'railGun',
    beamWeapon: 'railGun',
    pulseWeapon: 'mgss',
    disruptor: 'gaussCannon',
    ionCannon: 'gaussCannon',
    machineGun: 'machineGun',
    gaussCannon: 'gaussCannon',
    railGun: 'railGun',
    mgss: 'mgss',
    rockets: 'rockets',
    energyLaser: 'railGun',
    missileLauncher: 'rockets',
  };
  return categoryMap[category];
}

export function convertSystemTypeToWeaponCategory(type: WeaponSystemType): WeaponCategory {
  return type as WeaponCategory;
}

export function isValidWeaponMount(mount: WeaponMount): boolean {
  return (
    typeof mount.id === 'string' &&
    typeof mount.size === 'string' &&
    typeof mount.position === 'string' &&
    typeof mount.rotation === 'number' &&
    Array.isArray(mount.allowedCategories)
  );
}

export function isValidWeaponSystem(weapon: WeaponSystem): boolean {
  return (
    typeof weapon.id === 'string' &&
    isWeaponSystemType(weapon.type) &&
    typeof weapon.damage === 'number' &&
    typeof weapon.range === 'number' &&
    typeof weapon.cooldown === 'number' &&
    ['ready', 'charging', 'cooling'].includes(weapon.status)
  );
}
