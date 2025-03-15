/**
 * BaseDataTable Component
 * 
 * A unified base component for tabular data visualization in the exploration system.
 * This component provides core table functionality including:
 * - Virtualized rendering for performance with large datasets
 * - Sorting by columns
 * - Filtering data
 * - Selectable rows
 * - Customizable cell rendering
 */

import * as React from "react";
import { useState, useCallback, useMemo } from 'react';
import { cn } from '../../../../utils/cn';

// Column definition
export interface DataColumn<T> {
  id: string;
  header: string;
  accessor: (item: T) => React.ReactNode;
  sortable?: boolean;
  sortFn?: (a: T, b: T) => number;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

// Sort direction
export type SortDirection = 'asc' | 'desc';

// Filter function
export type FilterFn<T> = (item: T) => boolean;

// Row selection handler
export type RowSelectionHandler<T> = (item: T, index: number, selected: boolean) => void;

// BaseDataTable Props
export interface BaseDataTableProps<T> {
  /** Data items to display */
  data: T[];
  
  /** Unique key for each data item */
  rowKey: keyof T | ((item: T) => string);
  
  /** Column definitions */
  columns: DataColumn<T>[];
  
  /** Initial sort column */
  initialSortColumn?: string;
  
  /** Initial sort direction */
  initialSortDirection?: SortDirection;
  
  /** Whether to enable virtualization */
  virtualized?: boolean;
  
  /** Height of the virtualized container */
  height?: number;
  
  /** Row height for virtualization calculations */
  rowHeight?: number;
  
  /** Filter function for data */
  filter?: FilterFn<T>;
  
  /** Selected item keys */
  selectedKeys?: Array<string | number>;
  
  /** Called when a row is selected */
  onRowSelect?: RowSelectionHandler<T>;
  
  /** Called when a row is clicked */
  onRowClick?: (item: T, index: number) => void;
  
  /** Called when a row is double-clicked */
  onRowDoubleClick?: (item: T, index: number) => void;
  
  /** Custom class name */
  className?: string;
  
  /** Custom empty state message */
  emptyMessage?: string;
  
  /** Whether to show the header */
  showHeader?: boolean;
  
  /** Custom loading state */
  loading?: boolean;
  
  /** Custom loading message */
  loadingMessage?: string;
  
  /** Called when sort changes */
  onSortChange?: (columnId: string, direction: SortDirection) => void;
}

/**
 * BaseDataTable Component
 */
export function BaseDataTable<T>({
  data,
  rowKey,
  columns,
  initialSortColumn,
  initialSortDirection = 'asc',
  virtualized = false,
  height = 400,
  rowHeight = 40,
  filter,
  selectedKeys = [],
  onRowSelect,
  onRowClick,
  onRowDoubleClick,
  className,
  emptyMessage = 'No data available',
  showHeader = true,
  loading = false,
  loadingMessage = 'Loading data...',
  onSortChange
}: BaseDataTableProps<T>) {
  // State
  const [sortColumn, setSortColumn] = useState<string | undefined>(initialSortColumn);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortDirection);
  const [scrollTop, setScrollTop] = useState(0);
  
  // Get key for a row
  const getRowKey = useCallback((item: T): string => {
    if (typeof rowKey === 'function') {
      return rowKey(item);
    }
    
    return String(item[rowKey]);
  }, [rowKey]);
  
  // Check if a row is selected
  const isRowSelected = useCallback((item: T): boolean => {
    const key = getRowKey(item);
    return selectedKeys.includes(key);
  }, [getRowKey, selectedKeys]);
  
  // Filter data
  const filteredData = useMemo(() => {
    if (!filter) return data;
    return data.filter(filter);
  }, [data, filter]);
  
  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    
    const column = columns.find(col => col.id === sortColumn);
    if (!column || !column.sortable) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const result = column.sortFn 
        ? column.sortFn(a, b) 
        : compareValues(column.accessor(a), column.accessor(b));
      
