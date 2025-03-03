import { Shield, Sword, Zap } from 'lucide-react';

interface TacticalBonusCardProps {
  name: string;
  description: string;
  value: number;
  type: 'offensive' | 'defensive' | 'utility';
}

/**
 * TacticalBonusCard - Displays a tactical bonus with its details and effect
 */
export function TacticalBonusCard({ name, description, value, type }: TacticalBonusCardProps) {
  // Get styling based on bonus type
  const getBonusStyles = () => {
    switch (type) {
      case 'offensive':
        return {
          icon: <Sword className="h-5 w-5" />,
          color: 'text-red-400',
          bgColor: 'bg-red-400/10',
          borderColor: 'border-red-400/20',
          valueColor: 'text-red-400',
        };
      case 'defensive':
        return {
          icon: <Shield className="h-5 w-5" />,
          color: 'text-blue-400',
          bgColor: 'bg-blue-400/10',
          borderColor: 'border-blue-400/20',
          valueColor: 'text-blue-400',
        };
      case 'utility':
        return {
          icon: <Zap className="h-5 w-5" />,
          color: 'text-amber-400',
          bgColor: 'bg-amber-400/10',
          borderColor: 'border-amber-400/20',
          valueColor: 'text-amber-400',
        };
      default:
        return {
          icon: <Zap className="h-5 w-5" />,
          color: 'text-gray-400',
          bgColor: 'bg-gray-400/10',
          borderColor: 'border-gray-400/20',
          valueColor: 'text-gray-400',
        };
    }
  };

  const styles = getBonusStyles();

  return (
    <div
      className={`rounded-lg border ${styles.borderColor} ${styles.bgColor} p-3 transition-all duration-300 hover:shadow-lg`}
    >
      <div className="flex items-center">
        <div className={`rounded-full bg-gray-800 p-1.5 ${styles.color}`}>{styles.icon}</div>
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-white">{name}</h4>
            <div className={`text-lg font-semibold ${styles.valueColor}`}>+{value}%</div>
          </div>
          <p className="mt-1 text-xs text-gray-400">{description}</p>
        </div>
      </div>
    </div>
  );
}
