/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import { AlertTriangle, Database } from 'lucide-react';
import { ResourceType } from '../../types/resources/ResourceTypes';
import * as React from "react";
import { useState } from 'react';

interface MineralNode {
  id: string;
  type: ResourceType;
  amount: number;
  maxAmount: number;
  extractionRate: number;
  priority: number;
  status: 'active' | 'depleted' | 'paused';
}

interface MineralProcessingProps {
  tier: 1 | 2 | 3;
  nodes: MineralNode[];
  totalOutput: number;
  efficiency: number;
  quality: 'low' | 'medium' | 'high';
  onNodeClick?: (nodeId: string) => void;
  onPriorityChange?: (nodeId: string, priority: number) => void;
}

export function MineralProcessing({
  tier,
  nodes,
  totalOutput,
  efficiency,
  quality,
  onNodeClick,
  onPriorityChange,
}: MineralProcessingProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const particleCount = quality === 'high' ? 12 : quality === 'medium' ? 8 : 4;

  return React.createElement(
    'div',
    { className: 'relative h-96 w-96' },
    /* Processing Center */
    React.createElement(
      'div',
      { className: 'absolute inset-0 flex items-center justify-center' },
      React.createElement(
        'div',
        { className: 'relative' },
        /* Central Processor */
        React.createElement(
          'div',
          {
            className:
              'flex h-40 w-40 rotate-45 transform items-center justify-center rounded-lg border-4 border-amber-500/30 bg-gray-800/80',
          },
          React.createElement(
            'div',
            {
              className:
                'flex h-24 w-24 -rotate-45 transform items-center justify-center rounded-lg bg-amber-900/50',
            },
            React.createElement(Database, { className: 'h-12 w-12 text-amber-400' })
          )
        ),

        /* Processing Field */
        React.createElement('div', {
          className: 'absolute inset-0 rounded-full border-2 border-amber-500/20',
          style: {
            transform: `scale(${2 + tier * 0.5})`,
            animation: 'pulse 4s infinite',
          },
        }),

        /* Mineral Nodes */
        nodes.map((node, index) => {
          const angle = (index / nodes.length) * Math.PI * 2;
          const radius = 80;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return React.createElement(
            'div',
            {
              key: node.id,
              className: 'absolute',
              style: {
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
              },
              onMouseEnter: () => setHoveredNode(node.id),
              onMouseLeave: () => setHoveredNode(null),
              onClick: () => onNodeClick?.(node.id),
            },
            React.createElement(
              'div',
              {
                className: `rounded-lg p-4 transition-all duration-300 ${
                  node.status === 'active'
                    ? 'bg-amber-500/20'
                    : node.status === 'depleted'
                      ? 'bg-red-500/20'
                      : 'bg-gray-500/20'
                } ${hoveredNode === node.id ? 'scale-110' : 'scale-100'}`,
              },
              React.createElement(Database, {
                className: `h-6 w-6 ${
                  node.status === 'active'
                    ? 'text-amber-400'
                    : node.status === 'depleted'
                      ? 'text-red-400'
                      : 'text-gray-400'
                }`,
              }),

              /* Resource Flow */
              node.status === 'active' &&
                quality !== 'low' &&
                React.createElement(
                  'svg',
                  { className: 'pointer-events-none absolute inset-0' },
                  React.createElement(
                    'line',
                    {
                      x1: '50%',
                      y1: '50%',
                      x2: '0',
                      y2: '0',
                      stroke: 'rgba(245, 158, 11, 0.3)',
                      strokeWidth: '2',
                      strokeDasharray: '4 4',
                    },
                    React.createElement('animate', {
                      attributeName: 'stroke-dashoffset',
                      values: '8;0',
                      dur: '1s',
                      repeatCount: 'indefinite',
                    })
                  )
                ),

              /* Priority Indicator */
              React.createElement(
                'div',
                {
                  className:
                    'absolute -right-1 -top-1 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border-2 border-amber-500 bg-gray-800',
                  onClick: (e: React.MouseEvent<HTMLDivElement>) => {
                    e.stopPropagation();
                    onPriorityChange?.(node.id, (node.priority % 3) + 1);
                  },
                },
                React.createElement('span', { className: 'text-xs text-amber-400' }, node.priority)
              ),

              /* Node Info Tooltip */
              hoveredNode === node.id &&
                React.createElement(
                  'div',
                  {
                    className:
                      'absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 transform whitespace-nowrap rounded-lg border border-gray-700 bg-gray-800/90 px-3 py-2',
                  },
                  React.createElement(
                    'div',
                    { className: 'text-sm font-medium text-white' },
                    node.type
                  ),
                  React.createElement(
                    'div',
                    { className: 'text-xs text-gray-400' },
                    `Amount: ${Math.round((node.amount / node.maxAmount) * 100)}%`
                  ),
                  React.createElement(
                    'div',
                    { className: 'text-xs text-gray-400' },
                    `Rate: ${node.extractionRate}/s`
                  ),
                  node.status === 'depleted' &&
                    React.createElement('div', { className: 'text-xs text-red-400' }, 'Depleted')
                )
            )
          );
        }),

        /* Efficiency Rings */
        Array.from({ length: tier }).map((_, i) =>
          React.createElement('div', {
            key: i,
            className: 'absolute inset-0 rounded-full border border-amber-500/10',
            style: {
              transform: `scale(${1.5 + i * 0.3}) rotate(${i * 45}deg)`,
              animation: `spin ${10 + i * 5}s linear infinite`,
            },
          })
        ),

        /* Particle Effects */
        Array.from({ length: particleCount }).map((_, i) =>
          React.createElement('div', {
            key: i,
            className: 'animate-float absolute h-2 w-2 rounded-full bg-amber-400',
            style: {
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              opacity: 0.5 + Math.random() * 0.5,
            },
          })
        )
      )
    ),

    /* Processing Info */
    React.createElement(
      'div',
      { className: 'absolute -bottom-12 left-1/2 w-48 -translate-x-1/2 transform space-y-2' },
      React.createElement(
        'div',
        { className: 'text-center' },
        React.createElement(
          'div',
          { className: 'font-medium text-amber-200' },
          'Mineral Processing'
        ),
        React.createElement(
          'div',
          { className: 'text-sm text-amber-300/70' },
          `Tier ${tier} • ${nodes.filter(n => n.status === 'active').length} Active Nodes`
        )
      ),

      /* Efficiency Bar */
      React.createElement(
        'div',
        null,
        React.createElement(
          'div',
          { className: 'mb-1 flex justify-between text-xs' },
          React.createElement('span', { className: 'text-gray-400' }, 'Processing Efficiency'),
          React.createElement(
            'span',
            { className: 'text-gray-300' },
            `${Math.round(efficiency * 100)}%`
          )
        ),
        React.createElement(
          'div',
          { className: 'h-1.5 overflow-hidden rounded-full bg-gray-700' },
          React.createElement('div', {
            className: 'h-full rounded-full bg-amber-500 transition-all',
            style: { width: `${efficiency * 100}%` },
          })
        )
      ),

      /* Output Rate */
      React.createElement(
        'div',
        { className: 'text-center text-xs text-gray-400' },
        `Output: ${totalOutput.toLocaleString()}/cycle`
      )
    ),

    /* Warnings */
    nodes.some(n => n.status === 'depleted') &&
      React.createElement(
        'div',
        {
          className:
            'absolute -top-8 left-1/2 flex -translate-x-1/2 transform items-center space-x-1 rounded-full border border-red-700 bg-red-900/80 px-3 py-1',
        },
        React.createElement(AlertTriangle, { className: 'h-3 w-3 text-red-400' }),
        React.createElement(
          'span',
          { className: 'text-xs text-red-200' },
          'Depleted Nodes Detected'
        )
      )
  );
}
