import { motion } from 'framer-motion';
import { AlertTriangle, Check, TrendingDown, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';

interface ThresholdStatusIndicatorProps {
  currentAmount: number;
  minThreshold: number;
  maxThreshold: number;
  maxCapacity: number;
  extractionRate: number;
  showDetails?: boolean;
}

export function ThresholdStatusIndicator({
  currentAmount,
  minThreshold,
  maxThreshold,
  maxCapacity,
  extractionRate,
  showDetails = false,
}: ThresholdStatusIndicatorProps) {
  const status = useMemo(() => {
    const percentage = (currentAmount / maxCapacity) * 100;

    if (currentAmount < minThreshold) {
      return {
        type: 'warning',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/20',
        borderColor: 'border-yellow-500/30',
        icon: TrendingDown,
        message: 'Below minimum threshold',
        percentage,
        trend: 'decreasing',
      } as const;
    } else if (currentAmount > maxThreshold) {
      return {
        type: 'danger',
        color: 'text-red-500',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/30',
        icon: AlertTriangle,
        message: 'Above maximum threshold',
        percentage,
        trend: 'increasing',
      } as const;
    } else if (percentage > 90) {
      return {
        type: 'caution',
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/20',
        borderColor: 'border-orange-500/30',
        icon: TrendingUp,
        message: 'Near capacity',
        percentage,
        trend: 'stable',
      } as const;
    }

    return {
      type: 'optimal',
      color: 'text-green-500',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/30',
      icon: Check,
      message: 'Within optimal range',
      percentage,
      trend: 'stable',
    } as const;
  }, [currentAmount, minThreshold, maxThreshold, maxCapacity]);

  const progressVariants = {
    decreasing: {
      opacity: [1, 0.5],
      transition: {
        repeat: Infinity,
        repeatType: 'reverse' as const,
        duration: 1,
      },
    },
    increasing: {
      opacity: [0.5, 1],
      transition: {
        repeat: Infinity,
        repeatType: 'reverse' as const,
        duration: 1,
      },
    },
    stable: {
      opacity: 1,
    },
  };

  return (
    <div className={`rounded-lg p-2 ${status.bgColor} border ${status.borderColor}`}>
      <div className="flex items-center space-x-2">
        <status.icon className={`h-4 w-4 ${status.color}`} />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${status.color}`}>{status.message}</span>
            <span className="text-sm text-gray-400">{status.percentage.toFixed(1)}%</span>
          </div>

          {/* Progress Bar */}
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-700">
            <motion.div
              className={`h-full rounded-full ${status.bgColor.replace('/20', '')}`}
              style={{ width: `${status.percentage}%` }}
              variants={progressVariants}
              animate={status.trend}
            />
          </div>

          {/* Threshold Markers */}
          <div className="relative mt-0.5 h-1">
            {/* Min Threshold Marker */}
            <div
              className="absolute top-0 h-2 w-0.5 bg-yellow-500"
              style={{ left: `${(minThreshold / maxCapacity) * 100}%` }}
            />
            {/* Max Threshold Marker */}
            <div
              className="absolute top-0 h-2 w-0.5 bg-red-500"
              style={{ left: `${(maxThreshold / maxCapacity) * 100}%` }}
            />
          </div>

          {showDetails && (
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-400">
              <div>
                <span>Current: </span>
                <span className="font-medium text-white">{currentAmount.toFixed(0)}</span>
              </div>
              <div>
                <span>Rate: </span>
                <span
                  className={`font-medium ${extractionRate > 0 ? 'text-green-400' : 'text-red-400'}`}
                >
                  {extractionRate > 0 ? '+' : ''}
                  {extractionRate.toFixed(1)}/s
                </span>
              </div>
              <div>
                <span>Min: </span>
                <span className="font-medium text-yellow-400">{minThreshold.toFixed(0)}</span>
              </div>
              <div>
                <span>Max: </span>
                <span className="font-medium text-red-400">{maxThreshold.toFixed(0)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
