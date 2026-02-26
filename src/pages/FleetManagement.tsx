import * as React from 'react';

const FormationTacticsPage = React.lazy(async () => {
  const module = await import('../components/combat/formations/FormationTacticsPage');
  return { default: module.FormationTacticsPage };
});

const FleetManagement: React.FC = () => {
  return (
    <div className="gs-route-shell">
      <React.Suspense
        fallback={
          <div className="gs-route-container gs-surface p-6 text-[var(--gs-text-2)]">
            Loading fleet management...
          </div>
        }
      >
        <FormationTacticsPage />
      </React.Suspense>
    </div>
  );
};

export default FleetManagement;
