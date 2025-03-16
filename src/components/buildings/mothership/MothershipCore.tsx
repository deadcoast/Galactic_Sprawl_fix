import { GraduationCap, Radar, Rocket, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ContextMenuItem, useContextMenu } from '../../../components/ui/ContextMenu';
import { Draggable, DragItem, DropTarget } from '../../../components/ui/DragAndDrop';
import { defaultModuleConfigs } from '../../../config/modules/defaultModuleConfigs';
import { MothershipSuperstructure } from '../../../effects/component_effects/MothershipSuperstructure';
import { ResourceFlowVisualization } from '../../../effects/component_effects/ResourceFlowVisualization';
import {
  ModularBuilding,
  ModuleAttachmentPoint,
  ModuleType,
} from '../../../types/buildings/ModuleTypes';
import { ResourceType } from './../../../types/resources/ResourceTypes';

const MOTHERSHIP_ATTACHMENT_POINTS: ModuleAttachmentPoint[] = [
  {
    id: 'top',
    position: { x: 0, y: -100 },
    allowedTypes: ['radar', 'hangar', 'academy'],
  },
  {
    id: 'right',
    position: { x: 100, y: 0 },
    allowedTypes: ['radar', 'hangar', 'academy'],
  },
  {
    id: 'bottom',
    position: { x: 0, y: 100 },
    allowedTypes: ['radar', 'hangar', 'academy'],
  },
  {
    id: 'left',
    position: { x: -100, y: 0 },
    allowedTypes: ['radar', 'hangar', 'academy'],
  },
];

const MODULE_ICONS = {
  radar: Radar,
  hangar: Rocket,
  academy: GraduationCap,
};

interface ResourceFlow {
  id: string;
  source: { x: number; y: number };
  target: { x: number; y: number };
  type: ResourceType.ENERGY | ResourceType.RESEARCH | 'materials';
  rate: number;
}

interface MothershipProps {
  id: string;
  level: number;
  modules: ModularBuilding['modules'];
  resourceLevels?: {
    [ResourceType.ENERGY]: number;
    materials: number;
    [ResourceType.RESEARCH]: number;
  };
  expansionProgress?: number;
  quality?: 'low' | 'medium' | 'high';
  onModuleAttach?: (moduleType: ModuleType, attachmentPointId: string) => void;
  onModuleDetach?: (moduleId: string) => void;
  onSectionClick?: (section: string) => void;
}

// Add mapping between ResourceType and resourceLevels keys
const resourceTypeToKey = {
  [ResourceType.ENERGY]: ResourceType.ENERGY,
  [ResourceType.RESEARCH]: ResourceType.RESEARCH,
  materials: 'materials',
} as const;

