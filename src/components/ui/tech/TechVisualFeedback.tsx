import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { TechNode } from '../../../managers/game/techTreeManager';
import { cn } from '../../../utils/cn';

// Types for the visual feedback component
interface TechVisualFeedbackProps {
  node: TechNode;
  isSelected: boolean;
  isAvailable: boolean;
  onNodeClick: (node: TechNode) => void;
  connections?: Connection[];
  showDetails?: boolean;
}

interface Connection {
  from: string;
  to: string;
  status: 'locked' | 'available' | 'unlocked';
}

// Icons for different tech categories
const categoryIcons = {
  infrastructure: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  warFleet: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d="M2 20h.01" />
      <path d="M7 20v-4" />
      <path d="M12 20v-8" />
      <path d="M17 20V8" />
      <path d="M22 4v16" />
    </svg>
  ),
  reconFleet: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="22" y1="12" x2="18" y2="12" />
      <line x1="6" y1="12" x2="2" y2="12" />
      <line x1="12" y1="6" x2="12" y2="2" />
      <line x1="12" y1="22" x2="12" y2="18" />
    </svg>
  ),
  miningFleet: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d="M14 10a3.5 3.5 0 0 0-5 0l-4 4a3.5 3.5 0 0 0 5 5l.5-.5" />
      <path d="M10 14a3.5 3.5 0 0 0 5 0l4-4a3.5 3.5 0 0 0-5-5l-.5.5" />
    </svg>
  ),
  weapons: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  defense: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  special: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  synergy: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <circle cx="18" cy="18" r="3" />
      <circle cx="6" cy="6" r="3" />
      <path d="M13 6h3a2 2 0 0 1 2 2v7" />
      <line x1="6" y1="9" x2="6" y2="21" />
    </svg>
  ),
};

/**
 * Enhanced visual feedback component for tech tree nodes
 */
