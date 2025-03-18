import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
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
import {
  AnalysisConfig,
  AnalysisType,
  Dataset,
  VisualizationType,
} from '../../types/exploration/DataAnalysisTypes';

interface AnalysisConfigManagerProps {
  configs: AnalysisConfig[];
  datasets: Dataset[];
  selectedConfig: AnalysisConfig | null;
  onSelectConfig: (config: AnalysisConfig) => void;
  onCreateConfig: (config: Omit<AnalysisConfig, 'id' | 'createdAt' | 'updatedAt'>) => string;
  onUpdateConfig: (id: string, updates: Partial<AnalysisConfig>) => void;
  onDeleteConfig: (id: string) => void;
}

const AnalysisConfigManager: React.FC<AnalysisConfigManagerProps> = ({
  configs,
  datasets,
  selectedConfig,
  onSelectConfig,
  onCreateConfig,
  onUpdateConfig,
  onDeleteConfig,
}) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [newConfigName, setNewConfigName] = useState('');
  const [newConfigDescription, setNewConfigDescription] = useState('');
  const [newConfigType, setNewConfigType] = useState<AnalysisType>('trend');
  const [newConfigDatasetId, setNewConfigDatasetId] = useState('');
  const [newVisualizationType, setNewVisualizationType] = useState<VisualizationType>('lineChart');

  const handleCreateConfig = () => {
    if (!newConfigName.trim() || !newConfigDatasetId) return;

    // Generate default parameters based on analysis type
    const parameters = generateDefaultParameters(newConfigType);

    // Generate default visualization config
    const visualizationConfig = generateDefaultVisualizationConfig(newVisualizationType);

    onCreateConfig({
      name: newConfigName,
      description: newConfigDescription,
      type: newConfigType,
      datasetId: newConfigDatasetId,
      parameters,
      visualizationType: newVisualizationType,
      visualizationConfig,
    });

    setNewConfigName('');
    setNewConfigDescription('');
    setNewConfigType('trend');
    setNewConfigDatasetId('');
    setNewVisualizationType('lineChart');
    setOpenDialog(false);
  };

  // Generate default parameters based on analysis type
  const generateDefaultParameters = (type: AnalysisType): Record<string, unknown> => {
    switch (type) {
      case 'trend':
        return {
          xAxis: 'date',
          yAxis: 'value',
          groupBy: 'type',
          timeRange: [Date.now() - 30 * 86400000, Date.now()], // Last 30 days
          aggregation: 'average',
        };
      case 'correlation':
        return {
          variables: ['resourcePotential', 'habitabilityScore', 'anomalyCount'],
          method: 'pearson',
          threshold: 0.5,
        };
      case 'distribution':
        return {
          variable: 'resourcePotential',
          bins: 10,
          normalize: true,
        };
      case 'clustering':
        return {
          variables: ['resourcePotential', 'habitabilityScore'],
          clusters: 3,
          method: 'kmeans',
        };
      case 'prediction':
        return {
          target: 'resourcePotential',
          features: ['habitabilityScore', 'anomalyCount'],
          method: 'linear',
          testSize: 0.2,
        };
      default:
        return {};
    }
  };

  // Generate default visualization config based on visualization type
  const generateDefaultVisualizationConfig = (type: VisualizationType): Record<string, unknown> => {
    switch (type) {
      case 'lineChart':
        return {
          xAxisLabel: 'Date',
          yAxisLabel: 'Value',
          showLegend: true,
          showGrid: true,
          colors: ['#4299E1', '#48BB78', '#F6AD55', '#F56565'],
        };
      case 'barChart':
        return {
          xAxisLabel: 'Category',
          yAxisLabel: 'Value',
          showLegend: true,
          showGrid: true,
          colors: ['#4299E1', '#48BB78', '#F6AD55', '#F56565'],
          barSize: 20,
        };
      case 'scatterPlot':
        return {
          xAxisLabel: 'X',
          yAxisLabel: 'Y',
          showLegend: true,
          showGrid: true,
          colors: ['#4299E1', '#48BB78', '#F6AD55', '#F56565'],
          pointSize: 5,
        };
      case 'pieChart':
        return {
          showLegend: true,
          colors: ['#4299E1', '#48BB78', '#F6AD55', '#F56565', '#9F7AEA', '#ED64A6'],
          innerRadius: 0,
          outerRadius: 80,
        };
      default:
        return {};
    }
  };

  return (
    <div>
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={() => setOpenDialog(true)}
        sx={{ mb: 2 }}
      >
        Create Analysis Config
      </Button>

      {configs.length === 0 ? (
        <Typography variant="body2" color="text.secondary" align="center">
          No analysis configurations available. Create one to get started.
        </Typography>
      ) : (
        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
          {configs.map(config => (
            <ListItem
              key={config.id}
              button
              selected={selectedConfig?.id === config.id}
              onClick={() => onSelectConfig(config)}
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onDeleteConfig(config.id);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText
                primary={config.name}
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="text.primary">
                      {config.type}
                    </Typography>
                    {` — ${datasets.find(d => d.id === config.datasetId)?.name || 'Unknown dataset'}`}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      )}

      {/* Create Config Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Create New Analysis Configuration</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Configuration Name"
            fullWidth
            value={newConfigName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewConfigName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            value={newConfigDescription}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setNewConfigDescription(e.target.value)
            }
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Dataset</InputLabel>
            <Select
              value={newConfigDatasetId}
              label="Dataset"
              onChange={e => setNewConfigDatasetId(e.target.value as string)}
            >
              <MenuItem value="">
                <em>Select a dataset</em>
              </MenuItem>
              {datasets.map(dataset => (
                <MenuItem key={dataset.id} value={dataset.id}>
                  {dataset.name} ({dataset.source}, {dataset.dataPoints.length} points)
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Analysis Type</InputLabel>
            <Select
              value={newConfigType}
              label="Analysis Type"
              onChange={e => setNewConfigType(e.target.value as AnalysisType)}
            >
              <MenuItem value="trend">Trend Analysis</MenuItem>
              <MenuItem value="correlation">Correlation Analysis</MenuItem>
              <MenuItem value="distribution">Distribution Analysis</MenuItem>
              <MenuItem value="clustering">Clustering Analysis</MenuItem>
              <MenuItem value="prediction">Prediction Analysis</MenuItem>
              <MenuItem value="comparison">Comparison Analysis</MenuItem>
              <MenuItem value="anomalyDetection">Anomaly Detection</MenuItem>
              <MenuItem value="resourceMapping">Resource Mapping</MenuItem>
              <MenuItem value="sectorAnalysis">Sector Analysis</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Visualization Type</InputLabel>
            <Select
              value={newVisualizationType}
              label="Visualization Type"
              onChange={e => setNewVisualizationType(e.target.value as VisualizationType)}
            >
              <MenuItem value="lineChart">Line Chart</MenuItem>
              <MenuItem value="barChart">Bar Chart</MenuItem>
              <MenuItem value="scatterPlot">Scatter Plot</MenuItem>
              <MenuItem value="pieChart">Pie Chart</MenuItem>
              <MenuItem value="heatMap">Heat Map</MenuItem>
              <MenuItem value="radar">Radar Chart</MenuItem>
              <MenuItem value="histogram">Histogram</MenuItem>
              <MenuItem value="boxPlot">Box Plot</MenuItem>
              <MenuItem value="table">Table</MenuItem>
              <MenuItem value="map">Map</MenuItem>
              <MenuItem value="network">Network Graph</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateConfig}
            disabled={!newConfigName.trim() || !newConfigDatasetId}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AnalysisConfigManager;
