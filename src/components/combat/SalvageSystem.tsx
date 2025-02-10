import React from 'react';
import { Package, ArrowRight, Database } from 'lucide-react';

interface Salvage {
  id: string;
  type: 'resources' | 'components' | 'technology';
  name: string;
  amount: number;
  rarity: 'common' | 'rare' | 'epic';
  position: { x: number; y: number };
  collected: boolean;
}

interface SalvageSystemProps {
  salvageItems: Salvage[];
  onCollect: (salvageId: string) => void;
}

export function SalvageSystem({ salvageItems, onCollect }: SalvageSystemProps) {
  const getRarityColor = (rarity: Salvage['rarity']) => {
    switch (rarity) {
      case 'common': return 'blue';
      case 'rare': return 'purple';
      case 'epic': return 'amber';
      default: return 'gray';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {salvageItems.map(item => (
        <div
          key={item.id}
          className={`absolute transition-all duration-500 ${
            item.collected ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
          }`}
          style={{
            left: `${item.position.x}%`,
            top: `${item.position.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {/* Salvage Item Visualization */}
          <div className={`p-3 bg-${getRarityColor(item.rarity)}-900/80 backdrop-blur-sm rounded-lg border border-${getRarityColor(item.rarity)}-500/50`}>
            <div className="flex items-center space-x-2">
              <Package className={`w-5 h-5 text-${getRarityColor(item.rarity)}-400`} />
              <div>
                <div className="text-sm font-medium text-white">{item.name}</div>
                <div className="text-xs text-gray-300">x{item.amount}</div>
              </div>
            </div>
          </div>

          {/* Collection Animation */}
          {item.collected && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-full h-full bg-${getRarityColor(item.rarity)}-500/30 rounded-full animate-ping`} />
            </div>
          )}
        </div>
      ))}

      {/* Collection Summary */}
      <div className="fixed bottom-6 right-6 space-y-2">
        {salvageItems
          .filter(item => item.collected)
          .map(item => (
            <div
              key={item.id}
              className={`px-4 py-2 bg-${getRarityColor(item.rarity)}-900/80 backdrop-blur-sm rounded-lg border border-${getRarityColor(item.rarity)}-500/50 flex items-center space-x-2`}
            >
              <Database className={`w-4 h-4 text-${getRarityColor(item.rarity)}-400`} />
              <span className="text-sm text-white">{item.name}</span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-300">+{item.amount}</span>
            </div>
          ))}
      </div>
    </div>
  );
}