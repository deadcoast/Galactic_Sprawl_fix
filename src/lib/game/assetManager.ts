import * as PIXI from 'pixi.js';

// Asset Types
export type AssetType = 'ship' | 'weapon' | 'effect' | 'ui';
export type AssetCategory = 'sprite' | 'spritesheet' | 'texture' | 'sound';

interface AssetDefinition {
  name: string;
  type: AssetType;
  category: AssetCategory;
  path: string;
}

interface AssetBundle {
  name: string;
  assets: AssetDefinition[];
}

export class AssetManager {
  private static instance: AssetManager;
  private loadedAssets: Map<string, PIXI.Texture | PIXI.Spritesheet> = new Map();
  private loadPromise: Promise<void> | null = null;

  // Asset bundles configuration
  private bundles: AssetBundle[] = [
    {
      name: 'ships',
      assets: [
        {
          name: 'spike_spritesheet',
          type: 'ship',
          category: 'spritesheet',
          path: '/assets/ships/spike_spritesheet.json',
        },
        // Add more ship assets here
      ],
    },
    {
      name: 'weapons',
      assets: [
        {
          name: 'weapon1',
          type: 'weapon',
          category: 'sprite',
          path: '/assets/ships/weapon1.json',
        },
        // Add more weapon assets here
      ],
    },
    {
      name: 'effects',
      assets: [
        {
          name: 'explosion-1-b',
          type: 'effect',
          category: 'spritesheet',
          path: '/assets/ships/explosion-1-b.json',
        },
        // Add more effect assets here
      ],
    },
  ];

  private constructor() {
    // Private constructor to enforce singleton
  }

  public static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  // Initialize and load all assets
  public async initialize(): Promise<void> {
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = new Promise(async (resolve, reject) => {
      try {
        // Initialize PIXI Assets
        await PIXI.Assets.init({
          manifest: {
            bundles: this.bundles.map(bundle => ({
              name: bundle.name,
              assets: bundle.assets.map(asset => ({
                name: asset.name,
                srcs: asset.path,
              })),
            })),
          },
        });

        // Load all bundles
        await Promise.all(
          this.bundles.map(async bundle => {
            const loadedBundle = await PIXI.Assets.loadBundle<
              Record<string, PIXI.Texture | PIXI.Spritesheet>
            >(bundle.name);
            bundle.assets.forEach(asset => {
              const loadedAsset = loadedBundle[asset.name];
              if (loadedAsset instanceof PIXI.Texture || loadedAsset instanceof PIXI.Spritesheet) {
                this.loadedAssets.set(asset.name, loadedAsset);
              }
            });
          })
        );

        resolve();
      } catch (error) {
        console.error('Error loading assets:', error);
        reject(error);
      }
    });

    return this.loadPromise;
  }

  // Get a loaded asset by name
  public getAsset(name: string): PIXI.Texture | PIXI.Spritesheet | undefined {
    return this.loadedAssets.get(name);
  }

  // Get a texture from a spritesheet
  public getTextureFromSpritesheet(
    spritesheetName: string,
    frameName: string
  ): PIXI.Texture | undefined {
    const spritesheet = this.loadedAssets.get(spritesheetName);
    if (spritesheet instanceof PIXI.Spritesheet) {
      return spritesheet.textures[frameName];
    }
    return undefined;
  }

  // Check if all assets are loaded
  public isLoaded(): boolean {
    return this.loadPromise !== null && this.loadedAssets.size > 0;
  }

  // Get loading progress
  public getLoadingProgress(): number {
    return this.isLoaded() ? 1 : 0;
  }

  // Preload a specific bundle
  public async preloadBundle(bundleName: string): Promise<void> {
    const bundle = this.bundles.find(b => b.name === bundleName);
    if (!bundle) {
      throw new Error(`Bundle ${bundleName} not found`);
    }

    await PIXI.Assets.loadBundle(bundleName);
  }

  // Clean up resources
  public destroy(): void {
    this.loadedAssets.forEach(asset => {
      if (asset instanceof PIXI.Texture) {
        asset.destroy(true);
      } else if (asset instanceof PIXI.Spritesheet) {
        asset.destroy();
      }
    });
    this.loadedAssets.clear();
    this.loadPromise = null;
  }
}

// Export singleton instance
export const assetManager = AssetManager.getInstance();
