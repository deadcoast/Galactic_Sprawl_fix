import * as React from 'react';
import { Link } from 'react-router-dom';

/**
 * Combat Dashboard component
 * Provides an overview of all combat-related systems and activities
 */
export const CombatDashboard: React.FC = () => {
  // Mock data for demonstration
  const activeFleets = [
    { id: 'fleet-1', name: 'Alpha Squadron', status: 'Patrolling', location: 'Sector 7' },
    { id: 'fleet-2', name: 'Beta Wing', status: 'Engaging', location: 'Nebula Edge' },
    { id: 'fleet-3', name: 'Delta Force', status: 'Standby', location: 'Home System' },
  ];

  const recentBattles = [
    { id: 'battle-1', location: 'Outer Rim', outcome: 'Victory', date: '2 days ago' },
    { id: 'battle-2', location: 'Mining Sector', outcome: 'Defeat', date: '5 days ago' },
    { id: 'battle-3', location: 'Trade Route', outcome: 'Victory', date: '1 week ago' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Combat Dashboard</h2>

      {/* Active Fleets */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Active Fleets</h3>
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700 text-left text-sm text-gray-400">
                <th className="pb-2">Fleet Name</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Location</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeFleets.map(fleet => (
                <tr key={fleet.id} className="border-b border-gray-700 last:border-b-0">
                  <td className="py-2 text-white">{fleet.name}</td>
                  <td className="py-2 text-white">{fleet.status}</td>
                  <td className="py-2 text-white">{fleet.location}</td>
                  <td className="py-2">
                    <Link
                      to={`/combat/fleet/${fleet.id}`}
                      className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-500"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Battles */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Recent Battles</h3>
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
          <div className="grid gap-4 md:grid-cols-3">
            {recentBattles.map(battle => (
              <div key={battle.id} className="rounded-lg border border-gray-700 bg-gray-900 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-white">{battle.location}</h4>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      battle.outcome === 'Victory'
                        ? 'bg-green-900 text-green-300'
                        : 'bg-red-900 text-red-300'
                    }`}
                  >
                    {battle.outcome}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-400">{battle.date}</p>
                <div className="mt-4">
                  <Link
                    to={`/combat/battle/${battle.id}`}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    View details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
        <div className="flex space-x-4">
          <Link
            to="/combat/formations"
            className="rounded-lg border border-gray-700 bg-gray-800 p-4 text-white hover:bg-gray-700"
          >
            Manage Formations
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CombatDashboard;
