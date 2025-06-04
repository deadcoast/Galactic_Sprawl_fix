import
  {
    Alert,
    Box,
    Button,
    CircularProgress,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    SxProps,
    Typography,
  } from '@mui/material';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getResourceManager } from '../../../../managers/ManagerRegistry';
import { OfficerManager } from '../../../../managers/module/OfficerManager';
import { StandardShipHangarManager } from '../../../../managers/ships/ShipManager';
import { PlayerShipClass } from '../../../../types/ships/PlayerShipTypes';
import { Ship } from '../../../../types/ships/ShipTypes';
import SelectedShipDetails, { SelectedShipDetailsData } from './SelectedShipDetails';
import { ShipCard, ShipCardData } from './ShipCard';
import { mapShipToSelectedShipData, mapShipToShipCardData } from './hangarUtils';

interface ShipHangarProps {
  hangarId: string;
  capacity?: number;
}

export const ShipHangar: React.FC<ShipHangarProps> = ({ hangarId, capacity = 10 }) => {
  const resourceManager = useMemo(() => getResourceManager(), []);
  const officerManager = useMemo(() => new OfficerManager(), []);
  const hangarManager = useMemo(() => {
    return new StandardShipHangarManager(hangarId, capacity, resourceManager, officerManager);
  }, [hangarId, capacity, resourceManager, officerManager]);

  const [ships, setShips] = useState<Ship[] | null>(null);
  const [selectedShipId, setSelectedShipId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBuildClass, setSelectedBuildClass] = useState<PlayerShipClass>(
    PlayerShipClass.SCOUT, // Default selection
  );

  const [shipCards, setShipCards] = useState<ShipCardData[]>([]);
  const [selectedDetails, setSelectedDetails] = useState<SelectedShipDetailsData | null>(null);
  const [rawSelectedShip, setRawSelectedShip] = useState<Ship | null>(null); // State for the raw selected ship object

  // Make synchronous as manager methods appear synchronous
  const fetchShips = useCallback(() => {
    setLoading(true);
    setError(null);
    try {
      const rawShips = hangarManager.getAllShipDetails();
      // Map to CardData immediately after fetch
      const mappedCards = rawShips?.map(mapShipToShipCardData) ?? [];
      setShipCards(mappedCards); // Set the processed card data
      setShips(rawShips); // Set the raw ship data (still needed for selection logic)
      // Also update the rawSelectedShip based on the current selectedShipId
      const currentlySelected = rawShips?.find((s) => s.id === selectedShipId) ?? null;
      setRawSelectedShip(currentlySelected);
    } catch {
      setError('Failed to load ships.');
    } finally {
      setLoading(false);
    }
  }, [hangarManager, selectedShipId]);

  useEffect(() => {
    fetchShips();
  }, [fetchShips]);

  useEffect(() => {
    // Map the rawSelectedShip state directly
    const mappedDetails = mapShipToSelectedShipData(rawSelectedShip);
    setSelectedDetails(mappedDetails);
  }, [rawSelectedShip]); // Only depends on the raw selected ship object

  const handleShipSelect = (id: string) => {
    const newSelectedId = selectedShipId === id ? null : id;
    setSelectedShipId(newSelectedId);
    // Update the raw selected ship state as well
    const newlySelectedShip = ships?.find((s) => s.id === newSelectedId) ?? null;
    setRawSelectedShip(newlySelectedShip);
  };

  const handleRefresh = () => {
    fetchShips();
  };

  const handleBuildShip = useCallback(() => {
    setLoading(true);
    const builtShip = hangarManager.buildShip(selectedBuildClass);
    if (builtShip) {
      fetchShips();
    }
  }, [hangarManager, selectedBuildClass, fetchShips]);

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ p: 2 } as SxProps}>
      <Typography variant="h5" gutterBottom>
        Ship Hangar ({hangarId})
      </Typography>
      <Button onClick={handleRefresh} sx={{ mb: 2 }}>
        Refresh Ships
      </Button>

      <Box sx={{ mb: 3, p: 2, border: '1px dashed grey' }}>
        <Typography variant="h6" gutterBottom>Build Ship</Typography>
        <FormControl fullWidth sx={{ mb: 1 }}>
          <InputLabel>Ship Class</InputLabel>
          <Select
            value={selectedBuildClass}
            label="Ship Class"
            onChange={e => setSelectedBuildClass(e.target.value as PlayerShipClass)}
          >
            {(Object.values(PlayerShipClass) as string[]).map(shipClass => (
              <MenuItem key={shipClass} value={shipClass}>
                {shipClass}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button onClick={handleBuildShip} variant="contained" sx={{ ml: 2 }}>
          Build
        </Button>
      </Box>

      <Grid container spacing={2}>
        {shipCards.length > 0 ? (
          shipCards.map((shipData) => (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              key={shipData.id}
            >
              <ShipCard ship={shipData} isSelected={selectedShipId === shipData.id} onClick={handleShipSelect} />
            </Grid>
          ))
        ) : (
          <Typography sx={{ p: 2 }}>No ships available.</Typography>
        )}
      </Grid>

      <SelectedShipDetails ship={selectedDetails} />

    </Box>
  );
};

export default ShipHangar;
