import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ShipCard } from './ShipCard';
// Correct ShipHangarManager import and add dependencies
import { getResourceManager } from '../../../../managers/ManagerRegistry';
import { OfficerManager } from '../../../../managers/module/OfficerManager';
import { StandardShipHangarManager } from '../../../../managers/ships/ShipManager';
// Fix import path for formatNumber
import { formatResourceAmount as formatNumber } from '../../../../types/resources/ResourceTypeUtils';
import { PlayerShipClass } from '../../../../types/ships/PlayerShipTypes';
import { Ship, ShipStatus } from '../../../../types/ships/ShipTypes';

// Move helper function outside the component
const calculateTotalCargoUsed = (ship: Ship): number => {
  if (!ship.cargo || !(ship.cargo.resources instanceof Map) || ship.cargo.resources.size === 0) {
    return 0;
  }
  let sum = 0;
  // Explicitly cast resources to Map after check
  const resourcesMap = ship.cargo.resources;
  for (const amount of resourcesMap.values()) {
    if (typeof amount === 'number') {
      sum += amount;
    }
  }
  return sum;
};

interface ShipHangarProps {
  hangarId: string;
  capacity?: number; // Add capacity prop if needed by manager
}

export const ShipHangar: React.FC<ShipHangarProps> = ({ hangarId, capacity = 10 }) => {
  // Instantiate manager using useMemo and dependencies
  const resourceManager = useMemo(() => getResourceManager(), []);
  // Assuming OfficerManager can be instantiated directly or needs a getter
  const officerManager = useMemo(() => new OfficerManager(), []);
  const hangarManager = useMemo(() => {
    return new StandardShipHangarManager(hangarId, capacity, resourceManager, officerManager);
  }, [hangarId, capacity, resourceManager, officerManager]);

  const [ships, setShips] = useState<Ship[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedShipId, setSelectedShipId] = useState<string | null>(null);
  const [selectedBuildClass, setSelectedBuildClass] = useState<PlayerShipClass>(
    PlayerShipClass.STAR_SCHOONER
  );
  const [alerts, setAlerts] = useState<Map<string, string[]>>(new Map());

  const fetchShips = useCallback(() => {
    setLoading(true);
    try {
      const currentShips = hangarManager.getAllShips();
      setShips(currentShips);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ships');
      setShips([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  }, [hangarManager]);

  useEffect(() => {
    fetchShips();
  }, [fetchShips]);

  const updateAlerts = useCallback(() => {
    const newAlertsMap = new Map<string, string[]>();
    ships?.forEach(ship => {
      const shipAlerts: string[] = [];
      if ((ship.stats?.health ?? 0) < (ship.stats?.maxHealth ?? 0) * 0.2) {
        shipAlerts.push('Critical hull damage');
      }
      if ((ship.stats?.shield ?? 0) === 0 && (ship.stats?.maxShield ?? 0) > 0) {
        shipAlerts.push('Shields down');
      }
      if ((ship.crew ?? 0) < (ship.maxCrew ?? 0) * 0.5) {
        shipAlerts.push('Low crew');
      }
      // Add more alert conditions as needed

      if (shipAlerts.length > 0) {
        newAlertsMap.set(ship.id, shipAlerts);
      }
    });
    // Create new Map instance before setting state
    setAlerts(newAlertsMap);
  }, [ships]);

  // --- Event Handling Placeholder ---
  // Add actual event types and logic based on ShipHangarManager events

  // --- UI Handlers ---
  const handleShipSelect = (shipId: string) => {
    setSelectedShipId(prevId => (prevId === shipId ? null : shipId));
  };

  const handleRefreshShips = () => {
    fetchShips();
  };

  const handleLaunchShip = (shipId: string) => {
    void hangarManager.launchShip(shipId); // launchShip might not return a promise
    fetchShips();
  };

  const handleRecallShip = (shipId: string) => {
    // Use correct ShipStatus enum
    hangarManager.changeShipStatus(shipId, ShipStatus.RETURNING); // changeShipStatus might not return promise
    fetchShips();
  };

  const handleRepairShip = (shipId: string) => {
    const ship = ships?.find(s => s.id === shipId);
    if (ship?.stats?.maxHealth) {
      // repairShip might not return a promise
      hangarManager.repairShip(shipId, ship.stats.maxHealth);
      fetchShips();
    }
  };

  const handleBuildShip = () => {
    // buildShip might not return a promise
    const builtShip = hangarManager.buildShip(selectedBuildClass);
    if (builtShip) {
      fetchShips(); // Refresh only if build succeeded
    } // Consider adding error handling/feedback if buildShip returns undefined
  };

  // --- Calculations & Derived State ---
  const selectedShip = ships?.find(ship => ship.id === selectedShipId);

  // --- Rendering ---
  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  // Pre-calculate cargo used if ship is selected
  const totalCargoUsed = selectedShip ? calculateTotalCargoUsed(selectedShip) : 0;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Ship Hangar ({hangarId})
      </Typography>
      <Button onClick={handleRefreshShips} sx={{ mb: 2 }}>
        Refresh Ships
      </Button>

      {/* Ship Building Section */}
      <Box sx={{ mb: 3, p: 2, border: '1px dashed grey' }}>
        <Typography variant="h6" gutterBottom>
          Build Ship
        </Typography>
        <FormControl fullWidth sx={{ mb: 1 }}>
          <InputLabel>Ship Class</InputLabel>
          <Select
            value={selectedBuildClass}
            label="Ship Class"
            onChange={e => setSelectedBuildClass(e.target.value as PlayerShipClass)}
          >
            {/* Added curly braces for correct JSX map */}
            {Object.values(PlayerShipClass).map(shipClass => (
              <MenuItem key={shipClass} value={shipClass}>
                {shipClass}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="contained" onClick={handleBuildShip}>
          Build
        </Button>
      </Box>

      {/* Ship List */}
      <Grid container spacing={2}>
        {ships && ships.length > 0 ? (
          ships.map(ship => (
            <Grid item xs={12} sm={6} md={4} key={ship.id}>
              <ShipCard
                ship={ship}
                isSelected={selectedShipId === ship.id}
                onClick={handleShipSelect}
              />
            </Grid>
          ))
        ) : (
          <Typography sx={{ m: 2 }}>No ships currently in hangar.</Typography>
        )}
      </Grid>

      {/* Selected Ship Details & Actions */}
      {selectedShip && (
        <Box sx={{ mt: 3, p: 2, border: '1px solid grey' }}>
          <Typography variant="h6">Selected: {selectedShip.name ?? 'N/A'}</Typography>
          <Typography variant="body1">Status: {selectedShip.status}</Typography>
          <Typography variant="body1">Category: {selectedShip.category}</Typography>
          <Typography variant="body1">Level: {selectedShip.level ?? 'N/A'}</Typography>
          {/* Use formatNumber with explicit number values */}
          <Typography variant="body2">
            Health: {formatNumber(selectedShip.stats?.health ?? 0)} /{' '}
            {formatNumber(selectedShip.stats?.maxHealth ?? 0)}
          </Typography>
          <Typography variant="body2">
            Shield: {formatNumber(selectedShip.stats?.shield ?? 0)} /{' '}
            {formatNumber(selectedShip.stats?.maxShield ?? 0)}
          </Typography>
          <Typography variant="body2">
            Armor: {formatNumber(selectedShip.stats?.defense?.armor ?? 0)}
          </Typography>
          <Typography variant="body2">
            Crew: {selectedShip.crew ?? 0} / {selectedShip.maxCrew ?? 'N/A'}
          </Typography>
          <Typography variant="body2">Location: {selectedShip.location ?? 'Unknown'}</Typography>
          {selectedShip.destination && (
            <Typography variant="body2">Destination: {selectedShip.destination}</Typography>
          )}
          {selectedShip.cargo && (
            <Typography variant="body2">
              Cargo: {totalCargoUsed} / {selectedShip.cargo.capacity}
            </Typography>
          )}

          <Box sx={{ mt: 2 }}>
            {/* Use correct ShipStatus enum member */}
            {selectedShip.status === ShipStatus.IDLE && (
              <Button onClick={() => handleLaunchShip(selectedShip.id)} sx={{ mr: 1 }}>
                Launch
              </Button>
            )}
            {[
              ShipStatus.ENGAGING,
              ShipStatus.ATTACKING,
              ShipStatus.RETURNING,
              ShipStatus.WITHDRAWING,
            ].includes(selectedShip.status) && (
              <Button onClick={() => handleRecallShip(selectedShip.id)} sx={{ mr: 1 }}>
                Recall
              </Button>
            )}
            {[ShipStatus.DAMAGED, ShipStatus.DISABLED].includes(selectedShip.status) && (
              <Button onClick={() => handleRepairShip(selectedShip.id)} sx={{ mr: 1 }}>
                Repair
              </Button>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ShipHangar;
