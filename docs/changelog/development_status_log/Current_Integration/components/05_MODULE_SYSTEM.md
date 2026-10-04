# MODULE SYSTEM

## Overview

The Module System provides a flexible and extensible architecture for managing game modules in Galactic Sprawl. It includes:

- Module lifecycle management
- Dependency resolution
- State management
- Event handling
- Performance optimization

## Core Components

### Module Types

```typescript
// src/types/modules/ModuleTypes.ts

export enum ModuleType {
  PRODUCER = 'PRODUCER',
  CONSUMER = 'CONSUMER',
  PROCESSOR = 'PROCESSOR',
  STORAGE = 'STORAGE',
  UTILITY = 'UTILITY',
}

export enum ModuleStatus {
  INACTIVE = 'INACTIVE',
  ACTIVE = 'ACTIVE',
  ERROR = 'ERROR',
  UPGRADING = 'UPGRADING',
}

export interface ModuleConfig {
  id?: string;
  name: string;
  type: ModuleType;
  status?: ModuleStatus;
  dependencies?: string[];
  inputs?: ResourceRequirement[];
  outputs?: ResourceOutput[];
  upgrades?: ModuleUpgrade[];
  metadata?: Record<string, unknown>;
}

export interface ResourceRequirement {
  type: ResourceType;
  rate: number;
  priority?: number;
  threshold?: number;
}

export interface ResourceOutput {
  type: ResourceType;
  rate: number;
  quality?: number;
}

export interface ModuleUpgrade {
  id: string;
  name: string;
  cost: ResourceCost[];
  effects: UpgradeEffect[];
}
```

### Module Manager Implementation

```typescript
// src/managers/module/ModuleManager.ts

export class ModuleManager extends BaseManager<ModuleEvent> {
  private modules: Map<string, Module>;
  private dependencies: DependencyGraph;
  private resourceManager: ResourceManager;

  constructor(eventBus: EventBus, resourceManager: ResourceManager) {
    super('ModuleManager', eventBus);
    this.modules = new Map();
    this.dependencies = new DependencyGraph();
    this.resourceManager = resourceManager;
  }

  public async createModule(config: ModuleConfig): Promise<Module> {
    const module = this.createModuleInstance(config);
    this.validateModule(module);

    this.modules.set(module.id, module);
    this.dependencies.addNode(module.id);

    if (config.dependencies) {
      this.dependencies.addDependencies(module.id, config.dependencies);
    }

    await this.setupResourceConnections(module);
    this.publishEvent(ModuleEvents.MODULE_CREATED, { module });

    return module;
  }

  public async activateModule(moduleId: string): Promise<void> {
    const module = this.getModule(moduleId);

    if (!this.canActivateModule(moduleId)) {
      throw new Error(`Cannot activate module ${moduleId}: dependencies not met`);
    }

    await this.startModule(module);
    this.updateModuleStatus(moduleId, ModuleStatus.ACTIVE);
    this.publishEvent(ModuleEvents.MODULE_ACTIVATED, { moduleId });
  }

  private async startModule(module: Module): Promise<void> {
    try {
      await this.ensureResourceRequirements(module);
      await this.initializeModuleComponents(module);
      await this.startResourceFlows(module);
    } catch (error) {
      this.handleModuleError(module, error);
      throw error;
    }
  }

  private async ensureResourceRequirements(module: Module): Promise<void> {
    if (!module.inputs) return;

    for (const input of module.inputs) {
      await this.resourceManager.reserveResource({
        type: input.type,
        amount: input.rate,
        moduleId: module.id,
        priority: input.priority,
      });
    }
  }

  protected async onUpdate(deltaTime: number): Promise<void> {
    for (const module of this.modules.values()) {
      if (module.status === ModuleStatus.ACTIVE) {
        await this.updateModule(module, deltaTime);
      }
    }
  }

  private async updateModule(module: Module, deltaTime: number): Promise<void> {
    try {
      await this.processInputs(module, deltaTime);
      await this.processOutputs(module, deltaTime);
      await this.checkThresholds(module);
    } catch (error) {
      this.handleModuleError(module, error);
    }
  }
}
```

