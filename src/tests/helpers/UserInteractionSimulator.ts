/**
 * User Interaction Simulator
 *
 * This file provides utilities for simulating realistic user interactions
 * for performance testing, including clicks, scrolling, typing, and
 * drag operations.
 */

export interface UserInteractionConfig {
  /**
   * Number of click events to simulate
   */
  clicks?: number;

  /**
   * Number of scroll events to simulate
   */
  scrollEvents?: number;

  /**
   * Number of key press events to simulate
   */
  typing?: number;

  /**
   * Whether interactions should be rapid or spaced out
   */
  rapidInteractions?: boolean;

  /**
   * Number of drag operations to simulate
   */
  dragOperations?: number;

  /**
   * Number of node creation operations (for resource networks)
   */
  nodeCreations?: number;

  /**
   * Number of connection creation operations (for resource networks)
   */
  connectionCreations?: number;

  /**
   * Number of chart interactions (zooming, panning, etc.)
   */
  chartInteractions?: number;

  /**
   * Custom operations to include
   */
  customOperations?: Array<() => Promise<void>>;
}

// Internal state to track DOM structure
let simulatedDomElements: Array<{ id: string; type: string }> = [];

/**
 * Initialize simulator with a fake DOM structure
 * (For testing purposes only - no actual DOM is created)
 */
function initializeSimulator() {
  // Create a simulated DOM structure for interactions
  simulatedDomElements = [
    { id: 'resource-panel', type: 'panel' },
    { id: 'resource-list', type: 'list' },
    { id: 'event-log', type: 'list' },
    { id: 'network-visualization', type: 'canvas' },
    { id: 'control-panel', type: 'panel' },
    { id: 'search-box', type: 'input' },
    { id: 'filter-dropdown', type: 'select' },
    { id: 'add-node-button', type: 'button' },
    { id: 'add-connection-button', type: 'button' },
    { id: 'settings-button', type: 'button' },
    { id: 'help-button', type: 'button' },
  ];

  // Add resource items
  for (let i = 0; i < 50; i++) {
    simulatedDomElements.push({ id: `resource-item-${i}`, type: 'list-item' });
  }

  // Add event items
  for (let i = 0; i < 100; i++) {
    simulatedDomElements.push({ id: `event-item-${i}`, type: 'list-item' });
  }
}

/**
 * Simulate a click event
 */
async function simulateClick(rapid: boolean): Promise<void> {
  const elementIndex = Math.floor(Math.random() * simulatedDomElements.length);
  const element = simulatedDomElements[elementIndex];

  // In a real implementation, we would programmatically trigger a click
  // using something like element.click() or dispatchEvent

  // For simulation purposes, we just log the action and add a delay
  console.log(`Simulated click on ${element.id}`);

  if (!rapid) {
    // Add a realistic delay between interactions (100-500ms)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 400 + 100));
  }
}

/**
 * Simulate a scroll event
 */
async function simulateScroll(rapid: boolean): Promise<void> {
  // Select a scrollable element - lists or panels
  const scrollableElements = simulatedDomElements.filter(
    el => el.type === 'list' || el.type === 'panel'
  );

  if (scrollableElements.length === 0) return;

  const element = scrollableElements[Math.floor(Math.random() * scrollableElements.length)];
  const scrollAmount = Math.floor(Math.random() * 100) + 10; // 10-110 pixels

  // In a real implementation, we would programmatically trigger a scroll
  // using something like element.scrollTop += scrollAmount

  console.log(`Simulated scroll on ${element.id} by ${scrollAmount}px`);

  if (!rapid) {
    // Add a realistic delay between interactions (50-200ms for scrolling)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 150 + 50));
  }
}

/**
 * Simulate typing
 */
async function simulateTyping(rapid: boolean): Promise<void> {
  // Find input elements
  const inputElements = simulatedDomElements.filter(el => el.type === 'input');

  if (inputElements.length === 0) return;

  const element = inputElements[Math.floor(Math.random() * inputElements.length)];
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const char = chars.charAt(Math.floor(Math.random() * chars.length));

  // In a real implementation, we would programmatically trigger keydown/keypress/keyup
  // using something like element.dispatchEvent(new KeyboardEvent('keydown', { key: char }))

  console.log(`Simulated typing '${char}' on ${element.id}`);

  if (!rapid) {
    // Add a realistic delay between key presses (80-250ms)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 170 + 80));
  }
}

/**
 * Simulate a drag operation
 */
async function simulateDrag(rapid: boolean): Promise<void> {
  // Find draggable elements (can be nodes in a visualization)
  const draggableElements = simulatedDomElements.filter(
    el => el.type === 'list-item' || el.id.includes('node')
  );

  if (draggableElements.length === 0) return;

  const element = draggableElements[Math.floor(Math.random() * draggableElements.length)];
  const targetX = Math.floor(Math.random() * 800);
  const targetY = Math.floor(Math.random() * 600);

  // In a real implementation, we would trigger mousedown, mousemove, mouseup

  console.log(`Simulated drag on ${element.id} to position (${targetX}, ${targetY})`);

  // Drag operations are more complex and take longer
  if (!rapid) {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 200));
  }
}

/**
 * Simulate a node creation
 */
