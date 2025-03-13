import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material';
import React, { useCallback, useMemo, useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';
import { ChartDataRecord } from '../../../types/exploration/AnalysisComponentTypes';

// Sorting directions
type Order = 'asc' | 'desc';

interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  format?: (value: unknown) => string;
}

interface VirtualizedDataTableProps {
  /**
   * Data records to display in the table
   */
  data: ChartDataRecord[];

  /**
   * Column definitions
   */
  columns: Column[];

  /**
   * Height of the table
   * @default 400
   */
  height?: number | string;

  /**
   * Maximum height before scrolling
   * @default 650
   */
  maxHeight?: number;

  /**
   * Height of each row
   * @default 53
   */
  rowHeight?: number;

  /**
   * Whether to show the header row
   * @default true
   */
  showHeader?: boolean;

  /**
   * Title to display above the table
   */
  title?: string;

  /**
   * Callback when a row is clicked
   */
  onRowClick?: (row: ChartDataRecord) => void;

  /**
   * Whether to show alternating row colors
   * @default true
   */
  zebraStripes?: boolean;

  /**
   * Whether to enable sorting
   * @default true
   */
  enableSorting?: boolean;

  /**
   * CSS class name
   */
  className?: string;

  /**
   * Default column to sort by
   */
  defaultSortColumn?: string;

  /**
   * Default sort direction
   * @default 'asc'
   */
  defaultSortDirection?: Order;
}

/**
 * A virtualized data table component that efficiently renders large datasets
 * using react-window for virtualization. Supports sorting, column formatting,
 * and custom row rendering.
 */
