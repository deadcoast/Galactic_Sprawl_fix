/**
 * Filter Transformation Utilities
 * 
 * This module provides utilities for filtering and transforming data
 * for use in filter panels, search components, and data tables.
 */

import { 
  isArray, 
  isNumber, 
  isObject, 
  isString, 
  safelyExtractPath 
} from './chartTransforms';

//=============================================================================
// Filter Types
//=============================================================================

/**
 * Supported filter operators
 */
export type FilterOperator =
  | 'equals'
  | 'notEquals'
  | 'greaterThan'
  | 'lessThan'
  | 'contains'
  | 'notContains'
  | 'between'
  | 'in'
  | 'notIn'
  | 'exists'
  | 'notExists';

/**
 * Filter definition
 */
export interface Filter {
  field: string;
  operator: FilterOperator;
  value: string | number | boolean | string[] | [number, number];
}

/**
 * Filter Group (for complex filtering with AND/OR logic)
 */
export interface FilterGroup {
  type: 'and' | 'or';
  filters: Array<Filter | FilterGroup>;
}

//=============================================================================
// Filter Creation and Validation
//=============================================================================

/**
 * Creates a filter with type checking and validation
 * @param field Field name to filter on
 * @param operator Filter operator
 * @param value Filter value
 */
export function createFilter(
  field: string,
  operator: FilterOperator,
  value: unknown
): Filter | null {
  // Validate field
  if (!field || typeof field !== 'string') {
    return null;
  }
  
  // Validate and convert value based on operator
  let validatedValue: string | number | boolean | string[] | [number, number];
  
  switch (operator) {
    case 'equals':
    case 'notEquals':
      // Accept string, number, or boolean
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        validatedValue = value;
      } else {
        return null;
      }
      break;
      
    case 'greaterThan':
    case 'lessThan':
      // Only accept numbers
      if (typeof value === 'number') {
        validatedValue = value;
      } else if (typeof value === 'string') {
        const num = parseFloat(value);
        if (isNaN(num)) {
          return null;
        }
        validatedValue = num;
      } else {
        return null;
      }
      break;
      
    case 'contains':
    case 'notContains':
      // Only accept strings
      if (typeof value === 'string') {
        validatedValue = value;
      } else {
        return null;
      }
      break;
      
    case 'between':
      // Accept numeric range
      if (Array.isArray(value) && value.length === 2 &&
          typeof value[0] === 'number' && typeof value[1] === 'number') {
        validatedValue = value as [number, number];
      } else if (typeof value === 'string' && value.includes(',')) {
        // Try to parse as "min,max" string
        const [minStr, maxStr] = value.split(',');
        const min = parseFloat(minStr.trim());
        const max = parseFloat(maxStr.trim());
        if (isNaN(min) || isNaN(max)) {
          return null;
        }
        validatedValue = [min, max];
      } else {
        return null;
      }
      break;
      
    case 'in':
    case 'notIn':
      // Accept array or convert comma-separated string
      if (Array.isArray(value)) {
        validatedValue = value.map(v => String(v));
      } else if (typeof value === 'string') {
        validatedValue = value.split(',').map(v => v.trim());
      } else {
        return null;
      }
      break;
      
    case 'exists':
    case 'notExists':
      // These operators don't use values
      validatedValue = true;
      break;
      
    default:
      return null;
  }
  
  return {
    field,
    operator,
    value: validatedValue,
  };
}

/**
 * Validates a filter object
 * @param filter Filter to validate
 */
