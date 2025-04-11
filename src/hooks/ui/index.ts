import { useEnhancedComponentProfiler } from '../../utils/profiling/enhancedComponentProfiler';
import { useBreakpoint } from './useBreakpoint';
import {
  useComponentLifecycle,
  useDynamicComponentLifecycle,
  useStableCallback,
} from './useComponentLifecycle';
import { useComponentProfiler, useComponentProfilerWithUpdates } from './useComponentProfiler';
import { useComponentRegistration } from './useComponentRegistration';
import { useDebugOverlay } from './useDebugOverlay';
import { useProfilingOverlay } from './useProfilingOverlay';
import { useTooltip } from './useTooltip';
import { useVPR } from './useVPR';
import { useVPRInteractivity } from './useVPRInteractivity';
import { useVPRSystem } from './useVPRSystem';

export {
  // Responsive hooks
  useBreakpoint,
  // Component lifecycle hooks
  useComponentLifecycle,
  // Profiling hooks
  useComponentProfiler,
  useComponentProfilerWithUpdates,
  // Component registration hooks
  useComponentRegistration,
  // Debug hooks
  useDebugOverlay,
  useDynamicComponentLifecycle,
  useEnhancedComponentProfiler,
  useProfilingOverlay,
  useStableCallback,
  // UI hooks
  useTooltip,
  // VPR hooks
  useVPR,
  useVPRInteractivity,
  useVPRSystem,
};