export function MothershipCore({
  id,
  level,
  modules,
  resourceLevels = { [ResourceType.ENERGY]: 50, materials: 50, [ResourceType.RESEARCH]: 50 },
  expansionProgress = 50,
  quality = 'medium',
  onModuleAttach,
  onModuleDetach,
  onSectionClick,
}: MothershipProps) {
  // State for resource flows
  const [resourceFlows, setResourceFlows] = useState<ResourceFlow[]>([]);

  // Calculate tier based on level
  const tier = level <= 3 ? 1 : level <= 7 ? 2 : 3;

  // Context menu for attachment points
  const getAttachmentPointMenuItems = (point: ModuleAttachmentPoint): ContextMenuItem[] => {
    const attachedModule = modules.find(
      (m: ModularBuilding['modules'][0]) =>
        m.position.x === point.position.x && m.position.y === point.position.y
    );

    if (attachedModule) {
      return [
        {
          id: 'detach',
          label: 'Detach Module',
          icon: <X className="h-4 w-4" />,
          action: () => onModuleDetach?.(attachedModule.id),
        },
      ];
    }

    return point.allowedTypes.map(type => {
      const config = defaultModuleConfigs[type];
      const Icon = MODULE_ICONS[type as keyof typeof MODULE_ICONS];
      return {
        id: type,
        label: config.name,
        icon: Icon ? <Icon className="h-4 w-4" /> : undefined,
        action: () => onModuleAttach?.(type, point.id),
      };
    });
  };

  const handleModuleDrop = (item: DragItem, point: ModuleAttachmentPoint) => {
    if (
      item.type === 'module' &&
      point.allowedTypes.includes(item.data.type as ModuleType) &&
      typeof item.data.type === 'string'
    ) {
      const moduleType = item.data.type as ModuleType;
      onModuleAttach?.(moduleType, point.id);
    }
  };

  // Generate resource flows
  useEffect(() => {
    const centerX = 0;
    const centerY = 0;

    const newFlows = modules.flatMap((module, index) => {
      const flows: ResourceFlow[] = [];

      // Energy flow (from center to module)
      const energyKey = resourceTypeToKey[ResourceType.ENERGY];
      flows.push({
        id: `energy-flow-${module.id}`,
        source: { x: centerX, y: centerY },
        target: { x: module.position.x, y: module.position.y },
        type: ResourceType.ENERGY,
        rate: Math.min(100, resourceLevels[energyKey] * (0.6 + Math.random() * 0.8)),
      });

      // Materials or research flow (from module to center)
      const resourceType = index % 2 === 0 ? 'materials' : ResourceType.RESEARCH;
      const resourceKey = resourceTypeToKey[resourceType];

      flows.push({
        id: `${resourceType}-flow-${module.id}`,
        source: { x: module.position.x, y: module.position.y },
        target: { x: centerX, y: centerY },
        type: resourceType,
        rate: Math.min(100, resourceLevels[resourceKey] * (0.6 + Math.random() * 0.8)),
      });

      return flows;
    });

    setResourceFlows(newFlows);
  }, [modules, resourceLevels]);

  return (
    <div className="relative h-full w-full" data-mothership-id={id}>
      {/* Core Mothership Structure */}
      <div className="absolute inset-0 rounded-lg border border-gray-700 bg-gray-900/90">
        <div className="p-6">
          <h2 className="mb-4 text-xl font-bold text-white">Mothership Control</h2>
          <div className="mb-6 text-sm text-gray-400">
            Level {level} (Tier {tier})
          </div>

          {/* Animated Superstructure */}
          <div className="relative mb-8 flex h-96 w-full items-center justify-center">
            <MothershipSuperstructure
              tier={tier as 1 | 2 | 3}
              expansionLevel={expansionProgress}
              resourceFlow={{
                energy: resourceLevels[ResourceType.ENERGY],
                materials: resourceLevels.materials,
                research: resourceLevels[ResourceType.RESEARCH],
              }}
              quality={quality}
              onSectionClick={onSectionClick}
            />

            {/* Resource Flow Visualizations */}
            <div className="pointer-events-none absolute inset-0">
              {resourceFlows.map(flow => (
                <ResourceFlowVisualization
                  key={flow.id}
                  sourcePosition={flow.source}
                  targetPosition={flow.target}
                  resourceType={flow.type}
                  flowRate={flow.rate}
                  quality={quality}
                />
              ))}
            </div>
          </div>

          {/* Module Attachment Points */}
          <div className="space-y-4">
            {MOTHERSHIP_ATTACHMENT_POINTS.map(point => {
              const attachedModule = modules.find(
                (m: ModularBuilding['modules'][0]) =>
                  m.position.x === point.position.x && m.position.y === point.position.y
              );

              const { handleContextMenu, ContextMenuComponent } = useContextMenu({
                items: getAttachmentPointMenuItems(point),
              });

              return (
                <div key={point.id}>
                  <DropTarget
                    accept={['module']}
                    onDrop={item => handleModuleDrop(item, point)}
                    className="rounded-lg bg-gray-800 p-4 transition-colors hover:bg-gray-800/80"
                  >
                    <div
                      className="flex items-center justify-between"
                      onContextMenu={handleContextMenu}
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-300">
                          {point.id.charAt(0).toUpperCase() + point.id.slice(1)} Attachment Point
                        </div>
                        {attachedModule ? (
                          <Draggable
                            item={{
                              id: attachedModule.id,
                              type: 'module',
                              data: attachedModule,
                            }}
                            className="cursor-grab text-xs text-gray-500 hover:text-gray-400"
                          >
                            {attachedModule.name}
                          </Draggable>
                        ) : (
                          <div className="text-xs text-gray-500">
                            Empty (Accepts: {point.allowedTypes.join(', ')})
                          </div>
                        )}
                      </div>
                      {attachedModule && (
                        <button
                          onClick={() => onModuleDetach?.(attachedModule.id)}
                          className="px-3 py-1 text-xs text-red-400 hover:text-red-300"
                        >
                          Detach
                        </button>
                      )}
                    </div>
                  </DropTarget>
                  {ContextMenuComponent}
                </div>
              );
            })}
          </div>

          {/* Resource Levels Display */}
          <div className="mt-8 space-y-3">
            <h3 className="text-md font-semibold text-gray-300">Resource Levels</h3>

            {/* Energy */}
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-yellow-400">Energy</span>
                <span className="text-gray-400">{resourceLevels[ResourceType.ENERGY]}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-700">
                <div
                  className="h-full rounded-full bg-yellow-500"
                  style={{ width: `${resourceLevels[ResourceType.ENERGY]}%` }}
                />
              </div>
            </div>

            {/* Materials */}
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-blue-400">Materials</span>
                <span className="text-gray-400">{resourceLevels.materials}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-700">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${resourceLevels.materials}%` }}
                />
              </div>
            </div>

            {/* Research */}
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-purple-400">Research</span>
                <span className="text-gray-400">{resourceLevels[ResourceType.RESEARCH]}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-700">
                <div
                  className="h-full rounded-full bg-purple-500"
                  style={{ width: `${resourceLevels[ResourceType.RESEARCH]}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
