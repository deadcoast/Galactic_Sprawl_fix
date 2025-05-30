import * as PIXI from 'pixi.js';
import { useEffect, useState } from 'react';
import { assetManager } from '../../managers/game/assetManager';
import { errorLoggingService, ErrorSeverity, ErrorType } from '../../services/ErrorLoggingService';

interface UseAssetsResult {
  isLoading: boolean;
  progress: number;
  getAsset: (name: string) => PIXI.Texture | PIXI.Spritesheet | undefined;
  getTextureFromSpritesheet: (
    spritesheetName: string,
    frameName: string
  ) => PIXI.Texture | undefined;
}

export function useAssets(bundleNames?: string[]): UseAssetsResult {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const loadAssets = async () => {
      try {
        if (bundleNames && bundleNames.length > 0) {
          // Load specific bundles
          await Promise.all(bundleNames.map(name => assetManager.preloadBundle(name)));
        } else {
          // Load all assets
          await assetManager.initialize();
        }
        setIsLoading(false);
        setProgress(1);
      } catch (error) {
        errorLoggingService.logError(
          error instanceof Error ? error : new Error('Error loading assets'),
          ErrorType.RESOURCE,
          ErrorSeverity.HIGH,
          { componentName: 'useAssets', action: 'loadAssets', bundleNames: bundleNames?.join(',') }
        );
        setIsLoading(false);
      }
    };

    if (!assetManager.isLoaded()) {
      loadAssets();
    } else {
      setIsLoading(false);
      setProgress(1);
    }

    return () => {
      // No cleanup needed as AssetManager handles its own cleanup
    };
  }, [bundleNames]);

  return {
    isLoading,
    progress,
    getAsset: assetManager.getAsset.bind(assetManager),
    getTextureFromSpritesheet: assetManager.getTextureFromSpritesheet.bind(assetManager),
  };
}
