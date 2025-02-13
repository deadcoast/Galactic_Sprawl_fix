import { FactionShipBase } from "../FactionShipBase";
import { WeaponMount } from "../../common/WeaponMount";
import { WeaponType } from "../../../../types/combat/CombatTypes";
import { CommonShipStats } from "../../../../types/ships/CommonShipTypes";
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

interface DarkMatterReaperProps {
  id: string;
  status: ShipStatus;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  weapons: WeaponType[];
  stats: CommonShipStats;
  onFire?: (weaponId: string) => void;
  onEngage?: () => void;
  onRetreat?: () => void;
  onSpecialAbility?: (abilityName?: string) => void;
}

export function DarkMatterReaper({
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
}: DarkMatterReaperProps) {
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
          const texture = getTextureFromSpritesheet('dark_matter_reaper_spritesheet', `dark_matter_reaper_${i}.png`);
          if (!texture) {
            throw new Error(`Failed to load texture dark_matter_reaper_${i}.png`);
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
        console.error("Error loading Dark Matter Reaper sprites:", error);
      }
    };

    loadSprites();

    return () => {
      app.destroy(true);
    };
  }, [isLoading, getTextureFromSpritesheet]);

  // Use the animation hook
  useAnimation({
    id: `dark-matter-reaper-${id}`,
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
          name: "Dark Matter Reaper",
          faction: "lost-nova",
          class: "dark-matter-reaper",
          status: status === "damaged" ? "disabled" : status,
          health,
          maxHealth,
          shield,
          maxShield,
          stats,
          specialAbility: {
            name: "Dark Matter Surge",
            description: "Temporarily increases damage output by channeling dark matter energy",
            cooldown: 40,
            active: false
          }
        }}
        onEngage={onEngage}
        onRetreat={onRetreat}
        onSpecialAbility={() => onSpecialAbility?.("Dark Matter Surge")}
      />

      {/* Weapon Mounts */}
      <div className="absolute inset-0 pointer-events-none">
        {weapons.map((weapon, index) => (
          <WeaponMount
            key={weapon.id}
            weapon={weapon}
            position={{
              x: 45 + index * 28,
              y: 45,
            }}
            rotation={0}
            isFiring={status === "engaging"}
            onFire={() => onFire?.(weapon.id)}
            className="absolute"
          />
        ))}
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
