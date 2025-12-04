import { ChevronDown, ChevronUp, Database, Folder, Settings, Star } from 'lucide-react';
import * as React from 'react';
import { useCallback, useState } from 'react';
import { moduleEventBus } from '../../lib/events/ModuleEventBus';
import { errorLoggingService } from '../../services/logging/ErrorLoggingService';
import { EventType } from '../../types/events/EventTypes';
import { StandardizedEvent } from '../../types/events/StandardizedEvents';
import { ResourceType } from './../../types/resources/ResourceTypes';
// Types from other components
interface Anomaly {
  id: string;
  type: 'artifact' | 'signal' | 'phenomenon';
  severity: 'low' | 'medium' | 'high';
  description: string;
  investigated: boolean;
  discoveryDate: number;
  sectorId: string;
  sectorName: string;
  coordinates: { x: number; y: number };
}

interface Sector {
  id: string;
  name: string;
  status: 'unmapped' | 'mapped' | 'scanning' | 'analyzed';
  coordinates: { x: number; y: number };
  resourcePotential: number;
  habitabilityScore: number;
  anomalies: Anomaly[];
  lastScanned?: number;
}

interface ResourceData {
  type:
    | ResourceType.MINERALS
    | ResourceType.GAS
    | ResourceType.ENERGY
    | ResourceType.ORGANIC
    | ResourceType.EXOTIC;
  name: string;
  amount: number;
  quality: number;
  accessibility: number;
  distribution: 'concentrated' | 'scattered' | 'veins';
  estimatedValue: number;
  extractionDifficulty: number;
}

// Exploration data types
interface ExplorationRecord {
  id: string;
  type: 'sector' | 'anomaly' | 'resource';
  name: string;
  date: number;
  tags: string[];
  starred: boolean;
  notes?: string;
  data: Sector | Anomaly | ResourceData;
  relatedRecords?: string[];
  category?: string;
}

interface ExplorationCategory {
  id: string;
  name: string;
  color: string;
  recordCount: number;
  parentId?: string;
  subCategories?: string[];
}

interface ExplorationDataManagerProps {
  records: ExplorationRecord[];
  categories: ExplorationCategory[];
  onSaveRecord: (record: ExplorationRecord) => void;
  onDeleteRecord: (recordId: string) => void;
  onExportData: (recordIds: string[]) => void;
  onImportData: () => void;
  onCreateCategory: (category: Omit<ExplorationCategory, 'id' | 'recordCount'>) => void;
  onUpdateCategory: (category: ExplorationCategory) => void;
  onDeleteCategory: (categoryId: string) => void;
  className?: string;
}

