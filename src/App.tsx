import React from 'react';
import { useState, useEffect } from 'react';
import { Crown, Flag, ChevronRight } from 'lucide-react';
import { GameLayout } from './components/GameLayout';
import { SprawlView } from './components/SprawlView';
import { VPRStarSystemView } from './components/VPRStarSystemView';
import { useVPRSystem } from './hooks/useVPRSystem';
import { useVPRInteractivity } from './hooks/useVPRInteractivity';

interface EmpireDetails {
  name: string;
  bannerColor: string;
}

interface ViewState {
  showSprawlView: boolean;
  showVPRView: boolean;
}

function App() {
  const [empireDetails, setEmpireDetails] = useState<EmpireDetails>({
    name: '',
    bannerColor: '#4F46E5'
  });

  const [viewState, setViewState] = useState<ViewState>({
    showSprawlView: false,
    showVPRView: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGameStarted(true);
  };

  const [gameStarted, setGameStarted] = useState(false);
  const vprSystem = useVPRSystem();

  const { handleModuleClick } = useVPRInteractivity({
    onModuleSelect: (moduleId) => {
      console.log('Selected module:', moduleId);
    }
  });

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'v' || e.key === 'V') {
        setViewState(prev => ({
          ...prev,
          showVPRView: !prev.showVPRView,
          showSprawlView: false
        }));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (gameStarted) {
    return (
      <GameLayout empireName={empireDetails.name} bannerColor={empireDetails.bannerColor}>
        {/* VPR View */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${
          viewState.showVPRView ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}>
          <VPRStarSystemView
            empireName={empireDetails.name}
            onModuleSelect={handleModuleClick}
          />
        </div>

        {/* Sprawl View */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${
          viewState.showSprawlView ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}>
          <SprawlView empireName={empireDetails.name} />
        </div>
      </GameLayout>
    );
  }

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2048')] bg-cover bg-center">
      <div className="min-h-screen bg-black/50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-gray-900/90 p-8 rounded-lg backdrop-blur-sm shadow-xl border border-gray-800">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Crown className="w-16 h-16 text-indigo-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Found Your Empire</h1>
            <p className="text-gray-400">Your legacy among the stars begins here</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="empireName" className="block text-sm font-medium text-gray-300 mb-2">
                Empire Name
              </label>
              <input
                type="text"
                id="empireName"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter your empire's name"
                value={empireDetails.name}
                maxLength={30}
                onChange={(e) => setEmpireDetails({ ...empireDetails, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Banner Color
              </label>
              <div className="flex items-center space-x-4">
                <Flag className="w-8 h-8" style={{ color: empireDetails.bannerColor }} />
                <input
                  type="color"
                  value={empireDetails.bannerColor}
                  onChange={(e) => setEmpireDetails({ ...empireDetails, bannerColor: e.target.value })}
                  className="h-10 w-20 bg-transparent rounded cursor-pointer"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              <span>Launch Your Empire</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;