      return sortDirection === 'asc' ? result : -result;
    });
  }, [filteredData, sortColumn, sortDirection, columns]);
  
  // Handle sort change
  const handleSortChange = useCallback((columnId: string) => {
    const column = columns.find(col => col.id === columnId);
    if (!column || !column.sortable) return;
    
    setSortColumn(columnId);
    setSortDirection(prev => {
      const newDirection = columnId === sortColumn
        ? (prev === 'asc' ? 'desc' : 'asc')
        : 'asc';
      
      if (onSortChange) {
        onSortChange(columnId, newDirection);
      }
      
      return newDirection;
    });
  }, [columns, sortColumn, onSortChange]);
  
  // Handle row selection
  const handleRowSelect = useCallback((item: T, index: number, selected: boolean) => {
    if (onRowSelect) {
      onRowSelect(item, index, selected);
    }
  }, [onRowSelect]);
  
  // Handle row click
  const handleRowClick = useCallback((item: T, index: number) => {
    if (onRowClick) {
      onRowClick(item, index);
    }
  }, [onRowClick]);
  
  // Handle row double click
  const handleRowDoubleClick = useCallback((item: T, index: number) => {
    if (onRowDoubleClick) {
      onRowDoubleClick(item, index);
    }
  }, [onRowDoubleClick]);
  
  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);
  
  // Calculate virtual rendering indices
  const virtualIndices = useMemo(() => {
    if (!virtualized) return { startIndex: 0, endIndex: sortedData.length - 1 };
    
    const startIndex = Math.floor(scrollTop / rowHeight);
    const visibleRows = Math.ceil(height / rowHeight);
    const endIndex = Math.min(startIndex + visibleRows + 3, sortedData.length - 1);
    
    return { startIndex, endIndex };
  }, [virtualized, scrollTop, rowHeight, height, sortedData.length]);
  
  // Render rows
  const renderRows = () => {
    if (loading) {
      return (
        <tr>
          <td 
            colSpan={columns.length} 
            className="p-4 text-center text-gray-500"
          >
            {loadingMessage}
          </td>
        </tr>
      );
    }
    
    if (sortedData.length === 0) {
      return (
        <tr>
          <td 
            colSpan={columns.length} 
            className="p-4 text-center text-gray-500"
          >
            {emptyMessage}
          </td>
        </tr>
      );
    }
    
    const { startIndex, endIndex } = virtualIndices;
    const visibleData = virtualized
      ? sortedData.slice(startIndex, endIndex + 1)
      : sortedData;
      
    return visibleData.map((item, visibleIndex) => {
      const index = virtualized ? startIndex + visibleIndex : visibleIndex;
      const key = getRowKey(item);
      const selected = isRowSelected(item);
      
      return (
        <tr 
          key={key}
          className={cn(
            "border-b border-gray-200 transition-colors",
            selected ? "bg-blue-50" : "hover:bg-gray-50",
            onRowClick && "cursor-pointer"
          )}
          onClick={() => handleRowClick(item, index)}
          onDoubleClick={() => handleRowDoubleClick(item, index)}
        >
          {onRowSelect && (
            <td className="py-2 px-3">
              <input 
                type="checkbox" 
                checked={selected}
                onChange={(e) => handleRowSelect(item, index, e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                className="form-checkbox h-5 w-5 text-blue-600"
              />
            </td>
          )}
          
          {columns.map(column => (
            <td 
              key={column.id}
              className={cn(
                "py-2 px-3",
                column.align === 'center' && "text-center",
                column.align === 'right' && "text-right",
                column.className
              )}
              style={{ width: column.width }}
            >
              {column.accessor(item)}
            </td>
          ))}
        </tr>
      );
    });
  };
  
  // Virtualized container style
  const virtualContainerStyle = useMemo(() => {
    if (!virtualized) return {};
    
    return {
      height: `${height}px`,
      overflowY: 'auto' as const,
    };
  }, [virtualized, height]);
  
  // Virtualized content style
  const virtualContentStyle = useMemo(() => {
    if (!virtualized) return {};
    
    return {
      height: `${sortedData.length * rowHeight}px`,
      position: 'relative' as const,
    };
  }, [virtualized, sortedData.length, rowHeight]);
  
  // Virtualized rows style
  const virtualRowsStyle = useMemo(() => {
    if (!virtualized) return {};
    
    const { startIndex } = virtualIndices;
    
    return {
      transform: `translateY(${startIndex * rowHeight}px)`,
      position: 'absolute' as const,
      width: '100%',
    };
  }, [virtualized, virtualIndices, rowHeight]);
  
  return (
    <div className={cn("bg-white rounded-md overflow-hidden", className)}>
      <div
        style={virtualContainerStyle}
        onScroll={virtualized ? handleScroll : undefined}
      >
        <div style={virtualContentStyle}>
          <table className="min-w-full divide-y divide-gray-200" style={virtualRowsStyle}>
            {showHeader && (
              <thead className="bg-gray-50">
                <tr>
                  {onRowSelect && (
                    <th className="py-3 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                      {/* Checkbox header, if needed */}
                    </th>
                  )}
                  
                  {columns.map(column => (
                    <th 
                      key={column.id}
                      className={cn(
                        "py-3 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider",
                        column.sortable && "cursor-pointer hover:bg-gray-100",
                        column.align === 'center' && "text-center",
                        column.align === 'right' && "text-right",
                        column.className
                      )}
                      style={{ width: column.width }}
                      onClick={() => column.sortable && handleSortChange(column.id)}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{column.header}</span>
                        {column.sortable && sortColumn === column.id && (
                          <span className="inline-block">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            
            <tbody className="bg-white divide-y divide-gray-200">
              {renderRows()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Helper function to compare values for sorting
function compareValues(a: React.ReactNode, b: React.ReactNode): number {
  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b);
  }
  
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }
  
  // Convert to string for other types
  return String(a).localeCompare(String(b));
}

export default BaseDataTable;