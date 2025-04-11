/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import { AlertTriangle, Database, Star, Users } from 'lucide-react';
import * as React from 'react';
import { ResourceType, ResourceTypeInfo } from '../../types/resources/ResourceTypes';

interface ColonyModule {
  id: string;
  type: 'residential' | 'commercial' | 'industrial';
  population: number;
  efficiency: number;
  status: 'active' | 'constructing' | 'damaged';
}

interface ColonyStarStationProps {
  name: string;
  tier: 1 | 2 | 3;
  modules: ColonyModule[];
  population: number;
  maxPopulation: number;
  resourceOutput: number;
  quality: 'low' | 'medium' | 'high';
  onClick?: () => void;
}

export function ColonyStarStation({
  name,
  tier,
  modules,
  population,
  maxPopulation,
  resourceOutput,
  quality,
  onClick,
}: ColonyStarStationProps) {
  const [hoveredModule, setHoveredModule] = React.useState<string | null>(null);
  const particleCount = quality === 'high' ? 12 : quality === 'medium' ? 8 : 4;

  return React.createElement(
    'div',
    { className: 'group relative h-80 w-80 cursor-pointer', onClick: onClick },
    [
      /* Core Station */
      React.createElement(
        'div',
        { className: 'absolute inset-0 flex items-center justify-center', key: 'core-station' },
        React.createElement('div', { className: 'relative' }, [
          /* Central Hub */
          React.createElement(
            'div',
            {
              className:
                'flex h-32 w-32 rotate-45 transform items-center justify-center rounded-lg border-4 border-cyan-500/30 bg-gray-800/80',
              key: 'central-hub',
            },
            React.createElement(
              'div',
              {
                className:
                  'flex h-20 w-20 -rotate-45 transform items-center justify-center rounded-lg bg-cyan-900/50',
              },
              React.createElement(Star, { className: 'h-10 w-10 text-cyan-400' })
            )
          ),

          /* Module Ring */
          React.createElement(
            'div',
            { className: 'absolute inset-0 scale-150 transform', key: 'module-ring' },
            modules.map((module, index) => {
              const angle = (index / modules.length) * Math.PI * 2;
              const x = Math.cos(angle) * 60;
              const y = Math.sin(angle) * 60;

              return React.createElement(
                'div',
                {
                  key: module.id,
                  className: 'absolute',
                  style: {
                    left: '50%',
                    top: '50%',
                    transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                  },
                  onMouseEnter: () => setHoveredModule(module.id),
                  onMouseLeave: () => setHoveredModule(null),
                },
                [
                  React.createElement(
                    'div',
                    {
                      className: `h-16 w-16 rounded-lg transition-all duration-300 ${
                        module.status === 'active'
                          ? 'bg-cyan-500/20'
                          : module.status === 'constructing'
                            ? 'bg-yellow-500/20'
                            : 'bg-red-500/20'
                      } ${hoveredModule === module.id ? 'scale-110' : 'scale-100'}`,
                      key: 'module-box',
                    },
                    [
                      React.createElement(
                        'div',
                        {
                          className: 'flex h-full w-full items-center justify-center',
                          key: 'module-icon',
                        },
                        module.type === 'residential'
                          ? React.createElement(Users, { className: 'h-6 w-6 text-cyan-400' })
                          : module.type === 'commercial'
                            ? React.createElement(Database, { className: 'h-6 w-6 text-cyan-400' })
                            : React.createElement(Star, { className: 'h-6 w-6 text-cyan-400' })
                      ),

                      /* Module Status Indicator */
                      React.createElement('div', {
                        className: `absolute -right-1 -top-1 h-2 w-2 rounded-full ${
                          module.status === 'active'
                            ? 'bg-green-500'
                            : module.status === 'constructing'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        } animate-pulse`,
                        key: 'status-indicator',
                      }),
                    ]
                  ),

                  /* Module Tooltip */
                  hoveredModule === module.id &&
                    React.createElement(
                      'div',
                      {
                        className:
                          'absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 transform whitespace-nowrap rounded-lg border border-gray-700 bg-gray-800/90 px-3 py-2',
                        key: 'tooltip',
                      },
                      [
                        React.createElement(
                          'div',
                          { className: 'text-sm font-medium text-white', key: 'tooltip-title' },
                          `${module.type.charAt(0).toUpperCase() + module.type.slice(1)} Module`
                        ),
                        React.createElement(
                          'div',
                          { className: 'text-xs text-gray-400', key: 'tooltip-population' },
                          `Population: ${module.population.toLocaleString()} (${ResourceTypeInfo[ResourceType.POPULATION]?.displayName ?? ResourceType.POPULATION})`
                        ),
                        React.createElement(
                          'div',
                          { className: 'text-xs text-gray-400', key: 'tooltip-efficiency' },
                          `Efficiency: ${Math.round(module.efficiency * 100)}%`
                        ),
                      ]
                    ),
                ]
              );
            })
          ),

          /* Energy Field */
          React.createElement('div', {
            className: 'absolute inset-0 rounded-full border-2 border-cyan-500/20',
            style: {
              transform: `scale(${2 + tier * 0.5})`,
              animation: 'pulse 4s infinite',
            },
            key: 'energy-field',
          }),

          /* Particle Effects */
          ...Array.from({ length: particleCount }).map((_, i) =>
            React.createElement('div', {
              key: `particle-${i}`,
              className: 'animate-float absolute h-2 w-2 rounded-full bg-cyan-400',
              style: {
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                opacity: 0.5 + Math.random() * 0.5,
              },
            })
          ),
        ])
      ),

      /* Station Info */
      React.createElement(
        'div',
        {
          className: 'absolute -bottom-12 left-1/2 w-48 -translate-x-1/2 transform space-y-2',
          key: 'station-info',
        },
        [
          React.createElement('div', { className: 'text-center', key: 'station-name' }, [
            React.createElement(
              'div',
              { className: 'font-medium text-cyan-200', key: 'name' },
              name
            ),
            React.createElement(
              'div',
              { className: 'text-sm text-cyan-300/70', key: 'tier-info' },
              `Tier ${tier} • ${modules.length} Modules`
            ),
          ]),

          /* Population Bar */
          React.createElement('div', { key: 'population-bar' }, [
            React.createElement(
              'div',
              { className: 'mb-1 flex justify-between text-xs', key: 'population-labels' },
              [
                React.createElement(
                  'span',
                  { className: 'text-gray-400', key: 'pop-label' },
                  ResourceTypeInfo[ResourceType.POPULATION]?.displayName ?? ResourceType.POPULATION
                ),
                React.createElement(
                  'span',
                  { className: 'text-gray-300', key: 'pop-percent' },
                  `${Math.round((population / maxPopulation) * 100)}%`
                ),
              ]
            ),
            React.createElement(
              'div',
              { className: 'h-1.5 overflow-hidden rounded-full bg-gray-700', key: 'progress-bar' },
              React.createElement('div', {
                className: 'h-full rounded-full bg-cyan-500 transition-all',
                style: { width: `${(population / maxPopulation) * 100}%` },
              })
            ),
          ]),

          /* Resource Output */
          React.createElement(
            'div',
            { className: 'text-center text-xs text-gray-400', key: 'resource-output' },
            `Output: ${resourceOutput.toLocaleString()}/cycle`
          ),
        ]
      ),

      /* Warnings */
      modules.some(m => m.status === 'damaged') &&
        React.createElement(
          'div',
          {
            className:
              'absolute -top-8 left-1/2 flex -translate-x-1/2 transform items-center space-x-1 rounded-full border border-red-700 bg-red-900/80 px-3 py-1',
            key: 'warnings',
          },
          [
            React.createElement(AlertTriangle, {
              className: 'h-3 w-3 text-red-400',
              key: 'warning-icon',
            }),
            React.createElement(
              'span',
              { className: 'text-xs text-red-200', key: 'warning-text' },
              'Module Damage Detected'
            ),
          ]
        ),
    ]
  );
}
