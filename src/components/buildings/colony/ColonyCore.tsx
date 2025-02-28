import { Database, GraduationCap, Leaf, Map, Radar, Rocket, X } from 'lucide-react';
import { ContextMenuItem, useContextMenu } from '../../../components/ui/ContextMenu';
import { Draggable, DragItem, DropTarget } from '../../../components/ui/DragAndDrop';
import { defaultModuleConfigs } from '../../../config/modules/defaultModuleConfigs';
import {
  ModularBuilding,
  ModuleAttachmentPoint,
  ModuleType,
} from '../../../types/buildings/ModuleTypes';

const COLONY_ATTACHMENT_POINTS: ModuleAttachmentPoint[] = [
  // Core module points (same as mothership)
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
  // Colony-specific module points
  {
    id: 'exploration',
    position: { x: 50, y: -50 },
    allowedTypes: ['exploration'],
  },
  {
    id: 'mineral',
    position: { x: 50, y: 50 },
    allowedTypes: ['mineral'],
  },
  {
    id: 'trading',
    position: { x: -50, y: 50 },
    allowedTypes: ['trading'],
  },
];

const MODULE_ICONS = {
  radar: Radar,
  hangar: Rocket,
  academy: GraduationCap,
  exploration: Map,
  mineral: Database,
  trading: Leaf,
};

interface ColonyProps {
  id: string;
  level: number;
  modules: ModularBuilding['modules'];
  onModuleAttach?: (moduleType: ModuleType, attachmentPointId: string) => void;
  onModuleDetach?: (moduleId: string) => void;
}

export function ColonyCore({ id, level, modules, onModuleAttach, onModuleDetach }: ColonyProps) {
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
    if (item.type === 'module' && point.allowedTypes.includes(item.data.type)) {
      onModuleAttach?.(item.data.type, point.id);
    }
  };

  return (
    <div className="relative h-full w-full" data-colony-id={id}>
      {/* Core Colony Structure */}
      <div className="absolute inset-0 rounded-lg border border-gray-700 bg-gray-900/90">
        <div className="p-6">
          <h2 className="mb-4 text-xl font-bold text-white">Colony Control</h2>
          <div className="mb-6 text-sm text-gray-400">Level {level}</div>

          {/* Module Attachment Points */}
          <div className="grid grid-cols-2 gap-4">
            {COLONY_ATTACHMENT_POINTS.map(point => {
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
                        <div className="mt-1 text-xs text-gray-400">
                          Allowed: {point.allowedTypes.join(', ')}
                        </div>
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
        </div>
      </div>
    </div>
  );
}
