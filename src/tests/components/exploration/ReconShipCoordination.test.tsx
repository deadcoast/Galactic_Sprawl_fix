import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ReconShipCoordination } from '../../../components/exploration/ReconShipCoordination';

// Mock ships data
const mockShips = [
  {
    id: 'ship-1',
    name: 'Explorer Alpha',
    type: 'AC27G' as const,
    status: 'idle' as const,
    experience: 100,
    specialization: 'mapping' as const,
    efficiency: 0.8,
    position: { x: 10, y: 20 },
  },
  {
    id: 'ship-2',
    name: 'Explorer Beta',
    type: 'PathFinder' as const,
    status: 'idle' as const,
    experience: 75,
    specialization: 'resource' as const,
    efficiency: 0.7,
    position: { x: 15, y: 25 },
  },
  {
    id: 'ship-3',
    name: 'Explorer Gamma',
    type: 'VoidSeeker' as const,
    status: 'scanning' as const,
    experience: 150,
    specialization: 'anomaly' as const,
    efficiency: 0.9,
    position: { x: 30, y: 40 },
  }
];

// Mock sectors data
const mockSectors = [
  {
    id: 'sector-1',
    name: 'Alpha Sector',
    status: 'mapped' as const,
    coordinates: { x: 5, y: 10 },
    resourcePotential: 0.7,
    habitabilityScore: 0.3
  },
  {
    id: 'sector-2',
    name: 'Beta Sector',
    status: 'unmapped' as const,
    coordinates: { x: 20, y: 30 },
    resourcePotential: 0.4,
    habitabilityScore: 0.6
  }
];

// Mock formations data
const mockFormations = [
  {
    id: 'formation-1',
    name: 'Alpha Formation',
    type: 'exploration' as const,
    shipIds: ['ship-1', 'ship-2'],
    leaderId: 'ship-1',
    position: { x: 12, y: 22 },
    scanBonus: 0.2,
    detectionBonus: 0.1,
    stealthBonus: 0.1,
    createdAt: Date.now()
  }
];

// Mock the ship context
vi.mock('../../../contexts/ShipContext', () => ({
  useShipContext: () => ({
    ships: mockShips,
    getShipById: (id: string) => {
      return mockShips.find(ship => ship.id === id);
    },
    updateShipStatus: vi.fn(),
    moveShip: vi.fn()
  })
}));

// Mock the ReconShipManagerImpl
const mockStartCoordinatedScan = vi.fn().mockResolvedValue({
  success: true,
  formationId: 'formation-1',
  message: 'Coordinated scan started successfully'
});

const mockCreateFormation = vi.fn().mockResolvedValue({
  success: true,
  formationId: 'formation-1',
  message: 'Formation created successfully'
});

const mockAssignShipToFormation = vi.fn().mockResolvedValue({
  success: true,
  message: 'Ship assigned to formation successfully'
});

const mockDisbandFormation = vi.fn().mockResolvedValue({
  success: true,
  message: 'Formation disbanded successfully'
});

vi.mock('../../../managers/exploration/ReconShipManagerImpl', () => ({
  ReconShipManagerImpl: {
    getInstance: () => ({
      startCoordinatedScan: mockStartCoordinatedScan,
      createFormation: mockCreateFormation,
      assignShipToFormation: mockAssignShipToFormation,
      disbandFormation: mockDisbandFormation,
      getFormations: () => mockFormations,
      getFormationById: (id: string) => {
        return mockFormations.find(formation => formation.id === id) || null;
      }
    })
  }
}));

