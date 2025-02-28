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
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={`relative h-16 w-16 rounded-lg bg-${color}-900/50 flex items-center justify-center overflow-hidden`}
          >
            <div className={`text-${color}-400 text-2xl font-bold`}>{officer.name.charAt(0)}</div>
            {officer.status === 'training' && (
              <>
                <div className="absolute inset-0 animate-pulse bg-gradient-to-t from-violet-500/20" />
                {Array.from({ length: particleCount }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute h-1 w-1 rounded-full bg-violet-400"
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
        <button onClick={onClose} className="rounded-full p-1 transition-colors hover:bg-gray-700">
          <X className="h-5 w-5 text-gray-400" />
        </button>
      </div>

      {/* Experience Progress */}
      <div className="mb-6">
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-gray-400">Experience</span>
          <span className="text-gray-300">
            {officer.xp.toLocaleString()}/{officer.nextLevelXp.toLocaleString()} XP
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-700">
          <div
            className={`h-full bg-${color}-500 rounded-full transition-all`}
            style={{ width: `${(officer.xp / officer.nextLevelXp) * 100}%` }}
          />
        </div>
      </div>

      {/* Skills */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-gray-800/50 p-3">
          <div className="mb-2 flex items-center space-x-2">
            <Sword className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-300">Combat</span>
          </div>
          <div className="text-lg font-medium text-white">{officer.skills.combat}</div>
        </div>
        <div className="rounded-lg bg-gray-800/50 p-3">
          <div className="mb-2 flex items-center space-x-2">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-300">Leadership</span>
          </div>
          <div className="text-lg font-medium text-white">{officer.skills.leadership}</div>
        </div>
        <div className="rounded-lg bg-gray-800/50 p-3">
          <div className="mb-2 flex items-center space-x-2">
            <Shield className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-300">Technical</span>
          </div>
          <div className="text-lg font-medium text-white">{officer.skills.technical}</div>
        </div>
      </div>

      {/* Traits */}
      <div className="mb-6">
        <h4 className="mb-3 text-sm font-medium text-gray-300">Traits</h4>
        <div className="flex flex-wrap gap-2">
          {officer.traits.map(trait => (
            <div
              key={trait}
              className={`rounded px-2 py-1 bg-${color}-900/20 border border-${color}-500/30 text-${color}-200 text-sm`}
            >
              {trait}
            </div>
          ))}
        </div>
      </div>

      {/* Training Options */}
      {officer.status === 'available' && (
        <div className="mb-6">
          <h4 className="mb-3 text-sm font-medium text-gray-300">Training Programs</h4>
          <div className="space-y-2">
            {['War', 'Recon', 'Mining'].map(spec => (
              <button
                key={spec}
                onClick={() => onStartTraining(officer.id, spec)}
                className={`w-full rounded-lg p-3 text-left transition-colors ${
                  officer.specialization === spec
                    ? `bg-${color}-500/20 border border-${color}-500/30`
                    : 'bg-gray-800/50 hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {spec === 'War' && <Sword className="h-4 w-4" />}
                    {spec === 'Recon' && <Star className="h-4 w-4" />}
                    {spec === 'Mining' && <Zap className="h-4 w-4" />}
                    <span className="text-white">{spec} Specialization</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current Assignment/Training */}
      {officer.status !== 'available' && (
        <div className="mb-6">
          <h4 className="mb-3 text-sm font-medium text-gray-300">Current Status</h4>
          <div
            className={`rounded-lg p-4 ${
              officer.status === 'training'
                ? 'border border-violet-700/30 bg-violet-900/20'
                : 'border border-green-700/30 bg-green-900/20'
            }`}
          >
            {officer.status === 'training' ? (
              <>
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-violet-200">Training in Progress</div>
                  <div className="text-violet-400">
                    {Math.round((officer.trainingProgress || 0) * 100)}%
                  </div>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-gray-700">
                  <div
                    className="h-full rounded-full bg-violet-500 transition-all"
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
          <h4 className="mb-3 text-sm font-medium text-gray-300">Available Assignments</h4>
          <div className="space-y-2">
            <button
              onClick={() => onAssign(officer.id, 'warFleet')}
              className="flex w-full items-center justify-between rounded-lg bg-gray-800/50 p-3 hover:bg-gray-700/50"
            >
              <div className="flex items-center space-x-2">
                <Sword className="h-4 w-4 text-red-400" />
                <span className="text-white">War Fleet Command</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-500" />
            </button>
            <button
              onClick={() => onAssign(officer.id, 'reconFleet')}
              className="flex w-full items-center justify-between rounded-lg bg-gray-800/50 p-3 hover:bg-gray-700/50"
            >
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4 text-cyan-400" />
                <span className="text-white">Recon Fleet Command</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-500" />
            </button>
            <button
              onClick={() => onAssign(officer.id, 'miningFleet')}
              className="flex w-full items-center justify-between rounded-lg bg-gray-800/50 p-3 hover:bg-gray-700/50"
            >
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-amber-400" />
                <span className="text-white">Mining Fleet Command</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
