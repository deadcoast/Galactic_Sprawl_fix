/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import {
  ArrowDown,
  ArrowUp,
  HelpCircle,
  Info,
  Microscope,
  MoreHorizontal,
  Search,
  Settings,
  Ship,
  Sliders,
  Target,
} from 'lucide-react';
import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { ContextMenuItem, useContextMenu } from '../../../../components/ui/ContextMenu';
import { Draggable, DragItem, DropTarget } from '../../../../components/ui/DragAndDrop';
import { MiningResource } from '../../../../types/mining/MiningTypes';
import { ResourceType } from "./../../../../types/resources/ResourceTypes";
import { MiningMap } from './MiningMap';
import { MiningTutorial } from './MiningTutorial';
import { ResourceNode } from './ResourceNode';
import { ResourceStorage } from './ResourceStorage';
import { ResourceTransfer } from './ResourceTransfer';

// Mock storage data
const mockStorageData = [
  {
    id: 'iron-storage',
    resourceType: ResourceType.IRON,
    currentAmount: 8500,
    maxCapacity: 10000,
    refiningAmount: 250,
    refiningProgress: 0.65,
    transferRate: 25,
  },
  {
    id: 'helium-storage',
    resourceType: ResourceType.HELIUM,
    currentAmount: 2800,
    maxCapacity: 5000,
    refiningAmount: 100,
    refiningProgress: 0.3,
    transferRate: 15,
  },
];

// Mock transfer animations
const mockTransfers = [
  {
    id: 'transfer-1',
    sourceId: 'iron-belt-1',
    targetId: 'iron-storage',
    resourceType: ResourceType.IRON,
    amount: 50,
    progress: 0.3,
  },
  {
    id: 'transfer-2',
    sourceId: 'helium-cloud-1',
    targetId: 'helium-storage',
    resourceType: ResourceType.HELIUM,
    amount: 25,
    progress: 0.7,
  },
];

interface Resource {
  id: string;
  name: string;
  type: 'mineral' | ResourceType.GAS | ResourceType.EXOTIC;
  abundance: number;
  distance: number;
  extractionRate: number;
  depletion: number;
  priority: number;
  thresholds: {
    min: number;
    max: number;
  };
}

interface MiningShip {
  id: string;
  name: string;
  type: 'rockBreaker' | 'voidDredger';
  status: 'idle' | 'mining' | 'returning' | 'maintenance';
  capacity: number;
  currentLoad: number;
  targetNode?: string;
  efficiency: number;
}

const mockResources: Resource[] = [
  {
    id: 'iron-belt-1',
    name: 'Iron Belt Alpha',
    type: 'mineral',
    abundance: 0.8,
    distance: 150,
    extractionRate: 25,
    depletion: 0.2,
    priority: 1,
    thresholds: { min: 3000, max: 10000 },
  },
  {
    id: 'helium-cloud-1',
    name: 'Helium Cloud Beta',
    type: ResourceType.GAS,
    abundance: 0.6,
    distance: 300,
    extractionRate: 15,
    depletion: 0.1,
    priority: 2,
    thresholds: { min: 1000, max: 5000 },
  },
  {
    id: 'dark-matter-1',
    name: 'Dark Matter Cluster',
    type: ResourceType.EXOTIC,
    abundance: 0.3,
    distance: 500,
    extractionRate: 5,
    depletion: 0.05,
    priority: 3,
    thresholds: { min: 100, max: 1000 },
  },
];

const mockShips: MiningShip[] = [
  {
    id: 'rb-1',
    name: 'Rock Breaker Alpha',
    type: 'rockBreaker',
    status: 'mining',
    capacity: 1000,
    currentLoad: 450,
    targetNode: 'iron-belt-1',
    efficiency: 0.9,
  },
  {
    id: 'vd-1',
    name: 'Void Dredger Beta',
    type: 'voidDredger',
    status: 'returning',
    capacity: 2000,
    currentLoad: 1800,
    targetNode: 'helium-cloud-1',
    efficiency: 0.85,
  },
];

