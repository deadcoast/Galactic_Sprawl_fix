import { Button, Card, Col, Form, InputNumber, Row, Select, Space, Switch, Typography } from 'antd';
import React, { useState } from 'react';
import { MultitabPerformanceResult } from '../../tests/performance/MultitabPerformanceTestSuite';

const { Title, Text } = Typography;
const { Option } = Select;

export interface MultitabLaunchConfig {
  tabCount: number;
  scenarioType: 'resource-intensive' | 'memory-intensive' | 'network-intensive' | 'ui-intensive';
  duration: number; // in seconds
  delayBetweenTabs: number; // in milliseconds
  reportFrequency: number; // in milliseconds
  autoClose: boolean;
  preserveData: boolean;
}

// Define the ResultSet type to match the page component
type ResultSet = MultitabPerformanceResult[] | Record<string, MultitabPerformanceResult[]>;

interface MultitabPerformanceLauncherProps {
  onLaunch: (config: MultitabLaunchConfig) => void;
  isRunning: boolean;
  isCoordinator?: boolean;
  onTestResults?: (results: ResultSet) => void;
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
    <Card style={{ borderRadius: '8px' }}>
      <Title level={5}>Multitab Performance Test Launcher</Title>
      <form onSubmit={handleSubmit}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Form.Item label="Number of Tabs" help="How munknown tabs to open (1-10)">
            <InputNumber
              value={config.tabCount}
              onChange={(value: number | null) => handleChange('tabCount', value ?? 1)}
              min={1}
              max={10}
              disabled={isRunning}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item label="Scenario Type" help="Type of performance scenario to run">
            <Select
              value={config.scenarioType}
              onChange={(value: string) => handleChange('scenarioType', value)}
              disabled={isRunning}
              style={{ width: '100%' }}
            >
              <Option value="resource-intensive">Resource Intensive</Option>
              <Option value="memory-intensive">Memory Intensive</Option>
              <Option value="network-intensive">Network Intensive</Option>
              <Option value="ui-intensive">UI Intensive</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Test Duration (seconds)"
            help="How long each test should run (5-300 seconds)"
          >
            <InputNumber
              value={config.duration}
              onChange={(value: number | null) => handleChange('duration', value ?? 10)}
              min={5}
              max={300}
              disabled={isRunning}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="Delay Between Tabs (ms)"
            help="Delay before opening next tab (0-5000 ms)"
          >
            <InputNumber
              value={config.delayBetweenTabs}
              onChange={(value: number | null) => handleChange('delayBetweenTabs', value ?? 0)}
              min={0}
              max={5000}
              step={100}
              disabled={isRunning}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="Report Frequency (ms)"
            help="How often to collect performance data (500-10000 ms)"
          >
            <InputNumber
              value={config.reportFrequency}
              onChange={(value: number | null) => handleChange('reportFrequency', value ?? 500)}
              min={500}
              max={10000}
              step={100}
              disabled={isRunning}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item>
            <Row>
              <Col span={16}>
                <Text>Auto-close tabs when finished</Text>
              </Col>
              <Col span={8}>
                <Switch
                  checked={config.autoClose}
                  onChange={(checked: boolean) => handleChange('autoClose', checked)}
                  disabled={isRunning}
                />
              </Col>
            </Row>
          </Form.Item>

          <Form.Item>
            <Row>
              <Col span={16}>
                <Text>Preserve test data between runs</Text>
              </Col>
              <Col span={8}>
                <Switch
                  checked={config.preserveData}
                  onChange={(checked: boolean) => handleChange('preserveData', checked)}
                  disabled={isRunning}
                />
              </Col>
            </Row>
          </Form.Item>

          <Button type="primary" htmlType="submit" disabled={isRunning} loading={isRunning}>
            {isRunning ? 'Running Test...' : 'Launch Test'}
          </Button>
        </Space>
      </form>
    </Card>
  );
};
