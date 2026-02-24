import * as React from 'react';
import GalaxyExplorationSystem from '../components/exploration/system/GalaxyExplorationSystem';

const ExplorationMap: React.FC = () => {
  return (
    <GalaxyExplorationSystem
      showToolbar={true}
      showStatusBar={true}
      height="100%"
      width="100%"
    />
  );
};

export default ExplorationMap;
