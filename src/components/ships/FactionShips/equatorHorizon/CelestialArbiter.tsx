import { FactionShipBase } from "../FactionShipBase";
import { WeaponMount } from "../../common/WeaponMount";
import { WeaponCategory, WeaponInstance } from "../../../../types/weapons/WeaponTypes";
import { FactionShipStats } from "../../../../types/ships/FactionShipTypes";
import * as PIXI from "pixi.js";
import { useEffect, useRef } from "react";
import { useAssets } from "../../../../hooks/game/useAssets";
import { useAnimation } from "../../../../hooks/game/useAnimation";
import { AlertTriangle } from "lucide-react";

type ShipStatus =
  | "idle"
  | "engaging"
  | "patrolling"
  | "retreating"
  | "disabled"
  | "damaged";

interface CelestialArbiterProps {
  id: string;
  status: ShipStatus;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  weapons: WeaponInstance[];
  stats: FactionShipStats;
  onFire?: (weaponId: string) => void;
  onEngage?: () => void;
  onRetreat?: () => void;
  onSpecialAbility?: (abilityName?: string) => void;
  systemBalance?: number;
}

export function CelestialArbiter({
  id,
  status,
  health,
  maxHealth,
  shield,
  maxShield,
  weapons,
  stats,
  onFire,
  onEngage,
  onRetreat,
  onSpecialAbility,
  systemBalance = 0,
}: CelestialArbiterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application>();
  const spriteRef = useRef<PIXI.Sprite | null>(null);
  const texturesRef = useRef<PIXI.Texture[]>([]);

  const { isLoading, getTextureFromSpritesheet } = useAssets(['ships']);

  useEffect(() => {
    if (!containerRef.current || isLoading) {
      return;
    }

    // Initialize PixiJS Application
    const app = new PIXI.Application({
      width: 400,
      height: 400,
      backgroundColor: 0x000000,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
    });

    containerRef.current.appendChild(app.view as unknown as Node);
    appRef.current = app;

    const loadSprites = async () => {
      try {
        // Create textures from the frames
        texturesRef.current = Array.from({ length: 16 }, (_, i) => {
          const texture = getTextureFromSpritesheet('celestial_arbiter_spritesheet', `celestial_arbiter_${i}.png`);
          if (!texture) {
            throw new Error(`Failed to load texture celestial_arbiter_${i}.png`);
          }
          return texture;
        });

        // Create sprite container
        const container = new PIXI.Container();
        container.x = 200;
        container.y = 200;
        container.scale.set(1);

        // Create initial sprite
        const sprite = new PIXI.Sprite(texturesRef.current[0]);
        sprite.anchor.set(0.5);
        container.addChild(sprite);
        spriteRef.current = sprite;

        app.stage.addChild(container);
      } catch (error) {
        console.error("Error loading Celestial Arbiter sprites:", error);
      }
    };

    loadSprites();

    return () => {
      app.destroy(true);
    };
  }, [isLoading, getTextureFromSpritesheet]);

  // Use the animation hook
  useAnimation({
    id: `celestial-arbiter-${id}`,
    sprite: spriteRef.current,
    textures: texturesRef.current,
    state: status,
  });

  return (
    <div className="relative">
      <div ref={containerRef} className="w-[400px] h-[400px]" />
      
      {/* Ship Base Component */}
      <FactionShipBase
        ship={{
          id,
          name: "Celestial Arbiter",
          faction: "equator-horizon",
          class: "celestial-arbiter",
          status: status === "damaged" ? "disabled" : status,
          health,
          maxHealth,
          shield,
          maxShield,
          stats,
          specialAbility: {
            name: "Balance Restoration",
            description: "Restore balance to nearby ships, enhancing their capabilities",
            cooldown: 45,
            active: false
          }
        }}
        onEngage={onEngage}
        onRetreat={onRetreat}
        onSpecialAbility={() => onSpecialAbility?.("Balance Restoration")}
      />

      {/* Weapon Mounts */}
      <div className="absolute inset-0 pointer-events-none">
        {weapons.map((weapon, index) => {
          const weaponCategory: WeaponCategory = weapon.config.category;
          const enhancedStats = {
            ...weapon.state.currentStats,
            damage: weapon.state.currentStats.damage * (1 + systemBalance * 0.1),
            accuracy: weapon.state.currentStats.accuracy * (1 + systemBalance * 0.05),
          };
          
          return (
            <WeaponMount
              key={`mount-${weapon.config.id}`}
              weapon={{
                category: weaponCategory,
                variant: weapon.config.name.toLowerCase().replace(/\s+/g, '-'),
                visualAsset: weapon.config.visualAsset || `weapons/equator-horizon/${weaponCategory}/${weapon.config.name.toLowerCase().replace(/\s+/g, '-')}`,
                stats: enhancedStats
              }}
              position={{
                x: 55 + index * 35,
                y: 55,
              }}
              rotation={0}
              isFiring={status === "engaging"}
              onFire={() => onFire?.(weapon.config.id)}
              className="absolute"
            />
          );
        })}
      </div>

      {/* Warning indicator for damaged state */}
      {status === "damaged" && (
        <div className="absolute top-0 right-0 p-2">
          <AlertTriangle className="w-6 h-6 text-yellow-500 animate-pulse" />
        </div>
      )}
    </div>
  );
}
