import { Box, List, ListItem, ListItemText, Typography } from '@mui/material';
import { ShipHangarBay } from '../../../../types/buildings/ShipHangarTypes';

interface HangarBayListProps {
  bays: ShipHangarBay[];
  // Add other props as needed
}

export const HangarBayList = ({ bays }: HangarBayListProps) => {
  return (
    <Box>
      {bays.length === 0 ? (
        <Typography>No hangar bays available.</Typography>
      ) : (
        <List dense>
          {bays.map((bay: ShipHangarBay) => (
            <ListItem key={bay.id}>
              <ListItemText
                primary={`Bay ${bay.id} (Tier ${bay.tier})`}
                secondary={`Capacity: ${bay.ships.length}/${bay.capacity} Status: ${bay.status}`}
              />
              {/* Optionally display ships in the bay */}
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default HangarBayList; 