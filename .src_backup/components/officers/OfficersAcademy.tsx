import React, { useState } from 'react';
import { Users, Star, Sword, Radar, Database, ChevronRight, Search, Filter, AlertTriangle } from 'lucide-react';
import { OfficerCard } from './OfficerCard';
import { OfficerDetails } from './OfficerDetails';
import { HiringPanel } from './HiringPanel';
import { useScalingSystem } from '../../hooks/useScalingSystem';

interface Officer {
  id: string;
  name: string;
  portrait: string;
  level: number;
  xp: number;
  nextLevelXp: number;
  role: 'Squad Leader' | 'Captain';
  status: 'training' | 'assigned' | 'available';
  specialization: 'War' | 'Recon' | 'Mining';
  skills: {
    combat: number;
    leadership: number;
    technical: number;
  };
  assignedTo?: string;
  trainingProgress?: number;
  traits: string[];
}

interface OfficersAcademyProps {
  tier: 1 | 2 | 3;
  officers: Officer[];
  onHireOfficer: (role: string) => void;
  onAssignOfficer: (officerId: string, assignmentId: string) => void;
  onStartTraining: (officerId: string, specialization: string) => void;
}

export function OfficersAcademy({
  tier,
  officers,
  onHireOfficer,
  onAssignOfficer,
  onStartTraining
}: OfficersAcademyProps) {
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);
  const [showHiringPanel, setShowHiringPanel] = useState(false);
  const [filter, setFilter] = useState<'all' | 'available' | 'training' | 'assigned'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const scaling = useScalingSystem();
  const quality = scaling.performance.fps > 45 ? 'high' : 
                 scaling.performance.fps > 30 ? 'medium' : 'low';

  const filteredOfficers = officers.filter(officer => {
    if (searchQuery && !officer.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filter === 'available' && officer.status !== 'available') return false;
    if (filter === 'training' && officer.status !== 'training') return false;
    if (filter === 'assigned' && officer.status !== 'assigned') return false;
    return true;
  });

  return (
    <div className="fixed inset-4 bg-gray-900/95 backdrop-blur-md rounded-lg border border-gray-700 shadow-2xl flex overflow-hidden">
      {/* Left Panel - Officer List */}
      <div className="w-2/3 border-r border-gray-700 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-violet-500/20 rounded-lg">
              <Users className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Officers Academy</h2>
              <div className="text-sm text-gray-400">Tier {tier} Training Facility</div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search officers..."
                className="w-64 px-4 py-2 bg-gray-800/90 rounded-lg border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>

            {/* View Toggle */}
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setView('grid')}
                className={`p-1.5 rounded ${
                  view === 'grid'
                    ? 'bg-violet-600 text-white'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <div className="w-5 h-5 grid grid-cols-2 gap-0.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-current rounded-sm" />
                  ))}
                </div>
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-1.5 rounded ${
                  view === 'list'
                    ? 'bg-violet-600 text-white'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <div className="w-5 h-5 flex flex-col justify-between">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-1 bg-current rounded-sm" />
                  ))}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex space-x-2 mb-6">
          {[
            { id: 'all', label: 'All Officers', icon: Users },
            { id: 'available', label: 'Available', icon: Star },
            { id: 'training', label: 'In Training', icon: Sword },
            { id: 'assigned', label: 'Assigned', icon: Radar }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setFilter(id as any)}
              className={`px-3 py-2 rounded-lg flex items-center space-x-2 ${
                filter === id
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Officer Grid/List */}
        <div className={`flex-1 overflow-y-auto ${
          view === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-4'
        }`}>
          {filteredOfficers.map(officer => (
            <OfficerCard
              key={officer.id}
              officer={officer}
              view={view}
              quality={quality}
              selected={selectedOfficer?.id === officer.id}
              onClick={() => setSelectedOfficer(officer)}
            />
          ))}
        </div>

        {/* Hire Button */}
        <button
          onClick={() => setShowHiringPanel(true)}
          className="mt-6 px-4 py-3 bg-violet-600 hover:bg-violet-700 rounded-lg text-white font-medium flex items-center justify-center space-x-2"
        >
          <Users className="w-5 h-5" />
          <span>Hire New Officer</span>
        </button>
      </div>

      {/* Right Panel - Details & Training */}
      <div className="w-1/3 p-6">
        {selectedOfficer ? (
          <OfficerDetails
            officer={selectedOfficer}
            quality={quality}
            onAssign={onAssignOfficer}
            onStartTraining={onStartTraining}
            onClose={() => setSelectedOfficer(null)}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 text-center">
            <div>
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select an officer to view details and manage assignments</p>
            </div>
          </div>
        )}
      </div>

      {/* Hiring Panel Modal */}
      {showHiringPanel && (
        <HiringPanel
          tier={tier}
          onHire={onHireOfficer}
          onClose={() => setShowHiringPanel(false)}
        />
      )}

      {/* Tier-specific Features */}
      {tier >= 2 && (
        <div className="absolute bottom-6 left-6 px-4 py-2 bg-violet-900/50 border border-violet-700/30 rounded-lg flex items-center space-x-2">
          <Database className="w-4 h-4 text-violet-400" />
          <span className="text-sm text-violet-200">Refugee Market Active</span>
        </div>
      )}

      {tier >= 3 && (
        <div className="absolute bottom-6 right-6 px-4 py-2 bg-red-900/50 border border-red-700/30 rounded-lg flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-200">Indoctrination Program Available</span>
        </div>
      )}
    </div>
  );
}