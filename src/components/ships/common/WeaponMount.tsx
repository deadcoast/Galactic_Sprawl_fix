import { WeaponEffect } from "../../effects/WeaponEffect";
import { WeaponType } from "../../../types/ships/CommonShipTypes";

// Map weapon categories to supported effect types
type SupportedEffectType = "machineGun" | "railGun" | "gaussCannon" | "rockets" | "mgss" | "pointDefense";

const mapToSupportedEffect = (category: WeaponType["category"]): SupportedEffectType => {
  switch (category) {
    case "machineGun":
    case "railGun":
    case "gaussCannon":
    case "rockets":
    case "mgss":
    case "pointDefense":
      return category;
    case "flakCannon":
      return "pointDefense"; // Map flak to point defense effect
    case "capitalLaser":
      return "railGun"; // Map capital laser to rail gun effect
    case "torpedoes":
      return "rockets"; // Map torpedoes to rocket effect
    default:
      return "machineGun"; // Fallback effect
  }
};

export interface WeaponMountProps {
  weapon: WeaponType;
  position: { x: number; y: number };
  rotation: number;
  isFiring: boolean;
  onFire?: () => void;
  className?: string;
}

export function WeaponMount({
  weapon,
  position,
  rotation,
  isFiring,
  onFire,
  className = "",
}: WeaponMountProps) {
  const getWeaponColor = (category: WeaponType["category"]) => {
    switch (category) {
      case "machineGun":
        return "#FF4444";
      case "gaussCannon":
        return "#44AAFF";
      case "railGun":
        return "#AA44FF";
      case "mgss":
        return "#FF8844";
      case "rockets":
        return "#FF4488";
      case "flakCannon":
        return "#44FF88";
      case "capitalLaser":
        return "#FF44FF";
      case "torpedoes":
        return "#FF8800";
      case "pointDefense":
      default:
        return "#FFFFFF";
    }
  };

  return (
    <div
      className={`relative ${className}`}
      style={{
        transform: `rotate(${rotation}deg)`,
      }}
    >
      {/* Weapon Model */}
      <div className="w-8 h-8 relative">
        <img
          src={weapon.visualAsset}
          alt={`${weapon.category} - ${weapon.variant}`}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Weapon Effect */}
      {isFiring && (
        <WeaponEffect
          type={mapToSupportedEffect(weapon.category)}
          color={getWeaponColor(weapon.category)}
          position={position}
          rotation={rotation}
          firing={true}
        />
      )}

      {/* Weapon Stats Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="font-medium">
          {weapon.category} - {weapon.variant}
        </div>
        <div className="text-gray-400">
          <div>Damage: {weapon.stats.damage}</div>
          <div>Range: {weapon.stats.range}</div>
          <div>Rate: {weapon.stats.rateOfFire}/s</div>
        </div>
      </div>

      {/* Click Handler */}
      {onFire && (
        <button
          onClick={onFire}
          className="absolute inset-0 cursor-pointer focus:outline-none"
          aria-label={`Fire ${weapon.category}`}
        />
      )}
    </div>
  );
}
