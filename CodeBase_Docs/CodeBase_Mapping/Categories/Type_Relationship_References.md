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