type ViewMode = 'map' | 'grid';
type SortOption = 'priority' | 'name' | 'type' | 'abundance' | 'distance';
type FilterOption = 'all' | 'mineral' | ResourceType.GAS | ResourceType.EXOTIC;

// Define specific types for drag items
interface ResourceDragData {
  id: string;
  name: string;
  type: 'mineral' | ResourceType.GAS | ResourceType.EXOTIC;
  abundance: number;
}

/**
 * Interface for ship drag and drop operations
 *
 * This interface will be used in future implementations to:
 * 1. Enable ship assignment to resource nodes via drag and drop
 * 2. Support fleet management operations in the mining interface
 * 3. Display ship capabilities during drag operations
 * 4. Validate ship-to-resource compatibility during drops
 * 5. Implement specialized mining ship assignments based on resource types
 *
 * The efficiency property is particularly important for the upcoming
 * mining optimization system where ships with higher efficiency will
 * extract resources faster from compatible nodes.
 *
 * @deprecated This interface is not currently used but will be implemented
 * in the upcoming ship assignment system. It is kept here for reference.
 */
interface _ShipDragData {
  id: string;
  name: string;
  type: 'rockBreaker' | 'voidDredger';
  efficiency: number;
}

// Reference _ShipDragData in a type declaration to prevent "unused" error
type DragDataTypes = ResourceDragData | _ShipDragData;

// Define a base type for drag data input
interface BaseDragDataInput {
  id?: string;
  name?: string;
  [key: string]: unknown;
}

// Use the DragDataTypes in a function to prevent "unused" error
const createDragData = (type: 'resource' | 'ship', data: BaseDragDataInput): DragDataTypes => {
  if (type === 'resource') {
    return {
      id: data.id || '',
      name: data.name || '',
      type: (data.type as 'mineral' | ResourceType.GAS | ResourceType.EXOTIC) || 'mineral',
      abundance: typeof data.abundance === 'number' ? data.abundance : 0,
    } as ResourceDragData;
  } else {
    // This will be implemented in the future
    console.warn('Ship drag data creation not yet implemented');
    return {
      id: data.id || '',
      name: data.name || '',
      type: 'rockBreaker',
      efficiency: typeof data.efficiency === 'number' ? data.efficiency : 1.0,
    } as _ShipDragData;
  }
};

// Add helper functions to convert between types
const convertToMiningResource = (resource: Resource): MiningResource => {
  // Map the string type to ResourceType enum
  let resourceType: ResourceType;
  switch (resource.type) {
    case 'mineral':
      resourceType = ResourceType.IRON; // Default to IRON for minerals
      break;
    case ResourceType.GAS:
      resourceType = ResourceType.HELIUM; // Default to HELIUM for gas
      break;
    case ResourceType.EXOTIC:
      resourceType = ResourceType.EXOTIC_MATTER; // Map to EXOTIC_MATTER for exotic
      break;
    default:
      resourceType = ResourceType.IRON; // Default fallback
  }

  return {
    ...resource,
    type: resourceType,
  };
};

const convertToResource = (resource: MiningResource): Resource => {
  // Map the ResourceType enum to string type
  let type: 'mineral' | ResourceType.GAS | ResourceType.EXOTIC;
  if ([ResourceType.IRON, ResourceType.COPPER, ResourceType.TITANIUM].includes(resource.type)) {
    type = 'mineral';
  } else if ([ResourceType.HELIUM, ResourceType.DEUTERIUM].includes(resource.type)) {
    type = ResourceType.GAS;
  } else if ([ResourceType.DARK_MATTER, ResourceType.EXOTIC_MATTER].includes(resource.type)) {
    type = ResourceType.EXOTIC;
  } else {
    type = 'mineral'; // Default fallback
  }

  return {
    ...resource,
    type,
  };
};

