import { useState } from 'react';
import { Database, AlertTriangle } from 'lucide-react';

interface MineralNode {
  id: string;
  type: string;
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
  onPriorityChange
}: MineralProcessingProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const particleCount = quality === 'high' ? 12 : quality === 'medium' ? 8 : 4;

  return (
    <div className="relative w-96 h-96">
      {/* Processing Center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {/* Central Processor */}
          <div className="w-40 h-40 bg-gray-800/80 rounded-lg border-4 border-amber-500/30 flex items-center justify-center transform rotate-45">
            <div className="w-24 h-24 bg-amber-900/50 rounded-lg flex items-center justify-center transform -rotate-45">
              <Database className="w-12 h-12 text-amber-400" />
            </div>
          </div>

          {/* Processing Field */}
          <div 
            className="absolute inset-0 rounded-full border-2 border-amber-500/20"
            style={{
              transform: `scale(${2 + (tier * 0.5)})`,
              animation: 'pulse 4s infinite'
            }}
          />

          {/* Mineral Nodes */}
          {nodes.map((node, index) => {
            const angle = (index / nodes.length) * Math.PI * 2;
            const radius = 80;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            return (
              <div
                key={node.id}
                className="absolute"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`
                }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => onNodeClick?.(node.id)}
              >
                <div className={`p-4 rounded-lg transition-all duration-300 ${
                  node.status === 'active' ? 'bg-amber-500/20' :
                  node.status === 'depleted' ? 'bg-red-500/20' :
                  'bg-gray-500/20'
                } ${hoveredNode === node.id ? 'scale-110' : 'scale-100'}`}>
                  <Database className={`w-6 h-6 ${
                    node.status === 'active' ? 'text-amber-400' :
                    node.status === 'depleted' ? 'text-red-400' :
                    'text-gray-400'
                  }`} />

                  {/* Resource Flow */}
                  {node.status === 'active' && quality !== 'low' && (
                    <svg className="absolute inset-0 pointer-events-none">
                      <line
                        x1="50%"
                        y1="50%"
                        x2="0"
                        y2="0"
                        stroke="rgba(245, 158, 11, 0.3)"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      >
                        <animate
                          attributeName="stroke-dashoffset"
                          values="8;0"
                          dur="1s"
                          repeatCount="indefinite"
                        />
                      </line>
                    </svg>
                  )}

                  {/* Priority Indicator */}
                  <div 
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gray-800 border-2 border-amber-500 flex items-center justify-center cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPriorityChange?.(node.id, (node.priority % 3) + 1);
                    }}
                  >
                    <span className="text-xs text-amber-400">{node.priority}</span>
                  </div>

                  {/* Node Info Tooltip */}
                  {hoveredNode === node.id && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-800/90 rounded-lg border border-gray-700 whitespace-nowrap z-10">
                      <div className="text-sm font-medium text-white">{node.type}</div>
                      <div className="text-xs text-gray-400">
                        Amount: {Math.round((node.amount / node.maxAmount) * 100)}%
                      </div>
                      <div className="text-xs text-gray-400">
                        Rate: {node.extractionRate}/s
                      </div>
                      {node.status === 'depleted' && (
                        <div className="text-xs text-red-400">Depleted</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Efficiency Rings */}
          {Array.from({ length: tier }).map((_, i) => (
            <div
              key={i}
              className="absolute inset-0 border border-amber-500/10 rounded-full"
              style={{
                transform: `scale(${1.5 + i * 0.3}) rotate(${i * 45}deg)`,
                animation: `spin ${10 + i * 5}s linear infinite`
              }}
            />
          ))}

          {/* Particle Effects */}
          {Array.from({ length: particleCount }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-amber-400 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                opacity: 0.5 + Math.random() * 0.5
              }}
            />
          ))}
        </div>
      </div>

      {/* Processing Info */}
      <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 space-y-2 w-48">
        <div className="text-center">
          <div className="text-amber-200 font-medium">Mineral Processing</div>
          <div className="text-amber-300/70 text-sm">
            Tier {tier} • {nodes.filter(n => n.status === 'active').length} Active Nodes
          </div>
        </div>

        {/* Efficiency Bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Processing Efficiency</span>
            <span className="text-gray-300">{Math.round(efficiency * 100)}%</span>
          </div>
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all"
              style={{ width: `${efficiency * 100}%` }}
            />
          </div>
        </div>

        {/* Output Rate */}
        <div className="text-xs text-center text-gray-400">
          Output: {totalOutput.toLocaleString()}/cycle
        </div>
      </div>

      {/* Warnings */}
      {nodes.some(n => n.status === 'depleted') && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-red-900/80 border border-red-700 rounded-full flex items-center space-x-1">
          <AlertTriangle className="w-3 h-3 text-red-400" />
          <span className="text-xs text-red-200">Depleted Nodes Detected</span>
        </div>
      )}
    </div>
  );
}