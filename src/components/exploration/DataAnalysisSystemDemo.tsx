import { DataAnalysisProvider } from '../../contexts/DataAnalysisContext';
import { DataAnalysisSystem } from './DataAnalysisSystem';

interface DataAnalysisSystemDemoProps {
  className?: string;
}

export function DataAnalysisSystemDemo({ className = '' }: DataAnalysisSystemDemoProps) {
  return (
    <div className={className}>
      <div className="border-b bg-gray-50 p-4 dark:bg-gray-800">
        <h2 className="text-xl font-semibold">Data Analysis System Demo</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Demonstration of the Data Analysis System for exploration data
        </p>
      </div>

      <div className="p-4">
        <DataAnalysisProvider>
          <DataAnalysisSystem />
        </DataAnalysisProvider>
      </div>

      <div className="border-t p-4">
        <h3 className="mb-2 font-medium">Usage Instructions</h3>
        <div className="space-y-2 text-sm">
          <p>
            This demo showcases the Data Analysis System for exploration data. Follow these steps to
            use the system:
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              <strong>Create a Dataset</strong>: Start by creating a dataset from the Datasets tab.
              You can choose from sectors, anomalies, resources, or a mix of all three.
            </li>
            <li>
              <strong>Create an Analysis</strong>: Switch to the Analysis tab and create a new
              analysis configuration. Select the dataset you created, choose an analysis type, and
              select a visualization type.
            </li>
            <li>
              <strong>Run the Analysis</strong>: Run the analysis by clicking the play button next
              to the analysis configuration or the "Run Analysis" button in the configuration
              details.
            </li>
            <li>
              <strong>View Results</strong>: Switch to the Results tab to view the analysis results.
              Select a result to see the visualization, insights, and summary.
            </li>
          </ol>
        </div>

        <h3 className="mb-2 mt-4 font-medium">Available Analysis Types</h3>
        <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
          <div className="rounded border p-2">
            <div className="font-medium">Trend Analysis</div>
            <p className="text-xs text-gray-500">
              Analyze how values change over time or another dimension
            </p>
          </div>
          <div className="rounded border p-2">
            <div className="font-medium">Correlation Analysis</div>
            <p className="text-xs text-gray-500">
              Identify relationships between different variables
            </p>
          </div>
          <div className="rounded border p-2">
            <div className="font-medium">Distribution Analysis</div>
            <p className="text-xs text-gray-500">
              Analyze how values are distributed across a range
            </p>
          </div>
          <div className="rounded border p-2">
            <div className="font-medium">Clustering Analysis</div>
            <p className="text-xs text-gray-500">Group similar data points into clusters</p>
          </div>
          <div className="rounded border p-2">
            <div className="font-medium">Prediction Analysis</div>
            <p className="text-xs text-gray-500">Predict values based on historical data</p>
          </div>
          <div className="rounded border p-2">
            <div className="font-medium">Comparison Analysis</div>
            <p className="text-xs text-gray-500">Compare different groups of data</p>
          </div>
          <div className="rounded border p-2">
            <div className="font-medium">Anomaly Detection</div>
            <p className="text-xs text-gray-500">Identify outliers and anomalies in the data</p>
          </div>
          <div className="rounded border p-2">
            <div className="font-medium">Resource Mapping</div>
            <p className="text-xs text-gray-500">Visualize resource distribution across sectors</p>
          </div>
          <div className="rounded border p-2">
            <div className="font-medium">Sector Analysis</div>
            <p className="text-xs text-gray-500">Analyze sector properties and compare sectors</p>
          </div>
        </div>

        <h3 className="mb-2 mt-4 font-medium">Available Visualization Types</h3>
        <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
          <div className="rounded border p-2">
            <div className="font-medium">Line Chart</div>
            <p className="text-xs text-gray-500">Show trends over time or another dimension</p>
          </div>
          <div className="rounded border p-2">
            <div className="font-medium">Bar Chart</div>
            <p className="text-xs text-gray-500">Compare values across categories</p>
          </div>
          <div className="rounded border p-2">
            <div className="font-medium">Scatter Plot</div>
            <p className="text-xs text-gray-500">Show relationships between two variables</p>
          </div>
          <div className="rounded border p-2">
            <div className="font-medium">Pie Chart</div>
            <p className="text-xs text-gray-500">Show proportions of a whole</p>
          </div>
          <div className="rounded border p-2">
            <div className="font-medium">Heat Map</div>
            <p className="text-xs text-gray-500">Show intensity of values across two dimensions</p>
          </div>
          <div className="rounded border p-2">
            <div className="font-medium">Radar Chart</div>
            <p className="text-xs text-gray-500">Compare multiple variables across categories</p>
          </div>
          <div className="rounded border p-2">
            <div className="font-medium">Histogram</div>
            <p className="text-xs text-gray-500">Show distribution of values</p>
          </div>
          <div className="rounded border p-2">
            <div className="font-medium">Box Plot</div>
            <p className="text-xs text-gray-500">Show distribution statistics</p>
          </div>
          <div className="rounded border p-2">
            <div className="font-medium">Table</div>
            <p className="text-xs text-gray-500">Show raw data in tabular format</p>
          </div>
          <div className="rounded border p-2">
            <div className="font-medium">Map</div>
            <p className="text-xs text-gray-500">Show spatial distribution of values</p>
          </div>
          <div className="rounded border p-2">
            <div className="font-medium">Network Graph</div>
            <p className="text-xs text-gray-500">Show relationships between entities</p>
          </div>
        </div>
      </div>
    </div>
  );
}
