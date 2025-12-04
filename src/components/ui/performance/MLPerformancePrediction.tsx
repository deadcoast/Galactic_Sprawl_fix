import * as d3 from 'd3';
import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MetricPoint, PerformanceMetrics } from './performanceTypes';

/**
 * Interface for machine learning configuration
 */
interface MLPredictionConfig {
  // Percentage of data to use for training (0-1)
  trainingRatio: number;
  // Number of predicted points to generate
  predictionHorizon: number;
  // Learning rate for the algorithm
  learningRate: number;
  // Number of iterations for training
  iterations: number;
  // Metrics to analyze and predict
  metricsToPredict: (keyof PerformanceMetrics)[];
  // Window size for feature extraction
  windowSize: number;
}

/**
 * Interface for prediction result
 */
export interface PredictionResult {
  metric: keyof PerformanceMetrics;
  actualData: MetricPoint[];
  predictedData: MetricPoint[];
  confidence: number;
  rmse: number; // Root Mean Square Error
  r2: number; // R-squared (coefficient of determination)
}

/**
 * Interface for machine learning model feature
 */
interface MLFeature {
  // Features derived from time series data
  average: number;
  standardDeviation: number;
  trend: number;
  seasonality: number;
  min: number;
  max: number;
  range: number;
  // Target value to predict
  target: number;
}

interface MLPerformancePredictionProps {
  // Performance metrics to analyze
  metrics: PerformanceMetrics;
  // Width of the component
  width?: number;
  // Height of the component
  height?: number;
  // Configuration for ML prediction
  predictionConfig?: Partial<MLPredictionConfig>;
  // Whether to show detailed analysis
  showDetailed?: boolean;
}

/**
 * A component that provides machine learning-based performance prediction
 * capabilities for performance metrics.
 */
