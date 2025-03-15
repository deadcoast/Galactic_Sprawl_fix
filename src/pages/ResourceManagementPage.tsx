import * as React from "react";
import { ResourceManagementDashboard } from '../components/ui/resource/ResourceManagementDashboard';
import { ResourceRatesProvider } from '../contexts/ResourceRatesContext';
import { ThresholdProvider } from '../contexts/ThresholdContext';
import './ResourceManagementPage.css';

/**
 * Resource Management Page
 *
 * This page provides a comprehensive interface for managing all aspects
 * of the resource system, including:
 *
 * - Resource monitoring
 * - Threshold configuration
 * - Resource flow visualization
 * - Resource conversion management
 * - Production chain management
 */
const ResourceManagementPage: React.FC = () => {
  return (
    <div className="resource-management-page">
      <ResourceRatesProvider>
        <ThresholdProvider>
          <ResourceManagementDashboard />
        </ThresholdProvider>
      </ResourceRatesProvider>
    </div>
  );
};

export default ResourceManagementPage;