async function simulateNodeCreation(rapid: boolean): Promise<void> {
  // First click add node button
  const addNodeButton = simulatedDomElements.find(el => el.id === 'add-node-button');
  if (!addNodeButton) return;

  console.log('Simulated click on add-node-button');

  // Then simulate filling out a form
  if (!rapid) {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
  }

  // Simulate picking a position
  const targetX = Math.floor(Math.random() * 800);
  const targetY = Math.floor(Math.random() * 600);

  console.log(`Simulated node creation at position (${targetX}, ${targetY})`);

  // Node creation is complex and takes time
  if (!rapid) {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 300));
  }

  // Add the new element to our simulated DOM
  const newNodeId = `node-${simulatedDomElements.length}`;
  simulatedDomElements.push({ id: newNodeId, type: 'node' });
}

/**
 * Simulate a connection creation
 */
async function simulateConnectionCreation(rapid: boolean): Promise<void> {
  // First click add connection button
  const addConnectionButton = simulatedDomElements.find(el => el.id === 'add-connection-button');
  if (!addConnectionButton) return;

  console.log('Simulated click on add-connection-button');

  // Find nodes to connect
  const nodes = simulatedDomElements.filter(el => el.type === 'node' || el.type === 'list-item');
  if (nodes.length < 2) return;

  // Pick two random nodes
  const sourceIndex = Math.floor(Math.random() * nodes.length);
  let targetIndex = Math.floor(Math.random() * nodes.length);
  while (targetIndex === sourceIndex) {
    targetIndex = Math.floor(Math.random() * nodes.length);
  }

  const source = nodes[sourceIndex];
  const target = nodes[targetIndex];

  console.log(`Simulated connection creation from ${source.id} to ${target.id}`);

  // Connection creation is complex and takes time
  if (!rapid) {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 400 + 200));
  }
}

/**
 * Simulate chart interactions (zoom, pan, etc.)
 */
async function simulateChartInteraction(rapid: boolean): Promise<void> {
  // Find chart elements
  const chartElements = simulatedDomElements.filter(
    el => el.type === 'canvas' || el.id.includes('visualization')
  );

  if (chartElements.length === 0) return;

  const element = chartElements[Math.floor(Math.random() * chartElements.length)];

  // Choose a random interaction type
  const interactionTypes = ['zoom-in', 'zoom-out', 'pan', 'select'];
  const interaction = interactionTypes[Math.floor(Math.random() * interactionTypes.length)];

  console.log(`Simulated ${interaction} on ${element.id}`);

  // Chart interactions can be complex
  if (!rapid) {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 150));
  }
}

/**
 * Simulate user interactions based on the provided configuration
 *
 * @param config Configuration for the interactions to simulate
 * @returns Promise that resolves when all interactions are complete
 */
export async function simulateUserInteractions(config: UserInteractionConfig): Promise<void> {
  // Initialize the simulator if not already initialized
  if (simulatedDomElements.length === 0) {
    initializeSimulator();
  }

  const {
    clicks = 0,
    scrollEvents = 0,
    typing = 0,
    rapidInteractions = false,
    dragOperations = 0,
    nodeCreations = 0,
    connectionCreations = 0,
    chartInteractions = 0,
    customOperations = [],
  } = config;

  // Create arrays of interactions based on counts
  const interactionPromises: Promise<void>[] = [];

  // Add click events
  for (let i = 0; i < clicks; i++) {
    interactionPromises.push(simulateClick(rapidInteractions));
  }

  // Add scroll events
  for (let i = 0; i < scrollEvents; i++) {
    interactionPromises.push(simulateScroll(rapidInteractions));
  }

  // Add typing events
  for (let i = 0; i < typing; i++) {
    interactionPromises.push(simulateTyping(rapidInteractions));
  }

  // Add drag operations
  for (let i = 0; i < dragOperations; i++) {
    interactionPromises.push(simulateDrag(rapidInteractions));
  }

  // Add node creation operations
  for (let i = 0; i < (nodeCreations || 0); i++) {
    interactionPromises.push(simulateNodeCreation(rapidInteractions));
  }

  // Add connection creation operations
  for (let i = 0; i < (connectionCreations || 0); i++) {
    interactionPromises.push(simulateConnectionCreation(rapidInteractions));
  }

  // Add chart interactions
  for (let i = 0; i < (chartInteractions || 0); i++) {
    interactionPromises.push(simulateChartInteraction(rapidInteractions));
  }

  // Add custom operations
  if (customOperations) {
    interactionPromises.push(...customOperations);
  }

  // If rapid interactions, run all at once
  if (rapidInteractions) {
    await Promise.all(interactionPromises);
  } else {
    // Otherwise, run them sequentially for more realistic timing
    for (const promise of interactionPromises) {
      await promise;
    }
  }
}

/**
 * Get statistics about the simulated interactions
 */
export function getInteractionStatistics() {
  return {
    totalElements: simulatedDomElements.length,
    elementTypes: simulatedDomElements.reduce(
      (acc, el) => {
        acc[el.type] = (acc[el.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
  };
}

/**
 * Reset the simulator
 */
export function resetSimulator() {
  simulatedDomElements = [];
}
