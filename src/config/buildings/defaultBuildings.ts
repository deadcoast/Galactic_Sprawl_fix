import { ModularBuilding } from '../../types/buildings/ModuleTypes';
import { ResourceType } from './../../types/resources/ResourceTypes';

export const defaultMothership: ModularBuilding = {
  id: 'mothership-1',
  type: 'mothership',
  level: 1,
  modules: [],
  status: 'active',
  attachmentPoints: [
    {
      id: 'core-1',
      position: { x: 0, y: 0 },
      allowedTypes: ['radar', 'hangar', 'academy', 'resource-manager'],
      currentModule: undefined,
    },
    {
      id: 'core-2',
      position: { x: 1, y: 0 },
      allowedTypes: ['radar', 'hangar', 'academy', 'resource-manager'],
      currentModule: undefined,
    },
    {
      id: 'core-3',
      position: { x: -1, y: 0 },
      allowedTypes: ['radar', 'hangar', 'academy', 'resource-manager'],
      currentModule: undefined,
    },
  ],
};

export const defaultColony: ModularBuilding = {
  id: 'colony-1',
  type: 'colony',
  level: 1,
  modules: [],
  status: 'active',
  attachmentPoints: [
    // Core systems
    {
      id: 'core-1',
      position: { x: 0, y: 0 },
      allowedTypes: ['radar', 'hangar', 'resource-manager'],
      currentModule: undefined,
    },
    // Resource management
    {
      id: 'resource-1',
      position: { x: 1, y: 0 },
      allowedTypes: ['mineral', 'trading', 'resource-manager'],
      currentModule: undefined,
    },
    {
      id: 'resource-2',
      position: { x: -1, y: 0 },
      allowedTypes: ['mineral', 'trading', 'resource-manager'],
      currentModule: undefined,
    },
    // Colony development
    {
      id: 'development-1',
      position: { x: 0, y: 1 },
      allowedTypes: [ResourceType.POPULATION, 'infrastructure', ResourceType.FOOD],
      currentModule: undefined,
    },
    {
      id: 'development-2',
      position: { x: 1, y: 1 },
      allowedTypes: [ResourceType.POPULATION, 'infrastructure', ResourceType.FOOD],
      currentModule: undefined,
    },
    // Research and exploration
    {
      id: 'research-1',
      position: { x: -1, y: 1 },
      allowedTypes: [ResourceType.RESEARCH, 'exploration'],
      currentModule: undefined,
    },
    // Defense systems
    {
      id: 'defense-1',
      position: { x: 0, y: -1 },
      allowedTypes: ['defense', 'radar'],
      currentModule: undefined,
    },
  ],
};
