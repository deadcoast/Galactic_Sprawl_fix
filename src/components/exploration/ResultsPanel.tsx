import { Chip, Divider, List, ListItem, Typography } from '@mui/material';
import * as React from 'react';
import { AnalysisConfig, AnalysisResult } from '../../types/exploration/DataAnalysisTypes';

interface ResultsPanelProps {
  results: AnalysisResult[];
  configs: AnalysisConfig[];
  onSelectResult: (result: AnalysisResult) => void;
}

/**
 * Utility function to determine the status color for a result
 * Using underscore prefix to indicate it's a private function
 */
const _getStatusColor = (status: string): 'success' | 'error' | 'primary' => {
  if (status === 'completed') return 'success';
  if (status === 'failed') return 'error';
  return 'primary';
};

const ResultsPanel: React.FC<ResultsPanelProps> = ({ results, configs, onSelectResult }) => {
  // Sort results by start time (newest first)
  const sortedResults = [...results].sort((a, b) => b.startTime - a.startTime);

  return (
    <div className="results-panel">
      {sortedResults.length === 0 ? (
        <Typography variant="body2" color="text.secondary" align="center">
          No analysis results available. Run an analysis to see results here.
        </Typography>
      ) : (
        <List sx={{ maxHeight: 500, overflow: 'auto' }}>
          {sortedResults.map(result => {
            const config = configs.find(c => c.id === result?.analysisConfigId);

            return (
              <React.Fragment key={result?.id}>
                <ListItem
                  button
                  onClick={() => onSelectResult(result)}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    p: 2,
                  }}
                >
                  <div className="mb-1 flex w-full justify-between">
                    <Typography variant="subtitle2">
                      {config ? config.name : 'Unknown Analysis'}
                    </Typography>
                    <Chip
                      label={result?.status}
                      color={_getStatusColor(result?.status)}
                      size="small"
                    />
                  </div>

                  <Typography variant="body2" color="text.secondary">
                    {config?.type || 'Unknown Type'} analysis
                  </Typography>

                  <div className="mt-1 flex w-full justify-between">
                    <Typography variant="caption" color="text.secondary">
                      Started: {new Date(result?.startTime).toLocaleString()}
                    </Typography>
                    {result?.endTime && (
                      <Typography variant="caption" color="text.secondary">
                        Duration: {((result?.endTime - result?.startTime) / 1000).toFixed(2)}s
                      </Typography>
                    )}
                  </div>

                  {result?.summary && (
                    <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                      {result?.summary}
                    </Typography>
                  )}
                </ListItem>
                <Divider />
              </React.Fragment>
            );
          })}
        </List>
      )}
    </div>
  );
};

export default ResultsPanel;
