import { ResourceType } from "./../../../types/resources/ResourceTypes";
import { AlertTriangle, Check, Info, RefreshCw, TrendingUp, Zap } from 'lucide-react';
import * as React from "react";
import { useEffect, useState } from 'react';
import { useResourceRates } from '../../../contexts/ResourceRatesContext';
import { useThreshold } from '../../../contexts/ThresholdContext';
import { useComponentLifecycle } from '../../../hooks/ui/useComponentLifecycle';
import { useComponentRegistration } from '../../../hooks/ui/useComponentRegistration';
import {
  ResourceType,
  ResourceTypeHelpers,
} from '../../../types/resources/StandardizedResourceTypes';
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
  if (resourceType === 'all') return 'All Resources';
  return ResourceTypeHelpers.getDisplayName(resourceType);
};

/**
 * Component that analyzes resource flows and provides optimization suggestions
 * to improve efficiency. It integrates with the ResourceFlowManager to identify
 * bottlenecks, underutilized resources, and opportunities for optimization.
 */
const ResourceOptimizationSuggestions: React.FC<ResourceOptimizationSuggestionsProps> = ({
  showAllSuggestions = false,
  maxSuggestions = 5,
  focusedResource,
  onImplementSuggestion,
}) => {
  // Register component with system
  const componentId = useComponentRegistration({
    type: 'ResourceOptimizationSuggestions',
    eventSubscriptions: ['RESOURCE_UPDATED', 'RESOURCE_FLOW_UPDATED'],
    updatePriority: 'low',
  });

  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { resourceRates } = useResourceRates(state => ({ resourceRates: state.resourceRates }));
  const { state: thresholdState } = useThreshold();

  // Component lifecycle tracking for performance monitoring
  useComponentLifecycle({
    onMount: () => {
      console.log('ResourceOptimizationSuggestions mounted');
    },
    onUnmount: () => {
      console.log('ResourceOptimizationSuggestions unmounted');
    },
  });

  // Generate optimization suggestions based on current resource state
  useEffect(() => {
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
            suggestedAction: `Find additional uses for ${resourceType} or convert to other resources`,
          });
        }
      });

      // Add general optimization suggestions
      newSuggestions.push({
        id: `balance-production-${Date.now()}`,
        resourceType: 'all',
        title: 'Balance resource production',
        description: 'Balancing production across all resources could improve overall efficiency.',
        impact: 'medium',
        category: 'allocation',
        actionable: true,
        implemented: false,
        suggestedAction: 'Run production balancing algorithm',
      });

      newSuggestions.push({
        id: `optimize-flow-${Date.now()}`,
        resourceType: 'all',
        title: 'Optimize resource flow network',
        description: 'Running flow optimization could improve efficiency by up to 15%.',
        impact: 'high',
        category: 'efficiency',
        actionable: true,
        implemented: false,
        suggestedAction: 'Run resource flow optimization',
      });

      // Add prediction-based suggestions
      // Safe access to mineralsRate and energyRate
      const mineralRate = (resourceRates[ResourceType.MINERALS] as ResourceRateDetail)?.net ?? 0;
      const energyRate = (resourceRates[ResourceType.ENERGY] as ResourceRateDetail)?.net ?? 0;

      if (mineralRate < 5 && energyRate > 10) {
        newSuggestions.push({
          id: `reallocate-energy-${Date.now()}`,
          resourceType: ResourceType.MINERALS,
          title: 'Reallocate energy to mining',
          description: 'You have excess energy that could be used to boost mineral production.',
          impact: 'medium',
          category: 'prediction',
          actionable: true,
          implemented: false,
          suggestedAction: 'Increase mining module power allocation',
        });
      }

      // Sort suggestions by impact
      newSuggestions.sort((a, b) => {
        const impactValues = { high: 3, medium: 2, low: 1 };
        return impactValues[b.impact] - impactValues[a.impact];
      });

      // Filter by focused resource if needed
      const filteredSuggestions = focusedResource
        ? newSuggestions.filter(s => s.resourceType === focusedResource || s.resourceType === 'all')
        : newSuggestions;

      // Limit to max suggestions if not showing all
      const limitedSuggestions = showAllSuggestions
        ? filteredSuggestions
        : filteredSuggestions.slice(0, maxSuggestions);

      setSuggestions(limitedSuggestions);
      setLastUpdated(new Date());
      setLoading(false);
    };

    generateSuggestions();

    // Set up interval to refresh suggestions
    const interval = setInterval(generateSuggestions, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [resourceRates, thresholdState, showAllSuggestions, maxSuggestions, focusedResource]);

  const handleImplementSuggestion = (suggestion: OptimizationSuggestion) => {
    if (onImplementSuggestion) {
      onImplementSuggestion(suggestion);
    }

    // Mark suggestion as implemented
    setSuggestions(prevSuggestions =>
      prevSuggestions.map(s => (s.id === suggestion.id ? { ...s, implemented: true } : s))
    );
  };

  const refreshSuggestions = () => {
    // Force a refresh of suggestions
    setSuggestions([]);
    setLoading(true);
    setTimeout(() => {
      const event = new CustomEvent('RESOURCE_FLOW_UPDATED', {
        detail: { timestamp: Date.now() },
      });
      window.dispatchEvent(event);
    }, 100);
  };

  const renderSuggestionIcon = (category: string) => {
    switch (category) {
      case 'efficiency':
        return <Zap className="suggestion-icon efficiency" />;
      case 'bottleneck':
        return <AlertTriangle className="suggestion-icon bottleneck" />;
      case 'allocation':
        return <RefreshCw className="suggestion-icon allocation" />;
      case 'prediction':
        return <TrendingUp className="suggestion-icon prediction" />;
      default:
        return <Info className="suggestion-icon" />;
    }
  };

  // Update suggestion filtering to use ResourceType
  const filteredSuggestions = suggestions.filter(suggestion => {
    if (!focusedResource) return true;
    return suggestion.resourceType === focusedResource || suggestion.resourceType === 'all';
  });

  return (
    <div className="resource-optimization-suggestions">
      <div className="suggestions-header">
        <h3 className="suggestions-title">
          Optimization Suggestions
          {focusedResource && ` for ${getResourceName(focusedResource)}`}
        </h3>
        <div className="suggestions-controls">
          {lastUpdated && (
            <span className="last-updated">Updated: {lastUpdated.toLocaleTimeString()}</span>
          )}
          <button className="refresh-button" onClick={refreshSuggestions} disabled={loading}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-suggestions">
          <div className="loading-spinner"></div>
          <p>Analyzing resource flows...</p>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="no-suggestions">
          <Check size={24} />
          <p>No optimization suggestions available. Your resource system is running efficiently!</p>
        </div>
      ) : (
        <div className="suggestions-list">
          {filteredSuggestions.map(suggestion => (
            <div
              key={suggestion.id}
              className={`suggestion-card ${suggestion.impact} ${
                suggestion.implemented ? 'implemented' : ''
              }`}
            >
              <div className="suggestion-header">
                {renderSuggestionIcon(suggestion.category)}
                <h4>{suggestion.title}</h4>
                <span className={`impact-badge ${suggestion.impact}`}>{suggestion.impact}</span>
              </div>
              <p className="suggestion-description">{suggestion.description}</p>
              {suggestion.suggestedAction && (
                <div className="suggested-action">
                  <strong>Suggested Action:</strong> {suggestion.suggestedAction}
                </div>
              )}
              {suggestion.actionable && !suggestion.implemented && (
                <button
                  className="implement-button"
                  onClick={() => handleImplementSuggestion(suggestion)}
                >
                  Implement
                </button>
              )}
              {suggestion.implemented && (
                <div className="implemented-badge">
                  <Check size={16} />
                  Implemented
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!showAllSuggestions && suggestions.length >= maxSuggestions && (
        <div className="show-more-container">
          <button className="show-more-button">Show All Suggestions</button>
        </div>
      )}
    </div>
  );
};

export default ResourceOptimizationSuggestions;
