# CONTEXT PROVIDERS

## Overview

The Context Providers system manages state and data flow throughout the Galactic Sprawl application. It provides:

- Centralized state management
- Type-safe context creation
- Performance optimized updates
- Hierarchical data organization
- Integration with the Event System

## Core Components

### Base Context Provider

```typescript
// src/lib/context/BaseContextProvider.tsx

export interface BaseContextConfig<T> {
  name: string;
  initialState: T;
  eventTypes?: EventType[];
}

export class BaseContextProvider<T extends object> {
  protected state: T;
  protected subscribers: Set<StateSubscriber<T>>;
  protected eventBus: EventBus;
  protected name: string;

  constructor(config: BaseContextConfig<T>, eventBus: EventBus) {
    this.state = config.initialState;
    this.subscribers = new Set();
    this.eventBus = eventBus;
    this.name = config.name;

    if (config.eventTypes) {
      this.setupEventSubscriptions(config.eventTypes);
    }
  }

  protected setState(
    updater: ((prevState: T) => T) | Partial<T>,
    source?: string,
  ): void {
    const nextState =
      typeof updater === "function"
        ? updater(this.state)
        : { ...this.state, ...updater };

    const changes = this.getStateChanges(this.state, nextState);
    if (Object.keys(changes).length === 0) return;

    this.state = nextState;
    this.notifySubscribers(changes, source);
  }

  protected notifySubscribers(changes: Partial<T>, source?: string): void {
    this.subscribers.forEach((subscriber) => {
      try {
        subscriber(changes, this.state, source);
      } catch (error) {
        console.error(`Error notifying subscriber in ${this.name}:`, error);
      }
    });
  }

  public subscribe(subscriber: StateSubscriber<T>): Unsubscribe {
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  }

  protected setupEventSubscriptions(eventTypes: EventType[]): void {
    eventTypes.forEach((eventType) => {
      this.eventBus.subscribe(eventType, this.handleEvent.bind(this));
    });
  }

  protected handleEvent(event: BaseEvent): void {
    // Override in specific context providers
  }

  private getStateChanges(prevState: T, nextState: T): Partial<T> {
    const changes: Partial<T> = {};

    for (const key in nextState) {
      if (!Object.is(prevState[key], nextState[key])) {
        changes[key] = nextState[key];
      }
    }

    return changes;
  }
}
```

### Game Context

```typescript
// src/lib/context/GameContext.tsx

export interface GameState {
  status: GameStatus;
  tick: number;
  speed: GameSpeed;
  paused: boolean;
  startTime: number;
  elapsedTime: number;
}

export class GameContext extends BaseContextProvider<GameState> {
  constructor(eventBus: EventBus) {
    super(
      {
        name: "GameContext",
        initialState: {
          status: GameStatus.IDLE,
          tick: 0,
          speed: GameSpeed.NORMAL,
          paused: false,
          startTime: 0,
          elapsedTime: 0,
        },
        eventTypes: [
          EventType.GAME_STARTED,
          EventType.GAME_PAUSED,
          EventType.GAME_RESUMED,
          EventType.GAME_ENDED,
        ],
      },
      eventBus,
    );
  }

  public startGame(): void {
    this.setState({
      status: GameStatus.RUNNING,
      startTime: Date.now(),
      paused: false,
    });

    this.eventBus.publish({
      type: EventType.GAME_STARTED,
      timestamp: Date.now(),
      id: generateId(),
    });
  }

  public pauseGame(): void {
    this.setState({ paused: true });

    this.eventBus.publish({
      type: EventType.GAME_PAUSED,
      timestamp: Date.now(),
      id: generateId(),
    });
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

  private onGameStarted(): void {
    this.startGameLoop();
  }

  private startGameLoop(): void {
    if (this.state.status !== GameStatus.RUNNING) return;

    const loop = () => {
      if (this.state.paused) return;

      this.setState((prev) => ({
        tick: prev.tick + 1,
        elapsedTime: Date.now() - prev.startTime,
      }));

      setTimeout(loop, this.getTickInterval());
    };

    loop();
  }

  private getTickInterval(): number {
    switch (this.state.speed) {
      case GameSpeed.SLOW:
        return 1000;
      case GameSpeed.NORMAL:
        return 500;
      case GameSpeed.FAST:
        return 250;
      default:
        return 500;
    }
  }
}
```

### Resource Context

