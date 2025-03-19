import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Stack,
  Switch,
  Text,
} from '@chakra-ui/react';
import React, { useState } from 'react';

export interface MultitabLaunchConfig {
  tabCount: number;
  scenarioType: 'resource-intensive' | 'memory-intensive' | 'network-intensive' | 'ui-intensive';
  duration: number; // in seconds
  delayBetweenTabs: number; // in milliseconds
  reportFrequency: number; // in milliseconds
  autoClose: boolean;
  preserveData: boolean;
}

interface MultitabPerformanceLauncherProps {
  onLaunch: (config: MultitabLaunchConfig) => void;
  isRunning: boolean;
}

export const MultitabPerformanceLauncher: React.FC<MultitabPerformanceLauncherProps> = ({
  onLaunch,
  isRunning,
}) => {
  const [config, setConfig] = useState<MultitabLaunchConfig>({
    tabCount: 3,
    scenarioType: 'resource-intensive',
    duration: 30,
    delayBetweenTabs: 500,
    reportFrequency: 1000,
    autoClose: true,
    preserveData: false,
  });

  const handleChange = (field: keyof MultitabLaunchConfig, value: string | number | boolean) => {
    setConfig({ ...config, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onLaunch(config);
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" shadow="md">
      <Heading size="md" mb={4}>
        Multitab Performance Test Launcher
      </Heading>
      <form onSubmit={handleSubmit}>
        <Stack spacing={4}>
          <FormControl>
            <FormLabel>Number of Tabs</FormLabel>
            <Input
              type="number"
              value={config.tabCount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleChange('tabCount', parseInt(e.target.value) || 1)
              }
              min={1}
              max={10}
              isDisabled={isRunning}
            />
            <Text fontSize="sm" color="gray.500">
              How many tabs to open (1-10)
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel>Scenario Type</FormLabel>
            <Select
              value={config.scenarioType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                handleChange('scenarioType', e.target.value)
              }
              isDisabled={isRunning}
            >
              <option value="resource-intensive">Resource Intensive</option>
              <option value="memory-intensive">Memory Intensive</option>
              <option value="network-intensive">Network Intensive</option>
              <option value="ui-intensive">UI Intensive</option>
            </Select>
            <Text fontSize="sm" color="gray.500">
              Type of performance scenario to run
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel>Test Duration (seconds)</FormLabel>
            <Input
              type="number"
              value={config.duration}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleChange('duration', parseInt(e.target.value) || 10)
              }
              min={5}
              max={300}
              isDisabled={isRunning}
            />
            <Text fontSize="sm" color="gray.500">
              How long each test should run (5-300 seconds)
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel>Delay Between Tabs (ms)</FormLabel>
            <Input
              type="number"
              value={config.delayBetweenTabs}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleChange('delayBetweenTabs', parseInt(e.target.value) || 0)
              }
              min={0}
              max={5000}
              step={100}
              isDisabled={isRunning}
            />
            <Text fontSize="sm" color="gray.500">
              Delay before opening next tab (0-5000 ms)
            </Text>
          </FormControl>

          <FormControl>
            <FormLabel>Report Frequency (ms)</FormLabel>
            <Input
              type="number"
              value={config.reportFrequency}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleChange('reportFrequency', parseInt(e.target.value) || 500)
              }
              min={500}
              max={10000}
              step={100}
              isDisabled={isRunning}
            />
            <Text fontSize="sm" color="gray.500">
              How often to collect performance data (500-10000 ms)
            </Text>
          </FormControl>

          <FormControl display="flex" alignItems="center">
            <FormLabel mb="0">Auto-close tabs when finished</FormLabel>
            <Switch
              isChecked={config.autoClose}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleChange('autoClose', e.target.checked)
              }
              isDisabled={isRunning}
            />
          </FormControl>

          <FormControl display="flex" alignItems="center">
            <FormLabel mb="0">Preserve test data between runs</FormLabel>
            <Switch
              isChecked={config.preserveData}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleChange('preserveData', e.target.checked)
              }
              isDisabled={isRunning}
            />
          </FormControl>

          <Button
            mt={4}
            colorScheme="blue"
            type="submit"
            isDisabled={isRunning}
            isLoading={isRunning}
            loadingText="Running Test..."
          >
            Launch Test
          </Button>
        </Stack>
      </form>
    </Box>
  );
};
