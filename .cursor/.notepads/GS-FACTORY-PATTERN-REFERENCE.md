# GALACTIC SPRAWL - Factory Pattern Reference

## Overview
This document provides canonical implementation examples of the Factory Pattern as used throughout the Galactic Sprawl codebase. These examples serve as reference for implementing new factory classes that adhere to project standards.

## Singleton Factory Pattern

The standard implementation of a factory class uses the singleton pattern to ensure a single instance exists across the application.

```typescript
// src/factories/ships/ShipClassFactory.ts

export class ShipClassFactory {
  private static instance: ShipClassFactory;

  // Private constructor prevents direct instantiation
  private constructor() {
    // Initialization code
  }

  // Static getter for the singleton instance
  public static getInstance(): ShipClassFactory {
    if (!ShipClassFactory.instance) {
      ShipClassFactory.instance = new ShipClassFactory();
    }
    return ShipClassFactory.instance;
  }

  // Factory methods for creating individual entities
  public createShip(
    shipClass: FactionShipClass,
    factionId: FactionId,
    position: Position
  ): CombatUnit {
    // Validation
    const stats = SHIP_STATS[shipClass];
    if (!stats) {
      throw new Error(`Invalid ship class: ${shipClass}`);
    }

    // Create and return the fully configured entity
    return {
      id: `${factionId}-${shipClass}-${Date.now()}`,
      type: shipClass,
      faction: factionId,
      position: { ...position },
      health: stats.health,
      maxHealth: stats.maxHealth,
      shield: stats.shield,
      maxShield: stats.maxShield,
      weapons: this.createWeapons(stats.weapons),
      status: 'ready',
      // Additional properties...
    };
  }

  // Helper methods for creating sub-components
  private createWeapons(weaponSpecs: WeaponSpec[]): Weapon[] {
    return weaponSpecs.map(spec => ({
      id: `weapon-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: spec.type,
      damage: spec.damage,
      cooldown: spec.cooldown,
      range: spec.range,
      // Additional properties...
    }));
  }
}

// Export the singleton instance for convenient access
export const shipClassFactory = ShipClassFactory.getInstance();
```

## Factory Method Pattern

Factory methods create objects with proper initialization and consistent structure.

```typescript
// src/factories/modules/ModuleFactory.ts

export class ModuleFactory {
  private static instance: ModuleFactory;

  // Singleton pattern implementation
  public static getInstance(): ModuleFactory {
    if (!ModuleFactory.instance) {
      ModuleFactory.instance = new ModuleFactory();
    }
    return ModuleFactory.instance;
  }

  // Factory method with full validation and initialization
  public createModule(
    type: ModuleType,
    level: number = 1,
    options: Partial<ModuleOptions> = {}
  ): Module {
    // Validate module type
    if (!Object.values(ModuleType).includes(type)) {
      throw new Error(`Invalid module type: ${type}`);
    }

    // Get module template
    const template = MODULE_TEMPLATES[type];
    if (!template) {
      throw new Error(`No template found for module type: ${type}`);
    }

    // Validate level
    if (level < 1 || level > template.maxLevel) {
      throw new Error(`Invalid level for module type ${type}: ${level}`);
    }

    // Create module with scaled stats based on level
    const id = options.id || `module-${type}-${Date.now()}`;
    const scaling = this.calculateLevelScaling(level);
    
    const module: Module = {
      id,
      type,
      name: options.name || template.name,
      status: options.status || ModuleStatus.INACTIVE,
      level,
      health: Math.round(template.baseHealth * scaling),
      maxHealth: Math.round(template.baseHealth * scaling),
      energyConsumption: Math.round(template.baseEnergyConsumption * scaling),
      efficiency: options.efficiency ?? 100,
      upgradeProgress: 0,
      alerts: [],
      attachedTo: options.attachedTo,
      // Additional properties...
    };

    return module;
  }

  // Helper method for level-based scaling
  private calculateLevelScaling(level: number): number {
    return 1 + (level - 1) * 0.2; // 20% increase per level
  }
}

export const moduleFactory = ModuleFactory.getInstance();
```

## Factory Function Pattern

Lightweight factory functions provide a simpler alternative for creating basic objects.

```typescript
// src/factories/resources/resourceFactory.ts

/**
 * Create a resource state with proper initialization
 */
export function createResourceState(
  type: ResourceType,
  options: Partial<ResourceState> = {}
): ResourceState {
  // Get default values from resource type config
  const defaults = RESOURCE_DEFAULTS[type] || {
    min: 0,
    max: 1000,
    current: 0,
    production: 0,
    consumption: 0,
  };

  // Create resource state with defaults and overrides
  return {
    min: options.min ?? defaults.min,
    max: options.max ?? defaults.max,
    current: options.current ?? defaults.current,
    production: options.production ?? defaults.production,
    consumption: options.consumption ?? defaults.consumption,
  };
}

/**
 * Create a resource threshold with proper initialization
 */
