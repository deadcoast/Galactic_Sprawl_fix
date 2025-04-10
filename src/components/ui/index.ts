/**
 * @context: ui-system, component-library
 * 
 * Main export file for all game-specific UI components.
 * This file aggregates UI component exports to simplify imports.
 */

// Export existing components
export { Button } from './Button';
export { Card } from './Card';

// Resource Components
export { ResourceBar } from './resource/ResourceBar';
export { ResourceDisplay } from './resource/ResourceDisplay';
export { ResourceGrid } from './resource/ResourceGrid';
export type { ResourceDisplayMode, ResourceGridItem } from './resource/ResourceGrid';
export { ResourceIcon } from './resource/ResourceIcon';

// Module Components
export { ModuleCard } from './modules/ModuleCard';
export { ModuleControls } from './modules/ModuleControls';
export { ModuleGrid } from './modules/ModuleGrid';
export { ModuleStatusIndicator } from './modules/ModuleStatusIndicator';

// Game Components
export { FactionBadge } from './game/FactionBadge';
export { MiniMap } from './game/MiniMap';
export type { MiniMapStar, ViewportConfig } from './game/MiniMap';
export { ShipDisplay } from './game/ShipDisplay';

// Visualization Components
export type {
  BarChartProps, ChartData, ChartProps, DataPoint,
  LineGraphProps, NetworkEdge,
  NetworkGraphProps, NetworkNode, ResourceFlowConnection,
  ResourceFlowDiagramProps, ResourceFlowNode
} from './visualization';
export { BarChart } from './visualization/BarChart';
export { Chart } from './visualization/Chart';
export { LineGraph } from './visualization/LineGraph';
export { NetworkGraph } from './visualization/NetworkGraph';
export { ResourceFlowDiagram } from './visualization/ResourceFlowDiagram';

// Examples
export * from './examples';

/* 
The following components are commented out until they're implemented:

// Basic UI Elements
export { Icon } from './Icon';
export { Badge } from './Badge';
export { Tooltip } from './Tooltip';
export { Divider } from './Divider';

// Typography Components
export { Heading } from './typography/Heading';
export { Text } from './typography/Text'; 
export { Label } from './typography/Label';

// Input Components
export { Input } from './inputs/Input';
export { Checkbox } from './inputs/Checkbox';
export { Radio } from './inputs/Radio';
export { Select } from './inputs/Select';
export { Slider } from './inputs/Slider';
export { Switch } from './inputs/Switch';

// Layout Components
export { Container } from './layout/Container';
export { Grid } from './layout/Grid';
export { Flex } from './layout/Flex';
export { Stack } from './layout/Stack';
export { Spacer } from './layout/Spacer';

// Feedback Components
export { Alert } from './feedback/Alert';
export { Spinner } from './feedback/Spinner';
export { Progress } from './feedback/Progress';
export { Skeleton } from './feedback/Skeleton';
export { Toast } from './feedback/Toast';

// Navigation Components
export { Tabs } from './navigation/Tabs';
export { Menu } from './navigation/Menu';
export { Breadcrumb } from './navigation/Breadcrumb';
export { Pagination } from './navigation/Pagination';

// Game-Specific Components
export { TechTree } from './game/TechTree';
export { AlertPanel } from './game/AlertPanel';
export { CommandConsole } from './game/CommandConsole';

// Data Display Components
export { DataTable } from './data/DataTable';
export { StatusCard } from './data/StatusCard';
export { Metric } from './data/Metric';
export { Timeline } from './data/Timeline';

// Compound Components
export type { ButtonProps } from './Button';
export type { CardProps } from './Card';
export type { ResourceDisplayProps } from './resource/ResourceDisplay';
*/ 