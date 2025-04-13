/**
 * @context: tech-system.visualization, ui-system
 * Enhanced visual feedback component for the tech tree system
 */

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { TechNode, TechPath } from '../../../managers/game/techTreeManager';
import { getTechTreeManager } from '../../../managers/ManagerRegistry';
import { cn } from '../../../utils/cn';

// Types for the visual feedback component
interface TechVisualFeedbackProps {
  node: TechNode;
  isSelected: boolean;
  isAvailable: boolean;
  onNodeClick: (node: TechNode) => void;
  connections?: Connection[];
  showDetails?: boolean;
  showResearchProgress?: boolean;
  showSynergies?: boolean;
  showPath?: boolean;
}

interface Connection {
  from: string;
  to: string;
  status: 'locked' | 'available' | 'unlocked';
}

interface SynergyVisualizationProps {
  sourceNodeId: string;
  targetNodeId: string;
  strength: number;
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
      className="h-4 w-4"
    >
      <path d="M2 22h20"></path>
      <path d="M6 18v4"></path>
      <path d="M18 18v4"></path>
      <path d="M6 14v4"></path>
      <path d="M18 14v4"></path>
      <rect x="8" y="6" width="8" height="8"></rect>
      <path d="M2 6h20"></path>
      <path d="M2 10h20"></path>
    </svg>
  ),
  combatFleet: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M2 22h20"></path>
      <path d="M12 2v20"></path>
      <path d="M2 10h20"></path>
      <path d="M18 6 4 18"></path>
      <path d="M4 6 18 18"></path>
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
      className="h-4 w-4"
    >
      <circle cx="12" cy="12" r="8"></circle>
      <line x1="12" y1="4" x2="12" y2="8"></line>
      <line x1="12" y1="16" x2="12" y2="20"></line>
      <line x1="4" y1="12" x2="8" y2="12"></line>
      <line x1="16" y1="12" x2="20" y2="12"></line>
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
      className="h-4 w-4"
    >
      <path d="M2 12h20"></path>
      <path d="M2 4h20"></path>
      <path d="M2 20h20"></path>
      <path d="M12 2v20"></path>
      <path d="M8 6V18"></path>
      <path d="M16 6V18"></path>
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
      className="h-4 w-4"
    >
      <line x1="3" y1="10" x2="21" y2="10"></line>
      <line x1="3" y1="14" x2="21" y2="14"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
      <line x1="3" y1="6" x2="21" y2="6"></line>
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
      className="h-4 w-4"
    >
      <path d="M12 22s8-4 8-10V4l-8-2-8 2v8c0 6 8 10 8 10z"></path>
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
      className="h-4 w-4"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z"></path>
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
      className="h-4 w-4"
    >
      <circle cx="12" cy="12" r="10"></circle>
      <circle cx="12" cy="12" r="4"></circle>
      <line x1="4.93" y1="4.93" x2="9.17" y2="9.17"></line>
      <line x1="14.83" y1="14.83" x2="19.07" y2="19.07"></line>
      <line x1="14.83" y1="9.17" x2="19.07" y2="4.93"></line>
      <line x1="14.83" y1="9.17" x2="18.36" y2="5.64"></line>
      <line x1="4.93" y1="19.07" x2="9.17" y2="14.83"></line>
    </svg>
  ),
};

/**
 * @context: tech-system.visualization, ui-system
 * Enhanced visual feedback component for a single tech node
 */
