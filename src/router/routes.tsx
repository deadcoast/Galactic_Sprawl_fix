// Import the new formation tactics page
import { FormationTacticsPage } from '../components/combat/formations/FormationTacticsPage';

// Import combat components
import { BattleView } from '../components/combat/BattleView';
import { CombatDashboard } from '../components/combat/CombatDashboard';
import { CombatLayout } from '../components/combat/CombatLayout';
import { FleetDetails } from '../components/combat/FleetDetails';

// Add the formation tactics route to the routes array
export const routes = [
  // Combat routes
  {
    path: '/combat',
    element: <CombatLayout />,
    children: [
      { path: '', element: <CombatDashboard /> },
      { path: 'fleet/:fleetId', element: <FleetDetails /> },
      { path: 'battle/:battleId', element: <BattleView /> },
      { path: 'formations', element: <FormationTacticsPage /> }, // New route
    ],
  },

  // ... other existing routes ...
];

// ... rest of the file ...
