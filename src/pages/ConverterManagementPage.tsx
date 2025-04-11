import { useCallback, useEffect, useState } from 'react';
import { getResourceFlowManager } from '../managers/ManagerRegistry';
import type { ConverterFlowNode } from '../types/resources/ResourceConversionTypes';
import { FlowNodeType, type FlowNode } from '../types/resources/ResourceTypes';

// --- Correct UI Component Imports --- //
import { Button } from '../ui/components/Button/Button'; // Assuming new path
import ConverterNodeCard from '../ui/components/Card/variants/ConverterNodeCard'; // Import the new variant
import { Heading, HeadingLevel } from '../ui/components/typography/Heading';
import { Text } from '../ui/components/typography/Text';

// --- Placeholder for Loading Spinner (find actual component later) --- //
const LoadingSpinner = () => <div>Loading...</div>;

/**
 * Page for managing resource converters.
 * Allows viewing, creating, configuring, and monitoring resource conversion processes.
 */
export function ConverterManagementPage() {
  // Access managers via the Manager Registry
  const flowManager = getResourceFlowManager();
  // const conversionManager = getResourceConversionManager(); // Example for conversion manager

  const [converters, setConverters] = useState<ConverterFlowNode[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConverterId, setSelectedConverterId] = useState<string | null>(null);

  const loadConverters = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get all nodes from the flow manager and filter for converters
      const allNodes: FlowNode[] = await flowManager.getNodes(); // Assuming async
      const fetchedConverters = allNodes.filter(
        (node): node is ConverterFlowNode => node.type === FlowNodeType.CONVERTER
      );
      setConverters(fetchedConverters);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load converters';
      setError(message);
      console.error('Error loading converters:', err);
    } finally {
      setIsLoading(false);
    }
  }, [flowManager]);

  useEffect(() => {
    loadConverters();
  }, [loadConverters]);

  const handleCreateConverter = () => {
    console.log('TODO: Implement Create New Converter functionality');
    // Likely involves ResourceConversionManager or a dedicated creation service/hook
    // Might open a modal or navigate to a creation form
  };

  const handleSelectConverter = (id: string) => {
    setSelectedConverterId(prevId => (prevId === id ? null : id)); // Toggle selection
    console.log(`Selected converter ${id}. TODO: Show details view.`);
    // Could fetch detailed status from ResourceConversionManager if needed
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 md:p-8">
        <Heading level={HeadingLevel.H2} className="mb-4">
          Error Loading Converters
        </Heading>
        <Text>{error}</Text>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <Heading level={HeadingLevel.H1} className="mb-6 text-2xl font-semibold">
        Resource Converter Management
      </Heading>

      <Button onClick={handleCreateConverter} className="mb-6">
        Create New Converter
      </Button>

      {converters.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {converters.map(conv => (
            <ConverterNodeCard
              key={conv.id}
              converter={conv}
              selected={selectedConverterId === conv.id}
              onClick={() => handleSelectConverter(conv.id)}
            />
          ))}
        </div>
      ) : (
        <Text>No converters found or configured.</Text>
      )}

      {selectedConverterId && (
        <div className="mt-8 rounded border p-4">
          <Heading level={HeadingLevel.H2} className="mb-4 text-xl font-semibold">
            Details for Converter {selectedConverterId}
          </Heading>
          {/* TODO: Implement ConverterDetailsView component */}
          <Text>Display details, configuration options, active processes, etc. here.</Text>
        </div>
      )}
    </div>
  );
}
