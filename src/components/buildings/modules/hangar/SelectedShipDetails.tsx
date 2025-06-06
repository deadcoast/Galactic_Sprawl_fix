import
  {
    Box,
    Button,
    Divider,
    Paper,
    Typography,
  } from '@mui/material';
import React, { ReactElement } from 'react';
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
const CombatShipDetails = (): ReactElement => {
  return React.createElement(
    Box,
    null,
    React.createElement(Typography, { variant: 'body2' }, 'Combat Specific Stats...')
  );
};

type MiningShipDetailsProps = Record<string, never>;
const MiningShipDetails = (): ReactElement => {
  return React.createElement(
    Box,
    null,
    React.createElement(Typography, { variant: 'body2' }, 'Mining Specific Stats...')
  );
};

type ReconShipDetailsProps = Record<string, never>;
const ReconShipDetails = (): ReactElement => {
  return React.createElement(
    Box,
    null,
    React.createElement(Typography, { variant: 'body2' }, 'Recon Specific Stats...')
  );
};

type TransportShipDetailsProps = Record<string, never>;
const TransportShipDetails = (): ReactElement => {
  return React.createElement(
    Box,
    null,
    React.createElement(Typography, { variant: 'body2' }, 'Transport Specific Stats...')
  );
};

// --- New Renderer Component ---
interface ShipSpecificDetailsRendererProps {
  ship: SelectedShipDetailsData | null;
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

  if (ship?.category === undefined) {
    return null;
  }

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
    const placeholder: JSX.Element = React.createElement(
      Box,
      { sx: { mt: 3, p: 2, border: '1px solid grey' } },
      React.createElement(Typography, { variant: 'body1' }, 'Select a ship to view details.')
    );
    return placeholder;
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

  // Helper to generate common actions without triggering complex union evaluation
  const buildCommonActions = (shipData: SelectedShipDetailsData): ReactElement => {
    const launchDisabled = !(shipData.status === ShipStatus.IDLE || shipData.status === ShipStatus.READY);
    const repairDisabled = shipData.status !== ShipStatus.DAMAGED || (shipData.stats.health ?? 0) >= (shipData.stats.maxHealth ?? 100);
    return React.createElement(
      Box,
      { sx: { display: 'flex', justifyContent: 'flex-start', gap: 1 } },
      [
        React.createElement(
          Button,
          { key: 'launch', variant: 'contained', color: 'primary', size: 'small', disabled: launchDisabled },
          'Launch'
        ),
        React.createElement(
          Button,
          { key: 'repair', variant: 'outlined', color: 'secondary', size: 'small', sx: { mr: 1 }, disabled: repairDisabled },
          'Repair (Cost TBD)'
        ),
        React.createElement(
          Button,
          { key: 'scrap', variant: 'outlined', color: 'error', size: 'small', disabled: false },
          'Scrap (Confirm TBD)'
        ),
      ]
    );
  };

  const commonActions: ReactElement = buildCommonActions(ship);

  // --- Rendering Logic ---
  return (
    (<Paper elevation={2} sx={{ p: 2, mt: 2 }}>
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
      {(() => {
        const cat = ship.category; // isolate to narrow union evaluation
        return isActionCategory(cat);
      })() && (
        <>
          <Divider sx={{ my: 2 }} />
          {commonActions}
        </>
      )}
    </Paper>) as JSX.Element
  );
};

export default SelectedShipDetails;