export const VirtualizedDataTable = React.memo(
  ({
    data,
    columns,
    height = 400,
    maxHeight = 650,
    rowHeight = 53,
    showHeader = true,
    title,
    onRowClick,
    zebraStripes = true,
    enableSorting = true,
    className = '',
    defaultSortColumn,
    defaultSortDirection = 'asc',
  }: VirtualizedDataTableProps) => {
    // State for sorting
    const [orderBy, setOrderBy] = useState<string | undefined>(defaultSortColumn);
    const [order, setOrder] = useState<Order>(defaultSortDirection);

    // Memoized sorted data
    const sortedData = useMemo(() => {
      if (!orderBy || !enableSorting) return data;

      return [...data].sort((a, b) => {
        const aValue = a[orderBy];
        const bValue = b[orderBy];

        // Handle undefined or null values
        if (aValue == null) return order === 'asc' ? -1 : 1;
        if (bValue == null) return order === 'asc' ? 1 : -1;

        // Compare values based on their types
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return order === 'asc' ? aValue - bValue : bValue - aValue;
        }

        // Convert to strings for string comparison
        const aString = String(aValue);
        const bString = String(bValue);

        return order === 'asc' ? aString.localeCompare(bString) : bString.localeCompare(aString);
      });
    }, [data, orderBy, order, enableSorting]);

    // Handle column header click for sorting
    const handleRequestSort = useCallback(
      (property: string) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
      },
      [order, orderBy]
    );

    // Render header row with sort labels
    const renderHeader = useCallback(
      () => (
        <TableHead>
          <TableRow>
            {columns.map(column => (
              <TableCell
                key={column.id}
                align={column.align || 'left'}
                style={{ minWidth: column.minWidth || 100, fontWeight: 'bold' }}
                sortDirection={orderBy === column.id ? order : false}
              >
                {enableSorting ? (
                  <TableSortLabel
                    active={orderBy === column.id}
                    direction={orderBy === column.id ? order : 'asc'}
                    onClick={() => handleRequestSort(column.id)}
                  >
                    {column.label}
                  </TableSortLabel>
                ) : (
                  column.label
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
      ),
      [columns, enableSorting, handleRequestSort, order, orderBy]
    );

    // Row renderer for react-window
    const RowRenderer = useCallback(
      ({ index, style }: { index: number; style: React.CSSProperties }) => {
        const row = sortedData[index];

        return (
          <TableRow
            hover
            tabIndex={-1}
            key={index}
            onClick={() => onRowClick && onRowClick(row)}
            style={{
              ...style,
              cursor: onRowClick ? 'pointer' : 'default',
              backgroundColor: zebraStripes && index % 2 ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
            }}
          >
            {columns.map(column => {
              const value = row[column.id];
              return (
                <TableCell key={column.id} align={column.align || 'left'}>
                  {column.format && value !== undefined && value !== null
                    ? column.format(value)
                    : renderCellValue(value)}
                </TableCell>
              );
            })}
          </TableRow>
        );
      },
      [columns, onRowClick, sortedData, zebraStripes]
    );

    // Helper function to render cell values of different types
    const renderCellValue = useCallback((value: unknown): React.ReactNode => {
      if (value === null || value === undefined) {
        return <span className="text-gray-400">—</span>;
      }

      if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
      }

      if (typeof value === 'object') {
        if (Array.isArray(value)) {
          if (value.length === 0) return <span className="text-gray-400">Empty array</span>;
          return value.map(v => String(v)).join(', ');
        }
        return JSON.stringify(value);
      }

      // For numbers, format with comma separators for thousands
      if (typeof value === 'number') {
        // Check if it's a float with decimal places
        if (value % 1 !== 0) {
          return value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        }
        return value.toLocaleString();
      }

      return String(value);
    }, []);

    // Handle empty data case
    if (!data.length) {
      // Use style prop instead of sx to avoid complex union type
      return (
        <Paper sx={{ width: '100%', overflow: 'hidden' }} className={className}>
          {title && (
            <Typography variant="h6" sx={{ p: 2 }}>
              {title}
            </Typography>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: 200,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No data to display
            </Typography>
          </div>
        </Paper>
      );
    }

    return (
      <Paper sx={{ width: '100%', overflow: 'hidden' }} className={className}>
        {title && (
          <Typography variant="h6" sx={{ p: 2 }}>
            {title}
          </Typography>
        )}

        <TableContainer sx={{ maxHeight: maxHeight }}>
          <Table stickyHeader aria-label="virtualized table">
            {showHeader && renderHeader()}

            <TableBody>
              <AutoSizer disableHeight>
                {({ width }) => (
                  <FixedSizeList
                    height={typeof height === 'number' ? height : 400}
                    width={width}
                    itemCount={sortedData.length}
                    itemSize={rowHeight}
                    overscanCount={5}
                  >
                    {RowRenderer}
                  </FixedSizeList>
                )}
              </AutoSizer>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  },
  // Custom equality function for React.memo to prevent unnecessary re-renders
  (prevProps, nextProps) => {
    // If data references have changed but data content is the same, don't re-render
    if (prevProps.data !== nextProps.data) {
      // Only compare length for basic check (could be enhanced for deeper equality)
      if (prevProps.data.length !== nextProps.data.length) {
        return false; // Re-render if lengths are different
      }

      // Perform a simple comparison of the first item for quick check
      if (
        prevProps.data.length > 0 &&
        JSON.stringify(prevProps.data[0]) !== JSON.stringify(nextProps.data[0])
      ) {
        return false; // Re-render if first items are different
      }
    }

    // For columns, title, and other props, a simple shallow comparison is enough
    if (prevProps.columns !== nextProps.columns) return false;
    if (prevProps.title !== nextProps.title) return false;
    if (prevProps.height !== nextProps.height) return false;
    if (prevProps.maxHeight !== nextProps.maxHeight) return false;
    if (prevProps.rowHeight !== nextProps.rowHeight) return false;
    if (prevProps.showHeader !== nextProps.showHeader) return false;
    if (prevProps.zebraStripes !== nextProps.zebraStripes) return false;
    if (prevProps.enableSorting !== nextProps.enableSorting) return false;
    if (prevProps.className !== nextProps.className) return false;
    if (prevProps.defaultSortColumn !== nextProps.defaultSortColumn) return false;
    if (prevProps.defaultSortDirection !== nextProps.defaultSortDirection) return false;

    // If click handlers have changed references, we should re-render
    if (prevProps.onRowClick !== nextProps.onRowClick) return false;

    // If we get here, props are considered equal
    return true;
  }
);
