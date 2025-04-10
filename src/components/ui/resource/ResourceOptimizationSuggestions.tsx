import { AlertTriangle, Check, Info, RefreshCw, TrendingUp, Zap } from 'lucide-react';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { useResourceRates } from '../../../contexts/ResourceRatesContext';
import { useThreshold } from '../../../contexts/ThresholdContext';
import { useComponentLifecycle } from '../../../hooks/ui/useComponentLifecycle';
import { useComponentRegistration } from '../../../hooks/ui/useComponentRegistration';
import { EventType } from '../../../types/events/EventTypes';
import { ResourceType, ResourceTypeHelpers } from '../../../types/resources/ResourceTypes';
import './ResourceOptimizationSuggestions.css';

// Define the ResourceRateDetail interface locally since it's not exported
interface ResourceRateDetail {
  production: number;
  consumption: number;
  net: number; // net rate (production - consumption)
}

interface OptimizationSuggestion {
  id: string;
  resourceType: ResourceType | 'all';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'efficiency' | 'bottleneck' | 'allocation' | 'prediction';
  actionable: boolean;
  implemented: boolean;
  suggestedAction?: string;
}

interface ResourceOptimizationSuggestionsProps {
  showAllSuggestions?: boolean;
  maxSuggestions?: number;
  focusedResource?: ResourceType;
  onImplementSuggestion?: (suggestion: OptimizationSuggestion) => void;
}

// Helper function to get resource name for display
const getResourceName = (resourceType: ResourceType | 'all'): string => {
  if (resourceType === 'all') {
    return 'All Resources';
  }
  return ResourceTypeHelpers.getDisplayName(resourceType);
};

/**
 * Component that analyzes resource flows and provides optimization suggestions
 * to improve efficiency. It integrates with the ResourceFlowManager to identify
 * bottlenecks, underutilized resources, and opportunities for optimization.
 */
