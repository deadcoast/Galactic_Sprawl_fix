# RESOURCE SYSTEM

## Overview

The Resource System manages all aspects of resource handling in Galactic Sprawl, including:

- Resource type definitions and standardization
- Resource production and consumption
- Resource flow optimization
- Threshold monitoring and alerts
- Visualization and UI components

## Core Components

### Resource Types

```typescript
// src/types/resources/StandardizedResourceTypes.ts

export enum ResourceType {
  IRON = 'IRON',
  COPPER = 'COPPER',
  TITANIUM = 'TITANIUM',
  ENERGY = 'ENERGY',
  WATER = 'WATER',
  OXYGEN = 'OXYGEN',
  // ... other resource types
}

export interface Resource {
  type: ResourceType;
  amount: number;
  location: Vector2D;
  quality?: number;
  extractionRate?: number;
}

export interface ResourceNode {
  id: string;
  resource: Resource;
  connections: ResourceConnection[];
  status: ResourceNodeStatus;
  metadata: ResourceMetadata;
}

export interface ResourceConnection {
  from: string;
  to: string;
  rate: number;
  resourceType: ResourceType;
  status: ConnectionStatus;
}
```

### Resource Manager

```typescript
// src/managers/game/ResourceManager.ts

export class ResourceManager extends AbstractBaseManager<ResourceEvent> {
  private resources: Map<string, ResourceNode>;
  private flows: Map<string, ResourceConnection>;

  constructor(eventBus: EventBus<ResourceEvent>) {
    super('ResourceManager', eventBus);
    this.resources = new Map();
    this.flows = new Map();
  }

  public async addResource(resource: Resource): Promise<void> {
    const node = this.createResourceNode(resource);
    this.resources.set(node.id, node);
    this.publishEvent(this.createEvent(ResourceEvents.RESOURCE_ADDED, { node }));
  }

  public async createFlow(connection: ResourceConnection): Promise<void> {
    this.validateFlow(connection);
    this.flows.set(this.getFlowId(connection), connection);
    this.publishEvent(this.createEvent(ResourceEvents.FLOW_CREATED, { connection }));
  }

  protected async onUpdate(deltaTime: number): Promise<void> {
    await this.updateFlows(deltaTime);
    await this.checkThresholds();
  }

  private async updateFlows(deltaTime: number): Promise<void> {
    for (const flow of this.flows.values()) {
      await this.processFlow(flow, deltaTime);
    }
  }

  private async processFlow(flow: ResourceConnection, deltaTime: number): Promise<void> {
    const amount = flow.rate * deltaTime;
    const sourceNode = this.resources.get(flow.from);
    const targetNode = this.resources.get(flow.to);

    if (!sourceNode || !targetNode) {
      throw new Error(`Invalid flow: ${flow.from} -> ${flow.to}`);
    }

    if (sourceNode.resource.amount < amount) {
      this.handleInsufficientResources(flow);
      return;
    }

    sourceNode.resource.amount -= amount;
    targetNode.resource.amount += amount;

    this.publishEvent(
      this.createEvent(ResourceEvents.FLOW_UPDATED, {
        flow,
        sourceNode,
        targetNode,
        amount,
      })
    );
  }
}
```

### Resource Flow Manager

```typescript
// src/managers/resource/ResourceFlowManager.ts

export class ResourceFlowManager extends AbstractBaseManager<ResourceEvent> {
  private flowNetwork: FlowNetwork;
  private optimizer: FlowOptimizer;

  constructor(eventBus: EventBus<ResourceEvent>) {
    super('ResourceFlowManager', eventBus);
    this.flowNetwork = new FlowNetwork();
    this.optimizer = new FlowOptimizer();
  }

  public async optimizeFlows(): Promise<void> {
    const optimization = await this.optimizer.optimize(this.flowNetwork);
    await this.applyOptimization(optimization);
  }

  private async applyOptimization(optimization: FlowOptimization): Promise<void> {
    for (const change of optimization.changes) {
      await this.updateFlow(change);
    }

    this.publishEvent(
      this.createEvent(ResourceEvents.FLOWS_OPTIMIZED, {
        optimization,
        networkState: this.flowNetwork.getState(),
      })
    );
  }
}
```

## Context Providers

### Resource Rates Context

```typescript
// src/contexts/ResourceRatesContext.tsx

export const ResourceRatesContext = React.createContext<ResourceRatesContextType | null>(null);

export const ResourceRatesProvider: React.FC<ResourceRatesProviderProps> = ({
  children,
  resourceManager,
}) => {
  const [rates, setRates] = useState<ResourceRates>({});

  useEffect(() => {
    const subscriptions = [
      resourceManager.subscribeToEvent(ResourceEvents.FLOW_UPDATED, handleFlowUpdate),
      resourceManager.subscribeToEvent(ResourceEvents.FLOWS_OPTIMIZED, handleFlowsOptimized),
    ];

    return () => subscriptions.forEach(unsub => unsub());
  }, [resourceManager]);

  const contextValue = useMemo(() => ({
    rates,
    getRateForResource: (type: ResourceType) => rates[type] || 0,
    getTotalRate: () => Object.values(rates).reduce((sum, rate) => sum + rate, 0),
  }), [rates]);

  return (
    <ResourceRatesContext.Provider value={contextValue}>
      {children}
    </ResourceRatesContext.Provider>
  );
};
```

