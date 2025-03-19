import { ChevronRight, Database, Radar, Star, Sword, Users } from 'lucide-react';

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
  stats: {
    combat: number;
    leadership: number;
    technical: number;
  };
}

interface OfficerCardProps {
  officer: Officer;
  view: 'grid' | 'list';
  quality: 'low' | 'medium' | 'high';
  selected: boolean;
  onClick: () => void;
}

export function OfficerCard({ officer, view, quality, selected, onClick }: OfficerCardProps) {
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
  const particleCount = quality === 'high' ? 8 : quality === 'medium' ? 4 : 2;

  if (view === 'list') {
    return (
      <button
        onClick={onClick}
        className={`w-full rounded-lg p-4 transition-all ${
          selected
            ? `bg-${color}-900/30 border-2 border-${color}-500`
            : 'border border-gray-700 bg-gray-800/50 hover:bg-gray-800'
        }`}
      >
        <div className="flex items-center space-x-4">
          {/* Portrait */}
          <div
            className={`relative h-12 w-12 rounded-lg bg-${color}-900/50 flex items-center justify-center overflow-hidden`}
          >
            <div className={`text-${color}-400 text-xl font-bold`}>{officer.name.charAt(0)}</div>
            {officer.status === 'training' && (
              <div className="absolute inset-0 animate-pulse bg-gradient-to-t from-violet-500/20" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-white">{officer.name}</div>
                <div className="text-sm text-gray-400">{officer.role}</div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-2">
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-gray-400">Level {officer.level}</span>
            <span className="text-gray-400">
              {officer.xp}/{officer.nextLevelXp} XP
            </span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-gray-700">
            <div
              className={`h-full bg-${color}-500 rounded-full`}
              style={{ width: `${(officer.xp / officer.nextLevelXp) * 100}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          <div title={`Combat rating affects battle performance`}>
            <div className="mb-1 flex items-center text-xs text-gray-500">
              <Sword className="mr-1 h-3 w-3" />
              Combat
            </div>
            <div className="text-sm text-gray-300">{officer.stats.combat}</div>
          </div>
          <div title={`Leadership affects squad coordination`}>
            <div className="mb-1 flex items-center text-xs text-gray-500">
              <Users className="mr-1 h-3 w-3" />
              Leadership
            </div>
            <div className="text-sm text-gray-300">{officer.stats.leadership}</div>
          </div>
          <div title={`Technical affects ship systems`}>
            <div className="mb-1 flex items-center text-xs text-gray-500">
              <Database className="mr-1 h-3 w-3" />
              Technical
            </div>
            <div className="text-sm text-gray-300">{officer.stats.technical}</div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center space-x-2">
          {officer.status === 'training' && (
            <div className="flex items-center text-xs text-violet-400">
              <Star className="mr-1 h-3 w-3" />
              In Training
            </div>
          )}
          {officer.assignedTo && (
            <div className="flex items-center text-xs text-cyan-400">
              <Radar className="mr-1 h-3 w-3" />
              On Mission
            </div>
          )}
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`relative rounded-lg p-4 transition-all ${
        selected
          ? `bg-${color}-900/30 border-2 border-${color}-500`
          : 'border border-gray-700 bg-gray-800/50 hover:bg-gray-800'
      }`}
    >
      {/* Portrait */}
      <div
        className={`relative aspect-square w-full rounded-lg bg-${color}-900/50 mb-4 overflow-hidden`}
      >
        <div
          className={`absolute inset-0 flex items-center justify-center text-${color}-400 text-4xl font-bold`}
        >
          {officer.name.charAt(0)}
        </div>

        {/* Status Effects */}
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

        {officer.status === 'assigned' && (
          <div className="absolute right-2 top-2 h-3 w-3 animate-pulse rounded-full bg-green-500" />
        )}
      </div>

      {/* Officer Info */}
      <div className="mb-4 text-center">
        <div className="mb-1 font-medium text-white">{officer.name}</div>
        <div className="text-sm text-gray-400">{officer.role}</div>
      </div>

      {/* Level & XP */}
      <div className="mb-4">
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-gray-400">Level {officer.level}</span>
          <span className="text-gray-400">
            {officer.xp}/{officer.nextLevelXp} XP
          </span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-gray-700">
          <div
            className={`h-full bg-${color}-500 rounded-full`}
            style={{ width: `${(officer.xp / officer.nextLevelXp) * 100}%` }}
          />
        </div>
      </div>

      {/* Skills */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <div className="mb-1 text-xs text-gray-400">Combat</div>
          <div className={`text-${color}-400 font-medium`}>{officer.skills.combat}</div>
        </div>
        <div className="text-center">
          <div className="mb-1 text-xs text-gray-400">Leadership</div>
          <div className={`text-${color}-400 font-medium`}>{officer.skills.leadership}</div>
        </div>
        <div className="text-center">
          <div className="mb-1 text-xs text-gray-400">Technical</div>
          <div className={`text-${color}-400 font-medium`}>{officer.skills.technical}</div>
        </div>
      </div>

      {/* Training Progress */}
      {officer.status === 'training' && officer.trainingProgress !== undefined && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
          <div
            className="h-full bg-violet-500 transition-all"
            style={{ width: `${officer.trainingProgress * 100}%` }}
          />
        </div>
      )}

      {/* Stats */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <div title={`Combat rating affects battle performance`}>
          <div className="mb-1 flex items-center text-xs text-gray-500">
            <Sword className="mr-1 h-3 w-3" />
            Combat
          </div>
          <div className="text-sm text-gray-300">{officer.stats.combat}</div>
        </div>
        <div title={`Leadership affects squad coordination`}>
          <div className="mb-1 flex items-center text-xs text-gray-500">
            <Users className="mr-1 h-3 w-3" />
            Leadership
          </div>
          <div className="text-sm text-gray-300">{officer.stats.leadership}</div>
        </div>
        <div title={`Technical affects ship systems`}>
          <div className="mb-1 flex items-center text-xs text-gray-500">
            <Database className="mr-1 h-3 w-3" />
            Technical
          </div>
          <div className="text-sm text-gray-300">{officer.stats.technical}</div>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="flex items-center space-x-2">
        {officer.status === 'training' && (
          <div className="flex items-center text-xs text-violet-400">
            <Star className="mr-1 h-3 w-3" />
            In Training
          </div>
        )}
        {officer.assignedTo && (
          <div className="flex items-center text-xs text-cyan-400">
            <Radar className="mr-1 h-3 w-3" />
            On Mission
          </div>
        )}
      </div>
    </button>
  );
}
