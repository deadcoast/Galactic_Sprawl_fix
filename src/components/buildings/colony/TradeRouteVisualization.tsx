import { motion } from 'framer-motion';
import { Package, TrendingDown, TrendingUp, Truck } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface TradePartner {
  id: string;
  name: string;
  distance: number; // Distance in light years or other unit
  position: { x: number; y: number }; // Relative position for visualization
}

interface TradeResource {
  id: string;
  name: string;
  type: 'import' | 'export';
  amount: number;
  value: number;
}

interface TradeRoute {
  id: string;
  partnerId: string;
  status: 'active' | 'pending' | 'disrupted';
  resources: TradeResource[];
  efficiency: number; // 0-1 efficiency factor
  lastTradeTime: number; // Timestamp of last trade
}

interface TradeRouteVisualizationProps {
  colonyId: string;
  colonyName: string;
  tradePartners: TradePartner[];
  tradeRoutes: TradeRoute[];
  quality: 'low' | 'medium' | 'high';
  onRouteClick?: (routeId: string) => void;
  onPartnerClick?: (partnerId: string) => void;
}

/**
 * TradeRouteVisualization component
 *
 * Visualizes trade routes between the colony and its trade partners.
 * Shows resource flows, trade efficiency, and allows interaction with routes.
 */
