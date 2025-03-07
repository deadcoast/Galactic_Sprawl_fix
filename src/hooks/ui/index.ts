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

export {
  // Component lifecycle hooks
  useComponentLifecycle,
  // Profiling hooks
  useComponentProfiler,
  useComponentProfilerWithUpdates,
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

  // VPR hooks
  useVPR,
  useVPRInteractivity,
  useVPRSystem,
};
