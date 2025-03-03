import React from 'react';
import { useProfilingOverlay } from '../hooks/ui/useProfilingOverlay';
import { ProfilingOverlay } from './ui/profiling';

const App: React.FC = () => {
  // Initialize profiling overlay
  const { isVisible } = useProfilingOverlay({
    enabledByDefault: process.env.NODE_ENV === 'development',
    toggleKey: 'p',
  });

  return (
    <div className="app">
      {/* Profiling overlay */}
      <ProfilingOverlay visible={isVisible} />
    </div>
  );
};

export default App;
