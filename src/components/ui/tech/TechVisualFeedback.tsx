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
  warFleet: (
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
  const techTreeManager = getTechTreeManager();
  
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
    const handleResearchProgress = (data: { nodeId: string; progress: number; remainingTime: number }) => {
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
      <div className="absolute inset-0 pointer-events-none">
        {synergies.map((synergy, index) => {
          // Find the other node
          const otherNodeId = synergy.sourceNodeId === node.id ? synergy.targetNodeId : synergy.sourceNodeId;
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
        className="absolute top-full mt-2 p-3 bg-black bg-opacity-80 rounded-lg z-20 text-xs text-white max-w-xs"
      >
        <h4 className="font-bold text-sm mb-1">Research Path</h4>
        <div className="flex items-center mb-2">
          <span className="text-gray-300 mr-2">Time:</span>
          <span>{Math.round(techPath.totalResearchTime / 60)} minutes</span>
        </div>
        {techPath.synergyBonus > 0 && (
          <div className="flex items-center mb-2">
            <span className="text-gray-300 mr-2">Synergy Bonus:</span>
            <span className="text-green-400">+{Math.round(techPath.synergyBonus * 100)}%</span>
          </div>
        )}
        <div className="mt-2">
          <h5 className="font-semibold mb-1">Steps:</h5>
          <ol className="list-decimal list-inside">
            {techPath.nodes.map((nodeId, index) => {
              const pathNode = techTreeManager.getNode(nodeId);
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
          'relative p-3 rounded-lg shadow-lg',
          getNodeColor(),
          {
            'ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-900': isSelected,
            'cursor-pointer': isAvailable || node.unlocked,
            'cursor-not-allowed opacity-50': !isAvailable && !node.unlocked,
            'hover:scale-105': isAvailable || node.unlocked,
          }
        )}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onNodeClick(node)}
        whileHover={{ scale: isAvailable || node.unlocked ? 1.05 : 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center mb-2">
          <div
            className={cn(
              'p-1 rounded-full mr-2',
              getIconColor()
            )}
          >
            {categoryIcons[node.category] || categoryIcons.special}
          </div>
          <div className="text-white font-bold">{node.name}</div>
        </div>
        
        {showResearchProgress && (researchActive || researchProgress > 0) && (
          <ResearchProgressIndicator 
            progress={researchProgress}
            totalTime={node.researchTime || 60}
            isActive={researchActive}
            remainingTime={remainingTime}
          />
        )}
        
        {showDetails && (
          <div className="text-gray-200 text-sm mt-2">{node.description}</div>
        )}
        
        <div className="absolute top-0 right-0 p-1">
          <div
            className={cn(
              'rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold',
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
            className="absolute top-full mt-2 p-3 bg-black bg-opacity-80 rounded-lg z-20 text-xs text-white max-w-xs"
          >
            <h4 className="font-bold text-sm">{node.name}</h4>
            <p className="mt-1">{node.description}</p>
            {!node.unlocked && (
              <div className="mt-2">
                <div className="font-semibold">Requirements:</div>
                <ul className="list-disc list-inside">
                  {node.requirements.map((req, index) => {
                    const reqNode = techTreeManager.getNode(req);
                    const isUnlocked = techTreeManager.isUnlocked(req);
                    
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
                <ul className="list-disc list-inside">
                  {Object.entries(node.synergyModifiers).map(([targetId, value], index) => {
                    const targetNode = techTreeManager.getNode(targetId);
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
      className="absolute pointer-events-none"
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
  totalTime,
  isActive,
  remainingTime,
}: {
  progress: number;
  totalTime: number;
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
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-white">Research Progress</span>
        {remainingTime !== undefined && (
          <span className="text-white">
            {formatTime(remainingTime)}
          </span>
        )}
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
        <motion.div
          className={cn(
            "h-full rounded-full",
            isActive ? "bg-yellow-500" : "bg-green-500"
          )}
          initial={{ width: `${progress * 100}%` }}
          animate={{ 
            width: `${progress * 100}%`,
            transition: { duration: isActive ? 1 : 0.5 }
          }}
        />
      </div>
      {isActive && (
        <div className="text-xs text-yellow-300 mt-1 animate-pulse">
          Researching...
        </div>
      )}
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
      className="absolute pointer-events-none"
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
        className="absolute bg-purple-400 origin-left"
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
  const [synergies, setSynergies] = useState<Record<string, number>>({});
  
  useEffect(() => {
    // Calculate synergies for active node
    const activeSynergies: Record<string, number> = {};
    
    // Get the active node
    const activeNode = nodes.find(n => n.id === activeNodeId);
    if (!activeNode) return;
    
    // Calculate synergy strength for all other nodes
    nodes.forEach(node => {
      if (node.id !== activeNodeId && node.unlocked) {
        const strength = calculateSynergyStrength(activeNode, node);
        if (strength > 0) {
          activeSynergies[node.id] = strength;
        }
      }
    });
    
    setSynergies(activeSynergies);
  }, [nodes, activeNodeId]);
  
  const calculateSynergyStrength = (node1: TechNode, node2: TechNode): number => {
    // Check if nodes have direct synergy via modifiers
    if (node1.synergyModifiers?.[node2.id]) {
      return node1.synergyModifiers[node2.id];
    }
    
    if (node2.synergyModifiers?.[node1.id]) {
      return node2.synergyModifiers[node1.id];
    }
    
    // Check for category synergy
    if (node1.category === node2.category) {
      return 0.1; // 10% base synergy for same category
    }
    
    // Special synergies for certain combinations
    if (
      (node1.category === 'weapons' && node2.category === 'warFleet') ||
      (node1.category === 'warFleet' && node2.category === 'weapons')
    ) {
      return 0.15; // 15% synergy for weapons + warships
    }
    
    return 0;
  };
  
  if (Object.keys(synergies).length === 0) {
    return null;
  }
  
  return (
    <div className="p-4 bg-gray-800 rounded-lg mt-4">
      <h3 className="text-white font-bold mb-2">Synergies</h3>
      <ul className="space-y-2">
        {Object.entries(synergies).map(([nodeId, strength]) => {
          const node = nodes.find(n => n.id === nodeId);
          if (!node) return null;
          
          return (
            <li key={nodeId} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="mr-2 p-1 rounded-full bg-purple-500">
                  {categoryIcons[node.category]}
                </div>
                <span className="text-white">{node.name}</span>
              </div>
              <span className="text-purple-400 font-bold">
                +{Math.round(strength * 100)}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