export function createResourceThreshold(
  resourceType: ResourceType,
  thresholdType: ThresholdType,
  value: number,
  callback?: (data: ThresholdTriggeredEventData) => void
): ResourceThreshold {
  return {
    resourceType,
    thresholdType,
    value,
    callback,
  };
}
```

## Factory With Method Chaining

Factory that supports method chaining for flexible object construction.

```typescript
// src/factories/ships/ShipBuilder.ts

export class ShipBuilder {
  private ship: Partial<Ship>;

  constructor(shipType: ShipType) {
    this.ship = {
      id: `ship-${shipType}-${Date.now()}`,
      type: shipType,
      status: 'idle',
      health: SHIP_DEFAULTS[shipType].health,
      maxHealth: SHIP_DEFAULTS[shipType].health,
      position: { x: 0, y: 0 },
      weapons: [],
    };
  }

  // Method chaining methods

  public withPosition(x: number, y: number): ShipBuilder {
    this.ship.position = { x, y };
    return this;
  }

  public withWeapons(weapons: Weapon[]): ShipBuilder {
    this.ship.weapons = [...weapons];
    return this;
  }

  public withCargo(capacity: number): ShipBuilder {
    this.ship.cargo = {
      capacity,
      resources: new Map(),
    };
    return this;
  }

  public withFaction(factionId: FactionId): ShipBuilder {
    this.ship.faction = factionId;
    return this;
  }

  // Build method validates and finalizes the object
  public build(): Ship {
    // Validate required fields
    if (!this.ship.type) {
      throw new Error('Ship must have a type');
    }

    // Add default weapons if none specified
    if (!this.ship.weapons || this.ship.weapons.length === 0) {
      this.ship.weapons = this.getDefaultWeapons(this.ship.type);
    }

    // Return the completed ship
    return this.ship as Ship;
  }

  // Helper methods
  private getDefaultWeapons(shipType: ShipType): Weapon[] {
    // Implementation details...
    return [];
  }

  // Static convenience method
  public static forType(shipType: ShipType): ShipBuilder {
    return new ShipBuilder(shipType);
  }
}

// Usage example
const ship = ShipBuilder.forType(ShipType.CRUISER)
  .withPosition(100, 200)
  .withFaction('player')
  .withCargo(1000)
  .build();
```

## React Component Factory Pattern

Factories for creating specialized React components with consistent props.

```typescript
// src/factories/ui/chartFactory.ts

/**
 * Create a chart configuration with default options
 */
export function createChartConfig(
  type: ChartType,
  options: Partial<ChartOptions> = {}
): ChartOptions {
  // Base options for all chart types
  const baseOptions: ChartOptions = {
    width: options.width ?? 800,
    height: options.height ?? 400,
    margin: options.margin ?? { top: 20, right: 30, bottom: 40, left: 50 },
    animate: options.animate ?? true,
    theme: options.theme ?? 'dark',
    responsive: options.responsive ?? true,
    legend: {
      visible: options.legend?.visible ?? true,
      position: options.legend?.position ?? 'top',
    },
    tooltip: {
      enabled: options.tooltip?.enabled ?? true,
    },
    // Additional options...
  };

  // Add type-specific defaults
  switch (type) {
    case ChartType.LINE:
      return {
        ...baseOptions,
        interpolation: options.interpolation ?? 'linear',
        showPoints: options.showPoints ?? true,
        areaFill: options.areaFill ?? false,
      };
    case ChartType.BAR:
      return {
        ...baseOptions,
        barPadding: options.barPadding ?? 0.2,
        groupPadding: options.groupPadding ?? 0.1,
        horizontal: options.horizontal ?? false,
      };
    case ChartType.SCATTER:
      return {
        ...baseOptions,
        pointSize: options.pointSize ?? 5,
        pointShape: options.pointShape ?? 'circle',
        trendline: options.trendline ?? false,
      };
    // Additional chart types...
    default:
      return baseOptions;
  }
}

/**
 * Factory function to create a chart component with proper configuration
 */
export function createChart(
  type: ChartType,
  data: ChartData,
  options: Partial<ChartOptions> = {}
): React.ReactElement {
  // Create the chart configuration
  const config = createChartConfig(type, options);

  // Return the appropriate chart component based on type
  switch (type) {
    case ChartType.LINE:
      return <LineChart data={data} options={config} />;
    case ChartType.BAR:
      return <BarChart data={data} options={config} />;
    case ChartType.SCATTER:
      return <ScatterChart data={data} options={config} />;
    case ChartType.PIE:
      return <PieChart data={data} options={config} />;
    case ChartType.AREA:
      return <AreaChart data={data} options={config} />;
    // Additional chart types...
    default:
      throw new Error(`Unsupported chart type: ${type}`);
  }
}
```

## Best Practices

1. Always implement factories as singletons to ensure consistent object creation
2. Include validation for all factory method parameters
3. Provide helper methods for creating complex sub-components
4. Export the singleton instance for convenient access
5. Use TypeScript to ensure type safety in factory methods
6. Provide sensible defaults for optional parameters
7. Document factory methods with JSDoc comments
8. Include error handling for invalid parameters

