import { Box, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import * as React from "react";
import { useState } from 'react';
import {
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// Define the color palette for different clusters
const CLUSTER_COLORS = [
  '#4361ee', // Blue
  '#ff6b6b', // Red
  '#4cc9f0', // Cyan
  '#f72585', // Pink
  '#7209b7', // Purple
  '#ffd166', // Yellow
  '#2ec4b6', // Teal
  '#e76f51', // Orange
  '#8ac926', // Green
  '#3a0ca3', // Dark blue
  // Add more colors if needed for more clusters
];

interface ClusterPoint {
  id: string;
  name: string;
  type: string;
  cluster: number;
  features: (number | null)[];
  distanceToCentroid: number;
}

interface ChartPoint {
  id: string;
  name: string;
  cluster: number;
  x: number | null;
  y: number | null;
  distanceToCentroid?: number;
  isCentroid?: boolean;
}

interface ClusterVisualizationProps {
  data: {
    clusters: Array<{
      cluster: number;
      size: number;
      percentage: number;
      centroid: number[];
      featureStats: Array<{
        feature: string;
        mean: number;
        min: number;
        max: number;
        count: number;
      }>;
      pointIds: string[];
    }>;
    features: string[];
    points: ClusterPoint[];
  };
  width?: number | string;
  height?: number | string;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartPoint;
  }>;
}

// Define styles as objects to avoid complex union types
const headerBoxStyle = {
  marginBottom: 3,
  display: 'flex',
  justifyContent: 'space-between',
} as const;

const featureControlsStyle = {
  display: 'flex',
  gap: 2,
} as const;

const formControlStyle = {
  minWidth: 120,
} as const;

const clusterSummaryStyle = {
  marginBottom: 3,
  display: 'flex',
  flexWrap: 'wrap',
  gap: 2,
} as const;

export const ClusterVisualization: React.FC<ClusterVisualizationProps> = ({
  data,
  width = '100%',
  height = 500,
}) => {
  // State for selected features for visualization
  const [xAxisFeature, setXAxisFeature] = useState<string>(data?.features[0] ?? '');
  const [yAxisFeature, setYAxisFeature] = useState<string>(
    data?.features.length > 1 ? data?.features[1] : data?.features[0] ?? ''
  );

  // Get feature indices for easier access
  const xFeatureIndex = data?.features.indexOf(xAxisFeature);
  const yFeatureIndex = data?.features.indexOf(yAxisFeature);

  // Prepare data for visualization
  const chartData: ChartPoint[] = data?.points
    .filter(
      point => point.features[xFeatureIndex] !== null && point.features[yFeatureIndex] !== null
    )
    .map(point => ({
      id: point.id,
      name: point.name,
      cluster: point.cluster,
      x: point.features[xFeatureIndex],
      y: point.features[yFeatureIndex],
      distanceToCentroid: point.distanceToCentroid,
    }));

  // Prepare centroid data
  const centroidData: ChartPoint[] = data?.clusters.map(cluster => ({
    id: `centroid-${cluster.cluster}`,
    name: `Centroid ${cluster.cluster}`,
    cluster: cluster.cluster,
    x: cluster.centroid[xFeatureIndex],
    y: cluster.centroid[yFeatureIndex],
    isCentroid: true,
  }));

  // Combine point and centroid data
  const combinedData: ChartPoint[] = [...chartData, ...centroidData];

  // Calculate cluster statistics
  const clusterSummary = data?.clusters.map(cluster => {
    const xFeatureStat = cluster.featureStats.find(stat => stat.feature === xAxisFeature);
    const yFeatureStat = cluster.featureStats.find(stat => stat.feature === yAxisFeature);

    return {
      cluster: cluster.cluster,
      size: cluster.size,
      percentage: cluster.percentage,
      xMean: xFeatureStat?.mean ?? 0,
      yMean: yFeatureStat?.mean ?? 0,
      color: CLUSTER_COLORS[cluster.cluster % CLUSTER_COLORS.length],
    };
  });

  // Custom tooltip for scatter plot
  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          className="custom-tooltip"
          style={{
            backgroundColor: '#fff',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
          }}
        >
          <p className="label">
            <strong>{data?.name}</strong>
          </p>
          <p>Cluster: {data?.cluster}</p>
          <p>
            {xAxisFeature}: {data?.x}
          </p>
          <p>
            {yAxisFeature}: {data?.y}
          </p>
          {!data?.isCentroid && (
            <p>Distance to centroid: {data?.distanceToCentroid?.toFixed(3) || 'N/A'}</p>
          )}
          {data?.isCentroid && (
            <p>
              <em>This is a cluster centroid</em>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Render feature selection controls and the scatter plot
  return (
    <Box component="div">
      <Box component="div" style={headerBoxStyle}>
        <Typography variant="h6">Cluster Visualization</Typography>
        <Box component="div" style={featureControlsStyle}>
          <FormControl size="small" style={formControlStyle}>
            <InputLabel>X-Axis</InputLabel>
            <Select
              value={xAxisFeature}
              label="X-Axis"
              onChange={e => setXAxisFeature(e.target.value)}
            >
              {data?.features.map(feature => (
                <MenuItem key={feature} value={feature}>
                  {feature}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" style={formControlStyle}>
            <InputLabel>Y-Axis</InputLabel>
            <Select
              value={yAxisFeature}
              label="Y-Axis"
              onChange={e => setYAxisFeature(e.target.value)}
            >
              {data?.features.map(feature => (
                <MenuItem key={feature} value={feature}>
                  {feature}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Cluster summary */}
      <Box component="div" style={clusterSummaryStyle}>
        {clusterSummary.map(cluster => (
          <Box
            key={cluster.cluster}
            component="div"
            style={{
              padding: '12px',
              borderRadius: '4px',
              border: '1px solid',
              borderColor: 'rgba(0, 0, 0, 0.12)',
              backgroundColor: `${cluster.color}15`,
            }}
          >
            <Typography variant="subtitle2" style={{ color: cluster.color, fontWeight: 'bold' }}>
              Cluster {cluster.cluster}
            </Typography>
            <Typography variant="body2">
              {cluster.size} points ({cluster.percentage.toFixed(1)}%)
            </Typography>
            <Typography variant="caption" style={{ display: 'block' }}>
              {xAxisFeature}: {cluster.xMean.toFixed(2)}
            </Typography>
            <Typography variant="caption" style={{ display: 'block' }}>
              {yAxisFeature}: {cluster.yMean.toFixed(2)}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Scatter plot visualization */}
      <Box component="div" style={{ height, width }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{
              top: 20,
              right: 20,
              bottom: 30,
              left: 40,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="x"
              name={xAxisFeature}
              label={{ value: xAxisFeature, position: 'insideBottom', offset: -15 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={yAxisFeature}
              label={{ value: yAxisFeature, angle: -90, position: 'insideLeft', offset: -5 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {/* Render each cluster's points */}
            {data?.clusters.map(cluster => (
              <Scatter
                key={`cluster-${cluster.cluster}`}
                name={`Cluster ${cluster.cluster}`}
                data={combinedData.filter(
                  point => point.cluster === cluster.cluster && !point.isCentroid
                )}
                fill={CLUSTER_COLORS[cluster.cluster % CLUSTER_COLORS.length]}
              />
            ))}

            {/* Render centroids with distinct styling */}
            <Scatter name="Centroids" data={centroidData} shape="star" fill="#000">
              {centroidData.map((entry, index) => (
                <Cell
                  key={`centroid-${index}`}
                  fill={CLUSTER_COLORS[entry.cluster % CLUSTER_COLORS.length]}
                  stroke="#000"
                  strokeWidth={2}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default ClusterVisualization;
