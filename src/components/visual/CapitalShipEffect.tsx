import { Crosshair, Zap } from "lucide-react";

interface CapitalShipEffectProps {
  type: "harbringerGalleon" | "midwayCarrier" | "motherEarthRevenge";
  status: "idle" | "engaging" | "damaged";
  shieldStrength: number;
  weaponCharge: number;
  quality: "low" | "medium" | "high";
}

export function CapitalShipEffect({
  type,
  status,
  shieldStrength,
  weaponCharge,
  quality,
}: CapitalShipEffectProps) {
  const getShipColor = () => {
    switch (type) {
      case "harbringerGalleon":
        return "purple";
      case "midwayCarrier":
        return "fuchsia";
      case "motherEarthRevenge":
        return "rose";
      default:
        return "blue";
    }
  };

  const color = getShipColor();
  const particleCount = quality === "high" ? 16 : quality === "medium" ? 10 : 6;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Shield Effect */}
      <div className="absolute inset-0">
        <div
          className={`absolute inset-0 rounded-full border-2 border-${color}-500/30`}
          style={{
            transform: `scale(${1 + shieldStrength * 0.2})`,
            opacity: shieldStrength,
            filter: `blur(${quality === "high" ? 8 : 4}px)`,
          }}
        />

        {quality !== "low" && (
          <div
            className={`absolute inset-0 bg-${color}-500/10 animate-pulse rounded-full`}
            style={{
              transform: `scale(${1 + shieldStrength * 0.1})`,
              animationDuration: "3s",
            }}
          />
        )}
      </div>

      {/* Weapon Charge Effect */}
      {weaponCharge > 0 && (
        <div className="absolute inset-0">
          {/* Energy Build-up */}
          <div
            className={`absolute inset-0 bg-${color}-500/20`}
            style={{
              clipPath: `polygon(0 ${100 - weaponCharge * 100}%, 100% ${100 - weaponCharge * 100}%, 100% 100%, 0 100%)`,
            }}
          />

          {/* Charge Particles */}
          {Array.from({ length: Math.ceil(particleCount * weaponCharge) }).map(
            (_, i) => (
              <div
                key={i}
                className={`absolute w-1 h-1 bg-${color}-400 rounded-full`}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animation: `float ${1 + Math.random()}s infinite`,
                  opacity: 0.5 + Math.random() * 0.5,
                }}
              />
            ),
          )}
        </div>
      )}

      {/* Status Effects */}
      {status === "engaging" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Crosshair className={`w-8 h-8 text-${color}-400 animate-pulse`} />
        </div>
      )}

      {status === "damaged" && (
        <div className="absolute inset-0">
          {/* Damage Sparks */}
          {Array.from({ length: particleCount }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-4 bg-yellow-500 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                transform: `rotate(${Math.random() * 360}deg)`,
                animation: `spark ${0.5 + Math.random()}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      {/* Ship-specific Effects */}
      {type === "harbringerGalleon" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`w-3/4 h-3/4 rounded-full border-2 border-${color}-500/30 animate-spin-slow`}
          />
        </div>
      )}

      {type === "midwayCarrier" && (
        <div className="absolute inset-0">
          {/* Carrier Bay Indicators */}
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`absolute w-8 h-2 bg-${color}-500/30`}
              style={{
                left: "50%",
                top: `${25 + i * 20}%`,
                transform: "translateX(-50%)",
                animation: `pulse ${1 + i * 0.5}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      {type === "motherEarthRevenge" && quality !== "low" && (
        <div className="absolute inset-0">
          {/* Energy Field */}
          <div
            className={`absolute inset-0 bg-gradient-radial from-${color}-500/30 via-transparent to-transparent animate-pulse`}
            style={{ animationDuration: "4s" }}
          />

          {/* Power Core */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className={`w-12 h-12 text-${color}-400 animate-pulse`} />
          </div>
        </div>
      )}
    </div>
  );
}
