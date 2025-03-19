import {
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import { scaleOrdinal } from 'd3-scale';
import { schemeCategory10 } from 'd3-scale-chromatic';
import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';

import {
  ChartDataRecord,
  LinearRegressionModelDetails,
  NeuralNetworkModelDetails,
  PredictionVisualizationProps,
  TooltipRenderer,
} from '../../../../types/exploration/AnalysisComponentTypes';
import { createTooltipComponent } from './TooltipAdapter';
import VirtualizedLineChart from './VirtualizedLineChart';

// Create a color scale
const colorScale = scaleOrdinal(schemeCategory10);

// Define type-safe interfaces for the chart data
interface TimeSeriesDataPoint extends ChartDataRecord {
  timestamp: number;
  actual?: number;
  predicted: number;
  error?: number;
  lower?: number;
  upper?: number;
  type: 'historical' | 'forecast';
}

interface FeatureComparisonDataPoint {
  featureValue: number;
  actual: number;
  predicted: number;
  error?: number;
}

interface ResidualDataPoint {
  predicted: number;
  residual: number;
  actual: number;
}

// Type guard for model details
function isLinearRegressionModel(
  modelDetails: LinearRegressionModelDetails | NeuralNetworkModelDetails
): modelDetails is LinearRegressionModelDetails {
  return 'coefficients' in modelDetails;
}

function isNeuralNetworkModel(
  modelDetails: LinearRegressionModelDetails | NeuralNetworkModelDetails
): modelDetails is NeuralNetworkModelDetails {
  return 'architecture' in modelDetails;
}

export const PredictionVisualization: React.FC<PredictionVisualizationProps> = React.memo(
  ({ data, width = '100%', height = 500, title }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [selectedFeature, setSelectedFeature] = useState<string>('');

    const featureIndex = useMemo(() => {
      if (!selectedFeature) return -1;
      return data?.features.indexOf(selectedFeature);
    }, [data?.features, selectedFeature]);

    // Prepare time series data for date-based visualization
    const timeSeriesData = useMemo<TimeSeriesDataPoint[]>(() => {
      console.warn('Computing time series data'); // Helpful for debugging
      const result: TimeSeriesDataPoint[] = [];
      // Add historical data points
      for (const point of data?.predictions) {
        result?.push({
          timestamp: point.features[0], // Assume first feature is timestamp
          actual: point.actual,
          predicted: point.predicted,
          error: point.error,
          type: 'historical',
        });
      }

      // Add forecast data points
      for (const point of data?.forecast) {
        result?.push({
          timestamp: point.features[0], // Assume first feature is timestamp
          predicted: point.predicted,
          lower: point.confidence ? point.confidence[0] : undefined,
          upper: point.confidence ? point.confidence[1] : undefined,
          type: 'forecast',
        });
      }

      // Sort by timestamp
      return result?.sort((a, b) => a.timestamp - b.timestamp);
    }, [data?.predictions, data?.forecast]);

    // Feature comparison data
    const featureComparisonData = useMemo<FeatureComparisonDataPoint[]>(() => {
      if (featureIndex < 0 || !selectedFeature) return [];

      return data?.predictions.map(point => ({
        featureValue: point.features[featureIndex + 1], // Skip timestamp
        actual: point.actual,
        predicted: point.predicted,
        error: point.error,
      }));
    }, [data?.predictions, featureIndex, selectedFeature]);

    // Residual plot data
    const residualData = useMemo<ResidualDataPoint[]>(() => {
      return data?.predictions.map(point => ({
        predicted: point.predicted,
        residual: point.actual - point.predicted,
        actual: point.actual,
      }));
    }, [data?.predictions]);

    // Get forecast start timestamp
    const forecastStartTimestamp = useMemo(() => {
      const forecastPoint = timeSeriesData.find(d => d.type === 'forecast');
      return forecastPoint ? forecastPoint.timestamp : undefined;
    }, [timeSeriesData]);

    const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
      setActiveTab(newValue);
    }, []);

    const handleFeatureChange = useCallback((event: SelectChangeEvent<string>) => {
      setSelectedFeature(event?.target.value);
    }, []);

    // Custom tooltip renderers with proper typing
    const renderTimeSeriesToolTip: TooltipRenderer<TimeSeriesDataPoint> = useCallback(dataPoint => {
      return (
        <Paper sx={{ p: 1 }}>
          <Typography variant="subtitle2">
            {new Date(dataPoint.timestamp).toLocaleDateString()}
          </Typography>
          {dataPoint.type === 'historical' ? (
            <>
              <Typography variant="body2">Actual: {dataPoint.actual?.toFixed(2)}</Typography>
              <Typography variant="body2">Predicted: {dataPoint.predicted.toFixed(2)}</Typography>
              {dataPoint.error !== undefined && (
                <Typography variant="body2">Error: {dataPoint.error.toFixed(2)}</Typography>
              )}
            </>
          ) : (
            <>
              <Typography variant="body2">Forecast: {dataPoint.predicted.toFixed(2)}</Typography>
              {dataPoint.lower !== undefined && dataPoint.upper !== undefined && (
                <Typography variant="body2">
                  Confidence: [{dataPoint.lower.toFixed(2)}, {dataPoint.upper.toFixed(2)}]
                </Typography>
              )}
            </>
          )}
        </Paper>
      );
    }, []);

    // Custom tooltip for feature comparison
    const renderFeatureComparisonTooltip: TooltipRenderer<FeatureComparisonDataPoint> = useCallback(
      dataPoint => {
        return (
          <Paper sx={{ p: 1 }}>
            <Typography variant="subtitle2">
              {selectedFeature}: {dataPoint.featureValue.toFixed(2)}
            </Typography>
            <Typography variant="body2">Actual: {dataPoint.actual.toFixed(2)}</Typography>
            <Typography variant="body2">Predicted: {dataPoint.predicted.toFixed(2)}</Typography>
            {dataPoint.error !== undefined && (
              <Typography variant="body2">Error: {dataPoint.error.toFixed(2)}</Typography>
            )}
          </Paper>
        );
      },
      [selectedFeature]
    );

    // Create tooltip components using the adapter
    const TimeSeriesToolTipComponent = useMemo(
      () => createTooltipComponent(renderTimeSeriesToolTip),
      [renderTimeSeriesToolTip]
    );

    const FeatureComparisonTooltipComponent = useMemo(
      () => createTooltipComponent(renderFeatureComparisonTooltip),
      [renderFeatureComparisonTooltip]
    );

    const metrics = useMemo(
      () => (
        <TableContainer component={Paper} sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Metric</TableCell>
                <TableCell align="right">Value</TableCell>
                <TableCell>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>MSE</TableCell>
                <TableCell align="right">{data?.metrics.mse.toFixed(4)}</TableCell>
                <TableCell>Mean Squared Error</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>RMSE</TableCell>
                <TableCell align="right">{data?.metrics.rmse.toFixed(4)}</TableCell>
                <TableCell>Root Mean Squared Error</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>MAE</TableCell>
                <TableCell align="right">{data?.metrics.mae.toFixed(4)}</TableCell>
                <TableCell>Mean Absolute Error</TableCell>
              </TableRow>
              {data?.metrics.r2 !== undefined && (
                <TableRow>
                  <TableCell>R²</TableCell>
                  <TableCell align="right">{data?.metrics.r2.toFixed(4)}</TableCell>
                  <TableCell>Coefficient of Determination</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ),
      [data?.metrics]
    );

    // Determine if we should use virtualized rendering based on dataset size
    const useVirtualized = useMemo(() => {
      return timeSeriesData.length > 500; // Use virtualized rendering for large datasets
    }, [timeSeriesData.length]);

    // Convert time series data to the format expected by VirtualizedLineChart
    const virtualizedChartData = useMemo(() => {
      return timeSeriesData.map(point => ({
        ...point,
        // Add any additional required properties to make it compatible with ChartDataRecord
      }));
    }, [timeSeriesData]);

    // Create a VirtualizedLineChart config
    const virtualizedTimeSeriesChart = useMemo(
      () => (
        <VirtualizedLineChart
          data={virtualizedChartData}
          xAxisKey="timestamp"
          yAxisKeys={['actual', 'predicted']}
          width="100%"
          height={300}
          dateFormat={true}
          customTooltip={TimeSeriesToolTipComponent}
          connectNulls={true}
          showGrid={true}
          fillArea={false}
          strokeWidth={2}
          showDots={timeSeriesData.length < 100}
          colors={[colorScale('0'), colorScale('1')]}
          referenceLines={
            forecastStartTimestamp
              ? [
                  {
                    value: forecastStartTimestamp,
                    label: 'Forecast Start',
                    color: colorScale('3'),
                    position: 'insideTopRight',
                    axis: 'x',
                  },
                ]
              : []
          }
          maxDisplayedPoints={1000}
          enableProgressiveLoading={true}
          subtitle={
            timeSeriesData.length > 1000
              ? `Large dataset optimized with intelligent downsampling`
              : undefined
          }
        />
      ),
      [timeSeriesData, TimeSeriesToolTipComponent, forecastStartTimestamp, virtualizedChartData]
    );

    const timeSeriesChart = useMemo(() => {
      // Use our virtualized line chart for large datasets
      if (useVirtualized) {
        return virtualizedTimeSeriesChart;
      }

      // Otherwise use the standard Recharts implementation
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeSeriesData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              scale="time"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={timestamp => new Date(timestamp).toLocaleDateString()}
            />
            <YAxis />
            <Tooltip content={TimeSeriesToolTipComponent} />
            <Legend />

            {/* Historical data */}
            <Line
              type="monotone"
              name="Actual"
              dataKey="actual"
              stroke={colorScale('0')}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
              connectNulls
            />
            <Line
              type="monotone"
              name="Predicted"
              dataKey="predicted"
              stroke={colorScale('1')}
              strokeDasharray="5 5"
              dot={{ r: 4 }}
              isAnimationActive={false}
              connectNulls
            />

            {/* Forecast confidence interval */}
            {timeSeriesData.some(d => d.lower !== undefined) && forecastStartTimestamp && (
              <ReferenceArea
                x1={forecastStartTimestamp}
                x2={timeSeriesData[timeSeriesData.length - 1].timestamp}
                fill={colorScale('1')}
                fillOpacity={0.1}
                ifOverflow="extendDomain"
              />
            )}

            {/* Divider between historical and forecast */}
            {forecastStartTimestamp && (
              <ReferenceLine
                x={forecastStartTimestamp}
                stroke={colorScale('3')}
                strokeDasharray="3 3"
                label={{
                  value: 'Forecast Start',
                  position: 'insideTopRight',
                  fill: colorScale('3'),
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      );
    }, [
      timeSeriesData,
      TimeSeriesToolTipComponent,
      forecastStartTimestamp,
      useVirtualized,
      virtualizedTimeSeriesChart,
    ]);

    const featureComparisonChart = useMemo(
      () => (
        <>
          <div className="mb-2">
            <FormControl fullWidth size="small">
              <InputLabel>Feature</InputLabel>
              <Select
                value={selectedFeature}
                onChange={handleFeatureChange}
                label="Feature"
                displayEmpty
                disabled={data?.features.length <= 1}
              >
                {data?.features.slice(1).map(feature => (
                  <MenuItem key={feature} value={feature}>
                    {feature}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          {selectedFeature ? (
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="featureValue"
                  name={selectedFeature}
                  label={{
                    value: selectedFeature,
                    position: 'insideBottomRight',
                    offset: -5,
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="actual"
                  name="Value"
                  label={{
                    value: data?.targetVariable,
                    angle: -90,
                    position: 'insideLeft',
                  }}
                />
                <ZAxis type="number" range={[60, 60]} />
                <Tooltip content={FeatureComparisonTooltipComponent} />
                <Legend />
                <Scatter
                  name="Actual vs. Feature"
                  data={featureComparisonData}
                  fill={colorScale('0')}
                />

                {/* Add trend line if using linear regression */}
                {data?.model === 'linear' &&
                  data?.modelDetails &&
                  isLinearRegressionModel(data?.modelDetails) && (
                    <Line
                      name="Model Trend"
                      type="monotone"
                      dataKey={(point: FeatureComparisonDataPoint) => {
                        const coefficients = data?.modelDetails as LinearRegressionModelDetails;
                        const intercept = coefficients.coefficients[0];
                        const featureCoef =
                          featureIndex >= 0 ? coefficients.coefficients[featureIndex + 1] : 0;

                        return intercept + featureCoef * point.featureValue;
                      }}
                      data={featureComparisonData}
                      stroke={colorScale('2')}
                      strokeWidth={2}
                      dot={false}
                      activeDot={false}
                      isAnimationActive={false}
                    />
                  )}
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <Typography variant="body2" align="center" sx={{ py: 2 }}>
              Select a feature to visualize its relationship with the target variable.
            </Typography>
          )}
        </>
      ),
      [
        data?.features,
        selectedFeature,
        handleFeatureChange,
        data?.targetVariable,
        featureComparisonData,
        FeatureComparisonTooltipComponent,
        data?.model,
        data?.modelDetails,
        featureIndex,
      ]
    );

    const residualPlot = useMemo(
      () => (
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="predicted"
              name="Predicted"
              label={{
                value: 'Predicted Values',
                position: 'insideBottomRight',
                offset: -5,
              }}
            />
            <YAxis
              type="number"
              dataKey="residual"
              name="Residual"
              label={{
                value: 'Residuals',
                angle: -90,
                position: 'insideLeft',
              }}
            />
            <ZAxis type="number" range={[60, 60]} />
            <Tooltip />
            <ReferenceLine y={0} stroke="#666" strokeWidth={1} />
            <Scatter name="Residuals" data={residualData} fill={colorScale('4')} />
          </ScatterChart>
        </ResponsiveContainer>
      ),
      [residualData]
    );

    const modelDetails = useMemo(() => {
      // Use type guards to safely access model-specific properties
      if (data?.model === 'linear' && isLinearRegressionModel(data?.modelDetails)) {
        const modelDetails = data?.modelDetails;
        const intercept = modelDetails.coefficients[0];
        const featureImportance = modelDetails.featureImportance;

        return (
          <div>
            <Typography variant="h6" gutterBottom>
              Linear Regression Model
            </Typography>

            <Typography variant="subtitle2" gutterBottom>
              Model Equation
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, fontFamily: 'monospace' }}>
              {data?.targetVariable} = {intercept.toFixed(4)}
              {data?.features
                .slice(1)
                .map((feature, i) => {
                  const coef = modelDetails.coefficients[i + 1];
                  return coef >= 0
                    ? ` + ${coef.toFixed(4)} × ${feature}`
                    : ` - ${Math.abs(coef).toFixed(4)} × ${feature}`;
                })
                .join('')}
            </Typography>

            {featureImportance && (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  Feature Importance
                </Typography>
                <TableContainer component={Paper} sx={{ mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Feature</TableCell>
                        <TableCell align="right">Importance</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {featureImportance.map(item => (
                        <TableRow key={item?.feature}>
                          <TableCell>{item?.feature}</TableCell>
                          <TableCell align="right">
                            {(item?.importance * 100).toFixed(2)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </div>
        );
      } else if (data?.model === 'neuralNetwork' && isNeuralNetworkModel(data?.modelDetails)) {
        const modelDetails = data?.modelDetails;

        return (
          <div>
            <Typography variant="h6" gutterBottom>
              Neural Network Model
            </Typography>

            <Typography variant="subtitle2" gutterBottom>
              Architecture
            </Typography>
            <TableContainer component={Paper} sx={{ mb: 2 }}>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>Input Features</TableCell>
                    <TableCell>{data?.features.length - 1}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Hidden Layers</TableCell>
                    <TableCell>1</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Hidden Units</TableCell>
                    <TableCell>{modelDetails.architecture.hiddenUnits || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Activation {`(...args: unknown[]) => unknown`}</TableCell>
                    <TableCell>{modelDetails.architecture.activation || 'ReLU'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Output</TableCell>
                    <TableCell>1 (Regression)</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="subtitle2" gutterBottom>
              Training Information
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>Epochs</TableCell>
                    <TableCell>{modelDetails.training.epochs || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Learning Rate</TableCell>
                    <TableCell>{modelDetails.training.learningRate || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Batch Size</TableCell>
                    <TableCell>{modelDetails.training.batchSize || 'N/A'}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        );
      }

      return (
        <Typography variant="body2">
          Details not available for the {data?.model} model type.
        </Typography>
      );
    }, [data?.model, data?.modelDetails, data?.targetVariable, data?.features]);

    return (
      <div className="h-full w-full overflow-auto" style={{ width, height }}>
        {title && (
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
        )}

        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Time Series" />
          <Tab label="Feature Comparison" />
          <Tab label="Residuals" />
          <Tab label="Model Details" />
        </Tabs>

        {metrics}

        {activeTab === 0 && timeSeriesChart}
        {activeTab === 1 && featureComparisonChart}
        {activeTab === 2 && residualPlot}
        {activeTab === 3 && modelDetails}
      </div>
    );
  }
);

export default PredictionVisualization;
