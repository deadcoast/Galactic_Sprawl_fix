import * as React from "react";
import { useEffect, useState } from 'react';
import { Alert, AlertLevel, AlertSystemUI } from './alerts/AlertSystemUI';
import { DetectionVisualization } from './radar/DetectionVisualization';
import { RadarSweepAnimation } from './radar/RadarSweepAnimation';
import { RangeIndicators } from './radar/RangeIndicators';

// Sample data for demo
const sampleDetectedObjects = [
  {
    id: 'obj-1',
    position: { x: 0.6, y: 0.3 },
    size: 0.7,
    type: 'friendly' as const,
    confidence: 0.95,
    velocity: { x: 0.01, y: 0.005 },
    name: 'Friendly Cruiser',
    distance: 2.4,
  },
  {
    id: 'obj-2',
    position: { x: 0.2, y: 0.7 },
    size: 0.5,
    type: 'hostile' as const,
    confidence: 0.8,
    velocity: { x: -0.02, y: 0.01 },
    name: 'Unknown Vessel',
    distance: 5.1,
  },
  {
    id: 'obj-3',
    position: { x: 0.8, y: 0.8 },
    size: 0.3,
    type: 'neutral' as const,
    confidence: 0.6,
    name: 'Mining Station',
    distance: 3.7,
  },
  {
    id: 'obj-4',
    position: { x: 0.4, y: 0.2 },
    size: 0.2,
    type: 'unknown' as const,
    confidence: 0.4,
    velocity: { x: 0.005, y: -0.01 },
    distance: 8.2,
  },
];

const sampleRanges = [
  {
    id: 'range-1',
    distance: 0.3,
    color: 'rgba(255, 0, 0, 0.7)',
    label: 'Weapons Range',
    type: 'weapons' as const,
  },
  {
    id: 'range-2',
    distance: 0.6,
    color: 'rgba(0, 255, 0, 0.7)',
    label: 'Detection Range',
    type: 'detection' as const,
    pulseEffect: true,
  },
  {
    id: 'range-3',
    distance: 0.9,
    color: 'rgba(0, 150, 255, 0.7)',
    label: 'Comms Range',
    type: 'communication' as const,
    dashPattern: [5, 5],
  },
];

const generateSampleAlerts = (): Alert[] => {
  const now = Date.now();

  return [
    {
      id: 'alert-1',
      level: 'critical',
      message: 'Hostile ship detected within weapons range',
      details: 'Vessel matches profile of known pirate faction. Weapons systems active.',
      source: 'Proximity Sensors',
      timestamp: now - 30000, // 30 seconds ago
    },
    {
      id: 'alert-2',
      level: 'danger',
      message: 'Shield integrity at 64%',
      details: 'Port shield generator operating at reduced capacity.',
      source: 'Defense Systems',
      timestamp: now - 120000, // 2 minutes ago
      acknowledged: true,
    },
    {
      id: 'alert-3',
      level: 'warning',
      message: 'Unidentified signal detected',
      details: 'Signal pattern does not match known signatures.',
      source: 'Long Range Scanners',
      timestamp: now - 300000, // 5 minutes ago
    },
    {
      id: 'alert-4',
      level: 'info',
      message: 'Scheduled maintenance required',
      details: 'Sensor array calibration recommended within next 24 hours.',
      source: 'Maintenance System',
      timestamp: now - 3600000, // 1 hour ago
    },
    {
      id: 'alert-5',
      level: 'warning',
      message: 'Asteroid field ahead',
      details: 'Navigation recommends course adjustment.',
      source: 'Navigation',
      timestamp: now - 180000, // 3 minutes ago
    },
    {
      id: 'alert-6',
      level: 'info',
      message: 'Communication relay established',
      details: 'Secure channel open with nearest outpost.',
      source: 'Communications',
      timestamp: now - 600000, // 10 minutes ago
      acknowledged: true,
    },
  ];
};

