import * as React from "react";
import { useParams } from 'react-router-dom';

/**
 * Battle View component
 * Displays detailed information about a specific battle
 */
export const BattleView: React.FC = () => {
  const { battleId } = useParams<{ battleId: string }>();

  // Mock data for demonstration
  const battleDetails = {
    id: battleId,
    name:
      battleId === 'battle-1'
        ? 'The Battle of Outer Rim'
        : battleId === 'battle-2'
          ? 'Mining Sector Conflict'
          : 'Trade Route Defense',
    status: 'Completed',
    outcome: battleId === 'battle-2' ? 'Defeat' : 'Victory',
    location:
      battleId === 'battle-1'
        ? 'Outer Rim'
        : battleId === 'battle-2'
          ? 'Mining Sector'
          : 'Trade Route',
    date:
      battleId === 'battle-1'
        ? '2 days ago'
        : battleId === 'battle-2'
          ? '5 days ago'
          : '1 week ago',
    duration: '2 hours 15 minutes',
    ownForces: {
      fleetsDeployed: 2,
      shipsDeployed: 8,
      shipsLost: battleId === 'battle-2' ? 5 : 2,
      formation: 'Spearhead',
    },
    enemyForces: {
      fleetsDeployed: 1,
      shipsDeployed: 6,
      shipsDestroyed: battleId === 'battle-2' ? 2 : 4,
      faction: 'Pirate Syndicate',
    },
    events: [
      { time: '00:15', description: 'Initial engagement' },
      { time: '00:45', description: 'Enemy reinforcements arrive' },
      {
        time: '01:30',
        description:
          battleId === 'battle-2' ? 'Critical system failure' : 'Flanking maneuver executed',
      },
      {
        time: '02:00',
        description: battleId === 'battle-2' ? 'Retreat order given' : 'Enemy fleet scattered',
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">{battleDetails.name}</h2>
        <span
          className={`rounded-full px-3 py-1 text-sm ${
            battleDetails.outcome === 'Victory'
              ? 'bg-green-700 text-white'
              : 'bg-red-700 text-white'
          }`}
        >
          {battleDetails.outcome}
        </span>
      </div>

      {/* Battle Overview */}
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
        <h3 className="mb-3 text-lg font-semibold text-white">Battle Overview</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-gray-400">Location</p>
            <p className="text-white">{battleDetails.location}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Date</p>
            <p className="text-white">{battleDetails.date}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Duration</p>
            <p className="text-white">{battleDetails.duration}</p>
          </div>
        </div>
      </div>

      {/* Forces */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Own Forces */}
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
          <h3 className="mb-3 text-lg font-semibold text-white">Your Forces</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-400">Fleets Deployed</p>
              <p className="text-white">{battleDetails.ownForces.fleetsDeployed}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Ships Deployed</p>
              <p className="text-white">{battleDetails.ownForces.shipsDeployed}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Ships Lost</p>
              <p className="text-white">{battleDetails.ownForces.shipsLost}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Formation</p>
              <p className="text-white">{battleDetails.ownForces.formation}</p>
            </div>
          </div>
        </div>

        {/* Enemy Forces */}
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
          <h3 className="mb-3 text-lg font-semibold text-white">Enemy Forces</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-400">Faction</p>
              <p className="text-white">{battleDetails.enemyForces.faction}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Fleets Deployed</p>
              <p className="text-white">{battleDetails.enemyForces.fleetsDeployed}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Ships Deployed</p>
              <p className="text-white">{battleDetails.enemyForces.shipsDeployed}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Ships Destroyed</p>
              <p className="text-white">{battleDetails.enemyForces.shipsDestroyed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Battle Timeline */}
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
        <h3 className="mb-3 text-lg font-semibold text-white">Battle Timeline</h3>
        <div className="space-y-4">
          {battleDetails.events.map((event, index) => (
            <div key={index} className="flex">
              <div className="relative mr-4 flex-shrink-0">
                <div className="h-4 w-4 rounded-full bg-blue-600"></div>
                {index < battleDetails.events.length - 1 && (
                  <div className="absolute left-1.5 top-4 h-full w-1 -translate-x-1/2 bg-gray-700"></div>
                )}
              </div>
              <div className="pb-6">
                <p className="font-medium text-white">{event?.time}</p>
                <p className="text-gray-400">{event?.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BattleView;
