// Import React.lazy for code splitting
import { lazy, Suspense } from 'react';

// Define a loading component for lazy-loaded routes
const LazyLoadingFallback = () => (
  <div className="flex h-full w-full items-center justify-center p-10">
    <div className="text-center">
      <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      <p className="text-lg font-medium text-gray-300">Loading...</p>
    </div>
  </div>
);

// Lazy load components instead of direct imports
const FormationTacticsPage = lazy(() =>
  import('../components/combat/formations/FormationTacticsPage').then(module => ({
    default: module.FormationTacticsPage,
  }))
);
const BattleView = lazy(() =>
  import('../components/combat/BattleView').then(module => ({ default: module.BattleView }))
);
const CombatDashboard = lazy(() =>
  import('../components/combat/CombatDashboard').then(module => ({
    default: module.CombatDashboard,
  }))
);
const FleetDetails = lazy(() =>
  import('../components/combat/FleetDetails').then(module => ({ default: module.FleetDetails }))
);

// Layout components are typically loaded eagerly as they are needed immediately
import { CombatLayout } from '../components/combat/CombatLayout';

// Add the formation tactics route to the routes array
export const routes = [
  // Combat routes
  {
    path: '/combat',
    element: <CombatLayout />,
    children: [
      {
        path: '',
        element: (
          <Suspense fallback={<LazyLoadingFallback />}>
            <CombatDashboard />
          </Suspense>
        ),
      },
      {
        path: 'fleet/:fleetId',
        element: (
          <Suspense fallback={<LazyLoadingFallback />}>
            <FleetDetails />
          </Suspense>
        ),
      },
      {
        path: 'battle/:battleId',
        element: (
          <Suspense fallback={<LazyLoadingFallback />}>
            <BattleView />
          </Suspense>
        ),
      },
      {
        path: 'formations',
        element: (
          <Suspense fallback={<LazyLoadingFallback />}>
            <FormationTacticsPage />
          </Suspense>
        ),
      },
    ],
  },

  // ... other existing routes ...
];

// ... rest of the file ...
