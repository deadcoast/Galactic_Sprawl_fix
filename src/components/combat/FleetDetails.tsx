import * as React from 'react';
import { useParams } from 'react-router-dom';

/**
 * Fleet Details component
 * Displays detailed information about a specific fleet
 */
export const FleetDetails: React.FC = () => {
  const { fleetId } = useParams<{ fleetId: string }>();

  // Mock data for demonstration
  const fleetDetails = {
    id: fleetId,
    name:
      fleetId === 'fleet-1'
        ? 'Alpha Squadron'
        : fleetId === 'fleet-2'
          ? 'Beta Wing'
          : 'Delta Force',
    status: 'Active',
    location: 'Sector 7',
    commander: 'Captain Alex Rodriguez',
    ships: [
      { id: 'ship-1', name: 'Valiant', type: 'Destroyer', status: 'Operational' },
      { id: 'ship-2', name: 'Guardian', type: 'Cruiser', status: 'Operational' },
      { id: 'ship-3', name: 'Sentinel', type: 'Frigate', status: 'Damaged' },
    ],
    formation: {
      type: 'offensive',
      pattern: 'spearhead',
      spacing: 150,
      facing: 45,
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">{fleetDetails.name}</h2>
        <span className="rounded-full bg-green-700 px-3 py-1 text-sm text-white">
          {fleetDetails.status}
        </span>
      </div>

      {/* Fleet Overview */}
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
        <h3 className="mb-3 text-lg font-semibold text-white">Fleet Overview</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-gray-400">Location</p>
            <p className="text-white">{fleetDetails.location}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Commander</p>
            <p className="text-white">{fleetDetails.commander}</p>
          </div>
        </div>
      </div>

      {/* Ships */}
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
        <h3 className="mb-3 text-lg font-semibold text-white">Ships</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700 text-left text-sm text-gray-400">
              <th className="pb-2">Name</th>
              <th className="pb-2">Type</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {fleetDetails.ships.map(ship => (
              <tr key={ship.id} className="border-b border-gray-700 last:border-b-0">
                <td className="py-2 text-white">{ship.name}</td>
                <td className="py-2 text-white">{ship.type}</td>
                <td className="py-2">
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs ${
                      ship.status === 'Operational'
                        ? 'bg-green-900 text-green-300'
                        : 'bg-yellow-900 text-yellow-300'
                    }`}
                  >
                    {ship.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Formation */}
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
        <h3 className="mb-3 text-lg font-semibold text-white">Current Formation</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-gray-400">Type</p>
            <p className="capitalize text-white">{fleetDetails.formation.type}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Pattern</p>
            <p className="capitalize text-white">{fleetDetails.formation.pattern}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Spacing</p>
            <p className="text-white">{fleetDetails.formation.spacing} units</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Facing</p>
            <p className="text-white">{fleetDetails.formation.facing}°</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FleetDetails;
