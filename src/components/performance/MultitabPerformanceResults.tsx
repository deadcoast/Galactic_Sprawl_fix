import {
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Row,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import React from 'react';
import { MultitabPerformanceResult } from '../../tests/performance/MultitabPerformanceTestSuite';

const { Title, Text } = Typography;

// Define the ResultSet type to match the page component
type ResultSet = MultitabPerformanceResult[] | Record<string, MultitabPerformanceResult[]>;

interface MultitabPerformanceResultsProps {
  results: ResultSet;
  isRunning?: boolean;
  _onReportGenerated?: (report: string) => void;
}

export const MultitabPerformanceResults: React.FC<MultitabPerformanceResultsProps> = ({
  results,
  isRunning = false,
  _onReportGenerated,
}) => {
  // Normalize results to always work with an array
  const resultsArray = Array.isArray(results) ? results : Object.values(results).flat();

  // Calculate aggregate metrics
  const calculateAverages = () => {
    if (resultsArray.length === 0) return null;

    const avgMemory =
      resultsArray.reduce((sum, result) => sum + result.memory.average, 0) / resultsArray.length;
    const avgCPU =
      resultsArray.reduce((sum, result) => sum + result.cpu.average, 0) / resultsArray.length;
    const avgFPS =
      resultsArray.reduce((sum, result) => {
        // Some tabs might not have FPS data
        return sum + (result.fps?.average ?? 0);
      }, 0) / resultsArray.length;

    const maxMemory = Math.max(...resultsArray.map(r => r.memory.max));
    const maxCPU = Math.max(...resultsArray.map(r => r.cpu.max));

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
        return 'success';
      case 'Good':
        return 'processing';
      case 'Fair':
        return 'warning';
      case 'Poor':
        return 'error';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: 'Tab ID',
      dataIndex: 'tabId',
      key: 'tabId',
    },
    {
      title: 'Memory (MB)',
      dataIndex: 'memory',
      key: 'memory',
      render: (memory: { average: number; max: number }) => (
        <span>
          {memory.average.toFixed(1)}
          <Text type="secondary" style={{ fontSize: '12px', marginLeft: '4px' }}>
            (max: {memory.max.toFixed(1)})
          </Text>
        </span>
      ),
    },
    {
      title: 'CPU (%)',
      dataIndex: 'cpu',
      key: 'cpu',
      render: (cpu: { average: number; max: number }) => (
        <span>
          {cpu.average.toFixed(1)}
          <Text type="secondary" style={{ fontSize: '12px', marginLeft: '4px' }}>
            (max: {cpu.max.toFixed(1)})
          </Text>
        </span>
      ),
    },
    {
      title: 'FPS',
      dataIndex: 'fps',
      key: 'fps',
      render: (fps: { average: number; min: number } | undefined) =>
        fps ? (
          <span>
            {fps.average.toFixed(1)}
            <Text type="secondary" style={{ fontSize: '12px', marginLeft: '4px' }}>
              (min: {fps.min.toFixed(1)})
            </Text>
          </span>
        ) : (
          'N/A'
        ),
    },
    {
      title: 'Errors',
      dataIndex: 'errors',
      key: 'errors',
      render: (errors: unknown[]) => errors.length,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        if (status === 'completed') color = 'success';
        else if (status === 'running') color = 'processing';
        else color = 'error';

        return <Tag color={color}>{status}</Tag>;
      },
    },
  ];

  return (
    <Card style={{ borderRadius: '8px' }}>
      <Title level={5}>Multitab Performance Results</Title>

      {resultsArray.length === 0 ? (
        <Empty
          description={
            isRunning
              ? 'Test is running...'
              : 'No test results yet. Start a test to see results here.'
          }
          style={{ padding: '2rem' }}
        />
      ) : (
        <>
          <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
            <Col>
              <Text strong>Overall Performance</Text>
            </Col>
            <Col>
              <Badge
                status={
                  getRatingColor()
                }
                text={getPerformanceRating()}
                style={{ fontSize: '16px' }}
              />
            </Col>
          </Row>

          {avgMetrics && (
            <>
              <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={12} md={4.8}>
                  <Statistic
                    title="Avg. Memory Usage"
                    value={avgMetrics.avgMemory.toFixed(1)}
                    suffix="MB"
                  />
                </Col>
                <Col xs={12} md={4.8}>
                  <Statistic
                    title="Avg. CPU Usage"
                    value={avgMetrics.avgCPU.toFixed(1)}
                    suffix="%"
                  />
                </Col>
                <Col xs={12} md={4.8}>
                  <Statistic title="Avg. FPS" value={avgMetrics.avgFPS.toFixed(1)} />
                </Col>
                <Col xs={12} md={4.8}>
                  <Statistic
                    title="Peak Memory"
                    value={avgMetrics.maxMemory.toFixed(1)}
                    suffix="MB"
                  />
                </Col>
                <Col xs={12} md={4.8}>
                  <Statistic title="Peak CPU" value={avgMetrics.maxCPU.toFixed(1)} suffix="%" />
                </Col>
              </Row>
              <Divider style={{ margin: '0 0 24px 0' }} />
            </>
          )}

          <Table
            dataSource={resultsArray}
            columns={columns}
            rowKey="tabId"
            size="small"
            pagination={false}
          />

          {_onReportGenerated && (
            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <Button
                type="primary"
                onClick={() => {
                  // Simple report generation
                  const reportHeader = `Multitab Performance Report (${new Date().toLocaleString()})\n`;
                  const reportSummary = avgMetrics
                    ? `Overall Rating: ${getPerformanceRating()}\nAvg Memory: ${avgMetrics.avgMemory.toFixed(1)} MB, Avg CPU: ${avgMetrics.avgCPU.toFixed(1)}%, Avg FPS: ${avgMetrics.avgFPS.toFixed(1)}\n`
                    : 'Overall Rating: N/A (No data)\n';
                  const reportDetails = resultsArray
                    .map(
                      r =>
                        `Tab ${r.tabId}: Mem=${r.memory.average.toFixed(1)}MB(max ${r.memory.max.toFixed(1)}) CPU=${r.cpu.average.toFixed(1)}%(max ${r.cpu.max.toFixed(1)}) FPS=${r.fps?.average.toFixed(1) ?? 'N/A'}(min ${r.fps?.min.toFixed(1) ?? 'N/A'}) Errors=${r.errors.length} Status=${r.status}`
                    )
                    .join('\n');
                  const fullReport = `${reportHeader}\n${reportSummary}\nDetails:\n${reportDetails}`;
                  _onReportGenerated(fullReport);
                }}
              >
                Generate Report
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
};
