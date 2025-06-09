import { AlertTriangle } from 'lucide-react';
import * as PIXI from 'pixi.js';
import * as React from 'react';
import { useEffect, useRef } from 'react';
import { errorLoggingService, ErrorType } from 'src/services/logging/ErrorLoggingService';
import { ThrusterEffect } from '../../../effects/component_effects/ThrusterEffect';
import { useAnimation } from '../../../hooks/game/useAnimation';
import { useAssets } from '../../../hooks/game/useAssets';

// Type augmentation for PIXI.js
declare module 'pixi.js' {
  export interface ApplicationOptions {
    backgroundAlpha?: number;
  }

  export interface AssetsInit {
    manifest: {
      bundles: {
        name: string;
        assets: {
          name: string;
          srcs: string;
        }[];
      }[];
    };
  }

  export interface AssetsClass {
    init(options: AssetsInit): Promise<void>;
    loadBundle<T>(name: string): Promise<Record<string, T>>;
    spritesheet: SpriteAtlas;
  }
}

export interface HarbringerGalleonProps {
  x: number;
  y: number;
  status: 'idle' | 'engaging' | 'retreating' | 'damaged';
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  onStatusChange?: (status: string) => void;
}

export interface SpriteAtlas {
  frames: Record<
    string,
    {
      frame: { x: number; y: number; w: number; h: number };
      sourceSize: { w: number; h: number };
      spriteSourceSize: { x: number; y: number; w: number; h: number };
    }
  >;
  animations: Record<string, string[]>;
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

    const loadSprites = () => {
      try {
        // Create textures from the frames
        texturesRef.current = Array.from({ length: 16 }, (_, i) => {
          const texture = getTextureFromSpritesheet('spike_spritesheet', `spike_${i}.png`);
          if (!texture) {
            throw new Error(`Failed to load texture spike_${i}.png`);
          }
          return texture;
        });

        // Create sprite container
        const container = new PIXI.Container();
        container.x = x;
        container.y = y;
        container.scale.set(1);

        // Create initial sprite
        const sprite = new PIXI.Sprite(texturesRef.current[0]);
        sprite.anchor.set(0.5);
        container.addChild(sprite as PIXI.DisplayObject);
        spriteRef.current = sprite;

        app.stage.addChild(container as PIXI.DisplayObject);
      } catch (error) {
        errorLoggingService.logError(
          'Error loading Harbringer Galleon sprites:',
          error as ErrorType
        );
      }
    };

    loadSprites();

    return () => {
      app.destroy(true);
    };
  }, [x, y, isLoading, getTextureFromSpritesheet]);

  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  // Use the animation hook
  useAnimation({
    id: 'harbringer-galleon',
    sprite: spriteRef.current,
    textures: texturesRef.current,
    state: status,
  });

  return (
    <div className="relative">
      <div ref={containerRef} className="h-[400px] w-[400px]" />
      {/* Health and shield bars */}
      <div className="absolute bottom-0 left-0 w-full px-4 py-2">
        <div className="flex flex-col gap-1">
          <div className="h-2 rounded-full bg-gray-700">
            <div
              className="h-full rounded-full bg-red-500"
              style={{ width: `${(health / maxHealth) * 100}%` }}
            />
          </div>
          <div className="h-2 rounded-full bg-gray-700">
            <div
              className="h-full rounded-full bg-blue-500"
              style={{ width: `${(shield / maxShield) * 100}%` }}
            />
          </div>
        </div>
      </div>
      {/* warning indicator for damaged state */}
      {status === 'damaged' && (
        <div className="absolute top-0 right-0 p-2">
          <AlertTriangle className="h-6 w-6 animate-pulse text-yellow-500" />
        </div>
      )}
      {/* Thruster effects */}
      <ThrusterEffect
        size="large"
        color="#4f46e5"
        intensity={status === 'engaging' || status === 'retreating' ? 1.0 : 0.0}
      />
    </div>
  );
};
