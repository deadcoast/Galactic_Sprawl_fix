# MANAGER SERVICES

## Overview

The Manager Services system provides core game functionality through specialized service classes. It includes:

- Resource management
- Module management
- Game state management
- Event coordination
- Performance optimization

## Core Components

### Base Manager

```typescript
// src/lib/managers/BaseManager.ts

export interface ManagerConfig {
  name: string;
  eventTypes?: EventType[];
  contextTypes?: ContextType[];
}

export abstract class BaseManager {
  protected name: string;
  protected eventBus: EventBus;
  protected contexts: Map<ContextType, BaseContextProvider<any>>;
  protected isInitialized: boolean;

  constructor(config: ManagerConfig, eventBus: EventBus) {
    this.name = config.name;
    this.eventBus = eventBus;
    this.contexts = new Map();
    this.isInitialized = false;

    if (config.eventTypes) {
      this.setupEventSubscriptions(config.eventTypes);
    }
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.onInitialize();
      this.isInitialized = true;
    } catch (error) {
      console.error(`Failed to initialize ${this.name}:`, error);
      throw error;
    }
  }

  protected abstract onInitialize(): Promise<void>;

  protected setupEventSubscriptions(eventTypes: EventType[]): void {
    eventTypes.forEach(eventType => {
      this.eventBus.subscribe(eventType, this.handleEvent.bind(this));
    });
  }

  protected abstract handleEvent(event: BaseEvent): void;

  protected getContext<T>(type: ContextType): BaseContextProvider<T> {
    const context = this.contexts.get(type);
    if (!context) {
      throw new Error(`Context ${type} not found in ${this.name}`);
    }
    return context;
  }

  protected registerContext(type: ContextType, context: BaseContextProvider<any>): void {
    this.contexts.set(type, context);
  }
}
```

### Resource Manager

```typescript
// src/lib/managers/ResourceManager.ts

export class ResourceManager extends BaseManager {
  private resourceContext: ResourceContext;
  private flowOptimizer: ResourceFlowOptimizer;
  private thresholdMonitor: ResourceThresholdMonitor;

  constructor(eventBus: EventBus) {
    super(
      {
        name: 'ResourceManager',
        eventTypes: [
          EventType.RESOURCE_ADDED,
          EventType.RESOURCE_REMOVED,
          EventType.FLOW_CREATED,
          EventType.FLOW_UPDATED,
          EventType.THRESHOLD_REACHED,
        ],
        contextTypes: [ContextType.RESOURCE],
      },
      eventBus
    );

    this.resourceContext = new ResourceContext(eventBus);
    this.flowOptimizer = new ResourceFlowOptimizer();
    this.thresholdMonitor = new ResourceThresholdMonitor(eventBus);
  }

  protected async onInitialize(): Promise<void> {
    this.registerContext(ContextType.RESOURCE, this.resourceContext);
    await this.flowOptimizer.initialize();
    await this.thresholdMonitor.initialize();
  }

  public addResource(resource: Resource): void {
    this.resourceContext.addResource(resource);
  }

  public createFlow(sourceId: string, targetId: string, rate: number): void {
    const flow: ResourceFlow = {
      id: generateId(),
      sourceId,
      targetId,
      rate,
      type: 'transfer',
    };

    this.resourceContext.updateFlow(flow);
    this.optimizeFlows();
  }

  private optimizeFlows(): void {
    const flows = Object.values(this.resourceContext.getState().flows);
    const optimizedFlows = this.flowOptimizer.optimizeFlows(flows);

    optimizedFlows.forEach(flow => {
      this.resourceContext.updateFlow(flow);
    });

    this.eventBus.publish({
      type: EventType.FLOWS_OPTIMIZED,
      timestamp: Date.now(),
      id: generateId(),
    });
  }

  protected handleEvent(event: ResourceEvent): void {
    switch (event.type) {
      case EventType.RESOURCE_ADDED:
        this.onResourceAdded(event.payload.resource!);
        break;
      case EventType.FLOW_CREATED:
        this.onFlowCreated(event.payload.flow!);
        break;
      case EventType.THRESHOLD_REACHED:
        this.onThresholdReached(event.payload);
        break;
      // ... handle other events
    }
  }
}
```

### Module Manager

