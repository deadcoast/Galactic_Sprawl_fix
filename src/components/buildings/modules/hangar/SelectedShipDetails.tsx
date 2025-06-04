import
  {
    Box,
    Button,
    Divider,
    Paper,
    Typography,
  } from '@mui/material';
import React from 'react';
import { ResourceType } from '../../../../types/resources/ResourceTypes';
import { formatResourceAmount as formatNumber } from '../../../../types/resources/ResourceTypeUtils';
import
  {
    ShipCategory,
    ShipStatus,
  } from '../../../../types/ships/ShipTypes';

// --- Define the simplified data interface ---
export interface SelectedShipDetailsData {
  id: string;
  name: string;
  status: ShipStatus;
  category: ShipCategory;
  cargo: {
    capacity: number;
    resources: Map<ResourceType, number>;
  };
  assignedOfficers?: { id: string }[];
  stats: {
    health?: number;
    maxHealth?: number;
  };
}

// --- Internal Components for Specific Ship Types ---

type CombatShipDetailsProps = Record<string, never>;
const CombatShipDetails: React.FC<CombatShipDetailsProps> = () => (
  <Box>
    <Typography variant="body2">Combat Specific Stats...</Typography>
    {/* Display combat-specific details */}
  </Box>
);

type MiningShipDetailsProps = Record<string, never>;
const MiningShipDetails: React.FC<MiningShipDetailsProps> = () => (
  <Box>
    <Typography variant="body2">Mining Specific Stats...</Typography>
    {/* Display mining-specific details */}
  </Box>
);

type ReconShipDetailsProps = Record<string, never>;
const ReconShipDetails: React.FC<ReconShipDetailsProps> = () => (
  <Box>
    <Typography variant="body2">Recon Specific Stats...</Typography>
    {/* Display recon-specific details */}
  </Box>
);

type TransportShipDetailsProps = Record<string, never>;
const TransportShipDetails: React.FC<TransportShipDetailsProps> = () => (
  <Box>
    <Typography variant="body2">Transport Specific Stats...</Typography>
    {/* Add actions if needed */}
  </Box>
);

// --- New Renderer Component ---
interface ShipSpecificDetailsRendererProps {
  ship: SelectedShipDetailsData; // Use the simplified type
}

const ShipSpecificDetailsRenderer: React.FC<ShipSpecificDetailsRendererProps> = ({ ship }) => {
  // Use direct category checks instead of type guards
  const isCombatCategory = (cat: ShipCategory): boolean => {
    switch (cat) {
      case ShipCategory.combat:
      case ShipCategory.FIGHTER:
      case ShipCategory.CRUISER:
      case ShipCategory.BATTLESHIP:
      case ShipCategory.CARRIER:
        return true;
      default:
        return false;
    }
  };

  if (isCombatCategory(ship.category)) {
    return <CombatShipDetails />;
  } else if (ship.category === ShipCategory.MINING) {
    return <MiningShipDetails />;
  } else if (ship.category === ShipCategory.RECON || ship.category === ShipCategory.SCOUT) {
    return <ReconShipDetails />;
  } else if (ship.category === ShipCategory.TRANSPORT) {
    return <TransportShipDetails />;
  }
  // TODO: Add rendering for other ship types if necessary
  return null; // Return null if no specific details component matches
};

// --- Main Component Props ---
interface SelectedShipDetailsProps {
  ship: SelectedShipDetailsData | null; // Use the simplified type
}

// --- Main Component ---
const SelectedShipDetails: React.FC<SelectedShipDetailsProps> = ({ ship }) => { // Use ship prop
  // Helper keeps TS union complexity low when calculating cargo usage
  const computeCargoUsed = (cargoMap: Map<ResourceType, number>): number => {
    let total = 0;
    cargoMap.forEach(value => {
      total += value;
    });
    return total;
  };

  // Early bailout if ship is null – avoids union-complex expressions later
  if (!ship) {
    return (
      <Box sx={{ mt: 3, p: 2, border: '1px solid grey' }}>
        <Typography variant="body1">Select a ship to view details.</Typography>
      </Box>
    );
  }

  // Calculate cargo used only after ship is non-null
  const totalCargoUsed = computeCargoUsed(ship.cargo.resources);

  // Predicate helper – keeps union evaluation simple for TypeScript
  const isActionCategory = (category: ShipCategory): boolean => {
    switch (category) {
      case ShipCategory.combat:
      case ShipCategory.FIGHTER:
      case ShipCategory.CRUISER:
      case ShipCategory.BATTLESHIP:
      case ShipCategory.CARRIER:
      case ShipCategory.MINING:
        return true;
      default:
        return false;
    }
  };

  // Define the common actions JSX
  const commonActions = (
    <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 1 }}>
      <Button
        variant="contained"
        color="primary"
        size="small"
        disabled={!ship || !(ship.status === ShipStatus.IDLE || ship.status === ShipStatus.READY)}
        // onClick={() => handleLaunchShip(ship.id)} // TODO: Pass handler
      >
        Launch
      </Button>
      <Button
        variant="outlined"
        color="secondary"
        size="small"
        sx={{ mr: 1 }}
        disabled={!ship || ship.status !== ShipStatus.DAMAGED || (ship.stats.health ?? 0) >= (ship.stats.maxHealth ?? 100)}
        // onClick={() => handleRepairShip(ship.id)} // TODO: Pass handler
      >
        Repair (Cost TBD)
      </Button>
      <Button
        variant="outlined"
        color="error"
        size="small"
        disabled={!ship}
        // onClick={() => handleScrapShip(ship.id)} // TODO: Pass handler
      >
        Scrap (Confirm TBD)
      </Button>
      {/* Add Assign Officer Button if logic exists */}
      {/* <Button size="small">Assign Officer</Button> */}
    </Box>
  );

  // --- Rendering Logic ---
  return (
    <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
      {/* Common Header Details */}
      <Typography variant="h6">Selected: {ship.name}</Typography>
      <Typography variant="body1">Status: {ship.status}</Typography>
      <Typography variant="body2">
        {/* Use locally calculated cargo */}
        Cargo: {formatNumber(totalCargoUsed)} / {formatNumber(ship.cargo?.capacity ?? 0)}
      </Typography>
      {ship.assignedOfficers && ship.assignedOfficers.length > 0 && (
        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
          Officer: {ship.assignedOfficers[0]?.id ?? 'Unknown ID'} (Details TBD)
        </Typography>
      )}

      {/* Call the new renderer component */}
      <ShipSpecificDetailsRenderer ship={ship} />

      {/* Conditionally render common actions after specific details */}
      {isActionCategory(ship.category) && (
        <>
          <Divider sx={{ my: 2 }} />
          {commonActions}
        </>
      )}
    </Paper>
  );
};

export default SelectedShipDetails;
