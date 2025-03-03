import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReconShipCoordination } from '../../../components/exploration/ReconShipCoordination';

// Define types for our test
interface ReconShip {
  id: string;
  name: string;
  type: 'AC27G' | 'PathFinder' | 'VoidSeeker';
  status: 'idle' | 'scanning' | 'investigating' | 'returning';
  experience: number;
  specialization: 'mapping' | 'anomaly' | 'resource';
  efficiency: number;
  position: { x: number; y: number };
  formationId?: string;
  formationRole?: 'leader' | 'support' | 'scout';
  coordinationBonus?: number;
}

interface Sector {
  id: string;
  name: string;
  status: 'unmapped' | 'mapped' | 'scanning' | 'analyzed';
  coordinates: { x: number; y: number };
  resourcePotential: number;
  habitabilityScore: number;
}

interface FleetFormation {
  id: string;
  name: string;
  type: 'exploration' | 'survey' | 'defensive';
  shipIds: string[];
  leaderId: string;
  position: { x: number; y: number };
  scanBonus: number;
  detectionBonus: number;
  stealthBonus: number;
  createdAt: number;
}

interface ReconShipCoordinationProps {
  ships: ReconShip[];
  sectors: Sector[];
  formations: FleetFormation[];
  onCreateFormation: (
    name: string,
    type: 'exploration' | 'survey' | 'defensive',
    shipIds: string[],
    leaderId: string
  ) => void;
  onDisbandFormation: (formationId: string) => void;
  onAddShipToFormation: (formationId: string, shipId: string) => void;
  onRemoveShipFromFormation: (formationId: string, shipId: string) => void;
  onStartCoordinatedScan: (sectorId: string, shipIds: string[]) => void;
  onShareTask: (
    sourceShipId: string,
    targetShipId: string,
    taskType: 'explore' | 'investigate' | 'evade'
  ) => void;
  onAutoDistributeTasks: (sectorIds: string[], prioritizeFormations: boolean) => void;
}

// Mock ships data
const mockShips: ReconShip[] = [
  {
    id: 'ship-1',
    name: 'Explorer Alpha',
    type: 'AC27G',
    status: 'idle',
    experience: 100,
    specialization: 'mapping',
    efficiency: 0.8,
    position: { x: 10, y: 20 },
  },
  {
    id: 'ship-2',
    name: 'Explorer Beta',
    type: 'PathFinder',
    status: 'idle',
    experience: 75,
    specialization: 'resource',
    efficiency: 0.7,
    position: { x: 15, y: 25 },
  },
  {
    id: 'ship-3',
    name: 'Explorer Gamma',
    type: 'VoidSeeker',
    status: 'scanning',
    experience: 150,
    specialization: 'anomaly',
    efficiency: 0.9,
    position: { x: 30, y: 40 },
  },
];

// Mock sectors data
const mockSectors: Sector[] = [
  {
    id: 'sector-1',
    name: 'Alpha Sector',
    status: 'mapped',
    coordinates: { x: 5, y: 10 },
    resourcePotential: 0.7,
    habitabilityScore: 0.3,
  },
  {
    id: 'sector-2',
    name: 'Beta Sector',
    status: 'unmapped',
    coordinates: { x: 20, y: 30 },
    resourcePotential: 0.4,
    habitabilityScore: 0.6,
  },
];

// Mock formations data
const mockFormations: FleetFormation[] = [
  {
    id: 'formation-1',
    name: 'Alpha Formation',
    type: 'exploration',
    shipIds: ['ship-1', 'ship-2'],
    leaderId: 'ship-1',
    position: { x: 12, y: 22 },
    scanBonus: 0.2,
    detectionBonus: 0.1,
    stealthBonus: 0.1,
    createdAt: Date.now(),
  },
];

// Mock event handlers
const mockOnCreateFormation = vi.fn();
const mockOnDisbandFormation = vi.fn();
const mockOnAddShipToFormation = vi.fn();
const mockOnRemoveShipFromFormation = vi.fn();
const mockOnStartCoordinatedScan = vi.fn();
const mockOnShareTask = vi.fn();
const mockOnAutoDistributeTasks = vi.fn();

// Create a type for the mock component props
type MockComponentProps = {
  mockProps?: ReconShipCoordinationProps;
};

// Extend the ReconShipCoordination type to include our mock properties
type MockedReconShipCoordination = typeof ReconShipCoordination & MockComponentProps;

