import {
    Database,
    Folder,
    Star
} from 'lucide-react';
import * as React from 'react';
import { useCallback, useState } from 'react';
import { moduleEventBus } from '../../lib/events/ModuleEventBus';
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

}