### Threshold Context

```typescript
// src/contexts/ThresholdContext.tsx

export const ThresholdContext = React.createContext<ThresholdContextType | null>(null);

export const ThresholdProvider: React.FC<ThresholdProviderProps> = ({
  children,
  resourceManager,
}) => {
  const [thresholds, setThresholds] = useState<ResourceThresholds>({});
  const [alerts, setAlerts] = useState<ThresholdAlert[]>([]);

  useEffect(() => {
    const subscription = resourceManager.subscribeToEvent(
      ResourceEvents.THRESHOLD_REACHED,
      handleThresholdReached
    );

    return () => subscription();
  }, [resourceManager]);

  const contextValue = useMemo(() => ({
    thresholds,
    alerts,
    setThreshold: (type: ResourceType, level: number) => {
      setThresholds(prev => ({
        ...prev,
        [type]: level
      }));
    },
    clearAlert: (alertId: string) => {
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    },
  }), [thresholds, alerts]);

  return (
    <ThresholdContext.Provider value={contextValue}>
      {children}
    </ThresholdContext.Provider>
  );
};
```

## UI Components

### Resource Visualization

```typescript
// src/components/ui/ResourceVisualization.tsx

export const ResourceVisualization: React.FC<ResourceVisualizationProps> = ({
  resourceType,
  showDetails = false,
}) => {
  const { rates } = useResourceRates();
  const { thresholds, alerts } = useThresholds();
  const [selectedView, setSelectedView] = useState<'basic' | 'detailed'>('basic');

  const rate = rates[resourceType] || 0;
  const threshold = thresholds[resourceType] || 0;

  return (
    <div className="resource-visualization">
      <ResourceIcon type={resourceType} />
      <ResourceAmount amount={rate} threshold={threshold} />
      {showDetails && (
        <ResourceDetails
          type={resourceType}
          rate={rate}
          threshold={threshold}
          alerts={alerts.filter(alert => alert.resourceType === resourceType)}
        />
      )}
    </div>
  );
};
```

### Resource Flow Diagram

```typescript
// src/components/ui/ResourceFlowDiagram.tsx

export const ResourceFlowDiagram: React.FC<ResourceFlowDiagramProps> = ({
  width,
  height,
  data,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulation = useForceSimulation(data);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    // Create links
    const links = svg.selectAll('.link')
      .data(data.links)
      .join('path')
      .attr('class', 'link')
      .attr('marker-end', 'url(#arrow)');

    // Create nodes
    const nodes = svg.selectAll('.node')
      .data(data.nodes)
      .join('g')
      .attr('class', 'node')
      .call(d3.drag()
        .on('start', dragStarted)
        .on('drag', dragged)
        .on('end', dragEnded));

    // Update positions
    simulation.on('tick', () => {
      links.attr('d', calculateLinkPath);
      nodes.attr('transform', d => `translate(${d.x},${d.y})`);
    });
  }, [data, simulation]);

  return (
    <svg ref={svgRef} width={width} height={height}>
      <defs>
        <marker
          id="arrow"
          viewBox="0 -5 10 10"
          refX="8"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M0,-5L10,0L0,5" className="arrow-head" />
        </marker>
      </defs>
      <g className="flow-diagram" />
    </svg>
  );
};
```

## Integration Points

### Mining System Integration

The Resource System integrates with the Mining System through:

1. **Resource Detection**

   - Mining operations discover new resources
   - Resources are registered with ResourceManager
   - Resource nodes are created in the flow network

2. **Resource Extraction**

   - Mining operations extract resources
   - Extraction rates are monitored
   - Resources are added to the flow network

3. **Resource Quality**
   - Mining operations determine resource quality
   - Quality affects extraction rates
   - Quality information is displayed in UI

### Module System Integration

The Resource System integrates with the Module System through:

1. **Resource Consumption**

   - Modules consume resources
   - Consumption rates are tracked
   - Resource flows are optimized

2. **Resource Production**

   - Modules produce resources
   - Production rates are tracked
   - Resources are distributed through the network

3. **Resource Requirements**
   - Modules specify resource requirements
   - Requirements affect flow optimization
   - Threshold alerts are generated when needed

## Performance Considerations

1. **Flow Optimization**

   - Batch flow updates
   - Use spatial partitioning
   - Implement priority-based updates

2. **UI Performance**

   - Memoize expensive calculations
   - Use virtualization for large lists
   - Implement efficient rendering patterns

3. **Event Handling**
   - Batch similar events
   - Use event prioritization
   - Implement event throttling

## Testing Strategy

1. **Unit Tests**

   - Test individual components
   - Verify calculation accuracy
   - Check event handling

2. **Integration Tests**

   - Test system boundaries
   - Verify flow optimization
   - Check UI updates

3. **Performance Tests**
   - Measure update times
   - Check memory usage
   - Verify rendering performance

## Related Documentation

- [Architecture](../01_ARCHITECTURE.md)
- [Event System](02_EVENT_SYSTEM.md)
- [Context Providers](03_CONTEXT_PROVIDERS.md)
- [Manager Services](04_MANAGER_SERVICES.md)
- [Testing Architecture](../testing/01_TEST_ARCHITECTURE.md)
