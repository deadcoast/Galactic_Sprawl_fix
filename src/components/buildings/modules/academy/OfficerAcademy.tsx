import {
  AlertTriangle,
  ChevronRight,
  Database,
  Filter,
  Radar,
  Search,
  Star,
  Sword,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { useScalingSystem } from '../../../../hooks/game/useScalingSystem';
import { HiringPanel } from './HiringPanel';
import { OfficerCard } from './OfficerCard';
import { OfficerDetails } from './OfficerDetails';

interface Officer {
  id: string;
  name: string;
  portrait: string;
  level: number;
  xp: number;
  nextLevelXp: number;
  role: 'Squad Leader' | 'Captain';
  status: 'training' | 'assigned' | 'available';
  specialization: 'combat' | 'Recon' | 'Mining';
  skills: {
    combat: number;
    leadership: number;
    technical: number;
  };
  assignedTo?: string;
  trainingProgress?: number;
  traits: string[];
  stats: {
    combat: number;
    leadership: number;
    technical: number;
  };
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
  onStartTraining,
}: OfficersAcademyProps) {
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);
  const [showHiringPanel, setShowHiringPanel] = useState(false);
  const [filter, setFilter] = useState<'all' | 'available' | 'training' | 'assigned'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const scaling = useScalingSystem();
  const quality =
    scaling.performance.fps > 45 ? 'high' : scaling.performance.fps > 30 ? 'medium' : 'low';

  const filteredOfficers = officers.filter(officer => {
    if (searchQuery && !officer.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filter === 'available' && officer.status !== 'available') {
      return false;
    }
    if (filter === 'training' && officer.status !== 'training') {
      return false;
    }
    if (filter === 'assigned' && officer.status !== 'assigned') {
      return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-4 flex overflow-hidden rounded-lg border border-gray-700 bg-gray-900/95 shadow-2xl backdrop-blur-md">
      {/* Left Panel - Officer List */}
      <div className="flex w-2/3 flex-col border-r border-gray-700 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-violet-500/20 p-2">
              <Users className="h-6 w-6 text-violet-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Officers Academy</h2>
              <div className="text-sm text-gray-400">Tier {tier} Training Facility</div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search officers..."
                className="w-64 rounded-lg border border-gray-700 bg-gray-800/90 px-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <Search className="absolute top-2.5 right-3 h-5 w-5 text-gray-400" />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`rounded-lg p-2 transition-colors ${
                showFilters
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Filter className="h-5 w-5" />
            </button>
          </div>

          {/* Filter Buttons */}
          <div className="mb-6 flex space-x-2">
            {[
              { id: 'all', label: 'All Officers', icon: Users },
              { id: 'available', label: 'Available', icon: Star },
              { id: 'training', label: 'In Training', icon: Sword },
              { id: 'assigned', label: 'Assigned', icon: Radar },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setFilter(id as 'all' | 'available' | 'training' | 'assigned')}
                className={`flex items-center space-x-2 rounded-lg px-3 py-2 ${
                  filter === id
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex rounded-lg bg-gray-800 p-1">
            <button
              onClick={() => setView('grid')}
              className={`rounded p-1.5 ${
                view === 'grid' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <div className="grid h-5 w-5 grid-cols-2 gap-0.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-sm bg-current" />
                ))}
              </div>
            </button>
            <button
              onClick={() => setView('list')}
              className={`rounded p-1.5 ${
                view === 'list' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <div className="flex h-5 w-5 flex-col justify-between">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-1 rounded-sm bg-current" />
                ))}
              </div>
            </button>
          </div>
        </div>

        {/* Officer Grid/List */}
        <div
          className={`flex-1 overflow-y-auto ${
            view === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-4'
          }`}
        >
          {filteredOfficers.map(officer => (
            <div key={officer.id} className="group">
              <OfficerCard
                officer={officer}
                view={view}
                quality={quality}
                selected={selectedOfficer?.id === officer.id}
                onClick={() => setSelectedOfficer(officer)}
              />
              <div className="mt-2 flex justify-end opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => setSelectedOfficer(officer)}
                  className="flex items-center text-sm text-violet-400 hover:text-violet-300"
                >
                  <span>View Details</span>
                  <ChevronRight className="ml-1 h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Hire Button */}
        <button
          onClick={() => setShowHiringPanel(true)}
          className="mt-6 flex items-center justify-center space-x-2 rounded-lg bg-violet-600 px-4 py-3 font-medium text-white hover:bg-violet-700"
        >
          <Users className="h-5 w-5" />
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
          <div className="flex h-full items-center justify-center text-center text-gray-400">
            <div>
              <Users className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>Select an officer to view details and manage assignments</p>
            </div>
          </div>
        )}
      </div>

      {/* Hiring Panel Modal */}
      {showHiringPanel && (
        <HiringPanel tier={tier} onHire={onHireOfficer} onClose={() => setShowHiringPanel(false)} />
      )}

      {/* Tier-specific Features */}
      {tier >= 2 && (
        <div className="absolute bottom-6 left-6 flex items-center space-x-2 rounded-lg border border-violet-700/30 bg-violet-900/50 px-4 py-2">
          <Database className="h-4 w-4 text-violet-400" />
          <span className="text-sm text-violet-200">Refugee Market Active</span>
        </div>
      )}

      {tier >= 3 && (
        <div className="absolute right-6 bottom-6 flex items-center space-x-2 rounded-lg border border-red-700/30 bg-red-900/50 px-4 py-2">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <span className="text-sm text-red-200">Indoctrination Program Available</span>
        </div>
      )}
    </div>
  );
}
