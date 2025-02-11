import { ArrowRight, Package } from 'lucide-react';

interface CargoShipProps {
  id: string;
  sourcePosition: { x: number; y: number };
  targetPosition: { x: number; y: number };
  progress: number;
  resourceType: string;
  amount: number;
}

export function ResourceTransferAnimation({ ships }: { ships: CargoShipProps[] }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {ships.map(ship => {
        const x = ship.sourcePosition.x + (ship.targetPosition.x - ship.sourcePosition.x) * ship.progress;
        const y = ship.sourcePosition.y + (ship.targetPosition.y - ship.sourcePosition.y) * ship.progress;

        // Calculate angle for arrow rotation
        const angle = Math.atan2(
          ship.targetPosition.y - ship.sourcePosition.y,
          ship.targetPosition.x - ship.sourcePosition.x
        ) * (180 / Math.PI);

        return (
          <div
            key={ship.id}
            className="absolute transition-all duration-300"
            style={{
              left: x,
              top: y,
              transform: 'translate(-50%, -50%)'
            }}
          >
            {/* Cargo Ship */}
            <div className="relative">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <div className="px-2 py-1 bg-amber-900/80 backdrop-blur-sm rounded-full border border-amber-500/50 text-xs text-amber-200">
                  {ship.amount} {ship.resourceType}
                </div>
              </div>
              <div className="p-2 bg-amber-500/20 rounded-full animate-pulse">
                <Package className="w-5 h-5 text-amber-400" />
              </div>
              {/* Direction Arrow */}
              <div 
                className="absolute -right-6 top-1/2 -translate-y-1/2"
                style={{ transform: `rotate(${angle}deg)` }}
              >
                <ArrowRight className="w-4 h-4 text-amber-400/70" />
              </div>
            </div>

            {/* Trail Effect */}
            <div
              className="absolute h-0.5 bg-gradient-to-r from-amber-500/50 to-transparent"
              style={{
                width: '50px',
                transform: `translateX(-100%) rotate(${angle}deg)`,
                opacity: ship.progress
              }}
            />
          </div>
        );
      })}
    </div>
  );
}