describe('ReconShipCoordination', () => {
  // Mock event handlers
  const onCreateFormation = vi.fn();
  const onDisbandFormation = vi.fn();
  const onAddShipToFormation = vi.fn();
  const onRemoveShipFromFormation = vi.fn();
  const onStartCoordinatedScan = vi.fn();
  const onShareTask = vi.fn();
  const onAutoDistributeTasks = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the component with ships and formations', () => {
    render(
      <ReconShipCoordination 
        ships={mockShips}
        sectors={mockSectors}
        formations={mockFormations}
        onCreateFormation={onCreateFormation}
        onDisbandFormation={onDisbandFormation}
        onAddShipToFormation={onAddShipToFormation}
        onRemoveShipFromFormation={onRemoveShipFromFormation}
        onStartCoordinatedScan={onStartCoordinatedScan}
        onShareTask={onShareTask}
        onAutoDistributeTasks={onAutoDistributeTasks}
      />
    );

    // Check if ships are rendered
    expect(screen.getByText('Explorer Alpha')).toBeInTheDocument();
    expect(screen.getByText('Explorer Beta')).toBeInTheDocument();
    expect(screen.getByText('Explorer Gamma')).toBeInTheDocument();
    
    // Check if formations are rendered
    expect(screen.getByText('Alpha Formation')).toBeInTheDocument();
  });

  it('should allow creating a new formation', async () => {
    const user = userEvent.setup();
    
    render(
      <ReconShipCoordination 
        ships={mockShips}
        sectors={mockSectors}
        formations={mockFormations}
        onCreateFormation={onCreateFormation}
        onDisbandFormation={onDisbandFormation}
        onAddShipToFormation={onAddShipToFormation}
        onRemoveShipFromFormation={onRemoveShipFromFormation}
        onStartCoordinatedScan={onStartCoordinatedScan}
        onShareTask={onShareTask}
        onAutoDistributeTasks={onAutoDistributeTasks}
      />
    );

    // Find and click the create formation button
    const createButton = screen.getByRole('button', { name: /create formation|new formation|add formation/i });
    await user.click(createButton);

    // Fill in the formation form
    const nameInput = screen.getByLabelText(/formation name/i);
    const typeSelect = screen.getByLabelText(/formation type/i);
    
    await user.type(nameInput, 'Beta Formation');
    await user.selectOptions(typeSelect, 'survey');
    
    // Select ships for the formation
    const ship1Checkbox = screen.getByLabelText(/Explorer Alpha/i);
    const ship2Checkbox = screen.getByLabelText(/Explorer Beta/i);
    
    await user.click(ship1Checkbox);
    await user.click(ship2Checkbox);
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /save|create|submit/i });
    await user.click(submitButton);

    // Check if onCreateFormation was called with the correct parameters
    expect(onCreateFormation).toHaveBeenCalledWith(
      'Beta Formation',
      'survey',
      expect.arrayContaining(['ship-1', 'ship-2']),
      expect.any(String)
    );
  });

  it('should allow assigning a ship to a formation', async () => {
    const user = userEvent.setup();
    
    render(
      <ReconShipCoordination 
        ships={mockShips}
        sectors={mockSectors}
        formations={mockFormations}
        onCreateFormation={onCreateFormation}
        onDisbandFormation={onDisbandFormation}
        onAddShipToFormation={onAddShipToFormation}
        onRemoveShipFromFormation={onRemoveShipFromFormation}
        onStartCoordinatedScan={onStartCoordinatedScan}
        onShareTask={onShareTask}
        onAutoDistributeTasks={onAutoDistributeTasks}
      />
    );

    // Find and click on a formation
    const formationElement = screen.getByText('Alpha Formation');
    await user.click(formationElement);

    // Find and click the assign ship button
    const assignButton = screen.getByRole('button', { name: /assign ship|add ship/i });
    await user.click(assignButton);

    // Select a ship to assign
    const shipSelect = screen.getByLabelText(/select ship/i);
    await user.selectOptions(shipSelect, 'ship-3');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /save|assign|submit/i });
    await user.click(submitButton);

    // Check if onAddShipToFormation was called with the correct parameters
    expect(onAddShipToFormation).toHaveBeenCalledWith('formation-1', 'ship-3');
  });

  it('should allow starting a coordinated scan', async () => {
    const user = userEvent.setup();
    
    render(
      <ReconShipCoordination 
        ships={mockShips}
        sectors={mockSectors}
        formations={mockFormations}
        onCreateFormation={onCreateFormation}
        onDisbandFormation={onDisbandFormation}
        onAddShipToFormation={onAddShipToFormation}
        onRemoveShipFromFormation={onRemoveShipFromFormation}
        onStartCoordinatedScan={onStartCoordinatedScan}
        onShareTask={onShareTask}
        onAutoDistributeTasks={onAutoDistributeTasks}
      />
    );

    // Find and click on a formation
    const formationElement = screen.getByText('Alpha Formation');
    await user.click(formationElement);

    // Find and click the start scan button
    const scanButton = screen.getByRole('button', { name: /start scan|begin scan|coordinate scan/i });
    await user.click(scanButton);

    // Select a sector to scan
    const sectorSelect = screen.getByLabelText(/select sector/i);
    await user.selectOptions(sectorSelect, 'sector-2');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /start|begin|submit/i });
    await user.click(submitButton);

    // Check if onStartCoordinatedScan was called with the correct parameters
    expect(onStartCoordinatedScan).toHaveBeenCalledWith('sector-2', ['ship-1', 'ship-2']);
  });

  it('should allow disbanding a formation', async () => {
    const user = userEvent.setup();
    
    render(
      <ReconShipCoordination 
        ships={mockShips}
        sectors={mockSectors}
        formations={mockFormations}
        onCreateFormation={onCreateFormation}
        onDisbandFormation={onDisbandFormation}
        onAddShipToFormation={onAddShipToFormation}
        onRemoveShipFromFormation={onRemoveShipFromFormation}
        onStartCoordinatedScan={onStartCoordinatedScan}
        onShareTask={onShareTask}
        onAutoDistributeTasks={onAutoDistributeTasks}
      />
    );

    // Find and click on a formation
    const formationElement = screen.getByText('Alpha Formation');
    await user.click(formationElement);

    // Find and click the disband button
    const disbandButton = screen.getByRole('button', { name: /disband|delete|remove formation/i });
    await user.click(disbandButton);

    // Confirm the action
    const confirmButton = screen.getByRole('button', { name: /confirm|yes|proceed/i });
    await user.click(confirmButton);

    // Check if onDisbandFormation was called with the correct parameters
    expect(onDisbandFormation).toHaveBeenCalledWith('formation-1');
  });

  it('should display formation details', async () => {
    const user = userEvent.setup();
    
    render(
      <ReconShipCoordination 
        ships={mockShips}
        sectors={mockSectors}
        formations={mockFormations}
        onCreateFormation={onCreateFormation}
        onDisbandFormation={onDisbandFormation}
        onAddShipToFormation={onAddShipToFormation}
        onRemoveShipFromFormation={onRemoveShipFromFormation}
        onStartCoordinatedScan={onStartCoordinatedScan}
        onShareTask={onShareTask}
        onAutoDistributeTasks={onAutoDistributeTasks}
      />
    );

    // Find and click on a formation
    const formationElement = screen.getByText('Alpha Formation');
    await user.click(formationElement);

    // Check if formation details are displayed
    expect(screen.getByText(/Formation Type/i)).toBeInTheDocument();
    expect(screen.getByText(/exploration/i)).toBeInTheDocument();
    expect(screen.getByText(/Leader/i)).toBeInTheDocument();
    expect(screen.getByText(/Explorer Alpha/i)).toBeInTheDocument();
  });

  it('should display ship details', async () => {
    const user = userEvent.setup();
    
    render(
      <ReconShipCoordination 
        ships={mockShips}
        sectors={mockSectors}
        formations={mockFormations}
        onCreateFormation={onCreateFormation}
        onDisbandFormation={onDisbandFormation}
        onAddShipToFormation={onAddShipToFormation}
        onRemoveShipFromFormation={onRemoveShipFromFormation}
        onStartCoordinatedScan={onStartCoordinatedScan}
        onShareTask={onShareTask}
        onAutoDistributeTasks={onAutoDistributeTasks}
      />
    );

    // Find and click on a ship
    const shipElement = screen.getByText('Explorer Alpha');
    await user.click(shipElement);

    // Check if ship details are displayed
    expect(screen.getByText(/Status/i)).toBeInTheDocument();
    expect(screen.getByText(/idle/i)).toBeInTheDocument();
    expect(screen.getByText(/Position/i)).toBeInTheDocument();
    expect(screen.getByText(/X: 10, Y: 20/i)).toBeInTheDocument();
  });
}); 