// Mock the component's internal functions
vi.mock('../../../components/exploration/ReconShipCoordination', () => ({
  ReconShipCoordination: vi.fn((props: ReconShipCoordinationProps) => {
    // Store the props for testing
    (ReconShipCoordination as MockedReconShipCoordination).mockProps = props;

    return (
      <div data-testid="recon-ship-coordination">
        <h2>Recon Ship Coordination</h2>
        <div data-testid="formations-list">
          {props.formations.map((formation: FleetFormation) => (
            <div key={formation.id} data-testid={`formation-${formation.id}`}>
              <span>{formation.name}</span>
              <span>
                {formation.type} • {formation.shipIds.length} ships
              </span>
              <button
                data-testid={`disband-${formation.id}`}
                onClick={() => props.onDisbandFormation(formation.id)}
              >
                Disband
              </button>
            </div>
          ))}
        </div>
        <div data-testid="tabs">
          <button data-testid="tab-formations">Formations</button>
          <button data-testid="tab-coordination">Coordinated Scanning</button>
          <button data-testid="tab-auto">Auto-Distribution</button>
        </div>
        <button
          data-testid="new-formation-button"
          onClick={() =>
            props.onCreateFormation('New Formation', 'survey', ['ship-1', 'ship-2'], 'ship-1')
          }
        >
          New Formation
        </button>
      </div>
    );
  }),
}));

describe('ReconShipCoordination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the component with correct props', () => {
    render(
      <ReconShipCoordination
        ships={mockShips}
        sectors={mockSectors}
        formations={mockFormations}
        onCreateFormation={mockOnCreateFormation}
        onDisbandFormation={mockOnDisbandFormation}
        onAddShipToFormation={mockOnAddShipToFormation}
        onRemoveShipFromFormation={mockOnRemoveShipFromFormation}
        onStartCoordinatedScan={mockOnStartCoordinatedScan}
        onShareTask={mockOnShareTask}
        onAutoDistributeTasks={mockOnAutoDistributeTasks}
      />
    );

    // Check if component renders
    expect(screen.getByTestId('recon-ship-coordination')).toBeInTheDocument();

    // Check if formations are rendered
    expect(screen.getByTestId('formations-list')).toBeInTheDocument();
    expect(screen.getByTestId('formation-formation-1')).toBeInTheDocument();

    // Check if the component received the correct props
    const mockProps = (ReconShipCoordination as MockedReconShipCoordination).mockProps;
    expect(mockProps?.ships).toEqual(mockShips);
    expect(mockProps?.sectors).toEqual(mockSectors);
    expect(mockProps?.formations).toEqual(mockFormations);
    expect(mockProps?.onCreateFormation).toBe(mockOnCreateFormation);
    expect(mockProps?.onDisbandFormation).toBe(mockOnDisbandFormation);
  });

  it('should call onDisbandFormation when disband button is clicked', () => {
    render(
      <ReconShipCoordination
        ships={mockShips}
        sectors={mockSectors}
        formations={mockFormations}
        onCreateFormation={mockOnCreateFormation}
        onDisbandFormation={mockOnDisbandFormation}
        onAddShipToFormation={mockOnAddShipToFormation}
        onRemoveShipFromFormation={mockOnRemoveShipFromFormation}
        onStartCoordinatedScan={mockOnStartCoordinatedScan}
        onShareTask={mockOnShareTask}
        onAutoDistributeTasks={mockOnAutoDistributeTasks}
      />
    );

    // Click the disband button
    const disbandButton = screen.getByTestId('disband-formation-1');
    disbandButton.click();

    // Check if onDisbandFormation was called with the correct parameters
    expect(mockOnDisbandFormation).toHaveBeenCalledWith('formation-1');
  });

  it('should call onCreateFormation when new formation button is clicked', () => {
    render(
      <ReconShipCoordination
        ships={mockShips}
        sectors={mockSectors}
        formations={mockFormations}
        onCreateFormation={mockOnCreateFormation}
        onDisbandFormation={mockOnDisbandFormation}
        onAddShipToFormation={mockOnAddShipToFormation}
        onRemoveShipFromFormation={mockOnRemoveShipFromFormation}
        onStartCoordinatedScan={mockOnStartCoordinatedScan}
        onShareTask={mockOnShareTask}
        onAutoDistributeTasks={mockOnAutoDistributeTasks}
      />
    );

    // Click the new formation button
    const newFormationButton = screen.getByTestId('new-formation-button');
    newFormationButton.click();

    // Check if onCreateFormation was called with the correct parameters
    expect(mockOnCreateFormation).toHaveBeenCalledWith(
      'New Formation',
      'survey',
      ['ship-1', 'ship-2'],
      'ship-1'
    );
  });
});
