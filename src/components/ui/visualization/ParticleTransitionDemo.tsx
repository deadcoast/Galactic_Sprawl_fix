import * as React from "react";
import { useCallback, useMemo, useState } from 'react';
import {
  DataPoint,
  EasingFunction,
  ParticleBlendMode,
  ParticlePath,
} from '../../../lib/visualization/ParticleSystem';
import { ParticleTransitionVisualization, RenderMethod } from './ParticleTransitionVisualization';

export interface ParticleTransitionDemoProps {
  /**
   * Width of the visualization
   */
  width?: number;

  /**
   * Height of the visualization
   */
  height?: number;

  /**
   * Optional class name
   */
  className?: string;
}

/**
 * Transition effect option
 */
interface TransitionEffect {
  name: string;
  description: string;
  path: ParticlePath;
  easing: EasingFunction;
  staggerDelay: number;
  drawTrails: boolean;
  blendMode: ParticleBlendMode;
  duration: number;
}

/**
 * Transition data option
 */
interface TransitionPattern {
  name: string;
  description: string;
  sourceGenerator: (width: number, height: number) => DataPoint[];
  targetGenerator: (width: number, height: number) => DataPoint[];
}

/**
 * ParticleTransitionDemo
 *
 * A demo component showcasing the particle transition system with various
 * transition effects and data patterns.
 */
