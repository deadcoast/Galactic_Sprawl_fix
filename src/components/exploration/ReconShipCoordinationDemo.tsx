import { useEffect, useState } from 'react';
import { Position } from '../../types/core/GameTypes';
import { ReconShipCoordination } from './ReconShipCoordination';

// Sample data interfaces
interface ReconShip {
  id: string;
  name: string;
  type: 'AC27G' | 'PathFinder' | 'VoidSeeker';
  status: 'idle' | 'scanning' | 'investigating' | 'returning';
  targetSector?: string;
  experience: number;
  specialization: 'mapping' | 'anomaly' | 'resource';
  efficiency: number;
  position: Position;
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
  position: Position;
  scanBonus: number;
  detectionBonus: number;
  stealthBonus: number;
  createdAt: number;
}

interface ReconShipCoordinationDemoProps {
  className?: string;
}

// Sample data generation functions
const generateSampleShips = (count: number): ReconShip[] => {
  const shipTypes = ['AC27G', 'PathFinder', 'VoidSeeker'] as const;
  const specializations = ['mapping', 'resource', 'anomaly'] as const;
  const statuses = ['idle', 'scanning'] as const;

  return Array.from({ length: count }, (_, i) => ({
    id: `ship-${i + 1}`,
    name: `Ship ${i + 1}`,
    type: shipTypes[Math.floor(Math.random() * shipTypes.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    experience: Math.floor(Math.random() * 2000),
    specialization: specializations[Math.floor(Math.random() * specializations.length)],
    efficiency: 0.5 + Math.random() * 0.5,
    position: { x: 50 + Math.random() * 200, y: 50 + Math.random() * 200 },
    formationId: Math.random() > 0.7 ? undefined : undefined, // Will be assigned later
    targetSector: undefined,
  }));
};

const generateSampleSectors = (count: number): Sector[] => {
  const statuses = ['unmapped', 'mapped', 'scanning', 'analyzed'] as const;

  return Array.from({ length: count }, (_, i) => ({
    id: `sector-${i + 1}`,
    name: `Sector ${i + 1}`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    coordinates: { x: 50 + Math.random() * 300, y: 50 + Math.random() * 300 },
    resourcePotential: Math.floor(Math.random() * 100),
    habitabilityScore: Math.floor(Math.random() * 100),
  }));
};

const generateSampleFormations = (count: number, ships: ReconShip[]): FleetFormation[] => {
  const formationTypes = ['exploration', 'survey', 'defensive'] as const;
  const formations: FleetFormation[] = [];

  for (let i = 0; i < count; i++) {
    // Get random ships for this formation
    const availableShips = ships.filter(ship => !ship.formationId);
    if (availableShips.length < 2) break;

    const shipCount = Math.min(Math.floor(Math.random() * 3) + 2, availableShips.length);
    const formationShips = availableShips.slice(0, shipCount);
    const leaderId = formationShips[0].id;

    const formation: FleetFormation = {
      id: `formation-${i + 1}`,
      name: `Formation ${i + 1}`,
      type: formationTypes[Math.floor(Math.random() * formationTypes.length)],
      shipIds: formationShips.map(ship => ship.id),
      leaderId,
      createdAt: Date.now(),
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
      scanBonus: Math.random() * 0.3,
      detectionBonus: Math.random() * 0.3,
      stealthBonus: Math.random() * 0.3,
    };

    formations.push(formation);

    // Update ships with formation ID
    for (const ship of formationShips) {
      ship.formationId = formation.id;
    }
  }

  return formations;
};

export function ReconShipCoordinationDemo({ className = '' }: ReconShipCoordinationDemoProps) {
  // Sample data
  const [ships, setShips] = useState<ReconShip[]>([
    {
      id: 'ship-1',
      name: 'Pathfinder Alpha',
      type: 'PathFinder',
      status: 'idle',
      experience: 1250,
      specialization: 'mapping',
      efficiency: 0.85,
      position: { x: 100, y: 100 },
    },
    {
      id: 'ship-2',
      name: 'Surveyor Beta',
      type: 'AC27G',
      status: 'idle',
      experience: 980,
      specialization: 'resource',
      efficiency: 0.78,
      position: { x: 120, y: 90 },
    },
    {
      id: 'ship-3',
      name: 'Anomaly Hunter',
      type: 'VoidSeeker',
      status: 'idle',
      experience: 1500,
      specialization: 'anomaly',
      efficiency: 0.92,
      position: { x: 80, y: 110 },
    },
    {
      id: 'ship-4',
      name: 'Resource Seeker',
      type: 'AC27G',
      status: 'idle',
      experience: 800,
      specialization: 'resource',
      efficiency: 0.75,
      position: { x: 110, y: 120 },
    },
    {
      id: 'ship-5',
      name: 'Void Explorer',
      type: 'PathFinder',
      status: 'idle',
      experience: 1100,
      specialization: 'mapping',
      efficiency: 0.82,
      position: { x: 90, y: 95 },
    },
  ]);

  const [sectors, setSectors] = useState<Sector[]>([
    {
      id: 'sector-1',
      name: 'Alpha Quadrant',
      status: 'unmapped',
      coordinates: { x: 150, y: 150 },
      resourcePotential: 75,
      habitabilityScore: 60,
    },
    {
      id: 'sector-2',
      name: 'Beta Nebula',
      status: 'unmapped',
      coordinates: { x: 200, y: 100 },
      resourcePotential: 90,
      habitabilityScore: 30,
    },
    {
      id: 'sector-3',
      name: 'Gamma Cluster',
      status: 'unmapped',
      coordinates: { x: 120, y: 220 },
      resourcePotential: 60,
      habitabilityScore: 80,
    },
    {
      id: 'sector-4',
      name: 'Delta Void',
      status: 'unmapped',
      coordinates: { x: 80, y: 180 },
      resourcePotential: 40,
      habitabilityScore: 20,
    },
    {
      id: 'sector-5',
      name: 'Epsilon Field',
      status: 'unmapped',
      coordinates: { x: 250, y: 150 },
      resourcePotential: 85,
      habitabilityScore: 50,
    },
  ]);

  const [formations, setFormations] = useState<FleetFormation[]>([]);
  const [scanningShips, setScanningShips] = useState<string[]>([]);
  const [scanningSectors, setScanningSectors] = useState<string[]>([]);
  const [scanProgress, setScanProgress] = useState<Record<string, number>>({});
  const [logs, setLogs] = useState<string[]>([]);

  // Generate sample data on component mount
  useEffect(() => {
    // Generate sample ships
    const sampleShips = generateSampleShips(10);
    setShips(sampleShips);

    // Generate sample sectors
    const sampleSectors = generateSampleSectors(20);
    setSectors(sampleSectors);

    // Generate sample formations
    const sampleFormations = generateSampleFormations(3, sampleShips);
    setFormations(sampleFormations);
  }, []);

  // Function to regenerate sample data
  const handleRegenerateData = () => {
    // Generate sample ships
    const sampleShips = generateSampleShips(10);
    setShips(sampleShips);

    // Generate sample sectors
    const sampleSectors = generateSampleSectors(20);
    setSectors(sampleSectors);

    // Generate sample formations
    const sampleFormations = generateSampleFormations(3, sampleShips);
    setFormations(sampleFormations);

    // Clear logs
    setLogs([]);
    addLog('Data regenerated');
  };

  // Add a log entry
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  };

  // Simulate scan progress
  useEffect(() => {
    if (scanningShips.length === 0) return;

    const interval = setInterval(() => {
      // Update scan progress
      setScanProgress(prev => {
        const newProgress = { ...prev };

        scanningSectors.forEach(sectorId => {
          if (newProgress[sectorId] === undefined) {
            newProgress[sectorId] = 0;
          }

          // Increment progress
          newProgress[sectorId] += 0.05;

          // Check if scan is complete
          if (newProgress[sectorId] >= 1) {
            // Complete the scan
            setSectors(prevSectors =>
              prevSectors.map(sector =>
                sector.id === sectorId ? { ...sector, status: 'analyzed' } : sector
              )
            );

            // Reset ships
            setShips(prevShips =>
              prevShips.map(ship =>
                scanningShips.includes(ship.id)
                  ? { ...ship, status: 'idle', targetSector: undefined }
                  : ship
              )
            );

            // Remove from scanning lists
            setScanningShips([]);
            setScanningSectors([]);

            // Add log
            addLog(`Scan of ${sectors.find(s => s.id === sectorId)?.name} completed`);

            // Remove from progress
            delete newProgress[sectorId];
          }
        });

        return newProgress;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [scanningShips, scanningSectors, sectors]);

  // Handle creating a formation
  const handleCreateFormation = (
    name: string,
    type: 'exploration' | 'survey' | 'defensive',
    shipIds: string[],
    leaderId: string
  ) => {
    // Create a new formation
    const newFormation: FleetFormation = {
      id: `formation-${Date.now()}`,
      name,
      type,
      shipIds,
      leaderId,
      position: calculateAveragePosition(shipIds),
      scanBonus: calculateScanBonus(type, shipIds),
      detectionBonus: calculateDetectionBonus(type, shipIds),
      stealthBonus: calculateStealthBonus(type, shipIds),
      createdAt: Date.now(),
    };

    // Add the formation
    setFormations(prev => [...prev, newFormation]);

    // Update ships
    setShips(prevShips =>
      prevShips.map(ship => {
        if (shipIds.includes(ship.id)) {
          return {
            ...ship,
            formationId: newFormation.id,
            formationRole: ship.id === leaderId ? 'leader' : determineFormationRole(ship, type),
            coordinationBonus: ship.id === leaderId ? 0.15 : 0.1,
          };
        }
        return ship;
      })
    );

    // Add log
    addLog(`Formation "${name}" created with ${shipIds.length} ships`);
  };

  // Handle disbanding a formation
  const handleDisbandFormation = (formationId: string) => {
    // Get the formation
    const formation = formations.find(f => f.id === formationId);
    if (!formation) return;

    // Update ships
    setShips(prevShips =>
      prevShips.map(ship => {
        if (ship.formationId === formationId) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { formationId, formationRole, coordinationBonus, ...rest } = ship;
          return rest;
        }
        return ship;
      })
    );

    // Remove the formation
    setFormations(prev => prev.filter(f => f.id !== formationId));

    // Add log
    addLog(`Formation "${formation.name}" disbanded`);
  };

  // Handle adding a ship to a formation
  const handleAddShipToFormation = (formationId: string, shipId: string) => {
    // Get the formation
    const formation = formations.find(f => f.id === formationId);
    if (!formation) return;

    // Get the ship
    const ship = ships.find(s => s.id === shipId);
    if (!ship) return;

    // Update the formation
    setFormations(prevFormations =>
      prevFormations.map(f => {
        if (f.id === formationId) {
          const updatedShipIds = [...f.shipIds, shipId];
          return {
            ...f,
            shipIds: updatedShipIds,
            position: calculateAveragePosition(updatedShipIds),
            scanBonus: calculateScanBonus(f.type, updatedShipIds),
            detectionBonus: calculateDetectionBonus(f.type, updatedShipIds),
            stealthBonus: calculateStealthBonus(f.type, updatedShipIds),
          };
        }
        return f;
      })
    );

    // Update the ship
    setShips(prevShips =>
      prevShips.map(s => {
        if (s.id === shipId) {
          return {
            ...s,
            formationId,
            formationRole: determineFormationRole(s, formation.type),
            coordinationBonus: 0.1,
          };
        }
        return s;
      })
    );

    // Add log
    addLog(`Ship "${ship.name}" added to formation "${formation.name}"`);
  };

  // Handle removing a ship from a formation
  const handleRemoveShipFromFormation = (formationId: string, shipId: string) => {
    // Get the formation
    const formation = formations.find(f => f.id === formationId);
    if (!formation) return;

    // Get the ship
    const ship = ships.find(s => s.id === shipId);
    if (!ship) return;

    // Check if this is the leader
    const isLeader = shipId === formation.leaderId;

    // Update the formation
    setFormations(prevFormations =>
      prevFormations.map(f => {
        if (f.id === formationId) {
          const updatedShipIds = f.shipIds.filter(id => id !== shipId);

          // If no ships left, remove the formation
          if (updatedShipIds.length === 0) {
            return f;
          }

          // If this was the leader, assign a new leader
          const updatedLeaderId = isLeader ? updatedShipIds[0] : f.leaderId;

          return {
            ...f,
            shipIds: updatedShipIds,
            leaderId: updatedLeaderId,
            position: calculateAveragePosition(updatedShipIds),
            scanBonus: calculateScanBonus(f.type, updatedShipIds),
            detectionBonus: calculateDetectionBonus(f.type, updatedShipIds),
            stealthBonus: calculateStealthBonus(f.type, updatedShipIds),
          };
        }
        return f;
      })
    );

    // If this was the leader and there's a new leader, update the new leader's role
    if (isLeader && formation.shipIds.length > 1) {
      const newLeaderId = formation.shipIds.find(id => id !== shipId);
      if (newLeaderId) {
        setShips(prevShips =>
          prevShips.map(s => {
            if (s.id === newLeaderId) {
              return {
                ...s,
                formationRole: 'leader',
                coordinationBonus: 0.15,
              };
            }
            return s;
          })
        );
      }
    }

    // Update the ship
    setShips(prevShips =>
      prevShips.map(s => {
        if (s.id === shipId) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { formationId, formationRole, coordinationBonus, ...rest } = s;
          return rest;
        }
        return s;
      })
    );

    // If no ships left, remove the formation
    if (formation.shipIds.length === 1) {
      setFormations(prev => prev.filter(f => f.id !== formationId));
    }

    // Add log
    addLog(`Ship "${ship.name}" removed from formation "${formation.name}"`);
  };

  // Handle starting a coordinated scan
  const handleStartCoordinatedScan = (sectorId: string, shipIds: string[]) => {
    // Get the sector
    const sector = sectors.find(s => s.id === sectorId);
    if (!sector) return;

    // Update ships
    setShips(prevShips =>
      prevShips.map(ship => {
        if (shipIds.includes(ship.id)) {
          return {
            ...ship,
            status: 'scanning',
            targetSector: sectorId,
          };
        }
        return ship;
      })
    );

    // Update sector
    setSectors(prevSectors =>
      prevSectors.map(s => {
        if (s.id === sectorId) {
          return {
            ...s,
            status: 'scanning',
          };
        }
        return s;
      })
    );

    // Set scanning ships and sectors
    setScanningShips(shipIds);
    setScanningSectors([sectorId]);

    // Initialize scan progress
    setScanProgress(prev => ({
      ...prev,
      [sectorId]: 0,
    }));

    // Add log
    addLog(`Coordinated scan of "${sector.name}" started with ${shipIds.length} ships`);
  };

  // Handle sharing a task
  const handleShareTask = (
    sourceShipId: string,
    targetShipId: string,
    taskType: 'explore' | 'investigate' | 'evade'
  ) => {
    // Get the ships
    const sourceShip = ships.find(s => s.id === sourceShipId);
    const targetShip = ships.find(s => s.id === targetShipId);
    if (!sourceShip || !targetShip) return;

    // Add log
    addLog(`Task "${taskType}" shared from "${sourceShip.name}" to "${targetShip.name}"`);
  };

  // Handle auto-distributing tasks
  const handleAutoDistributeTasks = (sectorIds: string[], prioritizeFormations: boolean) => {
    // Get available ships
    const availableShips = ships.filter(ship => ship.status === 'idle');
    if (availableShips.length === 0) return;

    // Sort ships by priority
    const sortedShips = [...availableShips].sort((a, b) => {
      if (prioritizeFormations) {
        // Ships in formations have higher priority
        if (a.formationId && !b.formationId) return -1;
        if (!a.formationId && b.formationId) return 1;
      }

      // Then sort by experience
      return b.experience - a.experience;
    });

    // Distribute tasks
    const assignedShips: string[] = [];
    const assignedSectors: string[] = [];

    sectorIds.forEach((sectorId, index) => {
      if (index >= sortedShips.length) return;

      const ship = sortedShips[index];

      // If ship is in a formation, check if we can do a coordinated scan
      if (ship.formationId && prioritizeFormations) {
        const formation = formations.find(f => f.id === ship.formationId);
        if (formation) {
          // Get all idle ships in the formation
          const formationShips = ships
            .filter(s => s.formationId === formation.id && s.status === 'idle')
            .map(s => s.id);

          if (formationShips.length > 1) {
            // Start a coordinated scan
            handleStartCoordinatedScan(sectorId, formationShips);
            assignedShips.push(...formationShips);
            assignedSectors.push(sectorId);
            return;
          }
        }
      }

      // Otherwise, assign an individual task
      setShips(prevShips =>
        prevShips.map(s => {
          if (s.id === ship.id) {
            return {
              ...s,
              status: 'scanning',
              targetSector: sectorId,
            };
          }
          return s;
        })
      );

      // Update sector
      setSectors(prevSectors =>
        prevSectors.map(s => {
          if (s.id === sectorId) {
            return {
              ...s,
              status: 'scanning',
            };
          }
          return s;
        })
      );

      // Add to assigned lists
      assignedShips.push(ship.id);
      assignedSectors.push(sectorId);

      // Initialize scan progress
      setScanProgress(prev => ({
        ...prev,
        [sectorId]: 0,
      }));

      // Set scanning ships and sectors
      setScanningShips(prev => [...prev, ship.id]);
      setScanningSectors(prev => [...prev, sectorId]);

      // Add log
      const sector = sectors.find(s => s.id === sectorId);
      addLog(`Ship "${ship.name}" assigned to scan "${sector?.name || sectorId}"`);
    });

    // Add summary log
    addLog(
      `Auto-distributed tasks: ${assignedShips.length} ships assigned to ${assignedSectors.length} sectors`
    );
  };

  // Helper functions
  const calculateAveragePosition = (shipIds: string[]): Position => {
    const selectedShips = ships.filter(ship => shipIds.includes(ship.id));
    if (selectedShips.length === 0) return { x: 0, y: 0 };

    const totalX = selectedShips.reduce((sum, ship) => sum + ship.position.x, 0);
    const totalY = selectedShips.reduce((sum, ship) => sum + ship.position.y, 0);

    return {
      x: totalX / selectedShips.length,
      y: totalY / selectedShips.length,
    };
  };

  const calculateScanBonus = (
    type: 'exploration' | 'survey' | 'defensive',
    shipIds: string[]
  ): number => {
    const selectedShips = ships.filter(ship => shipIds.includes(ship.id));
    if (selectedShips.length === 0) return 0;

    // Base bonus depends on formation type
    let baseBonus = 0;
    switch (type) {
      case 'exploration':
        baseBonus = 0.2;
        break;
      case 'survey':
        baseBonus = 0.3;
        break;
      case 'defensive':
        baseBonus = 0.1;
        break;
    }

    // Additional bonus based on ship count (diminishing returns)
    const shipCountFactor = Math.min(1, 0.5 + selectedShips.length * 0.1);

    // Specialization bonus
    const specializationCounts = {
      mapping: selectedShips.filter(ship => ship.specialization === 'mapping').length,
      anomaly: selectedShips.filter(ship => ship.specialization === 'anomaly').length,
      resource: selectedShips.filter(ship => ship.specialization === 'resource').length,
    };

    // Synergy bonus for diverse specializations
    const diversityBonus = Object.values(specializationCounts).every(count => count > 0) ? 0.1 : 0;

    return baseBonus * shipCountFactor + diversityBonus;
  };

  const calculateDetectionBonus = (
    type: 'exploration' | 'survey' | 'defensive',
    shipIds: string[]
  ): number => {
    const selectedShips = ships.filter(ship => shipIds.includes(ship.id));
    if (selectedShips.length === 0) return 0;

    // Base bonus depends on formation type
    let baseBonus = 0;
    switch (type) {
      case 'exploration':
        baseBonus = 0.1;
        break;
      case 'survey':
        baseBonus = 0.05;
        break;
      case 'defensive':
        baseBonus = 0.3;
        break;
    }

    // Additional bonus based on ship count (diminishing returns)
    const shipCountFactor = Math.min(1, 0.5 + selectedShips.length * 0.1);

    return baseBonus * shipCountFactor;
  };

  const calculateStealthBonus = (
    type: 'exploration' | 'survey' | 'defensive',
    shipIds: string[]
  ): number => {
    const selectedShips = ships.filter(ship => shipIds.includes(ship.id));
    if (selectedShips.length === 0) return 0;

    // Base bonus depends on formation type
    let baseBonus = 0;
    switch (type) {
      case 'exploration':
        baseBonus = 0.1;
        break;
      case 'survey':
        baseBonus = 0.05;
        break;
      case 'defensive':
        baseBonus = 0.2;
        break;
    }

    // Additional bonus based on ship count (diminishing returns)
    const shipCountFactor = Math.min(1, 0.5 + selectedShips.length * 0.1);

    return baseBonus * shipCountFactor;
  };

  const determineFormationRole = (
    ship: ReconShip,
    formationType: 'exploration' | 'survey' | 'defensive'
  ): 'support' | 'scout' => {
    // Determine role based on specialization and formation type
    if (
      (formationType === 'exploration' && ship.specialization === 'mapping') ||
      (formationType === 'survey' && ship.specialization === 'resource') ||
      (formationType === 'defensive' && ship.specialization === 'anomaly')
    ) {
      return 'support'; // Primary support role
    }

    return 'scout'; // Scout role for other combinations
  };

  return (
    <div className={`flex h-full flex-col overflow-hidden bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-800 p-4">
        <h2 className="text-xl font-bold text-white">Recon Ship Coordination</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleRegenerateData}
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
          >
            Regenerate Data
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-grow overflow-hidden">
        <ReconShipCoordination
          ships={ships}
          sectors={sectors}
          formations={formations}
          onCreateFormation={handleCreateFormation}
          onDisbandFormation={handleDisbandFormation}
          onAddShipToFormation={handleAddShipToFormation}
          onRemoveShipFromFormation={handleRemoveShipFromFormation}
          onStartCoordinatedScan={handleStartCoordinatedScan}
          onShareTask={handleShareTask}
          onAutoDistributeTasks={handleAutoDistributeTasks}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Status Panel */}
          <div className="mb-4 rounded-lg border shadow-sm">
            <div className="border-b bg-gray-50 p-3 dark:bg-gray-800">
              <h3 className="font-medium">Status</h3>
            </div>
            <div className="p-3">
              <div className="mb-3">
                <h4 className="mb-1 text-sm font-medium">Ships</h4>
                <div className="text-sm">
                  <div>Total: {ships.length}</div>
                  <div>Idle: {ships.filter(s => s.status === 'idle').length}</div>
                  <div>Scanning: {ships.filter(s => s.status === 'scanning').length}</div>
                  <div>In Formations: {ships.filter(s => s.formationId).length}</div>
                </div>
              </div>

              <div className="mb-3">
                <h4 className="mb-1 text-sm font-medium">Sectors</h4>
                <div className="text-sm">
                  <div>Total: {sectors.length}</div>
                  <div>Unmapped: {sectors.filter(s => s.status === 'unmapped').length}</div>
                  <div>Scanning: {sectors.filter(s => s.status === 'scanning').length}</div>
                  <div>Analyzed: {sectors.filter(s => s.status === 'analyzed').length}</div>
                </div>
              </div>

              <div>
                <h4 className="mb-1 text-sm font-medium">Formations</h4>
                <div className="text-sm">
                  <div>Total: {formations.length}</div>
                  {formations.map(formation => (
                    <div key={formation.id}>
                      {formation.name}: {formation.shipIds.length} ships
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Scan Progress */}
          {Object.keys(scanProgress).length > 0 && (
            <div className="mb-4 rounded-lg border shadow-sm">
              <div className="border-b bg-gray-50 p-3 dark:bg-gray-800">
                <h3 className="font-medium">Scan Progress</h3>
              </div>
              <div className="p-3">
                {Object.entries(scanProgress).map(([sectorId, progress]) => {
                  const sector = sectors.find(s => s.id === sectorId);
                  return (
                    <div key={sectorId} className="mb-2 last:mb-0">
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{sector?.name || sectorId}</span>
                        <span>{Math.round(progress * 100)}%</span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className="h-2.5 rounded-full bg-blue-600"
                          style={{ width: `${Math.round(progress * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Activity Log */}
          <div className="rounded-lg border shadow-sm">
            <div className="border-b bg-gray-50 p-3 dark:bg-gray-800">
              <h3 className="font-medium">Activity Log</h3>
            </div>
            <div className="p-3">
              <div className="max-h-60 overflow-y-auto">
                {logs.length > 0 ? (
                  logs.map((log, index) => (
                    <div key={index} className="mb-1 text-xs last:mb-0">
                      {log}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">No activity yet</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
