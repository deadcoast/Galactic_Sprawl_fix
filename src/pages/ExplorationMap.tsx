import * as React from 'react';
import GalaxyExplorationSystem from '../components/exploration/system/GalaxyExplorationSystem';

const ExplorationMap: React.FC = () => {
  return (
    <div className="gs-route-shell">
      <div className="gs-route-container">
        <GalaxyExplorationSystem
          showToolbar={true}
          showStatusBar={true}
          height="100%"
          width="100%"
        />
      </div>
    </div>
  );
};

export default ExplorationMap;