export function TechVisualFeedback({
  node,
  isSelected,
  isAvailable,
  onNodeClick,
  connections = [],
  showDetails = false,
}: TechVisualFeedbackProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);

  // Determine node status for styling
  const nodeStatus = node.unlocked ? 'unlocked' : isAvailable ? 'available' : 'locked';

  // Set up pulse animation for newly available nodes
  useEffect(() => {
    if (isAvailable && !node.unlocked) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 10000); // Show pulse for 10 seconds
      return () => clearTimeout(timer);
    }
  }, [isAvailable, node.unlocked]);

  // Get color based on tier and status
  const getNodeColor = () => {
    const tierColors = {
      1: {
        unlocked: 'bg-blue-500 border-blue-300',
        available: 'bg-blue-700 border-blue-500',
        locked: 'bg-gray-700 border-gray-600',
      },
      2: {
        unlocked: 'bg-green-500 border-green-300',
        available: 'bg-green-700 border-green-500',
        locked: 'bg-gray-700 border-gray-600',
      },
      3: {
        unlocked: 'bg-purple-500 border-purple-300',
        available: 'bg-purple-700 border-purple-500',
        locked: 'bg-gray-700 border-gray-600',
      },
      4: {
        unlocked: 'bg-amber-500 border-amber-300',
        available: 'bg-amber-700 border-amber-500',
        locked: 'bg-gray-700 border-gray-600',
      },
    };

    return tierColors[node.tier][nodeStatus];
  };

  // Get icon color based on status
  const getIconColor = () => {
    if (node.unlocked) return 'text-white';
    if (isAvailable) return 'text-gray-200';
    return 'text-gray-400';
  };

  // Render connections between nodes
  const renderConnections = () => {
    return connections.map((connection, index) => {
      if (connection.from === node.id || connection.to === node.id) {
        // Determine connection color based on status
        const connectionColor =
          connection.status === 'unlocked'
            ? 'stroke-blue-400'
            : connection.status === 'available'
              ? 'stroke-blue-600'
              : 'stroke-gray-600';

        return (
          <svg
            key={`${connection.from}-${connection.to}-${index}`}
            className="pointer-events-none absolute left-0 top-0 h-full w-full"
          >
            <line
              x1="50%"
              y1="50%"
              x2="50%"
              y2="50%"
              className={cn('stroke-2', connectionColor)}
              strokeDasharray={connection.status === 'locked' ? '5,5' : 'none'}
            />
          </svg>
        );
      }
      return null;
    });
  };

  // Render the tech node with enhanced visual feedback
  return (
    <div className="relative">
      {renderConnections()}

      <motion.div
        ref={nodeRef}
        className={cn(
          'relative flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-full border-2 p-2 transition-all duration-300',
          getNodeColor(),
          isSelected && 'ring-4 ring-white',
          isHovered && 'scale-110'
        )}
        whileHover={{ scale: 1.1 }}
        onClick={() => onNodeClick(node)}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        {/* Pulse animation for available nodes */}
        {showPulse && (
          <motion.div
            className="absolute inset-0 rounded-full bg-blue-400 opacity-0"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: 'loop',
            }}
          />
        )}

        {/* Lock icon for locked nodes */}
        {!node.unlocked && !isAvailable && (
          <div className="absolute -right-2 -top-2 rounded-full bg-gray-800 p-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-gray-400"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
        )}

        {/* Checkmark for unlocked nodes */}
        {node.unlocked && (
          <motion.div
            className="absolute -right-2 -top-2 rounded-full bg-green-500 p-1"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-white"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </motion.div>
        )}

        {/* Tech category icon */}
        <div className={cn('mb-1', getIconColor())}>
          {categoryIcons[node.category] || (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          )}
        </div>

        {/* Tech name (shortened for space) */}
        <div className="text-center text-xs font-medium text-white">
          {node.name.length > 12 ? `${node.name.substring(0, 10)}...` : node.name}
        </div>
      </motion.div>

      {/* Detailed tooltip on hover */}
      <AnimatePresence>
        {(isHovered || showDetails) && (
          <motion.div
            className="absolute left-full top-0 z-10 ml-4 w-64 rounded-md bg-gray-800 p-4 shadow-lg"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="mb-1 text-lg font-bold text-white">{node.name}</h3>
            <div className="mb-2 flex items-center text-sm">
              <span
                className={cn(
                  'mr-2 inline-block h-3 w-3 rounded-full',
                  node.unlocked ? 'bg-green-500' : isAvailable ? 'bg-blue-500' : 'bg-gray-500'
                )}
              ></span>
              <span className="text-gray-300">
                {node.unlocked ? 'Unlocked' : isAvailable ? 'Available' : 'Locked'}
              </span>
              <span className="ml-auto text-gray-400">Tier {node.tier}</span>
            </div>
            <p className="mb-3 text-sm text-gray-300">{node.description}</p>

            {/* Requirements section */}
            {node.requirements.length > 0 && !node.unlocked && (
              <div className="mt-2">
                <h4 className="mb-1 text-xs font-semibold uppercase text-gray-400">Requirements</h4>
                <ul className="text-xs text-gray-300">
                  {node.requirements.map(req => (
                    <li key={req} className="flex items-center">
                      <span
                        className={cn(
                          'mr-1 inline-block h-2 w-2 rounded-full',
                          isAvailable ? 'bg-green-500' : 'bg-gray-500'
                        )}
                      ></span>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Unlocks section for unlocked nodes */}
            {node.unlocked && (
              <div className="mt-2 rounded-md bg-gray-700 p-2">
                <div className="text-xs font-semibold text-green-400">Technology Unlocked</div>
              </div>
            )}

            {/* Call-to-action for available nodes */}
            {isAvailable && !node.unlocked && (
              <motion.button
                className="mt-2 w-full rounded-md bg-blue-600 px-2 py-1 text-sm font-medium text-white hover:bg-blue-500"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={e => {
                  e.stopPropagation();
                  onNodeClick(node);
                }}
              >
                Research Technology
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Component to display tech tree connections with animated progress
 */
export function TechConnectionLine({
  from,
  to,
  status,
  progress = 1,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  status: 'locked' | 'available' | 'unlocked';
  progress?: number;
}) {
  // Calculate line properties
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Determine line color based on status
  const lineColor =
    status === 'unlocked'
      ? 'stroke-blue-400'
      : status === 'available'
        ? 'stroke-blue-600'
        : 'stroke-gray-600';

  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: from.x,
        top: from.y,
        width: length,
        height: 4,
        transformOrigin: '0 50%',
        transform: `rotate(${angle}deg)`,
      }}
    >
      <div
        className={cn(
          'h-0.5 w-full rounded-full',
          status === 'locked' ? 'border-dashed' : '',
          status === 'locked' ? 'bg-gray-600' : 'bg-gray-800'
        )}
      >
        <motion.div
          className={cn('h-full rounded-full', lineColor)}
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

/**
 * Component to display a research progress indicator
 */
export function ResearchProgressIndicator({
  progress,
  totalTime,
  isActive,
}: {
  progress: number;
  totalTime: number;
  isActive: boolean;
}) {
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-700">
      <motion.div
        className="absolute inset-0 bg-blue-500"
        initial={{ width: 0 }}
        animate={{ width: `${progress * 100}%` }}
        transition={{
          duration: isActive ? totalTime * (1 - progress) : 0,
          ease: 'linear',
        }}
      />

      {isActive && (
        <motion.div
          className="absolute inset-0 bg-blue-300 opacity-30"
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}
    </div>
  );
}

/**
 * Component to display tech tree node synergies
 */
export function TechSynergyIndicator({
  nodes,
  activeNodeId,
}: {
  nodes: TechNode[];
  activeNodeId: string;
}) {
  // Filter for unlocked nodes that have synergies
  const unlockedNodes = nodes.filter(node => node.unlocked);

  // Find the active node
  const activeNode = nodes.find(node => node.id === activeNodeId);

  if (!activeNode) return null;

  // Calculate synergy strength (this would be based on your game's logic)
  const calculateSynergyStrength = (node1: TechNode, node2: TechNode): number => {
    // Example logic - nodes in same category have stronger synergy
    if (node1.category === node2.category) return 0.8;

    // Nodes in complementary categories
    const complementary: Record<string, string[]> = {
      warFleet: ['weapons', 'defense'],
      weapons: ['warFleet', 'defense'],
      defense: ['warFleet', 'weapons'],
      miningFleet: ['infrastructure'],
      reconFleet: ['infrastructure'],
      infrastructure: ['miningFleet', 'reconFleet'],
      special: ['infrastructure', 'weapons', 'defense'],
      synergy: ['special', 'infrastructure'],
    };

    if (complementary[node1.category]?.includes(node2.category)) return 0.5;

    // Default weak synergy
    return 0.2;
  };

  // Find synergies with the active node
  const synergies = unlockedNodes
    .filter(node => node.id !== activeNodeId)
    .map(node => ({
      node,
      strength: calculateSynergyStrength(activeNode, node),
    }))
    .filter(synergy => synergy.strength > 0)
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 3); // Show top 3 synergies

  if (synergies.length === 0) return null;

  return (
    <div className="mt-4 rounded-md bg-gray-800 p-3">
      <h4 className="mb-2 text-sm font-semibold text-blue-400">Technology Synergies</h4>
      <div className="space-y-2">
        {synergies.map(({ node, strength }) => (
          <div key={node.id} className="flex items-center">
            <div className="mr-2 h-8 w-8 flex-shrink-0 rounded-full bg-gray-700 p-1">
              <div className="flex h-full w-full items-center justify-center text-gray-300">
                {categoryIcons[node.category]}
              </div>
            </div>
            <div className="flex-grow">
              <div className="text-xs font-medium text-gray-300">{node.name}</div>
              <div className="mt-1 h-1 w-full rounded-full bg-gray-700">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${strength * 100}%` }}
                />
              </div>
            </div>
            <div className="ml-2 text-xs font-medium text-gray-400">
              {Math.round(strength * 100)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