export function validateFilter(filter: unknown): filter is Filter {
  if (!isObject(filter)) {
    return false;
  }
  
  const { field, operator, value } = filter as Record<string, unknown>;
  
  if (!isString(field) || !isString(operator)) {
    return false;
  }
  
  const validOperators: string[] = [
    'equals', 'notEquals', 'greaterThan', 'lessThan',
    'contains', 'notContains', 'between', 'in', 'notIn',
    'exists', 'notExists',
  ];
  
  if (!validOperators.includes(operator)) {
    return false;
  }
  
  // Check if value is valid based on operator
  switch (operator) {
    case 'equals':
    case 'notEquals':
      return value !== undefined;
      
    case 'greaterThan':
    case 'lessThan':
      return isNumber(value);
      
    case 'contains':
    case 'notContains':
      return isString(value);
      
    case 'between':
      return Array.isArray(value) && value.length === 2 &&
             isNumber(value[0]) && isNumber(value[1]);
      
    case 'in':
    case 'notIn':
      return Array.isArray(value) && value.every(isString);
      
    case 'exists':
    case 'notExists':
      return true; // value not needed
      
    default:
      return false;
  }
}

/**
 * Converts a filter value from string input based on operator
 * @param value String value from input
 * @param operator Filter operator
 */
export function convertFilterValue(
  value: string,
  operator: FilterOperator
): string | number | boolean | string[] | [number, number] {
  switch (operator) {
    case 'greaterThan':
    const num = parseFloat(value);
      return isNaN(num) ? value : num;
      
    case 'equals':
    case 'notEquals':
      // Try to convert to number first
      const numVal = parseFloat(value);
      if (!isNaN(numVal) && numVal.toString() === value) {
        return numVal;
      }
      // Try to convert to boolean
      if (value === 'true') return true;
      if (value === 'false') return false;
      // Otherwise, keep as string
      return value;
      
    case 'between':
      if (value.includes(',')) {
        const [minStr, maxStr] = value.split(',');
        const min = parseFloat(minStr.trim());
        const max = parseFloat(maxStr.trim());
        if (!isNaN(min) && !isNaN(max)) {
          return [min, max] as [number, number];
        }
      }
      return value;
      
    case 'in':
    case 'notIn':
      return value.split(',').map(v => v.trim());
      
    default:
      return value;
  }
}

//=============================================================================
// Filter Formatting
//=============================================================================

/**
 * Formats a filter value for display
 * @param value Filter value
 */
export function formatFilterValue(
  value: string | number | boolean | string[] | [number, number]
): string {
  if (Array.isArray(value)) {
    // Format range as "min to max"
    if (value.length === 2 && isNumber(value[0]) && isNumber(value[1])) {
      return `${value[0]} to ${value[1]}`;
    }
    // Format array as comma-separated list
    return value.join(', ');
  }
  
  return String(value);
}

/**
 * Formats a filter for display
 * @param filter Filter to format
 */
export function formatFilter(filter: Filter): string {
  const operatorLabels: Record<FilterOperator, string> = {
    equals: '=',
    notEquals: '≠',
    greaterThan: '>',
    lessThan: '<',
    contains: 'contains',
    notContains: 'not contains',
    between: 'between',
    in: 'in',
    notIn: 'not in',
    exists: 'exists',
    notExists: 'not exists',
  };
  
  const operator = operatorLabels[filter.operator] || filter.operator;
  
  // Special case for exists/notExists which don't use values
  if (filter.operator === 'exists' || filter.operator === 'notExists') {
    return `${filter.field} ${operator}`;
  }
  
  return `${filter.field} ${operator} ${formatFilterValue(filter.value)}`;
}

/**
 * Gets appropriate input type based on filter operator
 * @param operator Filter operator
 */
export function getInputTypeForOperator(operator: FilterOperator): 'text' | 'number' | 'range' | 'select' | 'none' {
  switch (operator) {
    case 'greaterThan':
    case 'lessThan':
      return 'number';
      
    case 'between':
      return 'range';
      
    case 'in':
    case 'notIn':
      return 'select';
      
    case 'exists':
    case 'notExists':
      return 'none';
      
    default:
      return 'text';
  }
}

//=============================================================================
// Filtering Logic
//=============================================================================

/**
 * Applies a filter to a single data item
 * @param item Data item to filter
 * @param filter Filter to apply
 */
