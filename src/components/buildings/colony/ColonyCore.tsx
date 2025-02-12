import {
  ModularBuilding,
  ModuleAttachmentPoint,
  ModuleType,
} from "../../../types/buildings/ModuleTypes";

const COLONY_ATTACHMENT_POINTS: ModuleAttachmentPoint[] = [
  // Core module points (same as mothership)
  {
    id: "top",
    position: { x: 0, y: -100 },
    allowedTypes: ["radar", "hangar", "academy"],
  },
  {
    id: "right",
    position: { x: 100, y: 0 },
    allowedTypes: ["radar", "hangar", "academy"],
  },
  {
    id: "bottom",
    position: { x: 0, y: 100 },
    allowedTypes: ["radar", "hangar", "academy"],
  },
  {
    id: "left",
    position: { x: -100, y: 0 },
    allowedTypes: ["radar", "hangar", "academy"],
  },
  // Colony-specific module points
  {
    id: "exploration",
    position: { x: 50, y: -50 },
    allowedTypes: ["exploration"],
  },
  {
    id: "mineral",
    position: { x: 50, y: 50 },
    allowedTypes: ["mineral"],
  },
  {
    id: "trading",
    position: { x: -50, y: 50 },
    allowedTypes: ["trading"],
  },
];

interface ColonyProps {
  id: string;
  level: number;
  modules: ModularBuilding["modules"];
  onModuleAttach?: (moduleType: ModuleType, attachmentPointId: string) => void;
  onModuleDetach?: (moduleId: string) => void;
}

export function ColonyCore({
  id,
  level,
  modules,
  onModuleAttach,
  onModuleDetach,
}: ColonyProps) {
  return (
    <div className="relative w-full h-full" data-colony-id={id}>
      {/* Core Colony Structure */}
      <div className="absolute inset-0 bg-gray-900/90 rounded-lg border border-gray-700">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">Colony Control</h2>
          <div className="text-sm text-gray-400 mb-6">Level {level}</div>

          {/* Module Attachment Points */}
          <div className="grid grid-cols-2 gap-4">
            {COLONY_ATTACHMENT_POINTS.map((point) => {
              const attachedModule = modules.find(
                (m: ModularBuilding["modules"][0]) =>
                  m.position.x === point.position.x &&
                  m.position.y === point.position.y,
              );

              return (
                <div key={point.id} className="p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-300">
                        {point.id.charAt(0).toUpperCase() + point.id.slice(1)}{" "}
                        Attachment Point
                      </div>
                      <div className="text-xs text-gray-500">
                        {attachedModule ? attachedModule.name : "Empty"}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Allowed: {point.allowedTypes.join(", ")}
                      </div>
                    </div>
                    {attachedModule ? (
                      <button
                        onClick={() => onModuleDetach?.(attachedModule.id)}
                        className="px-3 py-1 text-xs text-red-400 hover:text-red-300"
                      >
                        Detach
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          onModuleAttach?.(point.allowedTypes[0], point.id)
                        }
                        className="px-3 py-1 text-xs text-blue-400 hover:text-blue-300"
                      >
                        Attach Module
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
