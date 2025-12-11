# EXPLORATION SYSTEM

## Overview

The Exploration System manages all aspects of space exploration and discovery in Galactic Sprawl. It includes:

- Sector generation and management
- Resource discovery and analysis
- Exploration vessel control
- Discovery classification
- Data analysis and visualization

## Core Components

### Exploration Types

```typescript
// src/types/exploration/ExplorationTypes.ts

export enum SectorType {
  UNEXPLORED = "UNEXPLORED",
  ASTEROID_FIELD = "ASTEROID_FIELD",
  NEBULA = "NEBULA",
  PLANETARY_SYSTEM = "PLANETARY_SYSTEM",
  DEEP_SPACE = "DEEP_SPACE",
}

export enum DiscoveryType {
  RESOURCE_DEPOSIT = "RESOURCE_DEPOSIT",
  ALIEN_ARTIFACT = "ALIEN_ARTIFACT",
  ANOMALY = "ANOMALY",
  DERELICT = "DERELICT",
  SPATIAL_PHENOMENON = "SPATIAL_PHENOMENON",
}

export interface Sector {
  id: string;
  coordinates: Vector3D;
  type: SectorType;
  discoveries: Discovery[];
  resources: ResourceDeposit[];
  status: ExplorationStatus;
  metadata: SectorMetadata;
}

export interface Discovery {
  id: string;
  type: DiscoveryType;
  location: Vector3D;
  classification?: Classification;
  analysisProgress: number;
  metadata: DiscoveryMetadata;
}

export interface ResourceDeposit {
  type: ResourceType;
  amount: number;
  quality: number;
  accessibility: number;
  extractionRate: number;
}
```

### Exploration Manager

```typescript
// src/managers/exploration/ExplorationManager.ts

export class ExplorationManager extends BaseManager<ExplorationEvent> {
  private sectors: Map<string, Sector>;
  private vessels: Map<string, ExplorationVessel>;
  private discoveryAnalyzer: DiscoveryAnalyzer;
  private sectorGenerator: SectorGenerator;

  constructor(eventBus: EventBus, config: ExplorationConfig) {
    super("ExplorationManager", eventBus);
    this.sectors = new Map();
    this.vessels = new Map();
    this.discoveryAnalyzer = new DiscoveryAnalyzer(config.analysis);
    this.sectorGenerator = new SectorGenerator(config.generation);
  }

  public async exploreSector(coordinates: Vector3D): Promise<Sector> {
    const sector = await this.generateSector(coordinates);
    this.sectors.set(sector.id, sector);

    await this.scanSector(sector);
    this.publishEvent(ExplorationEvents.SECTOR_EXPLORED, { sector });

    return sector;
  }

  public async analyzeSector(sectorId: string): Promise<Analysis> {
    const sector = this.getSector(sectorId);
    const analysis = await this.discoveryAnalyzer.analyzeSector(sector);

    this.updateSectorAnalysis(sector, analysis);
    this.publishEvent(ExplorationEvents.SECTOR_ANALYZED, {
      sectorId,
      analysis,
    });

    return analysis;
  }

  public async dispatchVessel(
    vesselId: string,
    destination: Vector3D,
  ): Promise<void> {
    const vessel = this.getVessel(vesselId);
    const route = await this.calculateRoute(vessel.position, destination);

    await this.startVesselJourney(vessel, route);
    this.publishEvent(ExplorationEvents.VESSEL_DISPATCHED, {
      vesselId,
      destination,
      route,
    });
  }

  private async scanSector(sector: Sector): Promise<void> {
    const discoveries = await this.performSectorScan(sector);

    for (const discovery of discoveries) {
      sector.discoveries.push(discovery);
      this.publishEvent(ExplorationEvents.DISCOVERY_MADE, { discovery });

      if (discovery.type === DiscoveryType.RESOURCE_DEPOSIT) {
        await this.handleResourceDiscovery(sector, discovery);
      }
    }
  }

  private async handleResourceDiscovery(
    sector: Sector,
    discovery: Discovery,
  ): Promise<void> {
    const deposit = await this.analyzeResourceDeposit(discovery);
    sector.resources.push(deposit);

    this.publishEvent(ExplorationEvents.RESOURCE_DISCOVERED, {
      sectorId: sector.id,
      deposit,
    });
  }

  protected async onUpdate(deltaTime: number): Promise<void> {
    await this.updateVessels(deltaTime);
    await this.updateAnalysis(deltaTime);
    await this.checkDiscoveryProgress();
  }
}
```

### Discovery Analyzer