export function applyFilter(
  item: Record<string, unknown>,
  filter: Filter
): boolean {
  const { field, operator, value } = filter;
  
  // Extract field value, supporting dot notation for nested properties
  const fieldValue = safelyExtractPath(item, field, null);
  
  // Skip invalid values (except for exists/notExists operators)
  if (fieldValue === null || fieldValue === undefined) {
    return operator === 'notExists';
  }
  
  // Apply appropriate comparison based on operator
  switch (operator) {
    case 'equals':
      return fieldValue === value;
    
    case 'notEquals':
      return fieldValue !== value;
    
    case 'greaterThan':
      return isNumber(fieldValue) && isNumber(value) && fieldValue > value;
    
    case 'lessThan':
      return isNumber(fieldValue) && isNumber(value) && fieldValue < value;
    
    case 'contains':
      return isString(fieldValue) && isString(value) && 
        fieldValue.toLowerCase().includes(value.toLowerCase());
    
    case 'notContains':
      return isString(fieldValue) && isString(value) && 
        !fieldValue.toLowerCase().includes(value.toLowerCase());
    
    case 'between':
      return isNumber(fieldValue) && Array.isArray(value) && 
        fieldValue >= value[0] && fieldValue <= value[1];
    
    case 'in':
      return isArray<string>(value) && 
        value.includes(String(fieldValue));
    
    case 'notIn':
      return isArray<string>(value) && 
        !value.includes(String(fieldValue));
    
    case 'exists':
      return true; // We already checked existence above
    
    case 'notExists':
      return false; // We already checked non-existence above
    
    default:
      return true;
  }
}

/**
 * Applies a filter group to a data item
 * @param item Data item to filter
 * @param filterGroup Filter group to apply
 */
export function applyFilterGroup(
  item: Record<string, unknown>,
  filterGroup: FilterGroup
): boolean {
  const { type, filters } = filterGroup;
  
  if (filters.length === 0) {
    return true;
  }
  
  // Apply filters based on group type (AND/OR)
  if (type === 'and') {
    return filters.every(filter => {
      if ('field' in filter) {
        return applyFilter(item, filter);
      } else {
        return applyFilterGroup(item, filter);
      }
    });
  } else {
    return filters.some(filter => {
      if ('field' in filter) {
        return applyFilter(item, filter);
      } else {
        return applyFilterGroup(item, filter);
      }
    });
  }
}

/**
 * Applies filters to a dataset
 * @param data Array of data objects
 * @param filters Array of filter objects
 */
export function applyFilters(
  data: Array<Record<string, unknown>>,
  filters: Array<Filter>
): Array<Record<string, unknown>> {
  if (!filters || filters.length === 0) {
    return data;
  }
  
  // Create an implicit AND filter group
  const filterGroup: FilterGroup = {
    type: 'and',
    filters,
  };
  
  return data?.filter(item => applyFilterGroup(item, filterGroup));
}

/**
 * Applies complex filter with support for AND/OR logic
 * @param data Array of data objects
 * @param filterGroup Filter group to apply
 */
export function applyComplexFilter(
  data: Array<Record<string, unknown>>,
  filterGroup: FilterGroup
): Array<Record<string, unknown>> {
  if (!filterGroup || !filterGroup.filters || filterGroup.filters.length === 0) {
    return data;
  }
  
  return data?.filter(item => applyFilterGroup(item, filterGroup));
}

//=============================================================================
// Field Analysis
//=============================================================================

/**
 * Detects field types from a dataset
 * @param data Array of data objects
 * @param sampleSize Number of items to sample (for performance with large datasets)
 */
