import AddIcon from '@mui/icons-material/Add';
import {
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';

type FilterOperator =
  | 'equals'
  | 'notEquals'
  | 'greaterThan'
  | 'lessThan'
  | 'contains'
  | 'notContains'
  | 'between';

interface Filter {
  field: string;
  operator: FilterOperator;
  value: string | number | boolean | string[] | [number, number];
}

interface DataFilterPanelProps {
  datasetId: string;
  filters: Filter[];
  onFilterChange: (filters: Filter[]) => void;
}

const DataFilterPanel: React.FC<DataFilterPanelProps> = ({
  datasetId,
  filters,
  onFilterChange,
}) => {
  const [newField, setNewField] = useState<string>('');
  const [newOperator, setNewOperator] = useState<FilterOperator>('equals');
  const [newValue, setNewValue] = useState<string>('');
  const [newValueMin, setNewValueMin] = useState<string>('');
  const [newValueMax, setNewValueMax] = useState<string>('');

  const handleAddFilter = () => {
    if (!newField) return;

    let value: string | number | boolean | string[] | [number, number];

    // Process the value based on the operator
    if (newOperator === 'between') {
      const min = parseFloat(newValueMin);
      const max = parseFloat(newValueMax);
      if (isNaN(min) || isNaN(max)) return;
      value = [min, max];
    } else if (['greaterThan', 'lessThan'].includes(newOperator)) {
      const num = parseFloat(newValue);
      if (isNaN(num)) return;
      value = num;
    } else if (newOperator === 'equals' && (newValue === 'true' || newValue === 'false')) {
      value = newValue === 'true';
    } else {
      value = newValue;
    }

    const newFilter: Filter = {
      field: newField,
      operator: newOperator,
      value,
    };

    onFilterChange([...filters, newFilter]);

    // Reset form
    setNewField('');
    setNewOperator('equals');
    setNewValue('');
    setNewValueMin('');
    setNewValueMax('');
  };

  const handleRemoveFilter = (index: number) => {
    const updatedFilters = [...filters];
    updatedFilters.splice(index, 1);
    onFilterChange(updatedFilters);
  };

  // Helper to render the value input based on the operator
  const renderValueInput = () => {
    if (newOperator === 'between') {
      return (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            size="small"
            label="Min"
            type="number"
            value={newValueMin}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewValueMin(e.target.value)}
            sx={{ flex: 1 }}
          />
          <Typography variant="body2">to</Typography>
          <TextField
            size="small"
            label="Max"
            type="number"
            value={newValueMax}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewValueMax(e.target.value)}
            sx={{ flex: 1 }}
          />
        </Box>
      );
    }

    // For numeric operators, use number input
    const isNumeric = ['greaterThan', 'lessThan'].includes(newOperator);

    return (
      <TextField
        fullWidth
        size="small"
        label="Value"
        type={isNumeric ? 'number' : 'text'}
        value={newValue}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewValue(e.target.value)}
      />
    );
  };

  // Helper to format filter for display
  const formatFilterValue = (filter: Filter): string => {
    if (filter.operator === 'between' && Array.isArray(filter.value)) {
      return `${filter.value[0]} to ${filter.value[1]}`;
    }
    return String(filter.value);
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Filters
      </Typography>

      {/* Current filters */}
      <Box sx={{ mb: 2 }}>
        {filters.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No filters applied. Add filters to refine the dataset.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {filters.map((filter, index) => (
              <Chip
                key={index}
                label={`${filter.field} ${filter.operator} ${formatFilterValue(filter)}`}
                onDelete={() => handleRemoveFilter(index)}
                variant="outlined"
                color="primary"
              />
            ))}
          </Box>
        )}
      </Box>

      {/* Add filter form */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          fullWidth
          size="small"
          label="Field"
          value={newField}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewField(e.target.value)}
          placeholder="e.g. properties.resourcePotential"
        />

        <FormControl fullWidth size="small">
          <InputLabel>Operator</InputLabel>
          <Select
            value={newOperator}
            label="Operator"
            onChange={e => setNewOperator(e.target.value as FilterOperator)}
          >
            <MenuItem value="equals">equals</MenuItem>
            <MenuItem value="notEquals">not equals</MenuItem>
            <MenuItem value="greaterThan">greater than</MenuItem>
            <MenuItem value="lessThan">less than</MenuItem>
            <MenuItem value="contains">contains</MenuItem>
            <MenuItem value="notContains">not contains</MenuItem>
            <MenuItem value="between">between</MenuItem>
          </Select>
        </FormControl>

        {renderValueInput()}

        <Button
          variant="outlined"
          onClick={handleAddFilter}
          startIcon={<AddIcon />}
          disabled={
            !newField ||
            (!newValue && newOperator !== 'between') ||
            (newOperator === 'between' && (!newValueMin || !newValueMax))
          }
        >
          Add Filter
        </Button>
      </Box>
    </Box>
  );
};

export default DataFilterPanel;
