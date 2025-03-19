import {
  Badge,
  Box,
  Flex,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import React from 'react';
import { MultitabPerformanceResult } from '../../tests/performance/MultitabPerformanceTestSuite';

interface MultitabPerformanceResultsProps {
  results: MultitabPerformanceResult[];
  isRunning: boolean;
}

export const MultitabPerformanceResults: React.FC<MultitabPerformanceResultsProps> = ({
  results,
  isRunning,
}) => {
  // Calculate aggregate metrics
  const calculateAverages = () => {
    if (results.length === 0) return null;

    const avgMemory =
      results.reduce((sum, result) => sum + result.memory.average, 0) / results.length;
    const avgCPU = results.reduce((sum, result) => sum + result.cpu.average, 0) / results.length;
    const avgFPS =
      results.reduce((sum, result) => {
        // Some tabs might not have FPS data
        return sum + (result.fps?.average || 0);
      }, 0) / results.length;

    const maxMemory = Math.max(...results.map(r => r.memory.max));
    const maxCPU = Math.max(...results.map(r => r.cpu.max));

    return {
      avgMemory,
      avgCPU,
      avgFPS,
      maxMemory,
      maxCPU,
    };
  };

  const avgMetrics = calculateAverages();

  const getPerformanceRating = () => {
    if (!avgMetrics) return 'Unknown';

    // Simple rating based on CPU and memory usage
    const memoryScore = avgMetrics.avgMemory < 100 ? 3 : avgMetrics.avgMemory < 200 ? 2 : 1;

    const cpuScore = avgMetrics.avgCPU < 15 ? 3 : avgMetrics.avgCPU < 30 ? 2 : 1;

    const fpsScore = avgMetrics.avgFPS > 55 ? 3 : avgMetrics.avgFPS > 30 ? 2 : 1;

    const totalScore = memoryScore + cpuScore + fpsScore;

    if (totalScore >= 8) return 'Excellent';
    if (totalScore >= 6) return 'Good';
    if (totalScore >= 4) return 'Fair';
    return 'Poor';
  };

  const getRatingColor = () => {
    const rating = getPerformanceRating();
    switch (rating) {
      case 'Excellent':
        return 'green';
      case 'Good':
        return 'blue';
      case 'Fair':
        return 'orange';
      case 'Poor':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" shadow="md">
      <Heading size="md" mb={4}>
        Multitab Performance Results
      </Heading>

      {results.length === 0 ? (
        <Text fontSize="lg" color="gray.500" py={4} textAlign="center">
          {isRunning
            ? 'Test is running...'
            : 'No test results yet. Start a test to see results here.'}
        </Text>
      ) : (
        <>
          <Flex justifyContent="space-between" alignItems="center" mb={4}>
            <Heading size="sm">Overall Performance</Heading>
            <Badge colorScheme={getRatingColor()} fontSize="md" py={1} px={2} borderRadius="md">
              {getPerformanceRating()}
            </Badge>
          </Flex>

          {avgMetrics && (
            <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4} mb={6}>
              <Stat>
                <StatLabel>Avg. Memory Usage</StatLabel>
                <StatNumber>{avgMetrics.avgMemory.toFixed(1)} MB</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Avg. CPU Usage</StatLabel>
                <StatNumber>{avgMetrics.avgCPU.toFixed(1)}%</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Avg. FPS</StatLabel>
                <StatNumber>{avgMetrics.avgFPS.toFixed(1)}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Peak Memory</StatLabel>
                <StatNumber>{avgMetrics.maxMemory.toFixed(1)} MB</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Peak CPU</StatLabel>
                <StatNumber>{avgMetrics.maxCPU.toFixed(1)}%</StatNumber>
              </Stat>
            </SimpleGrid>
          )}

          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Tab ID</Th>
                <Th>Memory (MB)</Th>
                <Th>CPU (%)</Th>
                <Th>FPS</Th>
                <Th>Errors</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {results.map(result => (
                <Tr key={result.tabId}>
                  <Td>{result.tabId}</Td>
                  <Td>
                    {result.memory.average.toFixed(1)}
                    <Text as="span" fontSize="xs" color="gray.500" ml={1}>
                      (max: {result.memory.max.toFixed(1)})
                    </Text>
                  </Td>
                  <Td>
                    {result.cpu.average.toFixed(1)}
                    <Text as="span" fontSize="xs" color="gray.500" ml={1}>
                      (max: {result.cpu.max.toFixed(1)})
                    </Text>
                  </Td>
                  <Td>
                    {result.fps ? (
                      <>
                        {result.fps.average.toFixed(1)}
                        <Text as="span" fontSize="xs" color="gray.500" ml={1}>
                          (min: {result.fps.min.toFixed(1)})
                        </Text>
                      </>
                    ) : (
                      'N/A'
                    )}
                  </Td>
                  <Td>{result.errors.length}</Td>
                  <Td>
                    <Badge
                      colorScheme={
                        result.status === 'completed'
                          ? 'green'
                          : result.status === 'running'
                            ? 'blue'
                            : 'red'
                      }
                    >
                      {result.status}
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </>
      )}
    </Box>
  );
};