```typescript
// src/lib/managers/ModuleManager.ts

export class ModuleManager extends BaseManager {
  private moduleContext: ModuleContext;
  private dependencyResolver: ModuleDependencyResolver;
  private statusMonitor: ModuleStatusMonitor;

  constructor(eventBus: EventBus) {
    super(
      {
        name: 'ModuleManager',
        eventTypes: [
          EventType.MODULE_CREATED,
          EventType.MODULE_DESTROYED,
          EventType.MODULE_UPDATED,
          EventType.MODULE_STATUS_CHANGED,
        ],
        contextTypes: [ContextType.MODULE],
      },
      eventBus
    );

    this.moduleContext = new ModuleContext(eventBus);
    this.dependencyResolver = new ModuleDependencyResolver();
    this.statusMonitor = new ModuleStatusMonitor(eventBus);
  }

  protected async onInitialize(): Promise<void> {
    this.registerContext(ContextType.MODULE, this.moduleContext);
    await this.dependencyResolver.initialize();
    await this.statusMonitor.initialize();
  }

  public createModule(config: ModuleConfig): void {
    const module: Module = {
      id: generateId(),
      ...config,
      status: ModuleStatus.INACTIVE,
    };

    this.moduleContext.addModule(module);
    this.resolveDependencies(module);
  }

  public activateModule(moduleId: string): void {
    if (this.canActivateModule(moduleId)) {
      this.moduleContext.activateModule(moduleId);
      this.updateDependentModules(moduleId);
    }
  }

  private resolveDependencies(module: Module): void {
    const dependencies = this.dependencyResolver.resolveDependencies(
      module,
      Object.values(this.moduleContext.getState().modules)
    );

    this.moduleContext.updateDependencies(module.id, dependencies);
  }

  private updateDependentModules(moduleId: string): void {
    const state = this.moduleContext.getState();
    const dependentModules = Object.entries(state.dependencies)
      .filter(([_, deps]) => deps.includes(moduleId))
      .map(([id]) => id);

    dependentModules.forEach(depId => {
      if (this.canActivateModule(depId)) {
        this.moduleContext.activateModule(depId);
      }
    });
  }

  protected handleEvent(event: ModuleEvent): void {
    switch (event.type) {
      case EventType.MODULE_CREATED:
        this.onModuleCreated(event.payload.module);
        break;
      case EventType.MODULE_STATUS_CHANGED:
        this.onModuleStatusChanged(event.payload.module, event.payload.status!);
        break;
      // ... handle other events
    }
  }
}
```

### Game Manager

```typescript
// src/lib/managers/GameManager.ts

export class GameManager extends BaseManager {
  private gameContext: GameContext;
  private resourceManager: ResourceManager;
  private moduleManager: ModuleManager;

  constructor(eventBus: EventBus) {
    super(
      {
        name: 'GameManager',
        eventTypes: [
          EventType.GAME_STARTED,
          EventType.GAME_PAUSED,
          EventType.GAME_RESUMED,
          EventType.GAME_ENDED,
        ],
        contextTypes: [ContextType.GAME],
      },
      eventBus
    );

    this.gameContext = new GameContext(eventBus);
    this.resourceManager = new ResourceManager(eventBus);
    this.moduleManager = new ModuleManager(eventBus);
  }

  protected async onInitialize(): Promise<void> {
    this.registerContext(ContextType.GAME, this.gameContext);
    await this.resourceManager.initialize();
    await this.moduleManager.initialize();
  }

  public async startGame(): Promise<void> {
    await this.initialize();
    this.gameContext.startGame();
    this.startGameLoop();
  }

  public pauseGame(): void {
    this.gameContext.pauseGame();
  }

  private startGameLoop(): void {
    const loop = () => {
      if (this.gameContext.getState().paused) return;

      this.updateGame();
      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  private updateGame(): void {
    const startTime = performance.now();

    try {
      this.resourceManager.update();
      this.moduleManager.update();
      this.checkGameConditions();
    } catch (error) {
      console.error('Error in game update:', error);
      this.handleGameError(error);
    }

    const endTime = performance.now();
    this.recordUpdateMetrics(endTime - startTime);
  }

  protected handleEvent(event: BaseEvent): void {
    switch (event.type) {
      case EventType.GAME_STARTED:
        this.onGameStarted();
        break;
      case EventType.GAME_PAUSED:
        this.onGamePaused();
        break;
      // ... handle other events
    }
  }
}
```

## Integration Points

### Context Integration

1. **State Management**

   - Managers access context data
   - State updates are coordinated
   - Changes are propagated

2. **Event Handling**

   - Events trigger state updates
   - Changes emit events
   - Event flow is managed

3. **Performance**
   - Updates are optimized
   - State changes are batched
   - Memory is managed

### Service Integration

1. **Manager Coordination**

   - Managers communicate via events
   - State is synchronized
   - Dependencies are managed

2. **Resource Flow**

   - Resources are tracked
   - Flows are optimized
   - Thresholds are monitored

3. **Module Management**
   - Modules are coordinated
   - Dependencies are resolved
   - Status is monitored

## Performance Optimization

1. **Update Cycle**

   - Updates are batched
   - Processing is prioritized
   - Memory is managed

2. **State Management**

   - Changes are optimized
   - Updates are efficient
   - Memory is controlled

3. **Event Processing**
   - Events are batched
   - Processing is optimized
   - Memory is managed

## Testing Strategy

1. **Unit Tests**

   - Test manager logic
   - Verify state updates
   - Check event handling

2. **Integration Tests**

   - Test manager interaction
   - Verify state coordination
   - Check performance

3. **Performance Tests**
   - Measure update times
   - Check memory usage
   - Verify optimization

## Related Documentation

- [Architecture](../01_ARCHITECTURE.md)
- [Event System](02_EVENT_SYSTEM.md)
- [Context Providers](03_CONTEXT_PROVIDERS.md)
- [Resource System](01_RESOURCE_SYSTEM.md)
- [Testing Architecture](../testing/01_TEST_ARCHITECTURE.md)
