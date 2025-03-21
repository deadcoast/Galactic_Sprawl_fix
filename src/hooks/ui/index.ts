import {
  useComponentLifecycle,
  useDynamicComponentLifecycle,
  useStableCallback,
} from './useComponentLifecycle';
import { useComponentProfiler, useComponentProfilerWithUpdates } from './useComponentProfiler';
import {
  useComponentRegistration,
  useComponentRegistrationWithManualUpdates,
} from './useComponentRegistration';
import { useDebugOverlay } from './useDebugOverlay';
import { useProfilingOverlay } from './useProfilingOverlay';
import { useTooltip } from './useTooltip';
import { useVPR } from './useVPR';
import { useVPRInteractivity } from './useVPRInteractivity';
import { useVPRSystem } from './useVPRSystem';
import { useBreakpoint } from './useBreakpoint';
import { useEnhancedComponentProfiler } from '../../utils/profiling/enhancedComponentProfiler';

export {
  // Component lifecycle hooks
  useComponentLifecycle,
  // Profiling hooks
  useComponentProfiler,
  useComponentProfilerWithUpdates,
  useEnhancedComponentProfiler,
  // Component registration hooks
  useComponentRegistration,
  useComponentRegistrationWithManualUpdates,
  // Debug hooks
  useDebugOverlay,
  useDynamicComponentLifecycle,
  useProfilingOverlay,
  useStableCallback,
  // UI hooks
  useTooltip,
  // Responsive hooks
  useBreakpoint,

  // VPR hooks
  useVPR,
  useVPRInteractivity,
  useVPRSystem,
};
