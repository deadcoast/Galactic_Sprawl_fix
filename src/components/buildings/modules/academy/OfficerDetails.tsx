import { ChevronRight, Shield, Star, Sword, Users, X, Zap } from 'lucide-react';

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

interface OfficerDetailsProps {
  officer: Officer;
  quality: 'low' | 'medium' | 'high';
  onAssign: (officerId: string, assignmentId: string) => void;
  onStartTraining: (officerId: string, specialization: string) => void;
  onClose: () => void;
}

export function OfficerDetails({
  officer,
  quality,
  onAssign,
  onStartTraining,
  onClose,
}: OfficerDetailsProps) {
  const getSpecializationColor = () => {
    switch (officer.specialization) {
      case 'War':
        return 'red';
      case 'Recon':
        return 'cyan';
      case 'Mining':
        return 'amber';
      default:
        return 'blue';
    }
  };

  const color = getSpecializationColor();
  const particleCount = quality === 'high' ? 12 : quality === 'medium' ? 8 : 4;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div
            className={`relative w-16 h-16 rounded-lg bg-${color}-900/50 flex items-center justify-center overflow-hidden`}
          >
            <div className={`text-${color}-400 font-bold text-2xl`}>{officer.name.charAt(0)}</div>
            {officer.status === 'training' && (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-violet-500/20 animate-pulse" />
                {Array.from({ length: particleCount }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-violet-400 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animation: `float ${1 + Math.random()}s infinite`,
                    }}
                  />
                ))}
              </>
            )}
          </div>
          <div>
            <h3 className="text-lg font-medium text-white">{officer.name}</h3>
            <div className="text-sm text-gray-400">
              Level {officer.level} {officer.role}
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded-full transition-colors">
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Experience Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Experience</span>
          <span className="text-gray-300">
            {officer.xp.toLocaleString()}/{officer.nextLevelXp.toLocaleString()} XP
          </span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full bg-${color}-500 rounded-full transition-all`}
            style={{ width: `${(officer.xp / officer.nextLevelXp) * 100}%` }}
          />
        </div>
      </div>

      {/* Skills */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-3 bg-gray-800/50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Sword className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">Combat</span>
          </div>
          <div className="text-lg font-medium text-white">{officer.skills.combat}</div>
        </div>
        <div className="p-3 bg-gray-800/50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">Leadership</span>
          </div>
          <div className="text-lg font-medium text-white">{officer.skills.leadership}</div>
        </div>
        <div className="p-3 bg-gray-800/50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">Technical</span>
          </div>
          <div className="text-lg font-medium text-white">{officer.skills.technical}</div>
        </div>
      </div>

      {/* Traits */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Traits</h4>
        <div className="flex flex-wrap gap-2">
          {officer.traits.map(trait => (
            <div
              key={trait}
              className={`px-2 py-1 rounded bg-${color}-900/20 border border-${color}-500/30 text-${color}-200 text-sm`}
            >
              {trait}
            </div>
          ))}
        </div>
      </div>

      {/* Training Options */}
      {officer.status === 'available' && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Training Programs</h4>
          <div className="space-y-2">
            {['War', 'Recon', 'Mining'].map(spec => (
              <button
                key={spec}
                onClick={() => onStartTraining(officer.id, spec)}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  officer.specialization === spec
                    ? `bg-${color}-500/20 border border-${color}-500/30`
                    : 'bg-gray-800/50 hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {spec === 'War' && <Sword className="w-4 h-4" />}
                    {spec === 'Recon' && <Star className="w-4 h-4" />}
                    {spec === 'Mining' && <Zap className="w-4 h-4" />}
                    <span className="text-white">{spec} Specialization</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current Assignment/Training */}
      {officer.status !== 'available' && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Current Status</h4>
          <div
            className={`p-4 rounded-lg ${
              officer.status === 'training'
                ? 'bg-violet-900/20 border border-violet-700/30'
                : 'bg-green-900/20 border border-green-700/30'
            }`}
          >
            {officer.status === 'training' ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-violet-200">Training in Progress</div>
                  <div className="text-violet-400">
                    {Math.round((officer.trainingProgress || 0) * 100)}%
                  </div>
                </div>
                <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-500 rounded-full transition-all"
                    style={{
                      width: `${(officer.trainingProgress || 0) * 100}%`,
                    }}
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between">
                <div className="text-green-200">Assigned to {officer.assignedTo}</div>
                <button
                  onClick={() => onAssign(officer.id, '')}
                  className="text-xs text-green-400 hover:text-green-300"
                >
                  Reassign
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assignment Options */}
      {officer.status === 'available' && (
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3">Available Assignments</h4>
          <div className="space-y-2">
            <button
              onClick={() => onAssign(officer.id, 'warFleet')}
              className="w-full p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                <Sword className="w-4 h-4 text-red-400" />
                <span className="text-white">War Fleet Command</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={() => onAssign(officer.id, 'reconFleet')}
              className="w-full p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-cyan-400" />
                <span className="text-white">Recon Fleet Command</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={() => onAssign(officer.id, 'miningFleet')}
              className="w-full p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-white">Mining Fleet Command</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