export function detectFieldTypes(
  data: Array<Record<string, unknown>>,
  sampleSize: number = 100
): Record<string, 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' | 'mixed'> {
  if (!data || data?.length === 0) {
    return {};
  }
  
  // Sample the data for performance
  const sampleData = data?.length <= sampleSize 
    ? data 
    : data?.slice(0, sampleSize);
  
  // Get all field names from first few records
  const fieldNames = new Set<string>();
  sampleData.slice(0, 10).forEach(item => {
    Object.keys(item).forEach(key => fieldNames.add(key));
  });
  
  // Detect types for each field
  const fieldTypes: Record<string, 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' | 'mixed'> = {};
  
  fieldNames.forEach(field => {
    const values = sampleData
      .map(item => item[field])
      .filter(val => val !== undefined && val !== null);
    
    // Skip empty fields
    if (values.length === 0) {
      fieldTypes[field] = 'mixed';
      return;
    }
    
    // Count occurrences of each type
    const typeCounts: Record<string, number> = {
      string: 0,
      number: 0,
      boolean: 0,
      date: 0,
      array: 0,
      object: 0,
    };
    
    values.forEach(value => {
      if (typeof value === 'string') {
        // Check if string is a date
        if (!isNaN(Date.parse(value)) && /^[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(value)) {
          typeCounts.date++;
        } else {
          typeCounts.string++;
        }
      } else if (typeof value === 'number') {
        typeCounts.number++;
      } else if (typeof value === 'boolean') {
        typeCounts.boolean++;
      } else if (Array.isArray(value)) {
        typeCounts.array++;
      } else if (typeof value === 'object' && value !== null) {
        typeCounts.object++;
      }
    });
    
    // Find dominant type (more than 80% of values)
    const totalValues = Object.values(typeCounts).reduce((sum, count) => sum + count, 0);
    const dominantType = Object.entries(typeCounts)
      .filter(([_, count]) => count / totalValues > 0.8)
      .map(([type]) => type)[0];
    
    fieldTypes[field] = (dominantType as 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object') || 'mixed';
  });
  
  return fieldTypes;
}

/**
 * Gets unique values for a field
 * @param data Array of data objects
 * @param field Field name
 * @param limit Maximum number of unique values to return
 */
export function getUniqueValues(
  data: Array<Record<string, unknown>>,
  field: string,
  limit: number = 100
): Array<string | number | boolean> {
  if (!data || data?.length === 0 || !field) {
    return [];
  }
  
  // Extract values and convert to strings for comparison
  const valueSet = new Set<string>();
  
  for (const item of data) {
    const value = safelyExtractPath(item, field, null);
    if (value === null || value === undefined) {
      continue;
    }
    
    // Convert to string/number/boolean for storage
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      valueSet.add(String(value));
    } else if (Array.isArray(value)) {
      valueSet.add(`Array(${value.length})`);
    } else if (typeof value === 'object' && value !== null) {
      valueSet.add('Object');
    }
    
    // Stop if we reach the limit
    if (valueSet.size >= limit) {
      break;
    }
  }
  
  // Convert back to original types when possible
  return Array.from(valueSet).map(value => {
    // Try parsing as number
    const num = parseFloat(value);
    if (!isNaN(num) && num.toString() === value) {
      return num;
    }
    
    // Handle booleans
    if (value === 'true') return true;
    if (value === 'false') return false;
    
    // Keep as string
    return value;
  });
}

/**
 * Gets the range (min/max) for a numeric field
 * @param data Array of data objects
 * @param field Field name
 */
export function getFieldRange(
  data: Array<Record<string, unknown>>,
  field: string
): [number, number] | null {
  if (!data || data?.length === 0 || !field) {
    return null;
  }
  
  // Extract numeric values
  const numericValues: number[] = [];
  
  for (const item of data) {
    const value = safelyExtractPath(item, field, null);
    if (isNumber(value)) {
      numericValues.push(value);
    }
  }
  
  // Return null if no numeric values found
  if (numericValues.length === 0) {
    return null;
  }
  
  // Calculate min and max
  const min = Math.min(...numericValues);
  const max = Math.max(...numericValues);
  
  return [min, max];
}