export function TradeRouteVisualization({
  colonyId: _colonyId,
  colonyName,
  tradePartners,
  tradeRoutes,
  quality,
  onRouteClick,
  onPartnerClick,
}: TradeRouteVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredRoute, setHoveredRoute] = useState<string | null>(null);
  const [hoveredPartner, setHoveredPartner] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Set up canvas dimensions
  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height });
    }

    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate trade metrics
  const totalImports = tradeRoutes.reduce(
    (sum, route) =>
      sum +
      route.resources.filter(r => r.type === 'import').reduce((total, r) => total + r.value, 0),
    0
  );

  const totalExports = tradeRoutes.reduce(
    (sum, route) =>
      sum +
      route.resources.filter(r => r.type === 'export').reduce((total, r) => total + r.value, 0),
    0
  );

  const tradeBalance = totalExports - totalImports;

  // Determine particle count based on quality
  const getParticleCount = (routeId: string) => {
    const route = tradeRoutes.find(r => r.id === routeId);
    if (!route) {
      return 0;
    }

    const baseCount = quality === 'high' ? 8 : quality === 'medium' ? 5 : 3;
    return Math.max(1, Math.round(baseCount * route.efficiency));
  };

  // Get route color based on status
  const getRouteColor = (status: TradeRoute['status']) => {
    switch (status) {
      case 'active':
        return 'rgba(52, 211, 153, 0.7)'; // Green
      case 'pending':
        return 'rgba(251, 191, 36, 0.7)'; // Yellow
      case 'disrupted':
        return 'rgba(239, 68, 68, 0.7)'; // Red
      default:
        return 'rgba(156, 163, 175, 0.7)'; // Gray
    }
  };

  // Get resource icon
  const getResourceIcon = (type: TradeResource['type']) => {
    return type === 'import' ? (
      <TrendingDown className="h-3 w-3 text-blue-400" />
    ) : (
      <TrendingUp className="h-3 w-3 text-green-400" />
    );
  };

  // Format value with + or - sign
  const formatValue = (value: number, type: TradeResource['type']) => {
    return type === 'import' ? `-${value}` : `+${value}`;
  };

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Trade Routes</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <TrendingDown className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-blue-400">{totalImports}</span>
          </div>
          <div className="flex items-center space-x-1">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <span className="text-sm text-green-400">{totalExports}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-sm font-medium text-gray-300">Balance:</span>
            <span
              className={`text-sm font-medium ${
                tradeBalance > 0
                  ? 'text-green-400'
                  : tradeBalance < 0
                    ? 'text-red-400'
                    : 'text-gray-400'
              }`}
            >
              {tradeBalance > 0 ? '+' : ''}
              {tradeBalance}
            </span>
          </div>
        </div>
      </div>

      {/* Trade Route Map */}
      <div
        ref={containerRef}
        className="relative mb-4 h-64 rounded-lg border border-gray-700 bg-gray-900"
      >
        {/* Colony (Center) */}
        <div className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 transform items-center justify-center rounded-full bg-indigo-900 shadow-lg">
          <div className="text-center">
            <div className="text-xs font-medium text-white">{colonyName}</div>
            <div className="text-[10px] text-indigo-300">{tradeRoutes.length} Routes</div>
          </div>
        </div>

        {/* Trade Partners and Routes */}
        {tradePartners.map(partner => {
          const route = tradeRoutes.find(r => r.partnerId === partner.id);
          const isHovered = hoveredPartner === partner.id || (route && hoveredRoute === route.id);

          // Calculate position within container
          const centerX = dimensions.width / 2;
          const centerY = dimensions.height / 2;
          const x = centerX + partner.position.x * (dimensions.width / 3);
          const y = centerY + partner.position.y * (dimensions.height / 3);

          return (
            <React.Fragment key={partner.id}>
              {/* Trade Route Line */}
              {route && (
                <div
                  className="absolute left-1/2 top-1/2 h-0.5 origin-left transform"
                  style={{
                    width: Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)),
                    transform: `rotate(${Math.atan2(y - centerY, x - centerX)}rad) translateX(6px)`,
                    backgroundColor: getRouteColor(route.status),
                    opacity: isHovered ? 1 : 0.6,
                    zIndex: isHovered ? 10 : 1,
                  }}
                  onMouseEnter={() => route && setHoveredRoute(route.id)}
                  onMouseLeave={() => setHoveredRoute(null)}
                  onClick={() => route && onRouteClick?.(route.id)}
                >
                  {/* Resource Flow Particles */}
                  {route.status === 'active' &&
                    Array.from({ length: getParticleCount(route.id) }).map((_, i) => {
                      const isImport = i % 2 === 0;
                      return (
                        <motion.div
                          key={`particle-${route.id}-${i}`}
                          className={`absolute h-2 w-2 rounded-full ${
                            isImport ? 'bg-blue-500' : 'bg-green-500'
                          }`}
                          animate={{
                            left: isImport ? ['0%', '100%'] : ['100%', '0%'],
                          }}
                          transition={{
                            duration: 2 + (i % 3),
                            repeat: Infinity,
                            ease: 'linear',
                            delay: i * 0.5,
                          }}
                          style={{
                            top: '-3px',
                          }}
                        />
                      );
                    })}
                </div>
              )}

              {/* Trade Partner Node */}
              <div
                className={`absolute flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-all ${
                  isHovered ? 'scale-110' : 'scale-100'
                } ${
                  route
                    ? route.status === 'active'
                      ? 'bg-green-800'
                      : route.status === 'pending'
                        ? 'bg-yellow-800'
                        : 'bg-red-800'
                    : 'bg-gray-700'
                }`}
                style={{
                  left: x,
                  top: y,
                  transform: 'translate(-50%, -50%)',
                  zIndex: isHovered ? 20 : 2,
                }}
                onMouseEnter={() => setHoveredPartner(partner.id)}
                onMouseLeave={() => setHoveredPartner(null)}
                onClick={() => onPartnerClick?.(partner.id)}
              >
                <Truck className="h-5 w-5 text-white" />
              </div>

              {/* Partner Label */}
              <div
                className={`absolute whitespace-nowrap text-center text-xs transition-opacity ${
                  isHovered ? 'opacity-100' : 'opacity-70'
                }`}
                style={{
                  left: x,
                  top: y + 20,
                  transform: 'translate(-50%, 0)',
                  zIndex: isHovered ? 20 : 2,
                }}
              >
                <div className="font-medium text-white">{partner.name}</div>
                <div className="text-[10px] text-gray-400">{partner.distance} LY</div>
              </div>

              {/* Route Details Tooltip */}
              {route && hoveredRoute === route.id && (
                <div
                  className="absolute z-30 w-48 rounded-md border border-gray-700 bg-gray-800 p-2 shadow-lg"
                  style={{
                    left: (x + centerX) / 2,
                    top: (y + centerY) / 2,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="mb-1 text-center text-sm font-medium text-white">
                    {colonyName} ↔ {partner.name}
                  </div>
                  <div className="mb-2 flex justify-between text-xs">
                    <span className="text-gray-400">Status:</span>
                    <span
                      className={
                        route.status === 'active'
                          ? 'text-green-400'
                          : route.status === 'pending'
                            ? 'text-yellow-400'
                            : 'text-red-400'
                      }
                    >
                      {route.status.charAt(0).toUpperCase() + route.status.slice(1)}
                    </span>
                  </div>
                  <div className="mb-1 text-xs text-gray-400">Resources:</div>
                  <div className="max-h-20 overflow-y-auto">
                    {route.resources.map(resource => (
                      <div
                        key={resource.id}
                        className="flex items-center justify-between border-t border-gray-700 py-1 text-xs"
                      >
                        <div className="flex items-center space-x-1">
                          {getResourceIcon(resource.type)}
                          <span className="text-gray-300">{resource.name}</span>
                        </div>
                        <div
                          className={
                            resource.type === 'import' ? 'text-blue-400' : 'text-green-400'
                          }
                        >
                          {formatValue(resource.value, resource.type)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between border-t border-gray-700 pt-1 text-xs">
                    <span className="text-gray-400">Efficiency:</span>
                    <span className="text-gray-300">{Math.round(route.efficiency * 100)}%</span>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Trade Routes List */}
      <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-700">
        {tradeRoutes.length === 0 ? (
          <div className="flex h-16 items-center justify-center text-sm text-gray-500">
            No active trade routes
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Partner</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Resources</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-400">Balance</th>
              </tr>
            </thead>
            <tbody>
              {tradeRoutes.map(route => {
                const partner = tradePartners.find(p => p.id === route.partnerId);
                if (!partner) return null;

                const imports = route.resources
                  .filter(r => r.type === 'import')
                  .reduce((sum, r) => sum + r.value, 0);

                const exports = route.resources
                  .filter(r => r.type === 'export')
                  .reduce((sum, r) => sum + r.value, 0);

                const balance = exports - imports;

                return (
                  <tr
                    key={route.id}
                    className={`border-t border-gray-700 transition-colors ${
                      hoveredRoute === route.id ? 'bg-gray-700' : 'hover:bg-gray-700/50'
                    }`}
                    onMouseEnter={() => setHoveredRoute(route.id)}
                    onMouseLeave={() => setHoveredRoute(null)}
                    onClick={() => onRouteClick?.(route.id)}
                  >
                    <td className="px-3 py-2 text-sm text-white">{partner.name}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                          route.status === 'active'
                            ? 'bg-green-900/30 text-green-400'
                            : route.status === 'pending'
                              ? 'bg-yellow-900/30 text-yellow-400'
                              : 'bg-red-900/30 text-red-400'
                        }`}
                      >
                        {route.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center space-x-1">
                        <Package className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-300">
                          {route.resources.length} types
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span
                        className={`text-sm font-medium ${
                          balance > 0
                            ? 'text-green-400'
                            : balance < 0
                              ? 'text-red-400'
                              : 'text-gray-400'
                        }`}
                      >
                        {balance > 0 ? '+' : ''}
                        {balance}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