export function TechVisualFeedback({
  node,
  isSelected,
  isAvailable,
  onNodeClick,
  connections = [],
  showDetails = false,
  showResearchProgress = true,
  showSynergies = true,
  showPath = false,
}: TechVisualFeedbackProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [nodePosition, setNodePosition] = useState({ x: 0, y: 0 });
  const [researchActive, setResearchActive] = useState(false);
  const [researchProgress, setResearchProgress] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [activeNodes, setActiveNodes] = useState<string[]>([]);
  const [techPath, setTechPath] = useState<TechPath | null>(null);
  const [synergies, setSynergies] = useState<SynergyVisualizationProps[]>([]);

  // Calculate node position for connections
  useEffect(() => {
    if (nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      setNodePosition({ x, y });
    }
  }, [nodeRef.current, isSelected]);

  // Set up research progress tracking
  useEffect(() => {
    const techTreeManager = getTechTreeManager();

    // Check if this node is being researched
    const activeResearch = techTreeManager.getActiveResearch();
    const researchData = activeResearch.get(node.id);

    if (researchData) {
      setResearchActive(true);
      setResearchProgress(researchData.progress);
      setRemainingTime(researchData.remainingTime);
    } else {
      setResearchActive(false);
      setResearchProgress(node.researchProgress || 0);
    }

    // Subscribe to research progress events
    const handleResearchProgress = (data: {
      nodeId: string;
      progress: number;
      remainingTime: number;
    }) => {
      if (data.nodeId === node.id) {
        setResearchActive(true);
        setResearchProgress(data.progress);
        setRemainingTime(data.remainingTime);
      }
    };

    const handleResearchCompleted = (data: { nodeId: string }) => {
      if (data.nodeId === node.id) {
        setResearchActive(false);
        setResearchProgress(1);
      }
    };

    techTreeManager.on('researchProgress', handleResearchProgress);
    techTreeManager.on('researchCompleted', handleResearchCompleted);

    return () => {
      techTreeManager.off('researchProgress', handleResearchProgress);
      techTreeManager.off('researchCompleted', handleResearchCompleted);
    };
  }, [node.id]);

  // Get synergy information
  useEffect(() => {
    if (showSynergies) {
      const techTreeManager = getTechTreeManager();
      const activeSynergies = techTreeManager.getActiveSynergies();

      const nodeSynergies: SynergyVisualizationProps[] = [];

      activeSynergies.forEach((strength, synergyPair) => {
        const [sourceId, targetId] = synergyPair.split('-');

        if (sourceId === node.id || targetId === node.id) {
          nodeSynergies.push({
            sourceNodeId: sourceId,
            targetNodeId: targetId,
            strength,
          });
        }
      });

      setSynergies(nodeSynergies);
    }
  }, [node.id, showSynergies]);

  // Get path planning information
  useEffect(() => {
    if (showPath && isSelected && !node.unlocked) {
      const techTreeManager = getTechTreeManager();
      const path = techTreeManager.findOptimalPath(node.id);
      setTechPath(path);

      if (path) {
        setActiveNodes(path.nodes);
      } else {
        setActiveNodes([]);
      }
    } else {
      setTechPath(null);
      setActiveNodes([]);
    }
  }, [node.id, isSelected, node.unlocked, showPath]);

  const getNodeColor = () => {
    if (node.unlocked) {
      return 'bg-gradient-to-br from-green-400 to-green-700';
    }

    if (researchActive) {
      return 'bg-gradient-to-br from-yellow-400 to-yellow-600';
    }

    if (isAvailable) {
      return 'bg-gradient-to-br from-blue-400 to-blue-700';
    }

    if (techPath && techPath.nodes.includes(node.id)) {
      return 'bg-gradient-to-br from-purple-400 to-purple-700';
    }

    return 'bg-gradient-to-br from-gray-400 to-gray-700';
  };

  const getIconColor = () => {
    if (node.unlocked) return 'text-green-200';
    if (researchActive) return 'text-yellow-200';
    if (isAvailable) return 'text-blue-200';
    return 'text-gray-400';
  };

  const renderConnections = () => {
    return connections.map((connection, index) => {
      // Skip rendering connections that aren't related to this node
      if (connection.from !== node.id && connection.to !== node.id) {
        return null;
      }

      // Find the other node to calculate position
      const otherNodeId = connection.from === node.id ? connection.to : connection.from;
      const otherNodeElement = document.querySelector(`[data-node-id="${otherNodeId}"]`);

      if (!otherNodeElement) {
        return null;
      }

      const rect = otherNodeElement.getBoundingClientRect();
      const otherNodePosition = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };

      // Determine source and target based on connection direction
      const source = connection.from === node.id ? nodePosition : otherNodePosition;
      const target = connection.from === node.id ? otherNodePosition : nodePosition;

      // Calculate progress based on research if applicable
      let progress = 1;
      if (connection.status === 'available' && showResearchProgress) {
        // If the source is being researched, use that progress
        if (connection.from === node.id && researchActive) {
          progress = researchProgress;
        }
      }

      return (
        <TechConnectionLine
          key={`connection-${index}`}
          from={source}
          to={target}
          status={connection.status}
          progress={progress}
        />
      );
    });
  };

  const renderSynergies = () => {
    if (!showSynergies || synergies.length === 0) {
      return null;
    }

    return (
      <div className="pointer-events-none absolute inset-0">
        {synergies.map((synergy, index) => {
          // Find the other node
          const otherNodeId =
            synergy.sourceNodeId === node.id ? synergy.targetNodeId : synergy.sourceNodeId;
          const otherNodeElement = document.querySelector(`[data-node-id="${otherNodeId}"]`);

          if (!otherNodeElement) {
            return null;
          }

          const rect = otherNodeElement.getBoundingClientRect();
          const otherNodePosition = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          };

          // Draw synergy line
          return (
            <SynergyLine
              key={`synergy-${index}`}
              from={nodePosition}
              to={otherNodePosition}
              strength={synergy.strength}
            />
          );
        })}
      </div>
    );
  };

  const renderPathInfo = () => {
    if (!showPath || !techPath || techPath.nodes.length === 0) {
      return null;
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="bg-opacity-80 absolute top-full z-20 mt-2 max-w-xs rounded-lg bg-black p-3 text-xs text-white"
      >
        <h4 className="mb-1 text-sm font-bold">Research Path</h4>
        <div className="mb-2 flex items-center">
          <span className="mr-2 text-gray-300">Time:</span>
          <span>{Math.round(techPath.totalResearchTime / 60)} minutes</span>
        </div>
        {techPath.synergyBonus > 0 && (
          <div className="mb-2 flex items-center">
            <span className="mr-2 text-gray-300">Synergy Bonus:</span>
            <span className="text-green-400">+{Math.round(techPath.synergyBonus * 100)}%</span>
          </div>
        )}
        <div className="mt-2">
          <h5 className="mb-1 font-semibold">Steps:</h5>
          <ol className="list-inside list-decimal">
            {techPath.nodes.map((nodeId, index) => {
              const pathNode = getTechTreeManager().getNode(nodeId);
              if (!pathNode) return null;
              return (
                <li key={`path-${index}`} className="mb-1">
                  {pathNode.name}
                </li>
              );
            })}
          </ol>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="relative" ref={nodeRef}>
      <motion.div
        data-node-id={node.id}
        className={cn(
          'relative rounded-lg p-3 shadow-lg transition-all duration-200 ease-in-out',
          getNodeColor(),
          {
            'ring-opacity-75 ring-4 shadow-blue-500/50 ring-blue-500': isSelected,
            'cursor-pointer': isAvailable || node.unlocked,
            'cursor-not-allowed opacity-60 grayscale filter': !isAvailable && !node.unlocked,
            'hover:scale-105 hover:shadow-xl': isAvailable || node.unlocked,
            'animate-pulse-slow ring-2 ring-purple-400 ring-offset-1 ring-offset-gray-900':
              activeNodes.includes(node.id) && !isSelected && !node.unlocked,
          }
        )}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onNodeClick(node)}
        whileHover={{ scale: isAvailable || node.unlocked ? 1.05 : 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="mb-2 flex items-center">
          <div className={cn('mr-2 rounded-full p-1', getIconColor())}>
            {categoryIcons[node.category] || categoryIcons.special}
          </div>
          <div className="font-bold text-white">{node.name}</div>
        </div>

        {showResearchProgress && (researchActive || researchProgress > 0) && (
          <ResearchProgressIndicator
            progress={researchProgress}
            isActive={researchActive}
            remainingTime={remainingTime}
          />
        )}

        {showDetails && <div className="mt-2 text-sm text-gray-200">{node.description}</div>}

        <div className="absolute top-0 right-0 p-1">
          <div
            className={cn(
              'flex h-4 w-4 items-center justify-center rounded-full text-xs font-bold',
              {
                'bg-green-500 text-white': node.unlocked,
                'bg-blue-500 text-white': !node.unlocked && isAvailable,
                'bg-gray-500 text-gray-200': !node.unlocked && !isAvailable,
              }
            )}
          >
            {node.tier}
          </div>
        </div>
      </motion.div>

      {/* Display additional details when hovered */}
      <AnimatePresence>
        {hovered && !showDetails && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-opacity-80 absolute top-full z-20 mt-2 max-w-xs rounded-lg bg-black p-3 text-xs text-white"
          >
            <h4 className="text-sm font-bold">{node.name}</h4>
            <p className="mt-1">{node.description}</p>
            {!node.unlocked && (
              <div className="mt-2">
                <div className="font-semibold">Requirements:</div>
                <ul className="list-inside list-disc">
                  {node.requirements.map((req, index) => {
                    const reqNode = getTechTreeManager().getNode(req);
                    const isUnlocked = getTechTreeManager().isUnlocked(req);

                    return (
                      <li
                        key={`req-${index}`}
                        className={isUnlocked ? 'text-green-400' : 'text-red-400'}
                      >
                        {reqNode?.name || req}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {node.synergyModifiers && Object.keys(node.synergyModifiers).length > 0 && (
              <div className="mt-2">
                <div className="font-semibold">Synergies:</div>
                <ul className="list-inside list-disc">
                  {Object.entries(node.synergyModifiers).map(([targetId, value], index) => {
                    const targetNode = getTechTreeManager().getNode(targetId);
                    return (
                      <li key={`synergy-${index}`}>
                        {targetNode?.name || targetId}: +{Math.round(value * 100)}%
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show path planning info when selected */}
      <AnimatePresence>{isSelected && showPath && renderPathInfo()}</AnimatePresence>

      {/* Render connections */}
      {renderConnections()}

      {/* Render synergies */}
      {renderSynergies()}
    </div>
  );
}

/**
 * Connection line between tech nodes
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

  // For partial progress, adjust the line length
  const adjustedLength = length * progress;

  // Determine color based on status
  const getLineColor = () => {
    switch (status) {
      case 'unlocked':
        return 'bg-green-500';
      case 'available':
        return progress < 1 ? 'bg-yellow-500' : 'bg-blue-500';
      case 'locked':
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div
      className="pointer-events-none absolute"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
      }}
    >
      <div
        className={cn('absolute h-0.5 origin-left', getLineColor())}
        style={{
          left: from.x,
          top: from.y,
          width: adjustedLength,
          transformOrigin: 'left center',
          transform: `rotate(${angle}deg)`,
        }}
      />
    </div>
  );
}

/**
 * Research progress indicator component
 */
export function ResearchProgressIndicator({
  progress,
  isActive,
  remainingTime,
}: {
  progress: number;
  isActive: boolean;
  remainingTime?: number;
}) {
  // Format remaining time as mm:ss
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mt-2">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-white">Research Progress</span>
        {remainingTime !== undefined && (
          <span className="text-white">{formatTime(remainingTime)}</span>
        )}
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-700">
        <motion.div
          className={cn('h-full rounded-full', isActive ? 'bg-yellow-500' : 'bg-green-500')}
          initial={{ width: `${progress * 100}%` }}
          animate={{
            width: `${progress * 100}%`,
            transition: { duration: isActive ? 1 : 0.5 },
          }}
        />
      </div>
      {isActive && <div className="mt-1 animate-pulse text-xs text-yellow-300">Researching...</div>}
    </div>
  );
}

/**
 * Synergy line between tech nodes
 */
export function SynergyLine({
  from,
  to,
  strength,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  strength: number;
}) {
  // Calculate line properties
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Calculate line thickness based on strength
  const thickness = Math.max(2, Math.min(10, strength * 10));

  return (
    <div
      className="pointer-events-none absolute"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
      }}
    >
      <motion.div
        className="absolute origin-left bg-purple-400"
        style={{
          left: from.x,
          top: from.y,
          width: length,
          height: thickness,
          transformOrigin: 'left center',
          transform: `rotate(${angle}deg)`,
          opacity: 0.6,
        }}
        initial={{ opacity: 0 }}
        animate={{
          opacity: 0.6,
          boxShadow: `0 0 ${strength * 10}px ${strength * 3}px rgba(168, 85, 247, 0.5)`,
        }}
      />
    </div>
  );
}

/**
 * Tech synergy indicator showing synergies between nodes
 */
export function TechSynergyIndicator({
  nodes,
  activeNodeId,
}: {
  nodes: TechNode[];
  activeNodeId: string;
}) {
  const techTreeManager = getTechTreeManager();
  const [synergyLines, setSynergyLines] = useState<
    {
      from: { x: number; y: number };
      to: { x: number; y: number };
      strength: number;
    }[]
  >([]);

  useEffect(() => {
    const activeNode = nodes.find(n => n.id === activeNodeId);
    if (!activeNode) return;

    const lines: typeof synergyLines = [];
    const activeNodeElement = document.querySelector(`[data-node-id="${activeNodeId}"]`);
    if (!activeNodeElement) return;

    const activeRect = activeNodeElement.getBoundingClientRect();
    const activePosition = {
      x: activeRect.left + activeRect.width / 2,
      y: activeRect.top + activeRect.height / 2,
    };

    // Get active synergies from the manager
    const activeSynergies = techTreeManager.getActiveSynergies();

    nodes.forEach(otherNode => {
      if (otherNode.id === activeNodeId) return;

      // Check for synergy in both directions in the map
      const synergyKey1 = `${activeNode.id}-${otherNode.id}`;
      const synergyKey2 = `${otherNode.id}-${activeNode.id}`;
      const synergyStrength =
        activeSynergies.get(synergyKey1) ?? activeSynergies.get(synergyKey2) ?? 0;

      if (synergyStrength > 0) {
        const otherNodeElement = document.querySelector(`[data-node-id="${otherNode.id}"]`);
        if (otherNodeElement) {
          const otherRect = otherNodeElement.getBoundingClientRect();
          const otherPosition = {
            x: otherRect.left + otherRect.width / 2,
            y: otherRect.top + otherRect.height / 2,
          };

          lines.push({
            from: activePosition,
            to: otherPosition,
            strength: synergyStrength,
          });
        }
      }
    });

    setSynergyLines(lines);
    // Dependency includes nodes array content and activeNodeId to recalculate if they change
  }, [nodes, activeNodeId, techTreeManager]);

  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      {synergyLines.map((line, index) => (
        <SynergyLine
          key={`indicator-synergy-${index}`}
          from={line.from}
          to={line.to}
          strength={line.strength}
        />
      ))}
    </div>
  );
}
