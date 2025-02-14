import { ExplorationHub } from './components/buildings/modules/ExplorationHub/ExplorationHub';
import { TooltipProvider } from './components/ui/TooltipProvider';

export function App() {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-900">
        <ExplorationHub />
      </div>
    </TooltipProvider>
  );
}

export default App;
