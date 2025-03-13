/**
 * Test file for CommonTypes imports
 */

import {
  BaseDataRecord,
  BasePoint,
  BaseLink,
  BaseChartComponentProps,
  BaseVisualizationProps,
  AnimationConfig,
  FlowDataNode,
  SimulationNodeDatum
} from '../../types/visualization/CommonTypes';

// Just create some examples to verify the types work
const testPoint: BasePoint = {
  id: 'test-point',
  x: 100,
  y: 200
};

const testLink: BaseLink = {
  id: 'test-link',
  source: 'source-node',
  target: testPoint
};

const testProps: BaseChartComponentProps = {
  width: 800,
  height: 600,
  title: 'Test Chart'
};

const testVisProps: BaseVisualizationProps = {
  ...testProps,
  data: [{ id: 'test', value: 100, x: 10, y: 20 }],
  xKey: 'x',
  yKey: 'y'
};

const testAnimation: AnimationConfig = {
  duration: 500,
  delay: 100,
  loop: true
};

const testFlowNode: FlowDataNode = {
  id: 'flow-node',
  name: 'Test Flow Node',
  type: 'source',
  value: 100,
  x: 50,
  y: 50
};

const testSimNode: SimulationNodeDatum = {
  id: 'sim-node',
  x: 50,
  y: 50,
  fx: null,
  fy: null
};

// This export is just to satisfy TypeScript in case this file is imported elsewhere
export const testTypes = {
  testPoint,
  testLink,
  testProps,
  testVisProps,
  testAnimation,
  testFlowNode,
  testSimNode
};