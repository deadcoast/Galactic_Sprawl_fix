import React, { useState } from 'react';
import { Users, Star, X, AlertTriangle, ChevronRight } from 'lucide-react';

interface HiringPanelProps {
  tier: 1 | 2 | 3;
  onHire: (role: string) => void;
  onClose: () => void;
}

export function HiringPanel({ tier, onHire, onClose }: HiringPanelProps) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const roles = [
    {
      id: 'squadLeader',
      name: 'Squad Leader',
      description: 'Leads small combat units and reconnaissance teams',
      requirements: {
        credits: 5000,
        tier: 1
      },
      stats: {
        combat: '5-8',
        leadership: '3-6',
        technical: '2-4'
      }
    },
    {
      id: 'captain',
      name: 'Captain',
      description: 'Commands capital ships and large fleet operations',
      requirements: {
        credits: 10000,
        tier: 2
      },
      stats: {
        combat: '7-10',
        leadership: '6-9',
        technical: '4-7'
      }
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900/95 rounded-lg border border-gray-700 p-6 max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
           Continuing with the HiringPanel.tsx file content exactly where we left off:

```tsx
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-violet-500/20 rounded-lg">
              <Users className="w-6 h-6 text-violet-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Hire New Officer</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Available Roles */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {roles.map(role => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              disabled={role.requirements.tier > tier}
              className={`p-4 rounded-lg text-left transition-all ${
                selectedRole === role.id
                  ? 'bg-violet-500/20 border-2 border-violet-500'
                  : role.requirements.tier > tier
                  ? 'bg-gray-800/30 border border-gray-700 opacity-50 cursor-not-allowed'
                  : 'bg-gray-800/50 border border-gray-700 hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium text-white">{role.name}</h3>
                {role.requirements.tier > tier ? (
                  <div className="px-2 py-1 rounded-full bg-gray-700 text-xs text-gray-400">
                    Tier {role.requirements.tier}
                  </div>
                ) : (
                  <Star className="w-5 h-5 text-violet-400" />
                )}
              </div>
              <p className="text-sm text-gray-400 mb-4">{role.description}</p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Combat</div>
                  <div className="text-sm text-gray-300">{role.stats.combat}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Leadership</div>
                  <div className="text-sm text-gray-300">{role.stats.leadership}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Technical</div>
                  <div className="text-sm text-gray-300">{role.stats.technical}</div>
                </div>
              </div>

              {/* Requirements */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Cost</span>
                <span className="text-violet-400">{role.requirements.credits.toLocaleString()} Credits</span>
              </div>
            </button>
          ))}
        </div>

        {/* Tier 2+ Features */}
        {tier >= 2 && (
          <div className="mb-6 p-4 bg-violet-900/20 border border-violet-700/30 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Star className="w-5 h-5 text-violet-400" />
              <h3 className="text-white font-medium">Refugee Market Access</h3>
            </div>
            <p className="text-sm text-gray-400">
              Officers from other factions are available for recruitment with unique traits and bonuses.
            </p>
          </div>
        )}

        {/* Hire Button */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            {selectedRole
              ? 'Click hire to begin the recruitment process'
              : 'Select a role to continue'}
          </div>
          <button
            onClick={() => selectedRole && onHire(selectedRole)}
            disabled={!selectedRole}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              selectedRole
                ? 'bg-violet-600 hover:bg-violet-700 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Hire Officer</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Warnings */}
        {selectedRole && roles.find(r => r.id === selectedRole)?.requirements.tier > tier && (
          <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <div className="text-sm text-yellow-200">
              This role requires a higher academy tier. Upgrade your facility to unlock.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}