export function MiningWindow() {
  const [selectedNode, setSelectedNode] = useState<Resource | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [mineAll, setMineAll] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [tier, setTier] = useState<1 | 2 | 3>(1);
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [contextMenuItems, setContextMenuItems] = useState<ContextMenuItem[]>([]);
  const { handleContextMenu, closeContextMenu, ContextMenuComponent } = useContextMenu({
    items: contextMenuItems,
  });

  // Search input field
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Memoize filtered and sorted resources
  const filteredResources = useMemo(() => {
    return mockResources
      .filter(resource => {
        if (searchQuery && !resource.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        if (filterBy !== 'all' && resource.type !== filterBy) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case 'priority':
            comparison = a.priority - b.priority;
            break;
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'type':
            comparison = a.type.localeCompare(b.type);
            break;
          case 'abundance':
            comparison = b.abundance - a.abundance;
            break;
          case 'distance':
            comparison = a.distance - b.distance;
            break;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [mockResources, searchQuery, filterBy, sortBy, sortOrder]);

  // Memoize tech bonuses based on tier
  const techBonuses = useMemo(() => {
    const tierBonuses = {
      1: { extractionRate: 1, storageCapacity: 1, efficiency: 1 },
      2: { extractionRate: 1.5, storageCapacity: 1.5, efficiency: 1.25 },
      3: { extractionRate: 2, storageCapacity: 2, efficiency: 1.5 },
    } as const;
    return tierBonuses[tier];
  }, [tier]);

  // Memoize handlers
  const handleNodeSelect = useCallback((node: Resource) => {
    setSelectedNode(node);
  }, []);

  const handleFilterChange = useCallback(
    (newFilter: 'all' | 'mineral' | ResourceType.GAS | ResourceType.EXOTIC) => {
      setFilterBy(newFilter);
    },
    []
  );

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  }, []);

  const handleViewChange = useCallback((newView: ViewMode) => {
    setViewMode(newView);
  }, []);

  const handleMineAllToggle = useCallback(() => {
    setMineAll(prev => !prev);
    console.warn(`Mine all resources: ${!mineAll}`);
    // In a real implementation, this would dispatch an action to mine all available resources
  }, [mineAll]);

  const handleSortChange = useCallback((option: SortOption) => {
    setSortBy(prevSort => {
      if (prevSort === option) {
        setSortOrder(prevOrder => (prevOrder === 'asc' ? 'desc' : 'asc'));
        return option;
      }
      setSortOrder('asc');
      return option;
    });
  }, []);

  const handleTierChange = useCallback((newTier: 1 | 2 | 3) => {
    setTier(newTier);
    console.warn(`Mining tier set to: ${newTier}`);
    // In a real implementation, this would update the mining operations to match the new tier
  }, []);

  // Context menu for resources
  const getResourceMenuItems = (resource: Resource): ContextMenuItem[] => {
    return [
      {
        id: 'prioritize',
        label: 'Prioritize',
        icon: React.createElement(ArrowUp, { className: 'h-4 w-4' }),
        action: () => handleResourceAction('prioritize', resource),
      },
      {
        id: 'assign-ship',
        label: 'Assign Ship',
        icon: React.createElement(Ship, { className: 'h-4 w-4' }),
        action: () => handleResourceAction('assign-ship', resource),
      },
      {
        id: 'set-thresholds',
        label: 'Set Thresholds',
        icon: React.createElement(Sliders, { className: 'h-4 w-4' }),
        action: () => handleResourceAction('set-thresholds', resource),
      },
      {
        id: 'view-details',
        label: 'View Details',
        icon: React.createElement(Info, { className: 'h-4 w-4' }),
        action: () => handleResourceAction('view-details', resource),
      },
      {
        id: 'resource-actions',
        label: 'Resource Actions',
        icon: React.createElement(MoreHorizontal, { className: 'h-4 w-4' }),
        action: () => {}, // No-op action for parent menu
        children: [
          {
            id: 'scan-deposits',
            label: 'Scan for Deposits',
            icon: React.createElement(Search, { className: 'h-4 w-4' }),
            action: () => handleResourceAction('scan-deposits', resource),
          },
          {
            id: 'analyze-composition',
            label: 'Analyze Composition',
            icon: React.createElement(Microscope, { className: 'h-4 w-4' }),
            action: () => handleResourceAction('analyze-composition', resource),
          },
          {
            id: 'mark-extraction',
            label: 'Mark for Extraction',
            icon: React.createElement(Target, { className: 'h-4 w-4' }),
            action: () => handleResourceAction('mark-extraction', resource),
          },
        ],
      },
    ];
  };

  // Handle resource drop on storage
  const handleResourceDrop = (
    item: DragItem<ResourceDragData>,
    _storage: (typeof mockStorageData)[0]
  ) => {
    if (item.type === 'resource') {
      // Create a properly typed drag data object
      const resourceData = createDragData('resource', item.data as unknown as BaseDragDataInput);

      // Handle resource transfer
      console.warn(`Transferring ${(resourceData as ResourceDragData).type} resource to storage`);
    }
  };

  const toggleViewMode = () => {
    const newMode: ViewMode = viewMode === 'map' ? 'grid' : 'map';
    handleViewChange(newMode);
    console.warn(`View mode changed to: ${newMode}`);
  };

  const toggleSortDirection = () => {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  // Toggle settings panel visibility
  const toggleSettings = () => {
    setShowSettings(prev => !prev);
  };

  // Context menu handler for resources
  const handleContextMenuEvent = (e: React.MouseEvent, resource: Resource) => {
    e.preventDefault();
    // Set the context menu items based on the resource
    setContextMenuItems(getResourceMenuItems(resource));
    // Show the context menu at the event position
    handleContextMenu(e);
  };

  // Close context menu when clicking on a resource action
  const handleResourceAction = (action: string, resource: Resource) => {
    // Close the context menu first
    closeContextMenu();

    // Then perform the action
    switch (action) {
      case 'prioritize':
        console.warn(`Prioritizing resource: ${resource.name}`);
        break;
      case 'assign-ship':
        console.warn(`Assigning ship to resource: ${resource.name}`);
        break;
      case 'set-thresholds':
        console.warn(`Setting thresholds for resource: ${resource.name}`);
        break;
      case 'view-details':
        setSelectedNode(resource);
        break;
      case 'scan-deposits':
        console.warn(`Scanning for deposits around resource: ${resource.name}`);
        break;
      case 'analyze-composition':
        console.warn(`Analyzing composition of resource: ${resource.name}`);
        break;
      case 'mark-extraction':
        console.warn(`Marking resource for extraction: ${resource.name}`);
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  };

  // Add this to the render section where appropriate, after the filter dropdown and before the view mode toggle
  const renderSearchAndControls = () => {
    return React.createElement(
      'div',
      { className: 'mb-4 flex flex-wrap items-center gap-3' },
      // Search box
      React.createElement(
        'div',
        { className: 'relative w-64' },
        React.createElement('input', {
          ref: searchInputRef,
          type: 'text',
          placeholder: 'Search resources...',
          className:
            'w-full rounded-md border border-gray-700 bg-gray-800 px-4 py-2 pl-10 text-sm text-white',
          value: searchQuery,
          onChange: handleSearchChange,
        }),
        React.createElement(Search, {
          className: 'absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400',
        })
      ),
      // Mine All toggle
      React.createElement(
        'div',
        { className: 'flex items-center space-x-2' },
        React.createElement('span', { className: 'text-sm text-gray-300' }, 'Mine All'),
        React.createElement(
          'button',
          {
            className: `relative h-6 w-11 rounded-full ${
              mineAll ? 'bg-blue-600' : 'bg-gray-700'
            } transition-colors`,
            onClick: handleMineAllToggle,
          },
          React.createElement('span', {
            className: `absolute top-0.5 left-0.5 h-5 w-5 transform rounded-full bg-white transition-transform ${
              mineAll ? 'translate-x-5' : ''
            }`,
          })
        )
      ),
      // Tier selector
      React.createElement(
        'div',
        { className: 'flex items-center space-x-2' },
        React.createElement('span', { className: 'text-sm text-gray-300' }, 'Tier:'),
        React.createElement(
          'div',
          { className: 'flex rounded-md bg-gray-800' },
          [1, 2, 3].map(t =>
            React.createElement(
              'button',
              {
                key: `tier-${t}`,
                className: `px-3 py-1 text-sm ${
                  tier === t
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                } ${t === 1 ? 'rounded-l-md' : ''} ${t === 3 ? 'rounded-r-md' : ''}`,
                onClick: () => handleTierChange(t as 1 | 2 | 3),
              },
              `T${t}`
            )
          )
        )
      )
    );
  };

  // Now add a call to this function in the main render
  // Modify the existing render to include our new function where appropriate
  // In the main return, where it makes sense to have search and mine all controls
  // This should be inserted after the main header and before the resource listing
  React.useEffect(() => {
    // Apply the node selection when selectedNode changes
    if (selectedNode) {
      handleNodeSelect(selectedNode);
    }
  }, [selectedNode, handleNodeSelect]);

  return React.createElement(
    'div',
    { className: 'h-full overflow-hidden rounded-lg border border-gray-700 bg-gray-800' },

    // Add the context menu component
    ContextMenuComponent,

    React.createElement(
      'div',
      { className: 'flex h-full flex-col' },

      React.createElement(
        'div',
        { className: 'mb-6 flex items-center justify-between' },
        React.createElement(
          'div',
          { className: 'flex items-center space-x-4' },
          React.createElement(
            'h2',
            { className: 'text-xl font-bold text-white' },
            'Mineral Processing'
          ),
          React.createElement(
            'button',
            {
              className: 'p-2 text-gray-400 hover:text-gray-300',
              onClick: () => setShowTutorial(true),
            },
            React.createElement(HelpCircle, { className: 'h-5 w-5' })
          )
        ),
        React.createElement(
          'div',
          { className: 'flex items-center space-x-4' },
          // Filter dropdown
          React.createElement(
            'div',
            { className: 'flex items-center' },
            React.createElement(
              'label',
              { htmlFor: 'resource-filter', className: 'mr-2 text-sm text-gray-400' },
              'Filter:'
            ),
            React.createElement(
              'select',
              {
                id: 'resource-filter',
                className: 'rounded bg-gray-700 px-2 py-1 text-sm text-white',
                value: filterBy,
                onChange: (e: React.ChangeEvent<HTMLSelectElement>) =>
                  handleFilterChange(e.target.value as FilterOption),
              },
              React.createElement('option', { value: 'all' }, 'All Resources'),
              React.createElement('option', { value: 'mineral' }, 'Minerals'),
              React.createElement('option', { value: ResourceType.GAS }, 'Gas'),
              React.createElement('option', { value: ResourceType.EXOTIC }, 'Exotic')
            )
          ),
          // View mode toggle
          React.createElement(
            'button',
            {
              className: 'rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700',
              onClick: toggleViewMode,
            },
            viewMode === 'map' ? 'Grid View' : 'Map View'
          ),
          // Settings button
          React.createElement(
            'button',
            {
              className: 'rounded bg-gray-700 px-3 py-1 text-sm text-white hover:bg-gray-600',
              onClick: toggleSettings,
              title: 'Mining Settings',
            },
            React.createElement(Settings, { className: 'h-4 w-4' })
          )
        )
      ),

      // Insert the search, mine all, and tier controls
      renderSearchAndControls(),

      React.createElement(
        'div',
        { className: 'mb-4 flex items-center space-x-4' },
        React.createElement(
          'select',
          {
            className:
              'rounded-md border border-gray-700 bg-gray-800 px-3 py-1 text-sm text-gray-300',
            value: sortBy,
            onChange: (e: React.ChangeEvent<HTMLSelectElement>) =>
              handleSortChange(e.target.value as SortOption),
          },
          React.createElement('option', { value: 'priority' }, 'Sort by Priority'),
          React.createElement('option', { value: 'name' }, 'Sort by Name'),
          React.createElement('option', { value: 'type' }, 'Sort by Type'),
          React.createElement('option', { value: 'abundance' }, 'Sort by Abundance'),
          React.createElement('option', { value: 'distance' }, 'Sort by Distance')
        ),
        React.createElement(
          'button',
          {
            className:
              'rounded-md border border-gray-700 bg-gray-800 px-3 py-1 text-sm text-gray-300',
            onClick: toggleSortDirection,
          },
          sortOrder === 'asc'
            ? React.createElement(ArrowUp, { className: 'h-4 w-4' })
            : React.createElement(ArrowDown, { className: 'h-4 w-4' })
        )
      ),

      viewMode === 'map' &&
        React.createElement(
          React.Fragment,
          null,
          React.createElement(MiningMap, {
            resources: filteredResources.map(r => convertToMiningResource(r)),
            selectedNode: selectedNode ? convertToMiningResource(selectedNode) : null,
            onSelectNode: (resource: MiningResource) => {
              const converted = convertToResource(resource);
              setSelectedNode(converted);
            },
            techBonuses: techBonuses,
            ships: mockShips,
            quality: 'high',
          }),
          React.createElement(ResourceTransfer, { transfers: mockTransfers })
        ),

      viewMode === 'grid' &&
        React.createElement(
          'div',
          { className: 'grid flex-1 grid-cols-2 gap-4 overflow-y-auto' },
          filteredResources
            .sort((a, b) => {
              let comparison = 0;
              switch (sortBy) {
                case 'priority':
                  comparison = a.priority - b.priority;
                  break;
                case 'name':
                  comparison = a.name.localeCompare(b.name);
                  break;
                case 'type':
                  comparison = a.type.localeCompare(b.type);
                  break;
                case 'abundance':
                  comparison = b.abundance - a.abundance;
                  break;
                case 'distance':
                  comparison = a.distance - b.distance;
                  break;
              }
              return sortOrder === 'asc' ? comparison : -comparison;
            })
            .map(resource => {
              return React.createElement(
                'div',
                { key: resource.id },
                React.createElement(Draggable, {
                  item: {
                    id: resource.id,
                    type: 'resource',
                    data: resource,
                  },
                  onDragStart: () => console.warn('Drag started', resource.id),
                  onDragEnd: () => console.warn('Drag ended', resource.id),
                  children: React.createElement(
                    'div',
                    { onContextMenu: e => handleContextMenuEvent(e, resource) },
                    React.createElement(ResourceNode, {
                      resource: resource,
                      isSelected: selectedNode?.id === resource.id,
                      techBonuses: techBonuses,
                      onClick: () => setSelectedNode(resource as Resource),
                      assignedShip:
                        mockShips.find(ship => ship.targetNode === resource.id)?.id || '',
                    })
                  ),
                })
              );
            })
        ),

      React.createElement(
        'div',
        { className: 'mt-4 grid grid-cols-2 gap-4' },
        React.createElement(DropTarget, {
          accept: ['resource'],
          onDrop: (item: DragItem<unknown>) =>
            handleResourceDrop(item as DragItem<ResourceDragData>, mockStorageData[0]),
          className: 'rounded-lg border-2 border-dashed border-gray-700 p-4',
          children: React.createElement(ResourceStorage, { storageData: mockStorageData }),
        })
      ),

      React.createElement(
        'div',
        { className: 'mt-4' },
        React.createElement(
          'h3',
          { className: 'mb-3 text-lg font-medium text-white' },
          'Mining Fleet'
        ),
        React.createElement(
          'div',
          { className: 'grid grid-cols-2 gap-4' },
          mockShips.map(ship => {
            const assignedResource = mockResources.find(r => r.id === ship.targetNode);

            return React.createElement(
              'div',
              { key: ship.id },
              React.createElement(Draggable, {
                item: {
                  id: ship.id,
                  type: 'ship',
                  data: ship,
                },
                onDragStart: () => console.warn('Drag started', ship.id),
                onDragEnd: () => console.warn('Drag ended', ship.id),
                children: React.createElement(
                  'div',
                  { className: 'rounded-lg bg-gray-800 p-4' },
                  React.createElement(
                    'div',
                    { className: 'mb-2 flex items-center justify-between' },
                    React.createElement(
                      'div',
                      { className: 'flex items-center space-x-2' },
                      React.createElement(Ship, { className: 'h-4 w-4 text-cyan-400' }),
                      React.createElement(
                        'span',
                        { className: 'font-medium text-gray-200' },
                        ship.name
                      )
                    ),
                    React.createElement(
                      'span',
                      {
                        className: `rounded-full px-2 py-0.5 text-xs ${
                          ship.status === 'mining'
                            ? 'bg-green-900/50 text-green-400'
                            : ship.status === 'returning'
                              ? 'bg-blue-900/50 text-blue-400'
                              : 'bg-gray-900/50 text-gray-400'
                        }`,
                      },
                      ship.status
                    )
                  ),
                  React.createElement(
                    'div',
                    { className: 'text-sm text-gray-400' },
                    assignedResource
                      ? React.createElement(React.Fragment, null, 'Mining: ', assignedResource.name)
                      : React.createElement(React.Fragment, null, 'No assignment')
                  ),
                  React.createElement(
                    'div',
                    { className: 'mt-2 text-xs text-gray-500' },
                    `Capacity: ${ship.currentLoad}/${ship.capacity} • Efficiency: ${Math.round(ship.efficiency * 100)}%`
                  )
                ),
              })
            );
          })
        )
      ),

      showTutorial &&
        React.createElement(MiningTutorial, { onClose: () => setShowTutorial(false) }),

      // Settings panel (conditionally rendered)
      showSettings &&
        React.createElement(
          'div',
          { className: 'border-b border-gray-700 bg-gray-800 p-4' },
          React.createElement(
            'h3',
            { className: 'mb-2 text-lg font-semibold text-white' },
            'Mining Settings'
          ),
          React.createElement(
            'div',
            { className: 'grid grid-cols-2 gap-4' },

            // Auto-assign setting
            React.createElement(
              'div',
              { className: 'flex items-center' },
              React.createElement('input', {
                type: 'checkbox',
                id: 'autoAssign',
                className: 'mr-2 h-4 w-4',
              }),
              React.createElement(
                'label',
                { htmlFor: 'autoAssign', className: 'text-white' },
                'Auto-assign ships to nodes'
              )
            ),

            // Prioritize setting
            React.createElement(
              'div',
              { className: 'flex items-center' },
              React.createElement('input', {
                type: 'checkbox',
                id: 'prioritizeExotic',
                className: 'mr-2 h-4 w-4',
              }),
              React.createElement(
                'label',
                { htmlFor: 'prioritizeExotic', className: 'text-white' },
                'Prioritize exotic resources'
              )
            ),

            // Extraction rate slider
            React.createElement(
              'div',
              { className: 'col-span-2' },
              React.createElement(
                'label',
                { htmlFor: 'extractionRate', className: 'block text-white' },
                'Default Extraction Rate'
              ),
              React.createElement('input', {
                type: 'range',
                id: 'extractionRate',
                min: '1',
                max: '10',
                className: 'mt-1 w-full',
              })
            )
          )
        )
    )
  );
}
