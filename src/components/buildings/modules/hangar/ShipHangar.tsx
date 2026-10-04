import
  {
    Alert,
    Box,
    Button,
    CircularProgress,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Typography
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
    return (
      <div className="gs-route-shell">
        <div className="gs-route-container gs-surface flex items-center justify-center p-8">
          <CircularProgress size={28} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gs-route-shell">
        <div className="gs-route-container gs-surface p-6">
          <Alert severity="error">{error}</Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="gs-route-shell">
      <div className="gs-route-container gs-surface p-4 md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Typography variant="h4" sx={{ color: 'var(--gs-text-1)', fontWeight: 700 }}>
            Ship Hangar ({hangarId})
          </Typography>
          <Button
            onClick={handleRefresh}
            variant="outlined"
            sx={{
              borderColor: 'var(--gs-border)',
              color: 'var(--gs-text-1)',
              textTransform: 'none',
              '&:hover': {
                borderColor: 'var(--gs-border-strong)',
                backgroundColor: 'rgba(59, 130, 246, 0.08)',
              },
            }}
          >
            Refresh Ships
          </Button>
        </div>

        <Box
          sx={{
            mb: 3,
            p: 2,
            border: '1px solid var(--gs-border)',
            borderRadius: '10px',
            backgroundColor: 'rgba(20, 38, 65, 0.88)',
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ color: 'var(--gs-text-1)' }}>
            Build Ship
          </Typography>
          <FormControl fullWidth sx={{ mb: 1 }}>
            <InputLabel sx={{ color: 'var(--gs-text-2)' }}>Ship Class</InputLabel>
            <Select
              value={selectedBuildClass}
              label="Ship Class"
              onChange={e => setSelectedBuildClass(e.target.value as PlayerShipClass)}
              sx={{
                color: 'var(--gs-text-1)',
                '.MuiOutlinedInput-notchedOutline': {
                  borderColor: 'var(--gs-border)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'var(--gs-border-strong)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#60a5fa',
                },
                '.MuiSvgIcon-root': {
                  color: 'var(--gs-text-2)',
                },
              }}
            >
              {(Object.values(PlayerShipClass) as string[]).map(shipClass => (
                <MenuItem key={shipClass} value={shipClass}>
                  {shipClass}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            onClick={handleBuildShip}
            variant="contained"
            sx={{
              mt: 1,
              textTransform: 'none',
              background: 'linear-gradient(180deg, #3578ef, #2b63ca)',
              '&:hover': {
                background: 'linear-gradient(180deg, #3b82f6, #2f6ed8)',
              },
            }}
          >
            Build
          </Button>
        </Box>

        <div className="mt-4 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
          {shipCards.length > 0 ? (
            shipCards.map(shipData => (
              <div key={shipData.id}>
                <ShipCard
                  ship={shipData}
                  isSelected={selectedShipId === shipData.id}
                  onClick={handleShipSelect}
                />
              </div>
            ))
          ) : (
            <Typography sx={{ p: 2, color: 'var(--gs-text-2)' }}>No ships available.</Typography>
          )}
        </div>

        <SelectedShipDetails ship={selectedDetails} />
      </div>
    </div>
  );
};

export default ShipHangar;
