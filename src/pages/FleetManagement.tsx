import * as React from 'react';
import { FormationTacticsPage } from '../components/combat/formations/FormationTacticsPage';

const FleetManagement: React.FC = () => {
  return (
    <div className="gs-route-shell">
      <FormationTacticsPage />
    </div>
  );
};

export default FleetManagement;
