import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ChevronRight, Filter, Search, Star, Users, X } from 'lucide-react';
import { useState } from 'react';

interface HiringPanelProps {
  tier: 1 | 2 | 3;
  onHire: (role: string) => void;
  onClose: () => void;
}

interface OfficerRole {
  id: string;
  name: string;
  description: string;
  requirements: {
    credits: number;
    tier: 1 | 2 | 3;
  };
  stats: {
    combat: string;
    leadership: string;
    technical: string;
  };
  xpGrowth: {
    war: number;
    recon: number;
    mining: number;
  };
  origin: 'native' | 'refugee' | 'captured';
}

export function HiringPanel({ tier, onHire, onClose }: HiringPanelProps) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'native' | 'refugee' | 'captured'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const roles: OfficerRole[] = [
    {
      id: 'squadLeader',
      name: 'Squad Leader',
      description: 'Leads small combat units and reconnaissance teams',
      requirements: {
        credits: 5000,
        tier: 1 as const,
      },
      stats: {
        combat: '5-8',
        leadership: '3-6',
        technical: '2-4',
      },
      xpGrowth: {
        war: 1.2,
        recon: 1.0,
        mining: 0.8,
      },
      origin: 'native',
    },
    {
      id: 'captain',
      name: 'Captain',
      description: 'Commands capital ships and large fleet operations',
      requirements: {
        credits: 10000,
        tier: 2 as const,
      },
      stats: {
        combat: '7-10',
        leadership: '6-9',
        technical: '4-7',
      },
      xpGrowth: {
        war: 1.5,
        recon: 1.2,
        mining: 1.0,
      },
      origin: 'native',
    },
    // Tier 2 Refugee Market roles
    ...(tier >= 2
      ? [
          {
            id: 'refugeeCaptain',
            name: 'Refugee Captain',
            description: 'Experienced captain from another faction with unique abilities',
            requirements: {
              credits: 15000,
              tier: 2 as const,
            },
            stats: {
              combat: '8-11',
              leadership: '7-10',
              technical: '5-8',
            },
            xpGrowth: {
              war: 1.6,
              recon: 1.3,
              mining: 1.1,
            },
            origin: 'refugee' as const,
          },
        ]
      : []),
    // Tier 3 Indoctrination roles
    ...(tier >= 3
      ? [
          {
            id: 'capturedLeader',
            name: 'Captured Leader',
            description: 'Former enemy leader converted to your cause',
            requirements: {
              credits: 20000,
              tier: 3 as const,
            },
            stats: {
              combat: '9-12',
              leadership: '8-11',
              technical: '6-9',
            },
            xpGrowth: {
              war: 1.8,
              recon: 1.4,
              mining: 1.2,
            },
            origin: 'captured' as const,
          },
        ]
      : []),
  ];

  const filteredRoles = roles.filter(role => {
    if (filter !== 'all' && role.origin !== filter) {
      return false;
    }
    if (searchQuery && !role.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-gray-900/95 rounded-lg border border-gray-700 p-6 max-w-2xl w-full mx-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
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

        {/* Search and Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search officers..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filter}
              onChange={e => setFilter(e.target.value as typeof filter)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
            >
              <option value="all">All Origins</option>
              <option value="native">Native</option>
              {tier >= 2 && <option value="refugee">Refugee</option>}
              {tier >= 3 && <option value="captured">Captured</option>}
            </select>
          </div>
        </div>

        {/* Available Roles */}
        <div className="grid grid-cols-2 gap-4 mb-6 max-h-[50vh] overflow-y-auto">
          <AnimatePresence>
            {filteredRoles.map(role => (
              <motion.button
                key={role.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
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

                {/* Stats with Tooltips */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div title={`Combat rating affects battle performance and tactical decisions`}>
                    <div className="text-xs text-gray-500 mb-1">Combat</div>
                    <div className="text-sm text-gray-300">{role.stats.combat}</div>
                  </div>
                  <div title={`Leadership affects squad morale and command efficiency`}>
                    <div className="text-xs text-gray-500 mb-1">Leadership</div>
                    <div className="text-sm text-gray-300">{role.stats.leadership}</div>
                  </div>
                  <div title={`Technical skill affects ship maintenance and resource gathering`}>
                    <div className="text-xs text-gray-500 mb-1">Technical</div>
                    <div className="text-sm text-gray-300">{role.stats.technical}</div>
                  </div>
                </div>

                {/* XP Growth Rates */}
                <div className="mb-4">
                  <div className="text-xs text-gray-500 mb-2">XP Growth Rates</div>
                  <div className="grid grid-cols-3 gap-1">
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500"
                        style={{ width: `${role.xpGrowth.war * 50}%` }}
                        title={`War XP: ${role.xpGrowth.war}x`}
                      />
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${role.xpGrowth.recon * 50}%` }}
                        title={`Recon XP: ${role.xpGrowth.recon}x`}
                      />
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${role.xpGrowth.mining * 50}%` }}
                        title={`Mining XP: ${role.xpGrowth.mining}x`}
                      />
                    </div>
                  </div>
                </div>

                {/* Requirements */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Cost</span>
                  <span className="text-violet-400">
                    {role.requirements.credits.toLocaleString()} Credits
                  </span>
                </div>

                {/* Origin Badge */}
                {role.origin !== 'native' && (
                  <div
                    className={`mt-2 px-2 py-1 rounded-full text-xs inline-block ${
                      role.origin === 'refugee'
                        ? 'bg-blue-900/50 text-blue-400'
                        : 'bg-red-900/50 text-red-400'
                    }`}
                  >
                    {role.origin.charAt(0).toUpperCase() + role.origin.slice(1)}
                  </div>
                )}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* Tier Features */}
        {tier >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-violet-900/20 border border-violet-700/30 rounded-lg"
          >
            <div className="flex items-center space-x-2 mb-2">
              <Star className="w-5 h-5 text-violet-400" />
              <h3 className="text-white font-medium">
                {tier === 3 ? 'Advanced Recruitment Options' : 'Refugee Market Access'}
              </h3>
            </div>
            <p className="text-sm text-gray-400">
              {tier === 3
                ? 'Full access to refugee market and captured officer conversion program.'
                : 'Officers from other factions are available for recruitment with unique traits and bonuses.'}
            </p>
          </motion.div>
        )}

        {/* Hire Button */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            {selectedRole
              ? 'Click hire to begin the recruitment process'
              : 'Select a role to continue'}
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
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
          </motion.button>
        </div>

        {/* Warnings */}
        <AnimatePresence>
          {selectedRole &&
            (filteredRoles.find(r => r.id === selectedRole)?.requirements?.tier ?? 0) > tier && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg flex items-start space-x-2"
              >
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                <div className="text-sm text-yellow-200">
                  This role requires a higher academy tier. Upgrade your facility to unlock.
                </div>
              </motion.div>
            )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
