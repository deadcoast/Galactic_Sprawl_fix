/**
 * @context: ui-system, component-library
 *
 * Main export file for all game-specific UI components.
 * This file aggregates UI component exports to simplify imports.
 */

// Export existing components
// export { Button } from './Button';
// export { Card } from './Card';

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
export { BarChart } from './visualization/BarChart';
export type { BarChartProps } from './visualization/BarChart';
export { Chart } from './visualization/Chart';
export type { ChartData, ChartProps } from './visualization/Chart';
export type { DataPoint } from './visualization/DataTransitionParticleSystem';
export { LineGraph } from './visualization/LineGraph';
export type { LineGraphProps } from './visualization/LineGraph';
export { NetworkGraph } from './visualization/NetworkGraph';
export type { NetworkEdge, NetworkGraphProps, NetworkNode } from './visualization/NetworkGraph';
export { ResourceFlowDiagram } from './visualization/ResourceFlowDiagram';
export type { ResourceFlowDiagramProps } from './visualization/ResourceFlowDiagram';

// Examples -> Showcase (Removed as ./showcase does not exist)
// export * from './showcase';

// Basic UI Elements - Re-exported from ui design system
export { Icon } from './Icon';
export type { IconProps } from './Icon';
export { Badge } from './Badge';
export type { BadgeProps } from './Badge';
export { Tooltip } from './Tooltip';
export type { TooltipProps } from './Tooltip';
export { Divider } from './Divider';
export type { DividerProps } from './Divider';

// Typography Components - Re-exported from ui design system
export { Heading, Text, Label } from './typography';
export type { HeadingProps, TextProps, LabelProps } from './typography';

// Input Components - Re-exported from ui design system
export { Input, Checkbox, Radio, Select, Slider, Switch } from './inputs';
export type { InputProps, CheckboxProps, RadioProps, SelectProps, SliderProps, SwitchProps } from './inputs';

// Layout Components - Re-exported from ui design system
export { Container, Grid, Flex, Stack, Spacer, ResponsiveLayout } from './layout';
export type { ContainerProps, GridProps, FlexProps, StackProps, SpacerProps } from './layout';

// Feedback Components - Placeholder implementations
export { Alert, Spinner, Progress, Skeleton, Toast } from './feedback';
export type { AlertProps, SpinnerProps, ProgressProps, SkeletonProps, ToastProps } from './feedback';

// Navigation Components - Re-export existing Tabs + placeholders
export { Tabs, Menu, Breadcrumb, Pagination } from './navigation';
export type { BreadcrumbProps, BreadcrumbItem, PaginationProps, MenuProps } from './navigation';

// Game-Specific Components
export { TechTree, AlertPanel, CommandConsole } from './game';
export type { AlertPanelProps, CommandConsoleProps } from './game';

// Data Display Components - Placeholder implementations
export { DataTable, StatusCard, Metric, Timeline } from './data';
export type { DataTableProps, Column, StatusCardProps, MetricProps, TimelineProps, TimelineItem } from './data';

// Re-export types from resource components
export type { ResourceDisplayProps } from './resource/ResourceDisplay';

// Remove default exports for base components
// export { default as Accordion } from './accordion/Accordion';
// export { default as Alert } from './alert/Alert';
// export { default as Avatar } from './avatar/Avatar';
// export { default as Badge } from './badge/Badge';
// export { default as Breadcrumb } from './breadcrumb/Breadcrumb';
// export { default as Checkbox } from './checkbox/Checkbox';