```typescript
// src/lib/context/ResourceContext.tsx

export interface ResourceState {
  resources: Record<string, Resource>;
  flows: Record<string, ResourceFlow>;
  thresholds: Record<string, ResourceThreshold>;
  production: Record<string, number>;
  consumption: Record<string, number>;
}

export class ResourceContext extends BaseContextProvider<ResourceState> {
  constructor(eventBus: EventBus) {
    super(
      {
        name: "ResourceContext",
        initialState: {
          resources: {},
          flows: {},
          thresholds: {},
          production: {},
          consumption: {},
        },
        eventTypes: [
          EventType.RESOURCE_ADDED,
          EventType.RESOURCE_REMOVED,
          EventType.FLOW_CREATED,
          EventType.FLOW_UPDATED,
          EventType.THRESHOLD_REACHED,
        ],
      },
      eventBus,
    );
  }

  public addResource(resource: Resource): void {
    this.setState((prev) => ({
      resources: {
        ...prev.resources,
        [resource.id]: resource,
      },
    }));

    this.eventBus.publish({
      type: EventType.RESOURCE_ADDED,
      timestamp: Date.now(),
      id: generateId(),
      payload: { resource },
    });
  }

  public updateFlow(flow: ResourceFlow): void {
    this.setState((prev) => ({
      flows: {
        ...prev.flows,
        [flow.id]: flow,
      },
    }));

    this.recalculateResourceRates();
  }

  private recalculateResourceRates(): void {
    const { production, consumption } = Object.values(this.state.flows).reduce(
      (acc, flow) => {
        if (flow.type === "production") {
          acc.production[flow.resourceId] =
            (acc.production[flow.resourceId] || 0) + flow.rate;
        } else {
          acc.consumption[flow.resourceId] =
            (acc.consumption[flow.resourceId] || 0) + flow.rate;
        }
        return acc;
      },
      { production: {}, consumption: {} } as Record<
        string,
        Record<string, number>
      >,
    );

    this.setState({ production, consumption });
  }

  protected handleEvent(event: ResourceEvent): void {
    switch (event.type) {
      case EventType.RESOURCE_ADDED:
        this.onResourceAdded(event.payload.resource!);
        break;
      case EventType.FLOW_CREATED:
        this.onFlowCreated(event.payload.flow!);
        break;
      // ... handle other events
    }
  }
}
```

### Module Context

```typescript
// src/lib/context/ModuleContext.tsx

export interface ModuleState {
  modules: Record<string, Module>;
  activeModules: string[];
  moduleStatus: Record<string, ModuleStatus>;
  dependencies: Record<string, string[]>;
}

export class ModuleContext extends BaseContextProvider<ModuleState> {
  constructor(eventBus: EventBus) {
    super(
      {
        name: "ModuleContext",
        initialState: {
          modules: {},
          activeModules: [],
          moduleStatus: {},
          dependencies: {},
        },
        eventTypes: [
          EventType.MODULE_CREATED,
          EventType.MODULE_DESTROYED,
          EventType.MODULE_UPDATED,
          EventType.MODULE_STATUS_CHANGED,
        ],
      },
      eventBus,
    );
  }

  public addModule(module: Module): void {
    this.setState((prev) => ({
      modules: {
        ...prev.modules,
        [module.id]: module,
      },
      moduleStatus: {
        ...prev.moduleStatus,
        [module.id]: ModuleStatus.INACTIVE,
      },
    }));

    this.eventBus.publish({
      type: EventType.MODULE_CREATED,
      timestamp: Date.now(),
      id: generateId(),
      payload: { module },
    });
  }

  public activateModule(moduleId: string): void {
    const module = this.state.modules[moduleId];
    if (!module) return;

    if (!this.canActivateModule(moduleId)) {
      console.warn(`Cannot activate module ${moduleId}: dependencies not met`);
      return;
    }

    this.setState((prev) => ({
      activeModules: [...prev.activeModules, moduleId],
      moduleStatus: {
        ...prev.moduleStatus,
        [moduleId]: ModuleStatus.ACTIVE,
      },
    }));
  }

  private canActivateModule(moduleId: string): boolean {
    const dependencies = this.state.dependencies[moduleId] || [];
    return dependencies.every(
      (depId) => this.state.moduleStatus[depId] === ModuleStatus.ACTIVE,
    );
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

## Integration Points

### Manager Integration

1. **State Management**
   - Managers access context through hooks
   - State updates trigger event emissions
   - Context changes propagate to managers

2. **Event Handling**
   - Context providers listen to relevant events
   - State updates based on events
   - Event propagation to subscribers

3. **Performance Optimization**
   - State updates are batched
   - Change detection is optimized
   - Memory usage is monitored

### UI Integration

1. **Component Access**
   - Components use context hooks
   - State changes trigger re-renders
   - Memoization is implemented

2. **State Updates**
   - Updates are atomic
   - Changes are propagated efficiently
   - UI stays responsive

3. **Development Tools**
   - State changes are logged
   - Context hierarchy is visualized
   - Performance is monitored

## Performance Optimization

1. **State Updates**
   - Changes are batched
   - Updates are debounced
   - Memory is managed

2. **Subscription Management**
   - Efficient subscriber storage
   - Automatic cleanup
   - Memory optimization

3. **Change Detection**
   - Shallow comparison
   - Deep comparison when needed
   - Selective updates

## Testing Strategy

1. **Unit Tests**
   - Test state management
   - Verify event handling
   - Check update propagation

2. **Integration Tests**
   - Test context interaction
   - Verify UI updates
   - Check performance

3. **Performance Tests**
   - Measure update times
   - Check memory usage
   - Verify optimization

## Related Documentation

- [Architecture](../01_ARCHITECTURE.md)
- [Event System](02_EVENT_SYSTEM.md)
- [Resource System](01_RESOURCE_SYSTEM.md)
- [Manager Services](04_MANAGER_SERVICES.md)
- [Testing Architecture](../testing/01_TEST_ARCHITECTURE.md)
