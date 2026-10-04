import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import Settings from '@mui/icons-material/Settings';
import
  {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    InputLabel,
    List,
    ListItem,
    ListItemText,
    MenuItem,
    Select,
    TextField,
    Typography,
  } from '@mui/material';
import * as React from 'react';
import { useState } from 'react';
import { errorLoggingService } from '../../services/logging/ErrorLoggingService';
import { Dataset } from '../../types/exploration/DataAnalysisTypes';

interface DatasetManagerProps {
  datasets: Dataset[];
  selectedDataset: Dataset | null;
  onSelectDataset: (dataset: Dataset) => void;
  onCreateDataset: (dataset: Omit<Dataset, 'id' | 'createdAt' | 'updatedAt'>) => string;
  onUpdateDataset: (id: string, updates: Partial<Dataset>) => void;
  onDeleteDataset: (id: string) => void;
}

const DatasetManager: React.FC<DatasetManagerProps> = ({
  datasets,
  selectedDataset,
  onSelectDataset,
  onCreateDataset,
  onUpdateDataset,
  onDeleteDataset,
}) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [newDatasetName, setNewDatasetName] = useState('');
  const [newDatasetDescription, setNewDatasetDescription] = useState('');
  const [newDatasetSource, setNewDatasetSource] = useState<
    'sectors' | 'anomalies' | 'resources' | 'mixed'
  >('sectors');

  const handleCreateDataset = () => {
    if (!newDatasetName.trim()) return;

    onCreateDataset({
      name: newDatasetName,
      description: newDatasetDescription,
      dataPoints: [],
      source: newDatasetSource,
    });

    setNewDatasetName('');
    setNewDatasetDescription('');
    setNewDatasetSource('sectors');
    setOpenDialog(false);
  };

  return (
    <div>
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={() => setOpenDialog(true)}
        sx={{ mb: 2 }}
      >
        Create Dataset
      </Button>

      {datasets.length === 0 ? (
        <Typography variant="body2" color="text.secondary" align="center">
          No datasets available. Create one to get started.
        </Typography>
      ) : (
        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
          {datasets.map(dataset => (
            <ListItem
              key={dataset.id}
              button
              selected={selectedDataset?.id === dataset.id}
              onClick={() => onSelectDataset(dataset)}
              secondaryAction={
                <>
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={e => {
                      e.stopPropagation();
                      const updatedName = `${dataset.name} (edited)`;
                      onUpdateDataset(dataset.id, { name: updatedName });
                      errorLoggingService.logInfo(`Placeholder edit for dataset: ${dataset.name}`);
                    }}
                    sx={{ mr: 1 }}
                  >
                    <Settings />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={e => {
                      e.stopPropagation();
                      onDeleteDataset(dataset.id);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </>
              }
            >
              <ListItemText
                primary={dataset.name}
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="text.primary">
                      {dataset.source}
                    </Typography>
                    {` — ${dataset.dataPoints.length} data points`}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      )}

      {/* Create Dataset Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Create New Dataset</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Dataset Name"
            fullWidth
            value={newDatasetName}
            onChange={e => setNewDatasetName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            value={newDatasetDescription}
            onChange={e => setNewDatasetDescription(e.target.value)}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Source</InputLabel>
            <Select
              value={newDatasetSource}
              label="Source"
              onChange={e =>
                setNewDatasetSource(
                  e.target.value as 'sectors' | 'anomalies' | 'resources' | 'mixed'
                )
              }
            >
              <MenuItem value="sectors">Sectors</MenuItem>
              <MenuItem value="anomalies">Anomalies</MenuItem>
              <MenuItem value="resources">Resources</MenuItem>
              <MenuItem value="mixed">Mixed</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateDataset} disabled={!newDatasetName.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default DatasetManager;
