import { ThrusterEffect } from "@/components/effects/ThrusterEffect";
import { AlertTriangle } from "lucide-react";
import * as PIXI from "pixi.js";
import { useEffect, useRef } from "react";

// Type augmentation for PIXI.js
declare module "pixi.js" {
  export interface ApplicationOptions {
    backgroundAlpha?: number;
  }

  export interface AssetsBundle<T> {
    [key: string]: T;
  }

  export interface AssetsInit {
    manifest: {
      bundles: Array<{
        name: string;
        assets: Array<{
          name: string;
          srcs: string;
        }>;
      }>;
    };
  }

  export interface AssetsClass {
    init(options: AssetsInit): Promise<void>;
    loadBundle<T>(name: string): Promise<AssetsBundle<T>>;
  }

  export const Assets: AssetsClass;
}

interface HarbringerGalleonProps {
  x: number;
  y: number;
  status: "idle" | "engaging" | "retreating" | "damaged";
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  onStatusChange?: (status: string) => void;
}

interface SpriteAtlas {
  frames: {
    [key: string]: {
      frame: { x: number; y: number; w: number; h: number };
      sourceSize: { w: number; h: number };
      spriteSourceSize: { x: number; y: number; w: number; h: number };
    };
  };
  animations: {
    [key: string]: string[];
  };
}

export const HarbringerGalleon: React.FC<HarbringerGalleonProps> = ({
  x,
  y,
  status,
  health,
  maxHealth,
  shield,
  maxShield,
  onStatusChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application>();
  const spriteRef = useRef<PIXI.Container | null>(null);
  const texturesRef = useRef<PIXI.Texture[]>([]);
  const currentStatus = useRef(status);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) {
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
        // Initialize asset loader
        const manifest: PIXI.AssetsInit = {
          manifest: {
            bundles: [
              {
                name: "spike-ship",
                assets: [
                  {
                    name: "spike_spritesheet",
                    srcs: "/assets/ships/spike_spritesheet.json",
                  },
                ],
              },
            ],
          },
        };

        await PIXI.Assets.init(manifest);

        // Load the sprite atlas
        const atlas = await PIXI.Assets.loadBundle<SpriteAtlas>("spike-ship");
        const spritesheet = atlas["spike_spritesheet"];

        // Create textures from the frames
        texturesRef.current = Object.keys(spritesheet.frames).map((frame) =>
          PIXI.Texture.from(`spike_${frame}.png`),
        );

        // Create sprite container
        const container = new PIXI.Container();
        container.x = x;
        container.y = y;
        container.scale.set(1);

        // Create initial sprite
        const sprite = new PIXI.Sprite(texturesRef.current[0]);
        sprite.anchor.set(0.5);
        container.addChild(sprite);

        spriteRef.current = container;
        app.stage.addChild(container);

        // Update animation based on status
        updateAnimation(status);
      } catch (error) {
        console.error("Error loading Spike ship sprites:", error);
      }
    };

    loadSprites();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      app.destroy(true);
      if (spriteRef.current) {
        spriteRef.current.destroy();
      }
    };
  }, [status, x, y]);

  useEffect(() => {
    if (status !== currentStatus.current) {
      currentStatus.current = status;
      updateAnimation(status);
      onStatusChange?.(status);
    }
  }, [status, onStatusChange]);

  const updateAnimation = (newStatus: string) => {
    if (!spriteRef.current || texturesRef.current.length === 0) {
      return;
    }

    const container = spriteRef.current;
    let frameStart = 0;
    const frameCount = 4;
    let frameDelay = 100;

    switch (newStatus) {
      case "idle":
        frameStart = 0;
        frameDelay = 150;
        break;
      case "engaging":
        frameStart = 4;
        frameDelay = 100;
        break;
      case "retreating":
        frameStart = 8;
        frameDelay = 120;
        break;
      case "damaged":
        frameStart = 12;
        frameDelay = 200;
        break;
    }

    let currentFrame = 0;
    const animate = () => {
      if (!container.children[0]) return;

      const spriteIndex = frameStart + (currentFrame % frameCount);
      (container.children[0] as PIXI.Sprite).texture =
        texturesRef.current[spriteIndex];

      currentFrame++;
      animationFrameRef.current = requestAnimationFrame(() => {
        setTimeout(animate, frameDelay);
      });
    };

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animate();
  };

  return (
    <div className="relative">
      {/* Ship Container */}
      <div ref={containerRef} className="relative w-[400px] h-[400px]" />

      {/* Status Indicators */}
      <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
        {/* Health Bar */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Hull Integrity</span>
            <span
              className={
                health < maxHealth * 0.3 ? "text-red-400" : "text-gray-300"
              }
            >
              {Math.round((health / maxHealth) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                health < maxHealth * 0.3 ? "bg-red-500" : "bg-green-500"
              }`}
              style={{ width: `${(health / maxHealth) * 100}%` }}
            />
          </div>
        </div>

        {/* Shield Bar */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-400">Shield Power</span>
            <span className="text-gray-300">
              {Math.round((shield / maxShield) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${(shield / maxShield) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Thruster Effects */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
        <ThrusterEffect
          size="large"
          color="#4f46e5"
          intensity={status === "retreating" ? 1.5 : 1}
        />
      </div>

      {/* Status Warning */}
      {status === "damaged" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-red-900/80 border border-red-700 rounded-full flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-200">Critical Damage</span>
        </div>
      )}
    </div>
  );
};
