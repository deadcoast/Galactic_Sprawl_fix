import { Box, Chip, Divider, List, ListItem, Typography } from '@mui/material';
import React from 'react';
import { AnalysisConfig, AnalysisResult } from '../../types/exploration/DataAnalysisTypes';

interface ResultsPanelProps {
  results: AnalysisResult[];
  configs: AnalysisConfig[];
  onSelectResult: (result: AnalysisResult) => void;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({ results, configs, onSelectResult }) => {
  // Sort results by start time (newest first)
  const sortedResults = [...results].sort((a, b) => b.startTime - a.startTime);

  return (
    <Box>
      {sortedResults.length === 0 ? (
        <Typography variant="body2" color="text.secondary" align="center">
          No analysis results available. Run an analysis to see results here.
        </Typography>
      ) : (
        <List sx={{ maxHeight: 500, overflow: 'auto' }}>
          {sortedResults.map(result => {
            const config = configs.find(c => c.id === result.analysisConfigId);

            return (
              <React.Fragment key={result.id}>
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
                  <Box
                    sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', mb: 1 }}
                  >
                    <Typography variant="subtitle2">
                      {config ? config.name : 'Unknown Analysis'}
                    </Typography>
                    <Chip
                      label={result.status}
                      color={
                        result.status === 'completed'
                          ? 'success'
                          : result.status === 'failed'
                            ? 'error'
                            : 'primary'
                      }
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    {config?.type || 'Unknown Type'} analysis
                  </Typography>

                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mt: 1 }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Started: {new Date(result.startTime).toLocaleString()}
                    </Typography>
                    {result.endTime && (
                      <Typography variant="caption" color="text.secondary">
                        Duration: {((result.endTime - result.startTime) / 1000).toFixed(2)}s
                      </Typography>
                    )}
                  </Box>

                  {result.summary && (
                    <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                      {result.summary}
                    </Typography>
                  )}
                </ListItem>
                <Divider />
              </React.Fragment>
            );
          })}
        </List>
      )}
    </Box>
  );
};

export default ResultsPanel;