interface CombatSystemDemoProps {
  className?: string;
}

/**
 * CombatSystemDemo component
 *
 * Demonstrates the combat system UI components in an integrated display.
 */
export function CombatSystemDemo({ className = '' }: CombatSystemDemoProps) {
  const [radarSize, setRadarSize] = useState(400);
  const [selectedObjectId, setSelectedObjectId] = useState<string | undefined>(undefined);
  const [activeRangeId, setActiveRangeId] = useState<string | undefined>('range-2');
  const [alerts, setAlerts] = useState<Alert[]>(generateSampleAlerts());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [visualQuality, setVisualQuality] = useState<'low' | 'medium' | 'high'>('medium');

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // Adjust radar size based on window width
      const newSize = Math.min(
        Math.max(window.innerWidth * 0.3, 300), // Min 300px, max 30% of window width
        500 // Max 500px
      );
      setRadarSize(newSize);
    };

    handleResize(); // Initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle object click
  const handleObjectClick = (objectId: string) => {
    setSelectedObjectId(objectId);

    // Generate a new alert when clicking on a hostile object
    const clickedObject = sampleDetectedObjects.find(obj => obj.id === objectId);
    if (clickedObject && clickedObject.type === 'hostile') {
      const newAlert: Alert = {
        id: `alert-${Date.now()}`,
        level: 'warning',
        message: `Tracking hostile object: ${clickedObject.name || 'Unknown vessel'}`,
        details: `Distance: ${clickedObject.distance} LY. Confidence: ${Math.round(clickedObject.confidence * 100)}%`,
        source: 'Combat System',
        timestamp: Date.now(),
      };

      setAlerts(prev => [newAlert, ...prev]);
    }
  };

  // Handle range click
  const handleRangeClick = (rangeId: string) => {
    setActiveRangeId(rangeId);
  };

  // Handle alert acknowledge
  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts(prev =>
      prev.map(alert => (alert.id === alertId ? { ...alert, acknowledged: true } : alert))
    );
  };

  // Handle alert dismiss
  const handleDismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  // Handle alert details view
  const handleViewAlertDetails = (alertId: string) => {
    const alert = alerts.find(a => a.id === alertId);
    if (alert) {
      console.warn(`Viewing details for alert: ${alert.message}`);
      // In a real app, this would open a modal or panel with details
    }
  };

  // Toggle sound
  const handleToggleSound = () => {
    setSoundEnabled(prev => !prev);
  };

  // Toggle visual quality
  const handleToggleQuality = () => {
    setVisualQuality(prev => {
      switch (prev) {
        case 'low':
          return 'medium';
        case 'medium':
          return 'high';
        case 'high':
          return 'low';
      }
    });
  };

  return (
    <div className={`flex flex-col gap-6 rounded-lg bg-gray-900 p-6 lg:flex-row ${className}`}>
      {/* Left side - Radar and Detection */}
      <div className="flex flex-col items-center gap-4">
        <h2 className="text-xl font-bold text-white">Combat Radar System</h2>

        <div className="relative" style={{ width: radarSize, height: radarSize }}>
          {/* Radar Sweep Animation */}
          <div className="absolute inset-0">
            <RadarSweepAnimation
              size={radarSize}
              speed={2}
              color="rgba(0, 255, 0, 0.7)"
              backgroundColor="rgba(0, 20, 0, 0.2)"
              quality={visualQuality}
            />
          </div>

          {/* Range Indicators */}
          <div className="absolute inset-0">
            <RangeIndicators
              size={radarSize}
              ranges={sampleRanges}
              activeRangeId={activeRangeId}
              onRangeClick={handleRangeClick}
              quality={visualQuality}
            />
          </div>

          {/* Detection Visualization */}
          <div className="absolute inset-0">
            <DetectionVisualization
              size={radarSize}
              detectedObjects={sampleDetectedObjects}
              selectedObjectId={selectedObjectId}
              onObjectClick={handleObjectClick}
              quality={visualQuality}
              showVelocity={true}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="mt-2 flex gap-4">
          <button
            onClick={handleToggleQuality}
            className="rounded bg-blue-900 px-3 py-1 text-blue-100 transition-colors hover:bg-blue-800"
          >
            Quality: {visualQuality}
          </button>

          <button
            onClick={() => setSelectedObjectId(undefined)}
            className="rounded bg-gray-800 px-3 py-1 text-gray-100 transition-colors hover:bg-gray-700"
          >
            Clear Selection
          </button>
        </div>

        {/* Selected Object Info */}
        {selectedObjectId && (
          <div className="mt-4 w-full max-w-md rounded-lg bg-gray-800 p-4">
            <h3 className="mb-2 text-lg font-semibold text-white">Selected Object</h3>
            {(() => {
              const obj = sampleDetectedObjects.find(o => o.id === selectedObjectId);
              if (!obj) return <p className="text-gray-400">No object selected</p>;

              return (
                <div className="space-y-2">
                  <p className="text-white">
                    <span className="text-gray-400">Name:</span> {obj.name || 'Unknown'}
                  </p>
                  <p className="text-white">
                    <span className="text-gray-400">Type:</span>{' '}
                    {obj.type.charAt(0).toUpperCase() + obj.type.slice(1)}
                  </p>
                  <p className="text-white">
                    <span className="text-gray-400">Distance:</span> {obj.distance} LY
                  </p>
                  <p className="text-white">
                    <span className="text-gray-400">Confidence:</span>{' '}
                    {Math.round(obj.confidence * 100)}%
                  </p>
                  <div className="mt-1 h-2 w-full rounded-full bg-gray-700">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${obj.confidence * 100}%` }}
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Right side - Alert System */}
      <div className="flex w-full flex-col gap-4 lg:w-96">
        <h2 className="text-xl font-bold text-white">Alert System</h2>

        <AlertSystemUI
          alerts={alerts}
          onAcknowledge={handleAcknowledgeAlert}
          onDismiss={handleDismissAlert}
          onViewDetails={handleViewAlertDetails}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          className="w-full"
        />

        {/* Demo controls */}
        <div className="mt-4 rounded-lg bg-gray-800 p-4">
          <h3 className="mb-3 text-lg font-semibold text-white">Demo Controls</h3>

          <div className="space-y-3">
            <button
              onClick={() => {
                const levels: AlertLevel[] = ['info', 'warning', 'danger', 'critical'];
                const randomLevel = levels[Math.floor(Math.random() * levels.length)];

                const newAlert: Alert = {
                  id: `alert-${Date.now()}`,
                  level: randomLevel,
                  message: `Test ${randomLevel} alert`,
                  details: `This is a test ${randomLevel} alert generated at ${new Date().toLocaleTimeString()}`,
                  source: 'Demo System',
                  timestamp: Date.now(),
                };

                setAlerts(prev => [newAlert, ...prev]);
              }}
              className="w-full rounded bg-blue-700 px-4 py-2 text-white transition-colors hover:bg-blue-600"
            >
              Generate Random Alert
            </button>

            <button
              onClick={() => {
                const criticalAlert: Alert = {
                  id: `alert-${Date.now()}`,
                  level: 'critical',
                  message: 'CRITICAL: Hull breach detected',
                  details: 'Emergency protocols activated. All personnel to evacuation stations.',
                  source: 'Hull Integrity System',
                  timestamp: Date.now(),
                };

                setAlerts(prev => [criticalAlert, ...prev]);
              }}
              className="w-full rounded bg-red-700 px-4 py-2 text-white transition-colors hover:bg-red-600"
            >
              Simulate Critical Alert
            </button>

            <button
              onClick={() => {
                setAlerts([]);
              }}
              className="w-full rounded bg-gray-700 px-4 py-2 text-white transition-colors hover:bg-gray-600"
            >
              Clear All Alerts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
