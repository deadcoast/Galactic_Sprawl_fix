import { fireEvent, render, screen } from '@testing-library/react';
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
  formations?: FleetFormation[];
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
  onShareTask?: (
    sourceShipId: string,
    targetShipId: string,
    taskType: 'explore' | 'investigate' | 'evade'
  ) => void;
  onAutoDistributeTasks: (sectorIds: string[], prioritizeFormations: boolean) => void;
  className?: string;
}

// Helper function to render the component with type checking
const renderReconShipCoordination = (props: ReconShipCoordinationProps) => {
  return render(<ReconShipCoordination {...props} />);
};

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

describe('ReconShipCoordination', () => {
  // Mock event handlers
  const mockOnCreateFormation = vi.fn();
  const mockOnDisbandFormation = vi.fn();
  const mockOnAddShipToFormation = vi.fn();
  const mockOnRemoveShipFromFormation = vi.fn();
  const mockOnStartCoordinatedScan = vi.fn();
  const mockOnShareTask = vi.fn();
  const mockOnAutoDistributeTasks = vi.fn();

  // Create default props for tests
  const defaultProps: ReconShipCoordinationProps = {
    ships: mockShips,
    sectors: mockSectors,
    formations: mockFormations,
    onCreateFormation: mockOnCreateFormation,
    onDisbandFormation: mockOnDisbandFormation,
    onAddShipToFormation: mockOnAddShipToFormation,
    onRemoveShipFromFormation: mockOnRemoveShipFromFormation,
    onStartCoordinatedScan: mockOnStartCoordinatedScan,
    onShareTask: mockOnShareTask,
    onAutoDistributeTasks: mockOnAutoDistributeTasks,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the component with correct title', () => {
    renderReconShipCoordination(defaultProps);

    // Check if component renders with the correct title
    expect(screen.getByText('Recon Ship Coordination')).toBeInTheDocument();

    // Check if the description is present
    expect(
      screen.getByText('Manage fleet formations and coordinate recon ship operations')
    ).toBeInTheDocument();
  });

  it('should display the formations tab by default', () => {
    renderReconShipCoordination(defaultProps);

    // Check if the Formations tab is active
    const formationsTab = screen.getByText('Formations', { selector: 'button div' });
    expect(formationsTab).toBeInTheDocument();

    // Check if the Fleet Formations heading is visible
    expect(screen.getByText('Fleet Formations')).toBeInTheDocument();
  });

  it('should display the formation in the list', () => {
    renderReconShipCoordination(defaultProps);

    // Check if the formation name is displayed
    expect(screen.getByText('Alpha Formation')).toBeInTheDocument();

    // Check if the formation type and ship count are displayed
    expect(screen.getByText('exploration • 2 ships')).toBeInTheDocument();
  });

  it('should call onDisbandFormation when disband button is clicked', () => {
    renderReconShipCoordination(defaultProps);

    // Find the disband button (Trash2 icon) and click it
    const disbandButtons = screen.getAllByTitle('Disband formation');
    fireEvent.click(disbandButtons[0]);

    // Check if the onDisbandFormation function was called with the correct formation ID
    expect(mockOnDisbandFormation).toHaveBeenCalledWith('formation-1');
  });

  it('should show the new formation form when New Formation button is clicked', () => {
    renderReconShipCoordination(defaultProps);

    // Find the New Formation button and click it
    const newFormationButton = screen.getByText('New Formation');
    fireEvent.click(newFormationButton);

    // Check if the form appears
    expect(screen.getByText('Create New Formation')).toBeInTheDocument();

    // Check for form fields by their text content instead of label
    expect(screen.getByText('Formation Name')).toBeInTheDocument();
    expect(screen.getByText('Formation Type')).toBeInTheDocument();
    expect(screen.getByText('Select Ships')).toBeInTheDocument();

    // Check for the input fields
    expect(screen.getByPlaceholderText('Enter formation name')).toBeInTheDocument();
    expect(screen.getByText('Exploration')).toBeInTheDocument();
  });

  it('should render without formations', () => {
    renderReconShipCoordination({
      ships: mockShips,
      sectors: mockSectors,
      onCreateFormation: mockOnCreateFormation,
      onDisbandFormation: mockOnDisbandFormation,
      onAddShipToFormation: mockOnAddShipToFormation,
      onRemoveShipFromFormation: mockOnRemoveShipFromFormation,
      onStartCoordinatedScan: mockOnStartCoordinatedScan,
      onAutoDistributeTasks: mockOnAutoDistributeTasks,
    });

    // Check if component renders
    expect(screen.getByText('Recon Ship Coordination')).toBeInTheDocument();

    // Check if the Fleet Formations heading is visible
    expect(screen.getByText('Fleet Formations')).toBeInTheDocument();

    // Check that the formation is not in the list
    expect(screen.queryByText('Alpha Formation')).not.toBeInTheDocument();
  });

  it('should switch to Coordinated Scanning tab when clicked', () => {
    renderReconShipCoordination(defaultProps);

    // Find the Coordinated Scanning tab and click it
    const coordinationTab = screen.getByText('Coordinated Scanning');
    fireEvent.click(coordinationTab);

    // Check if the tab content changes - use the actual text from the component
    expect(screen.getByText('Coordinated Scanning', { selector: 'h3' })).toBeInTheDocument();
    expect(
      screen.getByText('Coordinate multiple ships to scan sectors more efficiently')
    ).toBeInTheDocument();

    // Check for the select elements
    expect(screen.getByText('Select Formation')).toBeInTheDocument();
    expect(screen.getByText('Select Sector to Scan')).toBeInTheDocument();
  });
});
