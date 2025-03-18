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
          name: 'klaed_fighter',
          type: 'ship',
          category: 'sprite',
          path: "/.pixelArtAssets/Space_Ships/Main_Faction_Ships/Space_Rats_Ships/Kla'ed/Base/PNGs/Kla'ed - Fighter - Base.png",
        },
        {
          name: 'klaed_scout',
          type: 'ship',
          category: 'sprite',
          path: "/.pixelArtAssets/Space_Ships/Main_Faction_Ships/Space_Rats_Ships/Kla'ed/Base/PNGs/Kla'ed - Scout - Base.png",
        },
        {
          name: 'klaed_bomber',
          type: 'ship',
          category: 'sprite',
          path: "/.pixelArtAssets/Space_Ships/Main_Faction_Ships/Space_Rats_Ships/Kla'ed/Base/PNGs/Kla'ed - Bomber - Base.png",
        },
        {
          name: 'klaed_frigate',
          type: 'ship',
          category: 'sprite',
          path: "/.pixelArtAssets/Space_Ships/Main_Faction_Ships/Space_Rats_Ships/Kla'ed/Base/PNGs/Kla'ed - Frigate - Base.png",
        },
        {
          name: 'klaed_battlecruiser',
          type: 'ship',
          category: 'sprite',
          path: "/.pixelArtAssets/Space_Ships/Main_Faction_Ships/Space_Rats_Ships/Kla'ed/Base/PNGs/Kla'ed - Battlecruiser - Base.png",
        },
      ],
    },
    {
      name: 'ui',
      assets: [
        {
          name: 'gui_sheet',
          type: 'ui',
          category: 'sprite',
          path: '/.pixelArtAssets/GUI_Assets/gui_sheet_64x64.aseprite',
        },
      ],
    },
    {
      name: 'effects',
      assets: [], // We'll add effects later as needed
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
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise((resolve, reject) => {
      // Initialize PIXI Assets
      PIXI.Assets.init({
        manifest: {
          bundles: this.bundles.map(bundle => ({
            name: bundle.name,
            assets: bundle.assets.map(asset => ({
              alias: asset.name,
              src: asset.path,
            })),
          })),
        },
      })
        .then(() => {
          // Load default bundle
          return PIXI.Assets.loadBundle('default');
        })
        .then(assets => {
          // Process loaded assets
          if (assets) {
            Object.entries(assets).forEach(([name, asset]) => {
              this.loadedAssets.set(name, asset as PIXI.Texture | PIXI.Spritesheet);
            });
            resolve();
          } else {
            console.warn('[AssetManager] Warning: loaded assets is null or undefined');
            resolve(); // Still resolve to avoid blocking game initialization
          }
        })
        .catch(error => {
          reject(error);
        });
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