export const ResourceOptimizationSuggestions: React.FC<ResourceOptimizationSuggestionsProps> = ({
  showAllSuggestions = false,
  maxSuggestions = 5,
  focusedResource,
  onImplementSuggestion,
}) => {
  // Register component with system
  const componentId = useComponentRegistration({
    type: ResourceType.RESEARCH,
    eventSubscriptions: ['RESOURCE_UPDATED', 'RESOURCE_FLOW_UPDATED'],
    updatePriority: 'low',
  });

  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { resourceRates } = useResourceRates(state => ({ resourceRates: state.resourceRates }));
  const { state: thresholdState } = useThreshold();

  // Function to refresh suggestions
  const refreshSuggestions = async () => {
    await generateSuggestions();
    setLastUpdated(new Date());
  };

  // Component lifecycle tracking for performance monitoring
  useComponentLifecycle({
    onMount: () => {
      console.warn(`ResourceOptimizationSuggestions (${componentId}) mounted`);
    },
    onUnmount: () => {
      console.warn(`ResourceOptimizationSuggestions (${componentId}) unmounted`);
    },
    eventSubscriptions: [
      {
        eventType: EventType.RESOURCE_UPDATED,
        handler: event => {
          console.warn(`Component ${componentId} received resource update:`, event);
          if (event?.data?.resourceType) {
            refreshSuggestions();
          }
        },
      },
      {
        eventType: EventType.RESOURCE_FLOW_UPDATED,
        handler: event => {
          console.warn(`Component ${componentId} received flow update:`, event);
          refreshSuggestions();
        },
      },
    ],
  });

  // Generate optimization suggestions based on current resource state
  const generateSuggestions = async () => {
    setLoading(true);

    // Simulate API call or complex analysis
    await new Promise(resolve => setTimeout(resolve, 500));

    const newSuggestions: OptimizationSuggestion[] = [];

    // Analyze resource rates for negative trends
    Object.entries(resourceRates).forEach(([typeKey, rateDetail]) => {
      const resourceType = typeKey as ResourceType;
      // Type assertion for rateDetail to access the net property
      const rate = (rateDetail as ResourceRateDetail).net;

      // Only include suggestions for the focused resource if specified
      if (focusedResource && resourceType !== focusedResource) {
        return;
      }

      // Check for negative resource rates
      if (rate < 0) {
        newSuggestions.push({
          id: `negative-rate-${resourceType}-${Date.now()}`,
          resourceType,
          title: `Negative ${resourceType} flow detected`,
          description: `You're consuming more ${resourceType} than you're producing, which may lead to shortages.`,
          impact: rate < -10 ? 'high' : rate < -5 ? 'medium' : 'low',
          category: 'bottleneck',
          actionable: true,
          implemented: false,
          suggestedAction: `Increase ${resourceType} production or reduce consumption`,
        });
      }

      // Check for extremely high positive rates (potential waste)
      if (
        rate > 20 &&
        thresholdState?.resources[resourceType]?.currentAmount >
          0.9 * (thresholdState?.resources[resourceType]?.maxCapacity || 1000)
      ) {
        newSuggestions.push({
          id: `excess-rate-${resourceType}-${Date.now()}`,
          resourceType,
          title: `Excess ${resourceType} production`,
          description: `You're producing more ${resourceType} than you can store, which may lead to waste.`,
          impact: 'medium',
          category: 'efficiency',
          actionable: true,
          implemented: false,
          suggestedAction: `Reduce ${resourceType} production or increase storage capacity`,
        });
      }

      // Check for underutilized resources
      if (
        rate > 0 &&
        rate < 3 &&
        thresholdState?.resources[resourceType]?.currentAmount >
          0.6 * (thresholdState?.resources[resourceType]?.maxCapacity || 1000)
      ) {
        newSuggestions.push({
          id: `underutilized-${resourceType}-${Date.now()}`,
          resourceType,
          title: `Underutilized ${resourceType} reserves`,
          description: `You have significant ${resourceType} reserves that could be utilized more effectively.`,
          impact: 'low',
          category: 'allocation',
          actionable: true,
          implemented: false,
          suggestedAction: `Consider reallocating ${resourceType} to other production chains or research`,
        });
      }
    });

    // Set the filtered suggestions
    setSuggestions(
      newSuggestions
        .slice(0, showAllSuggestions ? newSuggestions.length : maxSuggestions)
        .sort((a, b) => {
          // Sort by impact first
          const impactOrder = { high: 0, medium: 1, low: 2 };
          return (
            impactOrder[a.impact] - impactOrder[b.impact] ||
            // Then sort by resource type
            (a.resourceType === 'all' ? 1 : 0) - (b.resourceType === 'all' ? 1 : 0)
          );
        })
    );

    setLoading(false);
  };

  // Load suggestions on mount and when dependencies change
  useEffect(() => {
    refreshSuggestions();
  }, [focusedResource, resourceRates, thresholdState, maxSuggestions, showAllSuggestions]);

  // Render the suggestions
  return (
    <div className="resource-optimization-suggestions">
      <div className="suggestions-header">
        <h3>
          {focusedResource
            ? `Optimization Suggestions for ${getResourceName(focusedResource)}`
            : 'Global Optimization Suggestions'}
        </h3>
        <div className="suggestions-actions">
          {lastUpdated && (
            <span className="last-updated">Last updated: {lastUpdated.toLocaleTimeString()}</span>
          )}
          <button
            className="refresh-button"
            onClick={() => refreshSuggestions()}
            disabled={loading}
          >
            <RefreshCw className={loading ? 'spinning' : ''} size={16} />
            {loading ? 'Analyzing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {suggestions.length === 0 ? (
        <div className="no-suggestions">
          <Info size={24} />
          <p>No optimization suggestions found at this time.</p>
        </div>
      ) : (
        <ul className="suggestions-list">
          {suggestions.map(suggestion => (
            <li
              key={suggestion.id}
              className={`suggestion-item ${suggestion.impact} ${
                suggestion.implemented ? 'implemented' : ''
              }`}
            >
              <div className="suggestion-icon">
                {suggestion.category === 'efficiency' && <Zap size={24} />}
                {suggestion.category === 'bottleneck' && <AlertTriangle size={24} />}
                {suggestion.category === 'allocation' && <TrendingUp size={24} />}
                {suggestion.category === 'prediction' && <Info size={24} />}
              </div>
              <div className="suggestion-content">
                <h4>{suggestion.title}</h4>
                <p>{suggestion.description}</p>
                {suggestion.suggestedAction && (
                  <div className="suggested-action">
                    <strong>Suggested Action:</strong> {suggestion.suggestedAction}
                  </div>
                )}
                <div className="suggestion-meta">
                  <span className={`impact ${suggestion.impact}`}>
                    {suggestion.impact.charAt(0).toUpperCase() + suggestion.impact.slice(1)} Impact
                  </span>
                  <span className="resource-type">{getResourceName(suggestion.resourceType)}</span>
                </div>
              </div>
              {suggestion.actionable && !suggestion.implemented && onImplementSuggestion && (
                <button
                  className="implement-button"
                  onClick={() => onImplementSuggestion(suggestion)}
                >
                  <Check size={16} /> Implement
                </button>
              )}
              {suggestion.implemented && (
                <div className="implemented-tag">
                  <Check size={16} /> Implemented
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Export as default for backward compatibility
export default ResourceOptimizationSuggestions;
