## Type Relationships

```
ResourceState
├── resources: Map<ResourceType, Resource>
├── thresholds: Map<string, ResourceThreshold[]>
└── history: ResourceHistory

SerializedResourceState
├── resources: Record<ResourceType, SerializedResource>
├── thresholds: Record<string, SerializedThreshold[]>
└── timestamp: number

Resource
├── amount: number
├── capacity: number
└── rate: number

SerializedResource
├── amount: number
├── capacity: number
└── rate: number

ResourceTotals
├── amounts: Record<ResourceType, number>
├── capacities: Record<ResourceType, number>
└── rates: Record<ResourceType, number>
```

## Fixed Type Relationships

### Faction Behavior Types

```
FactionBehaviorType (string literal union)
├── 'aggressive'
├── 'defensive'
├── 'hit-and-run'
├── 'stealth'
└── 'balance'

FactionBehaviorConfig (object interface)
├── formation: string
├── behavior: FactionBehaviorType
└── target?: string
```

### Ship Ability Types

```
CommonShipAbility
├── id: string
├── name: string
├── description: string
├── cooldown: number
├── duration: number
├── active: boolean
└── effect: Effect

Effect
├── id: string
├── type: EffectType
├── magnitude: number
└── duration: number

DamageEffect extends Effect
├── id: string
├── name: string
├── description: string
├── type: 'damage'
├── magnitude: number
├── duration: number
├── strength: number
├── damageType: string
└── penetration: number
```

### Drag and Drop Types

```
DragItem<T = Record<string, unknown>>
├── id: string
├── type: 'module' | 'resource' | 'ship'
└── data: T

ModuleDragItem extends DragItem<ModuleData>
├── id: string
├── type: 'module'
└── data: ModuleData

ResourceDragItem extends DragItem<ResourceData>
├── id: string
├── type: 'resource'
└── data: ResourceData

ShipDragItem extends DragItem<ShipData>
├── id: string
├── type: 'ship'
└── data: ShipData
```

### Automation Rule Types

```
AutomationRule
├── id: string
├── name: string
├── description: string
├── enabled: boolean
├── conditions: AutomationCondition[]
├── actions: AutomationAction[]
└── interval?: number

AutomationCondition
├── type: ConditionType
└── value: ResourceConditionValue | EventConditionValue | TimeConditionValue

EventConditionValue
├── eventType: string
├── eventData?: Record<string, unknown>
└── timeElapsed?: number

AutomationAction
├── type: ActionType
└── value: EmitEventValue | ModifyResourceValue | ActivateModuleValue

EmitEventValue
├── eventType: ModuleEventType
└── data: Record<string, unknown>
```