```typescript
// src/systems/exploration/DiscoveryAnalyzer.ts

export class DiscoveryAnalyzer {
  private analysisQueue: PriorityQueue<Discovery>;
  private activeAnalysis: Map<string, Analysis>;
  private config: AnalysisConfig;

  constructor(config: AnalysisConfig) {
    this.analysisQueue = new PriorityQueue();
    this.activeAnalysis = new Map();
    this.config = config;
  }

  public async analyzeDiscovery(discovery: Discovery): Promise<Analysis> {
    const analysis = this.createAnalysis(discovery);
    this.activeAnalysis.set(discovery.id, analysis);

    try {
      await this.performAnalysis(analysis);
      this.finalizeAnalysis(analysis);
      return analysis;
    } catch (error) {
      this.handleAnalysisError(analysis, error);
      throw error;
    }
  }

  private async performAnalysis(analysis: Analysis): Promise<void> {
    const steps = this.determineAnalysisSteps(analysis.discovery);

    for (const step of steps) {
      await this.executeAnalysisStep(analysis, step);
      this.updateAnalysisProgress(analysis);
    }
  }

  private async executeAnalysisStep(
    analysis: Analysis,
    step: AnalysisStep,
  ): Promise<void> {
    const startTime = performance.now();

    try {
      const result = await step.execute(analysis.discovery);
      this.processStepResult(analysis, step, result);
    } catch (error) {
      this.handleStepError(analysis, step, error);
    }

    this.recordStepMetrics(step, performance.now() - startTime);
  }
}
```

### Exploration UI Components

```typescript
// src/components/exploration/ExplorationMap.tsx

export const ExplorationMap: React.FC<ExplorationMapProps> = ({
  sectors,
  selectedSector,
  onSectorSelect,
}) => {
  const mapRef = useRef<HTMLCanvasElement>(null);
  const [viewport, setViewport] = useState<Viewport>(defaultViewport);
  const renderer = useRenderer(mapRef);

  useEffect(() => {
    if (!renderer) return;
    renderer.renderSectors(sectors, viewport);
  }, [sectors, viewport, renderer]);

  const handleSectorClick = (event: MouseEvent) => {
    const coordinates = renderer?.getCoordinatesFromClick(event);
    if (!coordinates) return;

    const sector = sectors.find(s =>
      isSectorAtCoordinates(s, coordinates)
    );

    if (sector) {
      onSectorSelect(sector);
    }
  };

  return (
    <div className="exploration-map">
      <MapControls
        viewport={viewport}
        onViewportChange={setViewport}
      />
      <canvas
        ref={mapRef}
        onClick={handleSectorClick}
        className="sector-map"
      />
      {selectedSector && (
        <SectorDetails
          sector={selectedSector}
          onClose={() => onSectorSelect(null)}
        />
      )}
    </div>
  );
};
```

## Integration Points

### Resource System Integration

1. **Resource Discovery**
   - Resource deposit detection
   - Quality analysis
   - Extraction planning

2. **Resource Management**
   - Deposit tracking
   - Extraction coordination
   - Flow optimization

3. **Resource Events**
   - Discovery events
   - Analysis updates
   - Extraction status

### Module System Integration

1. **Exploration Modules**
   - Scanner modules
   - Analysis modules
   - Extraction modules

2. **Module Coordination**
   - Resource allocation
   - Task scheduling
   - Status monitoring

3. **Module Events**
   - Activation events
   - Status updates
   - Error handling

### Event System Integration

1. **Exploration Events**
   - Sector updates
   - Discovery events
   - Analysis progress

2. **Vessel Events**
   - Movement updates
   - Status changes
   - Mission events

3. **System Events**
   - Initialization
   - Error handling
   - Cleanup

## Performance Optimization

1. **Sector Management**
   - Spatial partitioning
   - Sector streaming
   - Memory optimization

2. **Analysis Processing**
   - Batch processing
   - Priority queue
   - Parallel analysis

3. **Rendering Optimization**
   - Viewport culling
   - Level of detail
   - Texture management

## Testing Strategy

1. **Unit Tests**
   - Sector generation
   - Discovery analysis
   - Path finding

2. **Integration Tests**
   - Resource integration
   - Module coordination
   - Event handling

3. **Performance Tests**
   - Sector loading
   - Analysis throughput
   - Rendering efficiency

## Related Documentation

- [Architecture](../01_ARCHITECTURE.md)
- [Resource System](01_RESOURCE_SYSTEM.md)
- [Module System](05_MODULE_SYSTEM.md)
- [Event System](02_EVENT_SYSTEM.md)
- [Testing Architecture](../testing/01_TEST_ARCHITECTURE.md)