export function ExplorationDataManager({
  records,
  categories,
  onSaveRecord,
  onDeleteRecord,
  onExportData,
  onImportData,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  className = '',
}: ExplorationDataManagerProps) {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [sortField, setSortField] = useState<'name' | 'date' | 'type'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<'all' | 'sector' | 'anomaly' | 'resource'>('all');
  const [filterStarred, setFilterStarred] = useState(false);
  const [filterTags, setFilterTags] = useState<string[]>([]);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6'); // Default blue
  const [newCategoryParentId, setNewCategoryParentId] = useState<string | undefined>(undefined);



  // Filter and sort records
  const filteredRecords = React.useMemo(() => {
    return records
      .filter(record => {
        // Search term filter
        if (searchTerm && !record.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }

        // Type filter
        if (filterType !== 'all' && record.type !== filterType) {
          return false;
        }

        // Starred filter
        if (filterStarred && !record.starred) {
          return false;
        }

        // Tags filter
        if (filterTags.length > 0 && !filterTags.some(tag => record.tags.includes(tag))) {
          return false;
        }

        // Category filter
        if (selectedCategoryId && record.category !== selectedCategoryId) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let comparison = 0;

        if (sortField === 'name') {
          comparison = a.name.localeCompare(b.name);
        } else if (sortField === 'date') {
          comparison = a.date - b.date;
        } else if (sortField === 'type') {
          comparison = a.type.localeCompare(b.type);
        }

        return sortDirection === 'asc' ? comparison : -comparison;
      });
  }, [
    records,
    searchTerm,
    filterType,
    filterStarred,
    filterTags,
    selectedCategoryId,
    sortField,
    sortDirection,
  ]);

  // Handle sort change
  const handleSortChange = (field: 'name' | 'date' | 'type') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle record selection with standardized events
  const handleRecordSelect = useCallback((recordId: string, multiSelect = false) => {
    if (multiSelect) {
      setSelectedRecordIds(prev => {
        const newSelection = prev.includes(recordId)
          ? prev.filter(id => id !== recordId)
          : [...prev, recordId];

        // Emit selection event
        const event: StandardizedEvent = {
          type: EventType.MODULE_UPDATED,
          moduleId: recordId,
          moduleType: 'exploration',
          timestamp: Date.now(),
          data: {
            action: 'select',
            selectionType: 'multi',
            selectedIds: newSelection,
          },
        };
        moduleEventBus.emit(event);

        return newSelection;
      });
    } else {
      setSelectedRecordIds([recordId]);

      // Emit selection event
      const event: StandardizedEvent = {
        type: EventType.MODULE_UPDATED,
        moduleId: recordId,
        moduleType: 'exploration',
        timestamp: Date.now(),
        data: {
          action: 'select',
          selectionType: 'single',
          selectedIds: [recordId],
        },
      };
      moduleEventBus.emit(event);
    }
  }, []);

  // Handle select all
  const handleSelectAll = () => {
    if (selectedRecordIds.length === filteredRecords.length) {
      setSelectedRecordIds([]);
    } else {
      setSelectedRecordIds(filteredRecords.map(record => record.id));
    }
  };

  // Handle record star toggle with standardized events
  const handleToggleStar = useCallback(
    (recordId: string) => {
      const record = records.find(r => r.id === recordId);
      if (record) {
        const updatedRecord = {
          ...record,
          starred: !record.starred,
        };
        onSaveRecord(updatedRecord);

        // Emit star toggle event
        const event: StandardizedEvent = {
          type: EventType.MODULE_UPDATED,
          moduleId: recordId,
          moduleType: 'exploration',
          timestamp: Date.now(),
          data: {
            action: 'toggle_star',
            starred: !record.starred,
          },
        };
        moduleEventBus.emit(event);
      }
    },
    [records, onSaveRecord]
  );



  // Handle category toggle with standardized events
  const handleToggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories(prev => {
      const isExpanded = !prev[categoryId];

      // Emit category toggle event
      const event: StandardizedEvent = {
        type: EventType.MODULE_UPDATED,
        moduleId: categoryId,
        moduleType: 'exploration',
        timestamp: Date.now(),
        data: {
          action: 'toggle_category',
          expanded: isExpanded,
        },
      };
      moduleEventBus.emit(event);

      return {
        ...prev,
        [categoryId]: isExpanded,
      };
    });
  }, []);

  // Handle create category with standardized events
  const handleCreateCategory = useCallback(() => {
    if (newCategoryName.trim()) {
      const categoryData = {
        name: newCategoryName.trim(),
        color: newCategoryColor,
        parentId: newCategoryParentId,
        subCategories: [],
      };
      onCreateCategory(categoryData);

      // Emit category create event
      const event: StandardizedEvent = {
        type: EventType.MODULE_UPDATED,
        moduleId: `category-${Date.now()}`, // Temporary ID until actual category is created
        moduleType: 'exploration',
        timestamp: Date.now(),
        data: {
          action: 'create_category',
          categoryData,
        },
      };
      moduleEventBus.emit(event);

      setNewCategoryName('');
      setNewCategoryColor('#3b82f6');
      setNewCategoryParentId(undefined);
    }
  }, [newCategoryName, newCategoryColor, newCategoryParentId, onCreateCategory]);

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get record icon
  const getRecordIcon = (type: ExplorationRecord['type']) => {
    switch (type) {
      case 'sector':
        return <Folder className="h-4 w-4" />;
      case 'anomaly':
        return <Star className="h-4 w-4" />;
      case 'resource':
        return <Database className="h-4 w-4" />;
    }
  };

  // Get record type color
  const getRecordTypeColor = (type: ExplorationRecord['type']) => {
    switch (type) {
      case 'sector':
        return 'text-blue-400';
      case 'anomaly':
        return 'text-yellow-400';
      case 'resource':
        return 'text-green-400';
    }
  };

  // Get category by ID
  const getCategoryById = (categoryId: string) => {
    return categories.find(category => category.id === categoryId);
  };

  // Recursive function to render categories
  const renderCategory = (category: ExplorationCategory, level = 0) => {
    const isExpanded = expandedCategories[category.id];
    const hasSubCategories = category.subCategories && category.subCategories.length > 0;

    return (
      <div key={category.id} style={{ marginLeft: `${level * 16}px` }}>
        <div className="flex items-center justify-between rounded p-1 hover:bg-gray-700">
          <div
            className="flex flex-grow cursor-pointer items-center"
            onClick={() => setSelectedCategoryId(category.id)}
          >
            {hasSubCategories && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  handleToggleCategory(category.id);
                }}
                className="mr-1 rounded p-0.5 hover:bg-gray-600"
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
            )}
            <span
              className="mr-2 h-3 w-3 rounded-full"
              style={{ backgroundColor: category.color }}
            ></span>
            <span
              className={`text-sm ${selectedCategoryId === category.id ? 'font-bold text-white' : 'text-gray-300'}`}
            >
              {category.name}
            </span>
            <span className="ml-2 text-xs text-gray-500">({category.recordCount})</span>
          </div>
          {/* Placeholder Edit/Delete buttons */}
          <div className="flex space-x-1 opacity-50 transition-opacity hover:opacity-100">
            <button
              className="rounded p-0.5 text-blue-400 hover:bg-gray-600"
              onClick={e => {
                e.stopPropagation();
                // Placeholder update action
                const updatedCategory = { ...category, name: `${category.name} (edited)` };
                onUpdateCategory(updatedCategory);
                errorLoggingService.logInfo(`Update category clicked: ${category.id}`);
              }}
              title="Edit Category (Placeholder)"
            >
              <Settings size={14} />
            </button>
            <button
              className="rounded p-0.5 text-red-400 hover:bg-gray-600"
              onClick={e => {
                e.stopPropagation();
                onDeleteCategory(category.id);
                errorLoggingService.logInfo(`Delete category clicked: ${category.id}`);
                // Deselect if the deleted category was selected
                if (selectedCategoryId === category.id) {
                  setSelectedCategoryId(null);
                }
              }}
              title="Delete Category"
            >
              <Database size={14} /> {/* Using Database icon as placeholder, replace if needed */}
            </button>
          </div>
        </div>
        {hasSubCategories && isExpanded && (
          <div>
            {category.subCategories?.map(subId => {
              const subCategory = getCategoryById(subId);
              return subCategory ? renderCategory(subCategory, level + 1) : null;
            })}
          </div>
        )}
      </div>
    );
  };

  // Main component return (needs modification to include category rendering)
  return (
    <div className={`exploration-data-manager flex h-[600px] ${className}`}>
      {/* Left Panel: Categories & Filters */}
      <div className="flex w-64 flex-shrink-0 flex-col border-r border-gray-700 bg-gray-800 p-3">
        <h3 className="mb-3 text-lg font-semibold text-white">Exploration Data</h3>

        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search records..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="mb-3 w-full rounded border border-gray-600 bg-gray-700 px-2 py-1 text-sm text-white"
        />

        {/* Filters */}
        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium text-gray-400">Filter by Type</label>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as typeof filterType)}
            className="w-full rounded border border-gray-600 bg-gray-700 px-2 py-1 text-sm text-white"
          >
            <option value="all">All Types</option>
            <option value="sector">Sector</option>
            <option value="anomaly">Anomaly</option>
            <option value="resource">Resource</option>
          </select>
        </div>

        <div className="mb-3 flex items-center">
          <input
            type="checkbox"
            id="filterStarred"
            checked={filterStarred}
            onChange={e => setFilterStarred(e.target.checked)}
            className="mr-2 h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-600"
          />
          <label htmlFor="filterStarred" className="text-sm text-gray-300">
            Show Starred Only
          </label>
        </div>

        {/* Categories Section */}
        <div className="mb-3 flex-grow overflow-y-auto border-t border-gray-700 pt-3">
          <h4 className="mb-2 text-sm font-semibold text-gray-400">Categories</h4>
          {/* Add category button/section */}
          <button
            onClick={() => setSelectedCategoryId(null)}
            className={`mb-1 w-full rounded p-1 text-left text-sm ${!selectedCategoryId ? 'bg-blue-800 font-bold text-white' : 'text-gray-300 hover:bg-gray-700'}`}
          >
            All Records
          </button>
          {categories.filter(cat => !cat.parentId).map(rootCat => renderCategory(rootCat))}
        </div>

        {/* Create Category Form */}
        <div className="border-t border-gray-700 pt-3">
          <h5 className="mb-2 text-sm font-semibold text-gray-400">New Category</h5>
          <input
            type="text"
            placeholder="Category Name"
            value={newCategoryName}
            onChange={e => setNewCategoryName(e.target.value)}
            className="mb-2 w-full rounded border border-gray-600 bg-gray-700 px-2 py-1 text-sm text-white"
          />
          <div className="mb-2 flex items-center">
            <input
              type="color"
              value={newCategoryColor}
              onChange={e => setNewCategoryColor(e.target.value)}
              className="mr-2 h-6 w-6 cursor-pointer rounded border border-gray-600"
            />
            <select
              value={newCategoryParentId ?? ''}
              onChange={e => setNewCategoryParentId(e.target.value ?? undefined)}
              className="flex-grow rounded border border-gray-600 bg-gray-700 px-2 py-1 text-sm text-white"
            >
              <option value="">No Parent</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleCreateCategory}
            disabled={!newCategoryName.trim()}
            className="w-full rounded bg-blue-600 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Create Category
          </button>
        </div>
      </div>

      {/* Right Panel: Records List */}
      <div className="flex flex-grow flex-col bg-gray-900 p-3">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Records ({filteredRecords.length})</h3>
          <div className="flex space-x-2">
            <button
              onClick={onImportData}
              className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600"
            >
              Import
            </button>
            <button
              onClick={() => onExportData(selectedRecordIds)}
              disabled={selectedRecordIds.length === 0}
              className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600 disabled:opacity-50"
            >
              Export Selected
            </button>
          </div>
        </div>

        {/* Records Table Header */}
        <div className="flex items-center border-b border-gray-700 pb-2 text-xs font-medium text-gray-400">
          <input
            type="checkbox"
            checked={
              selectedRecordIds.length === filteredRecords.length && filteredRecords.length > 0
            }
            onChange={handleSelectAll}
            className="mr-2 h-4 w-4 rounded border-gray-600 bg-gray-700"
          />
          <div className="w-12 px-1">Star</div>
          <div className="w-10 cursor-pointer px-1" onClick={() => handleSortChange('type')}>
            Type
          </div>
          <div className="flex-grow cursor-pointer px-1" onClick={() => handleSortChange('name')}>
            Name
          </div>
          <div className="w-40 cursor-pointer px-1" onClick={() => handleSortChange('date')}>
            Date
          </div>
          <div className="w-20 px-1">Actions</div>
        </div>

        {/* Records List (Scrollable) */}
        <div className="flex-grow overflow-y-auto">
          {filteredRecords.map(record => (
            <div
              key={record.id}
              className={`flex items-center border-b border-gray-800 py-2 text-sm hover:bg-gray-800 ${selectedRecordIds.includes(record.id) ? 'bg-gray-700' : ''}`}
            >
              <input
                type="checkbox"
                checked={selectedRecordIds.includes(record.id)}
                onChange={() => handleRecordSelect(record.id, true)}
                className="mr-2 h-4 w-4 rounded border-gray-600 bg-gray-700"
              />
              <div className="w-12 px-1 text-center">
                <button
                  onClick={() => handleToggleStar(record.id)}
                  className={`${record.starred ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-500'}`}
                >
                  <Star size={16} fill={record.starred ? 'currentColor' : 'none'} />
                </button>
              </div>
              <div className={`w-10 px-1 ${getRecordTypeColor(record.type)}`}>
                {getRecordIcon(record.type)}
              </div>
              <div
                className="flex-grow cursor-pointer px-1 text-white"
                onClick={() => handleRecordSelect(record.id)}
              >
                {record.name}
              </div>
              <div className="w-40 px-1 text-gray-400">{formatDate(record.date)}</div>
              <div className="w-20 px-1 text-center">
                <button
                  onClick={() => onDeleteRecord(record.id)}
                  className="text-red-500 hover:text-red-400"
                >
                  <Database size={16} /> {/* Using Database icon as placeholder */}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Panel (Optional - could render selected record details here) */}
      {/* {selectedRecordIds.length === 1 && <RecordDetailPanel recordId={selectedRecordIds[0]} />} */}
    </div>
  );
}
