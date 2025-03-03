import { motion } from 'framer-motion';
import {
  Frown,
  Heart,
  Home,
  Meh,
  Shield,
  Smile,
  ThumbsDown,
  ThumbsUp,
  Utensils,
  Zap,
} from 'lucide-react';

interface SatisfactionFactor {
  type: 'housing' | 'food' | 'healthcare' | 'energy' | 'security';
  name: string;
  value: number; // 0-100
  weight: number; // 0-1, sum of all weights should be 1
}

interface SatisfactionMeterProps {
  colonyId: string;
  factors: SatisfactionFactor[];
  onFactorClick?: (factorType: SatisfactionFactor['type']) => void;
}

export function SatisfactionMeter({ colonyId, factors, onFactorClick }: SatisfactionMeterProps) {
  // Calculate overall satisfaction
  const overallSatisfaction = factors.reduce(
    (sum, factor) => sum + factor.value * factor.weight,
    0
  );

  // Get satisfaction icon
  const getSatisfactionIcon = (value: number) => {
    if (value >= 80) {
      return <Smile className="h-6 w-6 text-green-400" />;
    } else if (value >= 50) {
      return <Meh className="h-6 w-6 text-amber-400" />;
    } else {
      return <Frown className="h-6 w-6 text-red-400" />;
    }
  };

  // Get satisfaction color
  const getSatisfactionColor = (value: number) => {
    if (value >= 80) {
      return 'text-green-400';
    } else if (value >= 50) {
      return 'text-amber-400';
    } else {
      return 'text-red-400';
    }
  };

  // Get factor icon
  const getFactorIcon = (type: SatisfactionFactor['type']) => {
    switch (type) {
      case 'housing':
        return <Home className="h-4 w-4 text-blue-400" />;
      case 'food':
        return <Utensils className="h-4 w-4 text-green-400" />;
      case 'healthcare':
        return <Heart className="h-4 w-4 text-red-400" />;
      case 'energy':
        return <Zap className="h-4 w-4 text-yellow-400" />;
      case 'security':
        return <Shield className="h-4 w-4 text-purple-400" />;
      default:
        return <ThumbsUp className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
      <h3 className="mb-4 text-lg font-medium text-white">Colony Satisfaction</h3>

      {/* Overall Satisfaction */}
      <div className="mb-4 flex items-center justify-between rounded-md border border-gray-700 bg-gray-900 p-3">
        <div className="flex items-center space-x-3">
          {getSatisfactionIcon(overallSatisfaction)}
          <div>
            <div className="text-sm font-medium text-white">Overall Satisfaction</div>
            <div className={`text-xs ${getSatisfactionColor(overallSatisfaction)}`}>
              {overallSatisfaction >= 80
                ? 'Excellent'
                : overallSatisfaction >= 60
                  ? 'Good'
                  : overallSatisfaction >= 40
                    ? 'Average'
                    : overallSatisfaction >= 20
                      ? 'Poor'
                      : 'Critical'}
            </div>
          </div>
        </div>

        <div className={`text-xl font-bold ${getSatisfactionColor(overallSatisfaction)}`}>
          {Math.round(overallSatisfaction)}%
        </div>
      </div>

      {/* Satisfaction Meter */}
      <div className="mb-4">
        <div className="h-4 w-full overflow-hidden rounded-full bg-gray-900">
          <motion.div
            className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-green-500"
            style={{ width: `${overallSatisfaction}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${overallSatisfaction}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>

        <div className="mt-1 flex justify-between text-xs text-gray-500">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Individual Factors */}
      <div className="space-y-3">
        {factors.map(factor => (
          <div
            key={factor.type}
            className="rounded-md border border-gray-700 bg-gray-900 p-2 transition-colors hover:bg-gray-800"
            onClick={() => onFactorClick?.(factor.type)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getFactorIcon(factor.type)}
                <span className="text-sm text-white">{factor.name}</span>
              </div>
              <div className={`text-sm font-medium ${getSatisfactionColor(factor.value)}`}>
                {Math.round(factor.value)}%
              </div>
            </div>

            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-800">
              <div
                className={`h-full ${
                  factor.value >= 80
                    ? 'bg-green-500'
                    : factor.value >= 50
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                }`}
                style={{ width: `${factor.value}%` }}
              />
            </div>

            <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>Impact: {Math.round(factor.weight * 100)}%</span>
              <span className="flex items-center space-x-1">
                {factor.value >= 60 ? (
                  <>
                    <ThumbsUp className="h-3 w-3 text-green-400" />
                    <span className="text-green-400">Good</span>
                  </>
                ) : factor.value >= 40 ? (
                  <>
                    <Meh className="h-3 w-3 text-amber-400" />
                    <span className="text-amber-400">Average</span>
                  </>
                ) : (
                  <>
                    <ThumbsDown className="h-3 w-3 text-red-400" />
                    <span className="text-red-400">Poor</span>
                  </>
                )}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
