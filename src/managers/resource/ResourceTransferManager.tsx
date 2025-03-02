/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Truck } from 'lucide-react';
import * as React from 'react';
import { useThreshold } from '../../contexts/ThresholdContext';

interface Transfer {
  id: string;
  sourceId: string;
  targetId: string;
  resourceType: string;
  amount: number;
  progress: number;
  priority: number;
  status: 'queued' | 'in-progress' | 'completed' | 'failed';
}

interface ResourceTransferManagerProps {
  storageNodes: Array<{
    id: string;
    resourceType: string;
    currentAmount: number;
    maxCapacity: number;
    transferRate: number;
  }>;
}

export function ResourceTransferManager({ storageNodes }: ResourceTransferManagerProps) {
  const [transfers, setTransfers] = React.useState<Transfer[]>([]);
  const [activeTransfers, setActiveTransfers] = React.useState<Transfer[]>([]);
  const { state } = useThreshold();

  // Monitor thresholds and initiate transfers
  React.useEffect(() => {
    const checkThresholds = () => {
      const newTransfers: Transfer[] = [];

      // Check each resource against storage nodes
      Object.entries(state.resources).forEach(([resourceId, resource]) => {
        const matchingStorage = storageNodes.find(
          node => node.resourceType === resource.name.split(' ')[0]
        );

        if (!matchingStorage) {
          return;
        }

        // Check if we need to transfer resources
        if (resource.currentAmount > resource.thresholds.max) {
          // Transfer excess to storage
          const transferAmount = resource.currentAmount - resource.thresholds.max;
          newTransfers.push({
            id: `transfer-${resourceId}-${Date.now()}`,
            sourceId: resourceId,
            targetId: matchingStorage.id,
            resourceType: resource.name,
            amount: transferAmount,
            progress: 0,
            priority: 1,
            status: 'queued' as const,
          });
        } else if (matchingStorage.currentAmount > matchingStorage.maxCapacity * 0.9) {
          // Storage is nearly full, transfer to other systems
          const excessAmount = matchingStorage.currentAmount - matchingStorage.maxCapacity * 0.8;
          newTransfers.push({
            id: `transfer-${matchingStorage.id}-${Date.now()}`,
            sourceId: matchingStorage.id,
            targetId: 'mothership',
            resourceType: resource.name,
            amount: excessAmount,
            progress: 0,
            priority: 1,
            status: 'queued' as const,
          });
        }
      });

      if (newTransfers.length > 0) {
        setTransfers(prev => [...prev, ...newTransfers]);
      }
    };

    const interval = setInterval(checkThresholds, 5000);
    return () => clearInterval(interval);
  }, [state.resources, storageNodes]);

  // Process transfers
  React.useEffect(() => {
    const processTransfers = () => {
      setTransfers(currentTransfers => {
        const updatedTransfers = currentTransfers.map(transfer => {
          if (transfer.status === 'in-progress') {
            const progress = transfer.progress + 0.1; // 10% progress per tick
            if (progress >= 1) {
              return { ...transfer, status: 'completed' as const, progress: 1 };
            }
            return { ...transfer, progress };
          }
          return transfer;
        });

        // Start new transfers if we have capacity
        const inProgress = updatedTransfers.filter(t => t.status === 'in-progress');
        if (inProgress.length < 3) {
          // Max 3 concurrent transfers
          const queued = updatedTransfers
            .filter(t => t.status === 'queued')
            .sort((a, b) => b.priority - a.priority);

          queued.slice(0, 3 - inProgress.length).forEach(transfer => {
            const index = updatedTransfers.findIndex(t => t.id === transfer.id);
            if (index !== -1) {
              updatedTransfers[index] = {
                ...transfer,
                status: 'in-progress' as const,
              };
            }
          });
        }

        // Clean up completed transfers after 2 seconds
        return updatedTransfers.filter(
          t => t.status !== 'completed' || Date.now() - parseInt(t.id.split('-')[2]) < 2000
        );
      });
    };

    const interval = setInterval(processTransfers, 100); // Update every 100ms
    return () => clearInterval(interval);
  }, []);

  // Update active transfers for visualization
  React.useEffect(() => {
    setActiveTransfers(transfers.filter(t => t.status === 'in-progress'));
  }, [transfers]);

  return (
    <div className="pointer-events-none absolute inset-0">
      <AnimatePresence>
        {activeTransfers.map(transfer => (
          <motion.div
            key={transfer.id}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Transfer Route Visualization */}
            <svg className="absolute inset-0 h-full w-full">
              <motion.path
                d="M100,100 C200,100 300,200 400,200" // This will be dynamic based on node positions
                stroke="rgba(99, 102, 241, 0.4)"
                strokeWidth="2"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: transfer.progress }}
                transition={{ duration: 0.1, ease: 'linear' }}
              />
            </svg>

            {/* Transfer Progress Indicator */}
            <motion.div
              className="absolute h-3 w-3 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50"
              style={{
                left: '100px',
                top: '100px',
              }}
              animate={{
                left: ['100px', '400px'],
                top: ['100px', '200px'],
              }}
              transition={{
                duration: 1,
                ease: 'linear',
                repeat: Infinity,
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Transfer Queue Display */}
      <div className="absolute bottom-4 right-4 space-y-2">
        {transfers
          .filter(t => t.status === 'queued')
          .slice(0, 3)
          .map(transfer => (
            <motion.div
              key={transfer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center space-x-2 rounded-lg bg-gray-800/90 p-2 text-sm"
            >
              <Truck className="h-4 w-4 text-indigo-400" />
              <span className="text-gray-300">
                Transferring {transfer.amount.toFixed(0)} {transfer.resourceType}
              </span>
              <ArrowRight className="h-4 w-4 text-gray-500" />
            </motion.div>
          ))}
      </div>
    </div>
  );
}