### Module Component Implementation

```typescript
// src/components/modules/ModuleComponent.tsx

export const ModuleComponent: React.FC<ModuleProps> = ({
  module,
  onActivate,
  onUpgrade,
}) => {
  const { resourceRates } = useResourceRates();
  const { thresholds } = useThresholds();

  const [isExpanded, setExpanded] = useState(false);
  const moduleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (module.status === ModuleStatus.ERROR) {
      animateError();
    }
  }, [module.status]);

  const handleActivate = async () => {
    try {
      await onActivate(module.id);
    } catch (error) {
      console.error(`Failed to activate module ${module.id}:`, error);
    }
  };

  const renderResourceFlow = () => (
    <div className="module-resources">
      <ResourceInputs
        inputs={module.inputs}
        rates={resourceRates}
        thresholds={thresholds}
      />
      <ResourceOutputs
        outputs={module.outputs}
        rates={resourceRates}
      />
    </div>
  );

  const renderUpgrades = () => (
    <div className="module-upgrades">
      {module.upgrades?.map(upgrade => (
        <UpgradeOption
          key={upgrade.id}
          upgrade={upgrade}
          onUpgrade={() => onUpgrade(module.id, upgrade.id)}
        />
      ))}
    </div>
  );

  return (
    <div
      ref={moduleRef}
      className={`module-container ${module.status.toLowerCase()}`}
    >
      <header className="module-header">
        <h3>{module.name}</h3>
        <ModuleStatus status={module.status} />
      </header>

      {renderResourceFlow()}

      {isExpanded && (
        <>
          <ModuleDetails module={module} />
          {renderUpgrades()}
        </>
      )}

      <footer className="module-footer">
        <button
          onClick={handleActivate}
          disabled={module.status === ModuleStatus.ACTIVE}
        >
          Activate
        </button>
        <button onClick={() => setExpanded(!isExpanded)}>
          {isExpanded ? 'Less' : 'More'}
        </button>
      </footer>
    </div>
  );
};
```

## Integration Points

### Resource System Integration

1. **Resource Requirements**

   - Modules specify input/output requirements
   - Resource flows are established
   - Thresholds are monitored

2. **Resource Optimization**

   - Flow rates are adjusted
   - Resources are balanced
   - Efficiency is maximized

3. **Resource Events**
   - Resource availability updates
   - Flow rate changes
   - Threshold alerts

### Event System Integration

1. **Module Events**

   - Creation/destruction events
   - Status change events
   - Upgrade events

2. **Resource Events**

   - Input/output events
   - Threshold events
   - Flow optimization events

3. **System Events**
   - Initialization events
   - Error events
   - Cleanup events

### UI Integration

1. **Module Display**

   - Status visualization
   - Resource flow display
   - Upgrade options

2. **Interaction Handling**

   - Module activation
   - Upgrade selection
   - Configuration changes

3. **Performance Optimization**
   - Efficient rendering
   - State updates
   - Event handling

## Performance Optimization

1. **Module Updates**

   - Batch processing
   - Priority scheduling
   - Efficient state updates

2. **Resource Management**

   - Optimized flow calculations
   - Efficient resource distribution
   - Memory management

3. **Event Handling**
   - Event batching
   - Priority queue
   - Memory optimization

## Testing Strategy

1. **Unit Tests**

   - Module creation
   - State management
   - Event handling

2. **Integration Tests**

   - Resource flow
   - Module interaction
   - System coordination

3. **Performance Tests**
   - Update efficiency
   - Memory usage
   - Event throughput

## Related Documentation

- [Architecture](../01_ARCHITECTURE.md)
- [Resource System](01_RESOURCE_SYSTEM.md)
- [Event System](02_EVENT_SYSTEM.md)
- [Manager Services](04_MANAGER_SERVICES.md)
- [Testing Architecture](../testing/01_TEST_ARCHITECTURE.md)