const MLPerformancePrediction: React.FC<MLPerformancePredictionProps> = ({
  metrics,
  width = 1200,
  height = 800,
  predictionConfig = {},
  showDetailed = true,
}) => {
  // Reference for the chart container
  const chartRef = useRef<HTMLDivElement>(null);

  // Configuration with defaults
  const config: MLPredictionConfig = {
    trainingRatio: predictionConfig.trainingRatio ?? 0.7,
    predictionHorizon: predictionConfig.predictionHorizon ?? 20,
    learningRate: predictionConfig.learningRate ?? 0.01,
    iterations: predictionConfig.iterations ?? 1000,
    metricsToPredict: predictionConfig.metricsToPredict ?? ['fps', 'renderTime', 'cpuTime'],
    windowSize: predictionConfig.windowSize ?? 5,
  };

  // State for prediction results
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);

  // State for training status
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingMessage, setTrainingMessage] = useState('');

  // Generate predictions when metrics change
  useEffect(() => {
    if (metrics && Object.values(metrics).some(arr => arr.length > config.windowSize * 2)) {
      generatePredictions();
    }
  }, [metrics]);

  // Update chart when predictions change
  useEffect(() => {
    if (predictions.length > 0 && chartRef.current) {
      setupCharts();
    }
  }, [predictions]);

  // Generate ML predictions for the metrics
  const generatePredictions = async () => {
    setIsTraining(true);
    setTrainingProgress(0);
    setTrainingMessage('Preparing data?...');

    // Simulate async processing to show progress
    await new Promise(resolve => setTimeout(resolve, 100));

    const newPredictions: PredictionResult[] = [];

    // For each metric to predict
    for (const metric of config.metricsToPredict) {
      const metricData = metrics[metric];
      if (!metricData || metricData.length <= config.windowSize * 2) continue;

      // Sort by timestamp
      const sortedData = [...metricData].sort((a, b) => a.timestamp - b.timestamp);

      setTrainingMessage(`Preparing features for ${metric}...`);
      setTrainingProgress(10);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Extract features
      const features = extractFeatures(sortedData, config.windowSize);

      setTrainingMessage(`Training model for ${metric}...`);
      setTrainingProgress(20);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Split into training and testing sets
      const splitIndex = Math.floor(features.length * config.trainingRatio);
      const trainingSet = features.slice(0, splitIndex);
      const testingSet = features.slice(splitIndex);

      // Train the model
      const model = trainModel(trainingSet, config.learningRate, config.iterations, progress => {
        setTrainingProgress(20 + Math.floor(progress * 50));
      });

      setTrainingMessage(`Evaluating model for ${metric}...`);
      setTrainingProgress(70);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Evaluate the model
      const evaluation = evaluateModel(model, testingSet);

      setTrainingMessage(`Generating predictions for ${metric}...`);
      setTrainingProgress(80);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Generate predictions
      const lastWindowData = sortedData.slice(-config.windowSize);
      const predictedPoints = makePredictions(model, lastWindowData, config.predictionHorizon);

      // Format actual data and predictions
      const lastTimestamp = sortedData[sortedData.length - 1].timestamp;
      const timeStep = lastTimestamp - sortedData[sortedData.length - 2].timestamp || 1000;

      const predictedData: MetricPoint[] = predictedPoints.map((value, index) => ({
        timestamp: lastTimestamp + timeStep * (index + 1),
        value,
      }));

      // Calculate confidence based on R^2 score
      const confidence = Math.max(0, Math.min(1, evaluation.r2));

      newPredictions.push({
        metric,
        actualData: sortedData,
        predictedData,
        confidence,
        rmse: evaluation.rmse,
        r2: evaluation.r2,
      });
    }

    setTrainingMessage('Processing results...');
    setTrainingProgress(90);
    await new Promise(resolve => setTimeout(resolve, 100));

    setPredictions(newPredictions);
    setIsTraining(false);
    setTrainingProgress(100);
    setTrainingMessage('Prediction complete');
  };

  // Extract features from time series data
  const extractFeatures = (data: MetricPoint[], windowSize: number): MLFeature[] => {
    const features: MLFeature[] = [];

    for (let i = windowSize; i < data?.length; i++) {
      const window = data?.slice(i - windowSize, i);
      const values = window.map(d => d.value);

      // Calculate statistical features
      const average = d3.mean(values) ?? 0;
      const standardDeviation = d3.deviation(values) ?? 0;

      // Simple trend calculation
      const trend = linearTrend(window.map((d, idx) => [idx, d.value]));

      // Simple seasonality estimation
      const detrended = values.map((v, idx) => v - (trend * idx + average));
      const seasonality = d3.deviation(detrended) ?? 0;

      features.push({
        average,
        standardDeviation,
        trend,
        seasonality,
        min: d3.min(values) ?? 0,
        max: d3.max(values) ?? 0,
        range: (d3.max(values) ?? 0) - (d3.min(values) ?? 0),
        target: data[i].value,
      });
    }

    return features;
  };

  // Calculate linear trend from points
  const linearTrend = (points: [number, number][]) => {
    if (points.length < 2) return 0;

    const n = points.length;
    const sumX = points.reduce((sum, [x]) => sum + x, 0);
    const sumY = points.reduce((sum, [, y]) => sum + y, 0);
    const sumXY = points.reduce((sum, [x, y]) => sum + x * y, 0);
    const sumXX = points.reduce((sum, [x]) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return isNaN(slope) ? 0 : slope;
  };

  // Simplistic ML model training (linear regression as baseline)
  const trainModel = (
    features: MLFeature[],
    learningRate: number,
    iterations: number,
    onProgress: (progress: number) => void
  ) => {
    // Initialize weights and bias
    const numFeatures = 7; // Number of feature properties
    const weights = Array(numFeatures).fill(0);
    let bias = 0;

    // Normalize features for better convergence
    const featureStats = normalizeStats(features);
    const normalizedFeatures = normalizeFeatures(features, featureStats);

    // Training loop
    for (let i = 0; i < iterations; i++) {
      // Forcombatd pass
      const predictions = normalizedFeatures.map(feature => predict(feature, weights, bias));

      // Compute gradients
      const dWeights = Array(numFeatures).fill(0);
      let dBias = 0;

      for (let j = 0; j < normalizedFeatures.length; j++) {
        const feature = normalizedFeatures[j];
        const error = predictions[j] - feature.target;

        // Update gradients
        dWeights[0] += error * feature.average;
        dWeights[1] += error * feature.standardDeviation;
        dWeights[2] += error * feature.trend;
        dWeights[3] += error * feature.seasonality;
        dWeights[4] += error * feature.min;
        dWeights[5] += error * feature.max;
        dWeights[6] += error * feature.range;
        dBias += error;
      }

      // Normalize gradients
      for (let j = 0; j < dWeights.length; j++) {
        dWeights[j] /= normalizedFeatures.length;
      }
      dBias /= normalizedFeatures.length;

      // Update weights and bias
      for (let j = 0; j < weights.length; j++) {
        weights[j] -= learningRate * dWeights[j];
      }
      bias -= learningRate * dBias;

      // Report progress
      if (i % Math.max(1, Math.floor(iterations / 20)) === 0) {
        onProgress(i / iterations);
      }
    }

    onProgress(1);

    // Return the trained model
    return {
      weights,
      bias,
      featureStats,
    };
  };

  // Statistics for feature normalization
  interface FeatureStats {
    mean: number[];
    std: number[];
    targetMean: number;
    targetStd: number;
  }

  // Calculate stats for normalization
  const normalizeStats = (features: MLFeature[]): FeatureStats => {
    const featureArray = features.map(f => [
      f.average,
      f.standardDeviation,
      f.trend,
      f.seasonality,
      f.min,
      f.max,
      f.range,
    ]);

    const targets = features.map(f => f.target);

    const mean = [];
    const std = [];

    for (let i = 0; i < 7; i++) {
      const values = featureArray.map(f => f[i]);
      mean.push(d3.mean(values) ?? 0);
      std.push(d3.deviation(values) ?? 1);
    }

    return {
      mean,
      std,
      targetMean: d3.mean(targets) ?? 0,
      targetStd: d3.deviation(targets) ?? 1,
    };
  };

  // Normalize features using stats
  const normalizeFeatures = (features: MLFeature[], stats: FeatureStats): MLFeature[] => {
    return features.map(f => {
      // Normalize features
      const normalizedAverage = (f.average - stats.mean[0]) / stats.std[0];
      const normalizedStdDev = (f.standardDeviation - stats.mean[1]) / stats.std[1];
      const normalizedTrend = (f.trend - stats.mean[2]) / stats.std[2];
      const normalizedSeasonality = (f.seasonality - stats.mean[3]) / stats.std[3];
      const normalizedMin = (f.min - stats.mean[4]) / stats.std[4];
      const normalizedMax = (f.max - stats.mean[5]) / stats.std[5];
      const normalizedRange = (f.range - stats.mean[6]) / stats.std[6];

      // Normalize target
      const normalizedTarget = (f.target - stats.targetMean) / stats.targetStd;

      return {
        average: normalizedAverage,
        standardDeviation: normalizedStdDev,
        trend: normalizedTrend,
        seasonality: normalizedSeasonality,
        min: normalizedMin,
        max: normalizedMax,
        range: normalizedRange,
        target: normalizedTarget,
      };
    });
  };

  // Predict with the model
  const predict = (feature: MLFeature, weights: number[], bias: number): number => {
    return (
      weights[0] * feature.average +
      weights[1] * feature.standardDeviation +
      weights[2] * feature.trend +
      weights[3] * feature.seasonality +
      weights[4] * feature.min +
      weights[5] * feature.max +
      weights[6] * feature.range +
      bias
    );
  };

  // Evaluate model performance
  interface ModelType {
    weights: number[];
    bias: number;
    featureStats: FeatureStats;
  }

  const evaluateModel = (model: ModelType, testSet: MLFeature[]) => {
    const normalizedTestSet = normalizeFeatures(testSet, model.featureStats);

    // Make predictions
    const predictions = normalizedTestSet.map(feature =>
      predict(feature, model.weights, model.bias)
    );

    // Denormalize predictions
    const denormalizedPredictions = predictions.map(
      p => p * model.featureStats.targetStd + model.featureStats.targetMean
    );

    // Calculate metrics
    const actualValues = testSet.map(f => f.target);

    // RMSE calculation
    const squaredErrors = actualValues.map((actual, i) =>
      Math.pow(actual - denormalizedPredictions[i], 2)
    );
    const mse = d3.mean(squaredErrors) ?? 0;
    const rmse = Math.sqrt(mse);

    // R^2 calculation
    const meanActual = d3.mean(actualValues) ?? 0;
    const totalSumSquares =
      d3.sum(actualValues.map(actual => Math.pow(actual - meanActual, 2))) ?? 0;
    const residualSumSquares = d3.sum(squaredErrors) ?? 0;
    const r2 = 1 - residualSumSquares / totalSumSquares;

    return { rmse, r2 };
  };

  // Make predictions for future points
  const makePredictions = (
    model: ModelType,
    lastWindow: MetricPoint[],
    horizon: number
  ): number[] => {
    const predictions: number[] = [];

    // Clone the window to avoid modifying the original
    const windowClone = [...lastWindow];

    for (let i = 0; i < horizon; i++) {
      // Extract features from current window
      const features = extractFeatures([...windowClone], windowClone.length);

      if (features.length === 0) {
        // If we can't extract features, use last known value
        const lastValue = windowClone[windowClone.length - 1].value;
        predictions.push(lastValue);

        // Add prediction to window for next iteration
        windowClone.push({
          timestamp: windowClone[windowClone.length - 1].timestamp + 1,
          value: lastValue,
        });

        // Remove oldest entry
        windowClone.shift();
        continue;
      }

      // Normalize feature for prediction
      const normalizedFeature = normalizeFeatures([features[0]], model.featureStats)[0];

      // Make prediction
      const normalizedPrediction = predict(normalizedFeature, model.weights, model.bias);

      // Denormalize prediction
      const prediction =
        normalizedPrediction * model.featureStats.targetStd + model.featureStats.targetMean;

      predictions.push(prediction);

      // Add prediction to window for next iteration
      windowClone.push({
        timestamp: windowClone[windowClone.length - 1].timestamp + 1,
        value: prediction,
      });

      // Remove oldest entry
      windowClone.shift();
    }

    return predictions;
  };

  // Set up visualization charts
  const setupCharts = () => {
    if (!chartRef.current) return;

    // Clear previous charts
    d3.select(chartRef.current).selectAll('*').remove();

    // Set up the SVG container
    const svg = d3
      .select(chartRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', 'translate(50, 20)');

    // Calculate chart dimensions
    const chartWidth = width - 100;
    const chartHeight = height - 100;

    // Draw charts for each prediction
    predictions.forEach((prediction, index) => {
      // Calculate y position for this chart
      const yPos = index * (chartHeight / predictions.length);
      const chartHeight_i = chartHeight / predictions.length - 40;

      // Create a group for this chart
      const chartGroup = svg.append('g').attr('transform', `translate(0, ${yPos})`);

      // Add title
      chartGroup
        .append('text')
        .attr('x', 0)
        .attr('y', 0)
        .attr('dy', '0.35em')
        .text(`${prediction.metric} (Confidence: ${(prediction.confidence * 100).toFixed(1)}%)`);

      // Combine actual and predicted data for domain calculation
      const allData = [...prediction.actualData, ...prediction.predictedData];

      // Create scales
      const xScale = d3
        .scaleTime()
        .domain(d3.extent(allData, d => new Date(d.timestamp)) as [Date, Date])
        .range([0, chartWidth]);

      const yScale = d3
        .scaleLinear()
        .domain([
          (d3.min(allData, d => d.value)!) * 0.9,
          (d3.max(allData, d => d.value)!) * 1.1,
        ])
        .range([chartHeight_i, 0]);

      // Create axes
      const xAxis = d3.axisBottom(xScale).ticks(5);
      const yAxis = d3.axisLeft(yScale).ticks(5);

      // Add axes
      chartGroup.append('g').attr('transform', `translate(0, ${chartHeight_i})`).call(xAxis);

      chartGroup.append('g').call(yAxis);

      // Create line generator for actual data
      const actualLine = d3
        .line<MetricPoint>()
        .x(d => xScale(new Date(d.timestamp)))
        .y(d => yScale(d.value))
        .curve(d3.curveMonotoneX);

      // Create line generator for predicted data
      const predictedLine = d3
        .line<MetricPoint>()
        .x(d => xScale(new Date(d.timestamp)))
        .y(d => yScale(d.value))
        .curve(d3.curveMonotoneX);

      // Add actual line
      chartGroup
        .append('path')
        .datum(prediction.actualData)
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 2)
        .attr('d', actualLine);

      // Add predicted line
      chartGroup
        .append('path')
        .datum(prediction.predictedData)
        .attr('fill', 'none')
        .attr('stroke', 'red')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
        .attr('d', predictedLine);

      // Add legend
      const legend = chartGroup.append('g').attr('transform', `translate(${chartWidth - 100}, 10)`);

      // Actual data
      legend
        .append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', 20)
        .attr('y2', 0)
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 2);

      legend.append('text').attr('x', 25).attr('y', 0).attr('dy', '0.35em').text('Actual');

      // Predicted data
      legend
        .append('line')
        .attr('x1', 0)
        .attr('y1', 20)
        .attr('x2', 20)
        .attr('y2', 20)
        .attr('stroke', 'red')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');

      legend.append('text').attr('x', 25).attr('y', 20).attr('dy', '0.35em').text('Predicted');
    });
  };

  // Get average confidence across all predictions
  const averageConfidence = useMemo(() => {
    if (predictions.length === 0) return 0;
    return predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
  }, [predictions]);

  return (
    <div className="ml-performance-prediction">
      <h2>ML-based Performance Prediction</h2>

      <div className="prediction-controls">
        <button className="prediction-button" onClick={generatePredictions} disabled={isTraining}>
          {isTraining ? 'Training...' : 'Generate Predictions'}
        </button>

        {isTraining && (
          <div className="training-progress">
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${trainingProgress}%` }}></div>
            </div>
            <div className="progress-message">{trainingMessage}</div>
          </div>
        )}
      </div>

      {predictions.length > 0 ? (
        <div className="prediction-results">
          <div className="chart-container" ref={chartRef}></div>

          {showDetailed && (
            <div className="prediction-metrics">
              <h3>Prediction Metrics</h3>

              <table className="metrics-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>RMSE</th>
                    <th>R²</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((prediction, index) => (
                    <tr key={index}>
                      <td>{prediction.metric}</td>
                      <td>{prediction.rmse.toFixed(4)}</td>
                      <td>{prediction.r2.toFixed(4)}</td>
                      <td>{(prediction.confidence * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="prediction-summary">
                <h4>Prediction Summary</h4>
                <p>
                  <strong>Overall confidence:</strong> {(averageConfidence * 100).toFixed(1)}%
                </p>
                <p>
                  <strong>Prediction horizon:</strong> {config.predictionHorizon} data points
                </p>
                <p>
                  <strong>Model parameters:</strong> Linear regression with {config.iterations}{' '}
                  iterations
                </p>
              </div>

              <div className="model-explanation">
                <h4>Model Explanation</h4>
                <p>
                  This prediction uses time series analysis with a windowed linear regression model.
                  Features are extracted from historical data and used to predict future values.
                </p>
                <p>
                  The confidence score is based on the R² value, which measures how well the model
                  fits the test data?. Higher values indicate better fit.
                </p>
                <p>
                  <strong>Note:</strong> This is a simplified prediction model for demonstration
                  purposes. In a production environment, more sophisticated models like ARIMA,
                  Prophet, or neural networks would provide better accuracy for complex patterns.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="no-predictions">
          <p>
            No predictions available. Click "Generate Predictions" to create predictions based on
            the available performance metrics.
          </p>
          <p>
            Requires at least {config.windowSize * 2} data points for each metric to generate
            predictions.
          </p>
        </div>
      )}

      <style>
        {`
        .ml-performance-prediction {
          padding: 20px;
          font-family:
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            Roboto,
            sans-serif;
        }

        h2 {
          color: #333;
          border-bottom: 2px solid #4285f4;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }

        h3 {
          color: #4285f4;
          margin-top: 0;
          margin-bottom: 15px;
        }

        .prediction-controls {
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .prediction-button {
          padding: 10px 20px;
          background: #4285f4;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .prediction-button:hover:not(:disabled) {
          background: #3367d6;
        }

        .prediction-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .training-progress {
          flex: 1;
        }

        .progress-bar {
          height: 10px;
          background: #eee;
          border-radius: 5px;
          overflow: hidden;
          margin-bottom: 5px;
        }

        .progress-bar-fill {
          height: 100%;
          background: #4285f4;
          transition: width 0.3s ease;
        }

        .progress-message {
          font-size: 14px;
          color: #666;
        }

        .chart-container {
          height: 400px;
          margin-bottom: 20px;
          overflow: hidden;
          background: #f9f9f9;
          border-radius: 4px;
        }

        .prediction-metrics {
          background: #fff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          margin-bottom: 30px;
        }

        .prediction-metrics h3 {
          padding: 15px;
          margin: 0;
          background: #f5f5f5;
          border-bottom: 1px solid #ddd;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th,
        td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }

        th {
          background: #f9f9f9;
          font-weight: 500;
        }

        .prediction-summary,
        .model-explanation {
          padding: 20px;
          border-top: 1px solid #eee;
        }

        .prediction-summary h4,
        .model-explanation h4 {
          margin-top: 0;
          color: #333;
        }

        .no-predictions {
          padding: 50px;
          text-align: center;
          background: #f9f9f9;
          border-radius: 8px;
          color: #666;
        }
        `}
      </style>
    </div>
  );
};

export default MLPerformancePrediction;