export const ParticleTransitionDemo: React.FC<ParticleTransitionDemoProps> = ({
  width = 800,
  height = 500,
  className = '',
}) => {
  // Available transition effects
  const transitionEffects: TransitionEffect[] = useMemo(
    () => [
      {
        name: 'Bounce',
        description: 'Particles bounce to their target positions with staggered delays',
        path: ParticlePath.CURVED,
        easing: EasingFunction.BOUNCE,
        staggerDelay: 30,
        drawTrails: false,
        blendMode: ParticleBlendMode.ADD,
        duration: 1500,
      },
      {
        name: 'Spiral',
        description: 'Particles move in spiral paths with elastic easing',
        path: ParticlePath.SPIRAL,
        easing: EasingFunction.ELASTIC,
        staggerDelay: 10,
        drawTrails: true,
        blendMode: ParticleBlendMode.ADD,
        duration: 2000,
      },
      {
        name: 'Wave',
        description: 'Particles follow wave-like paths with smooth animation',
        path: ParticlePath.WAVE,
        easing: EasingFunction.EASE_IN_OUT,
        staggerDelay: 15,
        drawTrails: true,
        blendMode: ParticleBlendMode.SCREEN,
        duration: 1800,
      },
      {
        name: 'Chaos',
        description: 'Particles follow random, chaotic paths',
        path: ParticlePath.RANDOM,
        easing: EasingFunction.BACK,
        staggerDelay: 5,
        drawTrails: true,
        blendMode: ParticleBlendMode.ADD,
        duration: 2200,
      },
      {
        name: 'Smooth',
        description: 'Particles follow smooth bezier curves',
        path: ParticlePath.BEZIER,
        easing: EasingFunction.EASE_OUT,
        staggerDelay: 20,
        drawTrails: false,
        blendMode: ParticleBlendMode.NORMAL,
        duration: 1200,
      },
    ],
    []
  );

  // Available data patterns
  const transitionPatterns: TransitionPattern[] = useMemo(
    () => [
      {
        name: 'Grid to Circle',
        description: 'Transition from a grid pattern to a circle arrangement',
        sourceGenerator: (width, height) => {
          const points: DataPoint[] = [];
          const gridSize = 10;
          const stepX = width / gridSize;
          const stepY = height / gridSize;

          for (let x = 0; x < gridSize; x++) {
            for (let y = 0; y < gridSize; y++) {
              points.push({
                x: x * stepX + stepX / 2,
                y: y * stepY + stepY / 2,
                value: (x + y) / (gridSize * 2),
                color: `hsl(${((x + y) / (gridSize * 2)) * 360}, 80%, 50%)`,
                size: 8,
              });
            }
          }

          return points;
        },
        targetGenerator: (width, height) => {
          const points: DataPoint[] = [];
          const count = 100;
          const centerX = width / 2;
          const centerY = height / 2;
          const radius = Math.min(width, height) * 0.4;

          for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            points.push({
              x,
              y,
              value: i / count,
              color: `hsl(${(i / count) * 360}, 80%, 50%)`,
              size: 8,
            });
          }

          return points;
        },
      },
      {
        name: 'Explode',
        description: 'Particles explode from center then form shapes',
        sourceGenerator: (width, height) => {
          const points: DataPoint[] = [];
          const count = 150;
          const centerX = width / 2;
          const centerY = height / 2;

          for (let i = 0; i < count; i++) {
            points.push({
              x: centerX + (Math.random() - 0.5) * 20,
              y: centerY + (Math.random() - 0.5) * 20,
              value: Math.random(),
              color: `hsl(${Math.random() * 360}, 80%, 50%)`,
              size: 5 + Math.random() * 5,
            });
          }

          return points;
        },
        targetGenerator: (width, height) => {
          const points: DataPoint[] = [];
          const count = 150;

          // Create a heart shape
          for (let i = 0; i < count; i++) {
            const t = (i / count) * Math.PI * 2;

            // Heart curve formula
            const x = 16 * Math.pow(Math.sin(t), 3);
            const y =
              13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);

            // Scale and position
            const scaleFactor = Math.min(width, height) / 40;
            const posX = width / 2 + x * scaleFactor;
            const posY = height / 2 - y * scaleFactor;

            points.push({
              x: posX,
              y: posY,
              value: i / count,
              color: `hsl(${(i / count) * 360}, 80%, 50%)`,
              size: 5 + Math.random() * 5,
            });
          }

          return points;
        },
      },
      {
        name: 'Text Morph',
        description: 'Transition between text shapes',
        sourceGenerator: (width, height) => {
          const points: DataPoint[] = [];
          // Draw the word "DATA"
          const chars = [
            // D
            [0, 0, 0, 5, 1, 5, 2, 4, 2, 1, 1, 0, 0, 0],
            // A
            [3, 5, 4, 0, 5, 5, 4.5, 3, 3.5, 3],
            // T
            [6, 0, 8, 0, 7, 0, 7, 5],
            // A
            [9, 5, 10, 0, 11, 5, 10.5, 3, 9.5, 3],
          ];

          let pointId = 0;

          chars.forEach(char => {
            for (let i = 0; i < char.length; i += 2) {
              const x = char[i];
              const y = char[i + 1];

              // Scale and position
              const scaleFactor = Math.min(width, height) / 15;
              const offsetX = width * 0.2;
              const offsetY = height * 0.3;

              points.push({
                x: offsetX + x * scaleFactor,
                y: offsetY + y * scaleFactor,
                value: pointId / 30,
                color: `hsl(${(pointId / 30) * 360}, 80%, 50%)`,
                size: 6,
              });

              pointId++;
            }
          });

          return points;
        },
        targetGenerator: (width, height) => {
          const points: DataPoint[] = [];
          // Draw the word "VIZ"
          const chars = [
            // V
            [0, 0, 1, 5, 2, 0],
            // I
            [3, 0, 5, 0, 4, 0, 4, 5, 3, 5, 5, 5],
            // Z
            [6, 0, 9, 0, 6, 5, 9, 5],
          ];

          let pointId = 0;

          chars.forEach(char => {
            for (let i = 0; i < char.length; i += 2) {
              const x = char[i];
              const y = char[i + 1];

              // Scale and position
              const scaleFactor = Math.min(width, height) / 15;
              const offsetX = width * 0.3;
              const offsetY = height * 0.3;

              points.push({
                x: offsetX + x * scaleFactor,
                y: offsetY + y * scaleFactor,
                value: pointId / 30,
                color: `hsl(${360 - (pointId / 30) * 360}, 80%, 50%)`,
                size: 6,
              });

              pointId++;
            }
          });

          return points;
        },
      },
      {
        name: 'Scatter Plot',
        description: 'Transform between different data distributions',
        sourceGenerator: (width, height) => {
          const points: DataPoint[] = [];
          const count = 200;

          // Create a normal distribution
          for (let i = 0; i < count; i++) {
            // Box-Muller transform for normal distribution
            const u1 = Math.random();
            const u2 = Math.random();
            const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
            const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);

            // Scale and position
            const standardDeviation = Math.min(width, height) / 10;
            const x = width / 2 + z0 * standardDeviation;
            const y = height / 2 + z1 * standardDeviation;

            // Keep points within bounds
            if (x < 0 || x > width || y < 0 || y > height) continue;

            const value = Math.random();
            points.push({
              x,
              y,
              value,
              color: `rgba(66, 133, 244, ${0.3 + value * 0.7})`,
              size: 4 + value * 6,
            });
          }

          return points;
        },
        targetGenerator: (width, height) => {
          const points: DataPoint[] = [];
          const count = 200;

          // Create two clusters
          for (let i = 0; i < count; i++) {
            const cluster = i < count / 2 ? 0 : 1;

            // Cluster parameters
            const clusterX = cluster === 0 ? width * 0.3 : width * 0.7;
            const clusterY = height / 2;
            const clusterRadius = Math.min(width, height) / 8;

            // Random position within cluster
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * clusterRadius;
            const x = clusterX + Math.cos(angle) * distance;
            const y = clusterY + Math.sin(angle) * distance;

            const value = Math.random();
            points.push({
              x,
              y,
              value,
              color:
                cluster === 0
                  ? `rgba(234, 67, 53, ${0.3 + value * 0.7})`
                  : `rgba(52, 168, 83, ${0.3 + value * 0.7})`,
              size: 4 + value * 6,
            });
          }

          return points;
        },
      },
    ],
    []
  );

  // State
  const [selectedEffect, setSelectedEffect] = useState<string>(transitionEffects[0].name);
  const [selectedPattern, setSelectedPattern] = useState<string>(transitionPatterns[0].name);
  const [renderMethod, setRenderMethod] = useState<RenderMethod>(RenderMethod.CANVAS);
  const [pingPong, setPingPong] = useState(false);
  const [loop, setLoop] = useState(false);

  // Get the current effect
  const currentEffect = useMemo(
    () => transitionEffects.find(effect => effect.name === selectedEffect) || transitionEffects[0],
    [selectedEffect, transitionEffects]
  );

  // Get the current pattern
  const currentPattern = useMemo(
    () =>
      transitionPatterns.find(pattern => pattern.name === selectedPattern) || transitionPatterns[0],
    [selectedPattern, transitionPatterns]
  );

  // Generate data points
  const sourceData = useMemo(
    () => currentPattern.sourceGenerator(width, height),
    [currentPattern, width, height]
  );

  const targetData = useMemo(
    () => currentPattern.targetGenerator(width, height),
    [currentPattern, width, height]
  );

  // Handle transition updates
  const handleTransitionUpdate = useCallback((progress: number) => {
    // console.log(`Transition progress: ${Math.round(progress * 100)}%`);
  }, []);

  return (
    <div className={`flex flex-col ${className}`}>
      <h2 className="mb-2 text-xl font-bold">Particle Transition Visualization</h2>
      <p className="mb-4 text-gray-600">{currentEffect.description}</p>

      <div className="mb-6 rounded-lg bg-gray-100 p-4">
        <ParticleTransitionVisualization
          initialData={sourceData}
          targetData={targetData}
          width={width}
          height={height}
          duration={currentEffect.duration}
          easing={currentEffect.easing}
          path={currentEffect.path}
          pathParams={
            currentEffect.path === ParticlePath.SPIRAL
              ? { turns: 2 }
              : currentEffect.path === ParticlePath.WAVE
                ? { amplitude: 50, frequency: 2 }
                : currentEffect.path === ParticlePath.RANDOM
                  ? { jitter: 0.3 }
                  : undefined
          }
          staggerDelay={currentEffect.staggerDelay}
          drawTrails={currentEffect.drawTrails}
          blendMode={currentEffect.blendMode}
          renderMethod={renderMethod}
          onTransitionUpdate={handleTransitionUpdate}
          loop={loop}
          pingPong={pingPong}
          className="rounded bg-white"
          autoPlay={true}
        />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-lg font-semibold">Transition Effects</h3>
          <div className="space-y-2">
            {transitionEffects.map(effect => (
              <div key={effect.name} className="flex items-center">
                <input
                  type="radio"
                  id={`effect-${effect.name}`}
                  name="effect"
                  checked={selectedEffect === effect.name}
                  onChange={() => setSelectedEffect(effect.name)}
                  className="mr-2"
                />
                <label htmlFor={`effect-${effect.name}`} className="cursor-pointer">
                  {effect.name}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-lg font-semibold">Data Patterns</h3>
          <div className="space-y-2">
            {transitionPatterns.map(pattern => (
              <div key={pattern.name} className="flex items-center">
                <input
                  type="radio"
                  id={`pattern-${pattern.name}`}
                  name="pattern"
                  checked={selectedPattern === pattern.name}
                  onChange={() => setSelectedPattern(pattern.name)}
                  className="mr-2"
                />
                <label htmlFor={`pattern-${pattern.name}`} className="cursor-pointer">
                  {pattern.name}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-gray-100 p-4">
        <h3 className="mb-2 text-lg font-semibold">Rendering Options</h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <h4 className="mb-1 font-medium">Render Method</h4>
            <div className="space-y-1">
              {Object.values(RenderMethod).map(method => (
                <div key={method} className="flex items-center">
                  <input
                    type="radio"
                    id={`render-${method}`}
                    name="render"
                    checked={renderMethod === method}
                    onChange={() => setRenderMethod(method)}
                    className="mr-2"
                  />
                  <label htmlFor={`render-${method}`} className="cursor-pointer">
                    {method.charAt(0).toUpperCase() + method.slice(1)}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-1 font-medium">Playback Options</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="loop"
                  checked={loop}
                  onChange={e => setLoop(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="loop" className="cursor-pointer">
                  Loop
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="pingpong"
                  checked={pingPong}
                  onChange={e => setPingPong(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="pingpong" className="cursor-pointer">
                  Ping Pong
                </label>
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-1 font-medium">Current Settings</h4>
            <div className="text-sm">
              <p>
                <span className="font-medium">Effect:</span> {currentEffect.name}
              </p>
              <p>
                <span className="font-medium">Path:</span> {currentEffect.path}
              </p>
              <p>
                <span className="font-medium">Easing:</span> {currentEffect.easing}
              </p>
              <p>
                <span className="font-medium">Duration:</span> {currentEffect.duration}ms
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
