import {
  CheckSquare,
  Database,
  Download,
  FileText,
  Folder,
  FolderOpen,
  Search,
  SortAsc,
  SortDesc,
  Square,
  Star,
  StarOff,
  Tag,
  Trash2,
  Upload,
} from 'lucide-react';
import * as React from "react";
import { useState } from 'react';
import { ResourceType } from "./../../types/resources/ResourceTypes";
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
  type: ResourceType.MINERALS | ResourceType.GAS | ResourceType.ENERGY | 'organic' | ResourceType.EXOTIC;
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
  onUpdateCategory: _onUpdateCategory,
  onDeleteCategory: _onDeleteCategory,
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
  const [_editingRecord, _setEditingRecord] = useState<ExplorationRecord | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6'); // Default blue
  const [newCategoryParentId, setNewCategoryParentId] = useState<string | undefined>(undefined);

  // Get all unique tags from records
  const allTags = React.useMemo(() => {
    const tags = new Set<string>();
    records.forEach(record => {
      record.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [records]);

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

  // Handle record selection
  const handleRecordSelect = (recordId: string, multiSelect = false) => {
    if (multiSelect) {
      setSelectedRecordIds(prev => {
        if (prev.includes(recordId)) {
          return prev.filter(id => id !== recordId);
        } else {
          return [...prev, recordId];
        }
      });
    } else {
      setSelectedRecordIds([recordId]);
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedRecordIds.length === filteredRecords.length) {
      setSelectedRecordIds([]);
    } else {
      setSelectedRecordIds(filteredRecords.map(record => record.id));
    }
  };

  // Handle record star toggle
  const handleToggleStar = (recordId: string) => {
    const record = records.find(r => r.id === recordId);
    if (record) {
      onSaveRecord({
        ...record,
        starred: !record.starred,
      });
    }
  };

  // Handle tag toggle
  const handleToggleTag = (tag: string) => {
    setFilterTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  // Handle category toggle
  const handleToggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // Handle create category
  const handleCreateCategory = () => {
    if (newCategoryName.trim()) {
      onCreateCategory({
        name: newCategoryName.trim(),
        color: newCategoryColor,
        parentId: newCategoryParentId,
        subCategories: [],
      });
      setNewCategoryName('');
      setNewCategoryColor('#3b82f6');
      setNewCategoryParentId(undefined);
    }
  };

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

  // Render category tree
  const renderCategoryTree = (parentId?: string, depth = 0) => {
    const categoryItems = categories
      .filter(category => category.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name));

    if (categoryItems.length === 0) {
      return null;
    }

    return (
      <ul className={`space-y-1 ${depth > 0 ? 'ml-4' : ''}`}>
        {categoryItems.map(category => {
          const hasSubCategories = categories.some(c => c.parentId === category.id);
          const isExpanded = expandedCategories[category.id];

          return (
            <li key={category.id}>
              <div
                className={`flex cursor-pointer items-center rounded px-2 py-1 ${
                  selectedCategoryId === category.id ? 'bg-gray-700' : 'hover:bg-gray-800'
                }`}
              >
                <button
                  className="mr-1 text-gray-400 hover:text-gray-300"
                  onClick={() => handleToggleCategory(category.id)}
                  style={{ visibility: hasSubCategories ? 'visible' : 'hidden' }}
                >
                  {isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />}
                </button>

                <div
                  className="flex flex-grow items-center"
                  onClick={() =>
                    setSelectedCategoryId(selectedCategoryId === category.id ? null : category.id)
                  }
                >
                  <div
                    className="mr-2 h-2 w-2 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm text-gray-300">{category.name}</span>
                  <span className="ml-2 text-xs text-gray-500">{category.recordCount}</span>
                </div>
              </div>

              {isExpanded && hasSubCategories && renderCategoryTree(category.id, depth + 1)}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className={`flex h-full flex-col bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 p-3">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-blue-400" />
          <h2 className="text-lg font-bold text-white">Exploration Data</h2>
        </div>

        <div className="flex items-center space-x-2">
          <button
            className="rounded p-1.5 text-gray-400 hover:bg-gray-700"
            title="Import Data"
            onClick={onImportData}
          >
            <Upload size={16} />
          </button>

          <button
            className={`rounded p-1.5 ${
              selectedRecordIds.length > 0
                ? 'text-blue-400 hover:bg-gray-700'
                : 'cursor-not-allowed text-gray-600'
            }`}
            title="Export Selected Data"
            onClick={() => selectedRecordIds.length > 0 && onExportData(selectedRecordIds)}
            disabled={selectedRecordIds.length === 0}
          >
            <Download size={16} />
          </button>

          <button
            className={`rounded p-1.5 ${
              selectedRecordIds.length > 0
                ? 'text-red-400 hover:bg-gray-700'
                : 'cursor-not-allowed text-gray-600'
            }`}
            title="Delete Selected Records"
            onClick={() => {
              if (
                selectedRecordIds.length > 0 &&
                window.confirm(`Delete ${selectedRecordIds.length} selected records?`)
              ) {
                selectedRecordIds.forEach(id => onDeleteRecord(id));
                setSelectedRecordIds([]);
              }
            }}
            disabled={selectedRecordIds.length === 0}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-grow overflow-hidden">
        {/* Sidebar */}
        <div className="bg-gray-850 flex w-64 flex-col border-r border-gray-700">
          {/* Search */}
          <div className="border-b border-gray-700 p-3">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search records..."
                className="w-full rounded border border-gray-600 bg-gray-700 py-1.5 pl-8 pr-3 text-sm text-gray-300"
              />
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 transform text-gray-400"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="border-b border-gray-700 p-3">
            <h3 className="mb-2 text-xs font-semibold uppercase text-gray-400">Filters</h3>

            <div className="space-y-3">
              {/* Type filter */}
              <div>
                <label className="mb-1 block text-xs text-gray-400">Record Type</label>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`rounded px-2 py-0.5 text-xs ${
                      filterType === 'all'
                        ? 'bg-blue-900 text-blue-300'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    All
                  </button>

                  <button
                    onClick={() => setFilterType('sector')}
                    className={`flex items-center space-x-1 rounded px-2 py-0.5 text-xs ${
                      filterType === 'sector'
                        ? 'bg-blue-900 text-blue-300'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <Folder size={12} />
                    <span>Sectors</span>
                  </button>

                  <button
                    onClick={() => setFilterType('anomaly')}
                    className={`flex items-center space-x-1 rounded px-2 py-0.5 text-xs ${
                      filterType === 'anomaly'
                        ? 'bg-yellow-900 text-yellow-300'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <Star size={12} />
                    <span>Anomalies</span>
                  </button>

                  <button
                    onClick={() => setFilterType('resource')}
                    className={`flex items-center space-x-1 rounded px-2 py-0.5 text-xs ${
                      filterType === 'resource'
                        ? 'bg-green-900 text-green-300'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <Database size={12} />
                    <span>Resources</span>
                  </button>
                </div>
              </div>

              {/* Starred filter */}
              <div>
                <button
                  onClick={() => setFilterStarred(!filterStarred)}
                  className={`flex items-center space-x-1 rounded px-2 py-1 text-xs ${
                    filterStarred
                      ? 'bg-yellow-900/50 text-yellow-300'
                      : 'text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {filterStarred ? (
                    <Star size={12} className="text-yellow-300" />
                  ) : (
                    <StarOff size={12} />
                  )}
                  <span>Starred Records</span>
                </button>
              </div>

              {/* Tags filter */}
              <div>
                <label className="mb-1 block text-xs text-gray-400">Tags</label>
                <div className="flex max-h-24 flex-wrap gap-1 overflow-y-auto">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleToggleTag(tag)}
                      className={`flex items-center space-x-1 rounded px-2 py-0.5 text-xs ${
                        filterTags.includes(tag)
                          ? 'bg-purple-900 text-purple-300'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <Tag size={10} />
                      <span>{tag}</span>
                    </button>
                  ))}

                  {allTags.length === 0 && (
                    <span className="text-xs text-gray-500">No tags available</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="border-b border-gray-700 p-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase text-gray-400">Categories</h3>
              <button
                className="text-xs text-blue-400 hover:text-blue-300"
                onClick={() => setSelectedCategoryId(null)}
              >
                Clear
              </button>
            </div>

            <div className="mb-3 max-h-48 overflow-y-auto">
              {renderCategoryTree()}

              {categories.length === 0 && (
                <p className="text-xs text-gray-500">No categories available</p>
              )}
            </div>

            {/* Create category */}
            <div className="space-y-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                placeholder="New category name..."
                className="w-full rounded border border-gray-600 bg-gray-700 px-2 py-1 text-xs text-gray-300"
              />

              <div className="flex space-x-2">
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={e => setNewCategoryColor(e.target.value)}
                  className="h-6 w-6 cursor-pointer rounded"
                />

                <select
                  value={newCategoryParentId || ''}
                  onChange={e => setNewCategoryParentId(e.target.value || undefined)}
                  className="flex-grow rounded border border-gray-600 bg-gray-700 px-1 py-1 text-xs text-gray-300"
                >
                  <option value="">No parent</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleCreateCategory}
                  disabled={!newCategoryName.trim()}
                  className={`rounded px-2 py-1 text-xs ${
                    newCategoryName.trim()
                      ? 'bg-blue-700 text-white hover:bg-blue-600'
                      : 'cursor-not-allowed bg-gray-700 text-gray-500'
                  }`}
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-auto border-t border-gray-700 p-3 text-xs text-gray-400">
            <div className="mb-1 flex justify-between">
              <span>Total Records:</span>
              <span>{records.length}</span>
            </div>
            <div className="mb-1 flex justify-between">
              <span>Sectors:</span>
              <span>{records.filter(r => r.type === 'sector').length}</span>
            </div>
            <div className="mb-1 flex justify-between">
              <span>Anomalies:</span>
              <span>{records.filter(r => r.type === 'anomaly').length}</span>
            </div>
            <div className="flex justify-between">
              <span>Resources:</span>
              <span>{records.filter(r => r.type === 'resource').length}</span>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-grow flex-col">
          {/* Toolbar */}
          <div className="flex items-center border-b border-gray-700 bg-gray-800 p-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSelectAll}
                className="p-1 text-gray-400 hover:text-gray-300"
                title={
                  selectedRecordIds.length === filteredRecords.length
                    ? 'Deselect All'
                    : 'Select All'
                }
              >
                {selectedRecordIds.length === filteredRecords.length &&
                filteredRecords.length > 0 ? (
                  <CheckSquare size={16} />
                ) : (
                  <Square size={16} />
                )}
              </button>

              <span className="text-xs text-gray-400">
                {selectedRecordIds.length > 0
                  ? `${selectedRecordIds.length} selected`
                  : `${filteredRecords.length} records`}
              </span>
            </div>

            <div className="ml-auto flex items-center space-x-3">
              <button
                onClick={() => handleSortChange('name')}
                className={`flex items-center space-x-1 rounded px-2 py-1 text-xs ${
                  sortField === 'name'
                    ? 'bg-blue-900/30 text-blue-300'
                    : 'text-gray-400 hover:bg-gray-700'
                }`}
              >
                <span>Name</span>
                {sortField === 'name' &&
                  (sortDirection === 'asc' ? <SortAsc size={12} /> : <SortDesc size={12} />)}
              </button>

              <button
                onClick={() => handleSortChange('date')}
                className={`flex items-center space-x-1 rounded px-2 py-1 text-xs ${
                  sortField === 'date'
                    ? 'bg-blue-900/30 text-blue-300'
                    : 'text-gray-400 hover:bg-gray-700'
                }`}
              >
                <span>Date</span>
                {sortField === 'date' &&
                  (sortDirection === 'asc' ? <SortAsc size={12} /> : <SortDesc size={12} />)}
              </button>

              <button
                onClick={() => handleSortChange('type')}
                className={`flex items-center space-x-1 rounded px-2 py-1 text-xs ${
                  sortField === 'type'
                    ? 'bg-blue-900/30 text-blue-300'
                    : 'text-gray-400 hover:bg-gray-700'
                }`}
              >
                <span>Type</span>
                {sortField === 'type' &&
                  (sortDirection === 'asc' ? <SortAsc size={12} /> : <SortDesc size={12} />)}
              </button>
            </div>
          </div>

          {/* Records list */}
          <div className="flex-grow overflow-y-auto">
            {filteredRecords.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-gray-400">
                <FileText className="mb-4 h-12 w-12 opacity-50" />
                <p className="text-lg">No records found</p>
                <p className="mt-2 text-sm">Try adjusting your filters or adding new data</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {filteredRecords.map(record => {
                  const isSelected = selectedRecordIds.includes(record.id);
                  const category = record.category ? getCategoryById(record.category) : null;

                  return (
                    <div
                      key={record.id}
                      className={`p-3 transition-colors ${
                        isSelected ? 'bg-blue-900/20' : 'hover:bg-gray-800'
                      }`}
                      onClick={e => {
                        // Don't trigger selection when clicking star button
                        if ((e.target as HTMLElement).closest('.star-button')) return;
                        handleRecordSelect(record.id, e.ctrlKey || e.metaKey);
                      }}
                    >
                      <div className="flex items-start">
                        <div className="mr-3 flex h-5 items-center">
                          <div className={`${getRecordTypeColor(record.type)}`}>
                            {getRecordIcon(record.type)}
                          </div>
                        </div>

                        <div className="min-w-0 flex-grow">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-sm font-medium text-white">{record.name}</h3>
                              <p className="mt-0.5 text-xs text-gray-400">
                                {formatDate(record.date)}
                                {category && (
                                  <span
                                    className="ml-2 rounded px-1.5 py-0.5 text-xs"
                                    style={{
                                      backgroundColor: `${category.color}30`,
                                      color: category.color,
                                    }}
                                  >
                                    {category.name}
                                  </span>
                                )}
                              </p>
                            </div>

                            <button
                              className="star-button p-1 text-gray-400 hover:text-yellow-400"
                              onClick={() => handleToggleStar(record.id)}
                            >
                              {record.starred ? (
                                <Star size={16} className="fill-yellow-400 text-yellow-400" />
                              ) : (
                                <Star size={16} />
                              )}
                            </button>
                          </div>

                          {record.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {record.tags.map(tag => (
                                <span
                                  key={tag}
                                  className="flex items-center rounded bg-gray-700 px-1.5 py-0.5 text-xs text-gray-300"
                                >
                                  <Tag size={10} className="mr-1" />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {record.notes && (
                            <p className="mt-2 line-clamp-2 text-xs text-gray-400">
                              {record.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
