import { ArrowRight, Database, Package } from 'lucide-react';
import { useEffect } from 'react';
import { salvageManager } from '../../managers/game/salvageManager';
import { Salvage } from '../../types/combat/SalvageTypes';
import { ShipType } from '../../types/ships/CommonShipTypes';

interface SalvageSystemProps {
  salvageItems: Salvage[];
  nearbyShips: Array<
    ShipType & {
      id: string;
      position: { x: number; y: number };
    }
  >;
  onCollect: (salvageId: string, shipId: string) => void;
}

export function SalvageSystem({ salvageItems, nearbyShips, onCollect }: SalvageSystemProps) {
  const getRarityColor = (rarity: Salvage['rarity']) => {
    switch (rarity) {
      case 'common':
        return 'blue';
      case 'rare':
        return 'purple';
      case 'epic':
        return 'amber';
      default:
        return 'gray';
    }
  };

  // Automatically check for ships that can collect salvage
  useEffect(() => {
    const checkInterval = setInterval(() => {
      salvageItems.forEach(item => {
        if (item?.collected) {
          return;
        }

        // Find nearest ship that can salvage
        const nearestShip = nearbyShips
          .filter(ship => {
            const shipType: ShipType = { type: ship.type };
            const capability = salvageManager.checkSalvageCapability(shipType);
            return capability.canSalvage;
          })
          .map(ship => ({
            ...ship,
            distance: Math.sqrt(
              Math.pow(ship.position.x - item?.position.x, 2) +
                Math.pow(ship.position.y - item?.position.y, 2)
            ),
          }))
          .sort((a, b) => a.distance - b.distance)[0];

        // If ship is within range, collect
        if (nearestShip && nearestShip.distance < 100) {
          onCollect(item?.id, nearestShip.id);
        }
      });
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [salvageItems, nearbyShips, onCollect]);

  return (
    <div className="pointer-events-none absolute inset-0">
      {salvageItems.map(item => (
        <div
          key={item?.id}
          className={`absolute transition-all duration-500 ${
            item?.collected ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
          }`}
          style={{
            left: `${item?.position.x}%`,
            top: `${item?.position.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Salvage Item Visualization */}
          <div
            className={`p-3 bg-${getRarityColor(item?.rarity)}-900/80 rounded-lg border backdrop-blur-sm border-${getRarityColor(item?.rarity)}-500/50`}
          >
            <div className="flex items-center space-x-2">
              <Package className={`h-5 w-5 text-${getRarityColor(item?.rarity)}-400`} />
              <div>
                <div className="text-sm font-medium text-white">{item?.name}</div>
                <div className="text-xs text-gray-300">x{item?.amount}</div>
              </div>
            </div>
          </div>

          {/* Collection Animation */}
          {item?.collected && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={`h-full w-full bg-${getRarityColor(item?.rarity)}-500/30 animate-ping rounded-full`}
              />
            </div>
          )}
        </div>
      ))}

      {/* Collection Summary */}
      <div className="fixed right-6 bottom-6 space-y-2">
        {salvageItems
          .filter(item => item?.collected)
          .map(item => (
            <div
              key={item?.id}
              className={`px-4 py-2 bg-${getRarityColor(item?.rarity)}-900/80 rounded-lg border backdrop-blur-sm border-${getRarityColor(item?.rarity)}-500/50 flex items-center space-x-2`}
            >
              <Database className={`h-4 w-4 text-${getRarityColor(item?.rarity)}-400`} />
              <span className="text-sm text-white">{item?.name}</span>
              <ArrowRight className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-300">+{item?.amount}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
