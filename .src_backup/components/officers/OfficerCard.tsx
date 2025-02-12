import React from 'react';
import { Users, Star, Sword, Radar, Database, ChevronRight } from 'lucide-react';

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
      case 'War': return 'red';
      case 'Recon': return 'cyan';
      case 'Mining': return 'amber';
      default: return 'blue';
    }
  };

  const color = getSpecializationColor();
  const particleCount = quality === 'high' ? 8 : quality === 'medium' ? 4 : 2;

  if (view === 'list') {
    return (
      <button
        onClick={onClick}
        className={`w-full p-4 rounded-lg transition-all ${
          selected
            ? `bg-${color}-900/30 border-2 border-${color}-500`
            : 'bg-gray-800/50 border border-gray-700 hover:bg-gray-800'
        }`}
      >
        <div className="flex items-center space-x-4">
          {/* Portrait */}
          <div className={`relative w-12 h-12 rounded-lg bg-${color}-900/50 flex items-center justify-center overflow-hidden`}>
            <div className={`text-${color}-400 font-bold text-xl`}>
              {officer.name.charAt(0)}
            </div>
            {officer.status === 'training' && (
              <div className="absolute inset-0 bg-gradient-to-t from-violet-500/20 animate-pulse" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-medium">{officer.name}</div>
                <div className="text-sm text-gray-400">{officer.role}</div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-2">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Level {officer.level}</span>
            <span className="text-gray-400">
              {officer.xp}/{officer.nextLevelXp} XP
            </span>
          </div>
          <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full bg-${color}-500 rounded-full`}
              style={{ width: `${(officer.xp / officer.nextLevelXp) * 100}%` }}
            />
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`relative p-4 rounded-lg transition-all ${
        selected
          ? `bg-${color}-900/30 border-2 border-${color}-500`
          : 'bg-gray-800/50 border border-gray-700 hover:bg-gray-800'
      }`}
    >
      {/* Portrait */}
      <div className={`relative w-full aspect-square rounded-lg bg-${color}-900/50 mb-4 overflow-hidden`}>
        <div className={`absolute inset-0 flex items-center justify-center text-${color}-400 font-bold text-4xl`}>
          {officer.name.charAt(0)}
        </div>

        {/* Status Effects */}
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
                  animation: `float ${1 + Math.random()}s infinite`
                }}
              />
            ))}
          </>
        )}

        {officer.status === 'assigned' && (
          <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-green-500 animate-pulse" />
        )}
      </div>

      {/* Officer Info */}
      <div className="text-center mb-4">
        <div className="text-white font-medium mb-1">{officer.name}</div>
        <div className="text-sm text-gray-400">{officer.role}</div>
      </div>

      {/* Level & XP */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">Level {officer.level}</span>
          <span className="text-gray-400">
            {officer.xp}/{officer.nextLevelXp} XP
          </span>
        </div>
        <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full bg-${color}-500 rounded-full`}
            style={{ width: `${(officer.xp / officer.nextLevelXp) * 100}%` }}
          />
        </div>
      </div>

      {/* Skills */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <div className="text-xs text-gray-400 mb-1">Combat</div>
          <div className={`text-${color}-400 font-medium`}>{officer.skills.combat}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-400 mb-1">Leadership</div>
          <div className={`text-${color}-400 font-medium`}>{officer.skills.leadership}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-400 mb-1">Technical</div>
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
    </button>
  );
}