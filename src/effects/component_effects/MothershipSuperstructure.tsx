import { AnimatePresence, motion } from 'framer-motion';
import { Cpu, Shield, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MothershipSuperstructureProps {
  tier: 1 | 2 | 3;
  expansionLevel: number; // 0-100 percentage of expansion
  resourceFlow: {
    energy: number;
    materials: number;
    research: number;
  };
  quality: 'low' | 'medium' | 'high';
  onSectionClick?: (section: string) => void;
}

/**
 * MothershipSuperstructure component
 *
 * Renders an animated superstructure that expands based on the expansionLevel prop.
 * Shows resource flow visualizations and allows interaction with different sections.
 */
export function MothershipSuperstructure({
  tier,
  expansionLevel,
  resourceFlow,
  quality,
  onSectionClick,
}: MothershipSuperstructureProps) {
  const [sections, setSections] = useState<string[]>([]);

  // Determine which sections to show based on expansion level
  useEffect(() => {
    const newSections = [];

    if (expansionLevel >= 10) {
      newSections.push('core');
    }
    if (expansionLevel >= 25) {
      newSections.push('inner');
    }
    if (expansionLevel >= 50) {
      newSections.push('middle');
    }
    if (expansionLevel >= 75) {
      newSections.push('outer');
    }
    if (expansionLevel >= 90) {
      newSections.push('extensions');
    }

    setSections(newSections);
  }, [expansionLevel]);

  // Determine animation complexity based on quality setting
  const particleCount = quality === 'high' ? 24 : quality === 'medium' ? 12 : 6;
  const animationDuration = quality === 'high' ? 0.5 : quality === 'medium' ? 0.8 : 1.2;

  // Resource flow intensity
  const energyFlowIntensity = Math.min(1, resourceFlow.energy / 100);
  const materialsFlowIntensity = Math.min(1, resourceFlow.materials / 100);
  const researchFlowIntensity = Math.min(1, resourceFlow.research / 100);

  return (
    <div className="relative h-full w-full">
      {/* Base container with proper scaling based on tier */}
      <div
        className={`absolute inset-0 flex items-center justify-center mothership-tier-${tier}`}
        style={{
          transform: `scale(${0.8 + tier * 0.1})`,
        }}
      >
        {/* Core structure - always visible */}
        <AnimatePresence>
          {sections.includes('core') && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: animationDuration }}
              className="absolute h-32 w-32 rounded-full border-4 border-indigo-600/50 bg-indigo-900/80"
              onClick={() => onSectionClick?.('core')}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <Cpu className="h-12 w-12 text-indigo-300" />
              </div>
            </motion.div>
          )}

          {/* Inner ring */}
          {sections.includes('inner') && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: animationDuration, delay: 0.1 }}
              className="absolute h-48 w-48 rounded-full border-2 border-indigo-500/30"
              style={{
                animation: 'spin 60s linear infinite',
              }}
              onClick={() => onSectionClick?.('inner')}
            >
              {/* Energy flow nodes */}
              {Array.from({ length: 4 }).map((_, i) => (
                <motion.div
                  key={`inner-energy-${i}`}
                  className="absolute h-6 w-6 rounded-full bg-yellow-500/80"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${i * 90}deg) translateY(-24px)`,
                    opacity: energyFlowIntensity,
                  }}
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: 'loop',
                  }}
                >
                  <Zap className="h-6 w-6 text-yellow-300" />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Middle ring */}
          {sections.includes('middle') && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: animationDuration, delay: 0.2 }}
              className="absolute h-64 w-64 rounded-full border-2 border-indigo-500/30"
              style={{
                animation: 'spin 80s linear infinite reverse',
              }}
              onClick={() => onSectionClick?.('middle')}
            >
              {/* Material flow nodes */}
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={`middle-material-${i}`}
                  className="absolute h-5 w-5 rounded-full bg-blue-500/80"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${i * 60}deg) translateY(-32px)`,
                    opacity: materialsFlowIntensity,
                  }}
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatType: 'loop',
                    delay: i * 0.5,
                  }}
                />
              ))}
            </motion.div>
          )}

          {/* Outer ring */}
          {sections.includes('outer') && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: animationDuration, delay: 0.3 }}
              className="absolute h-80 w-80 rounded-full border-2 border-indigo-500/30"
              style={{
                animation: 'spin 100s linear infinite',
              }}
              onClick={() => onSectionClick?.('outer')}
            >
              {/* Research flow nodes */}
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.div
                  key={`outer-research-${i}`}
                  className="absolute h-4 w-4 rounded-full bg-purple-500/80"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${i * 45}deg) translateY(-40px)`,
                    opacity: researchFlowIntensity,
                  }}
                  animate={{
                    scale: [1, 1.3, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    repeatType: 'loop',
                    delay: i * 0.3,
                  }}
                />
              ))}
            </motion.div>
          )}

          {/* Extension structures */}
          {sections.includes('extensions') && (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <motion.div
                  key={`extension-${i}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.8 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: animationDuration, delay: 0.4 + i * 0.1 }}
                  className="absolute h-16 w-16 rounded-lg border border-indigo-500/40 bg-indigo-800/60"
                  style={{
                    transform: `rotate(${i * 90}deg) translateY(-48px)`,
                  }}
                  onClick={() => onSectionClick?.(`extension-${i}`)}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Shield className="h-8 w-8 text-indigo-300" />
                  </div>
                </motion.div>
              ))}
            </>
          )}

          {/* Resource flow particles */}
          {Array.from({ length: particleCount }).map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute h-2 w-2 rounded-full"
              style={{
                backgroundColor:
                  i % 3 === 0
                    ? `rgba(255, 215, 0, ${energyFlowIntensity})`
                    : i % 3 === 1
                      ? `rgba(30, 144, 255, ${materialsFlowIntensity})`
                      : `rgba(147, 112, 219, ${researchFlowIntensity})`,
                top: '50%',
                left: '50%',
              }}
              animate={{
                x: [0, Math.cos(i * 30) * 150, 0],
                y: [0, Math.sin(i * 30) * 150, 0],
                opacity: [0, 0.8, 0],
              }}
              transition={{
                duration: 4 + (i % 3),
                repeat: Infinity,
                repeatType: 'loop',
                delay: i * 0.2,
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Expansion level indicator */}
      <div className="absolute bottom-4 left-1/2 w-64 -translate-x-1/2 transform">
        <div className="mb-1 flex justify-between text-xs text-gray-400">
          <span>Expansion</span>
          <span>{Math.round(expansionLevel)}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-gray-700">
          <motion.div
            className="h-full rounded-full bg-indigo-500"
            initial={{ width: 0 }}
            animate={{ width: `${expansionLevel}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </div>
  );
}
