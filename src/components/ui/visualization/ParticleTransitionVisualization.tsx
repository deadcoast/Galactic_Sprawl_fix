import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DataPoint,
  EasingFunction,
  EasingType,
  Particle,
  ParticleBlendMode,
  ParticlePath,
  ParticleSystem,
} from '../../../lib/visualization/ParticleSystem';

/**
 * Rendering method for the particle visualization
 */
export enum RenderMethod {
  CANVAS = 'canvas',
  SVG = 'svg',
  DOM = 'dom',
}

export interface ParticleTransitionVisualizationProps {
  /**
   * Initial data state
   */
  initialData: DataPoint[];

  /**
   * Target data state to transition to
   */
  targetData?: DataPoint[];

  /**
   * Width of the visualization
   */
  width: number;

  /**
   * Height of the visualization
   */
  height: number;

  /**
   * Transition duration in milliseconds
   */
  duration?: number;

  /**
   * Easing function or type for the transition
   */
  easing?: EasingFunction | EasingType;

  /**
   * Path type for particle movement
   */
  path?: ParticlePath;

  /**
   * Additional path parameters
   */
  pathParams?: Record<string, number>;

  /**
   * Delay between particle transitions in milliseconds
   */
  staggerDelay?: number;

  /**
   * Whether to transition colors
   */
  transitionColors?: boolean;

  /**
   * Whether to draw trail effects
   */
  drawTrails?: boolean;

  /**
   * Length of trails (0-1)
   */
  trailLength?: number;

  /**
   * Rendering method
   */
  renderMethod?: RenderMethod;

  /**
   * Callback when transition is complete
   */
  onTransitionComplete?: () => void;

  /**
   * Callback when transition is updated
   */
  onTransitionUpdate?: (progress: number) => void;

  /**
   * Optional className
   */
  className?: string;

  /**
   * Whether to auto-play the transition
   */
  autoPlay?: boolean;

  /**
   * Whether to loop the transition
   */
  loop?: boolean;

  /**
   * Whether to ping-pong the transition (forward then backward)
   */
  pingPong?: boolean;

  /**
   * Blend mode for particles
   */
  blendMode?: ParticleBlendMode;

  /**
   * Optional background color
   */
  backgroundColor?: string;
}

/**
 * ParticleTransitionVisualization
 *
 * A component that visualizes animated transitions between data states using a particle system.
 * Supports various transition paths, easing functions, and rendering methods.
 */
export const ParticleTransitionVisualization: React.FC<ParticleTransitionVisualizationProps> = ({
  initialData,
  targetData,
  width,
  height,
  duration = 1000,
  easing = EasingType.EASE_IN_OUT,
  path = ParticlePath.LINEAR,
  pathParams,
  staggerDelay = 20,
  transitionColors = true,
  drawTrails = false,
  trailLength = 0.3,
  renderMethod = RenderMethod.CANVAS,
  onTransitionComplete,
  onTransitionUpdate,
  className = '',
  autoPlay = true,
  loop = false,
  pingPong = false,
  blendMode = ParticleBlendMode.ADD,
  backgroundColor = 'transparent',
}) => {
  // References
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const domRef = useRef<HTMLDivElement>(null);
  const particleSystemRef = useRef<ParticleSystem | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  // State
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [currentDirection, setCurrentDirection] = useState<'forward' | 'backward'>('forward');
  const [renderedParticles, setRenderedParticles] = useState<JSX.Element[]>([]);

  // Initialize particle system
  useEffect(() => {
    // Clean up any existing system
    if (particleSystemRef.current) {
      particleSystemRef.current.dispose();
    }

    // Create new system
    particleSystemRef.current = new ParticleSystem();

    // Set up transition
    const transitionId = 'main-transition';
    particleSystemRef.current.setupTransition(transitionId, {
      id: transitionId,
      sourceData: initialData,
      targetData: targetData || initialData,
      duration,
      easing,
      path,
      pathParams,
      staggerDelay,
      transitionColors,
      onComplete: () => {
        onTransitionComplete?.();

        if (loop) {
          // Handle ping-pong looping
          if (pingPong) {
            // Swap direction
            setCurrentDirection(prevDirection =>
              prevDirection === 'forward' ? 'backward' : 'forward'
            );
          }

          // Restart the transition after a small delay
          setTimeout(() => {
            if (particleSystemRef.current) {
              const ps = particleSystemRef.current;

              if (pingPong && currentDirection === 'backward') {
                // Reverse the transition for ping-pong
                ps.setupTransition(transitionId, {
                  id: transitionId,
                  sourceData: targetData || initialData,
                  targetData: initialData,
                  duration,
                  easing,
                  path,
                  pathParams,
                  staggerDelay,
                  transitionColors,
                  onComplete: onTransitionComplete,
                  onUpdate: onTransitionUpdate,
                });
              } else {
                // Regular forward transition
                ps.setupTransition(transitionId, {
                  id: transitionId,
                  sourceData: initialData,
                  targetData: targetData || initialData,
                  duration,
                  easing,
                  path,
                  pathParams,
                  staggerDelay,
                  transitionColors,
                  onComplete: onTransitionComplete,
                  onUpdate: onTransitionUpdate,
                });
              }

              ps.startTransition(transitionId);
            }
          }, 500);
        }
      },
      onUpdate: progress => {
        setTransitionProgress(progress);
        onTransitionUpdate?.(progress);
      },
    });

    // Start animation loop
    if (isPlaying) {
      particleSystemRef.current.startTransition('main-transition');
    }

    // Start render loop based on selected method
    startRenderLoop();

    // Cleanup
    return () => {
      stopRenderLoop();
      if (particleSystemRef.current) {
        particleSystemRef.current.dispose();
      }
    };
  }, [
    initialData,
    targetData,
    duration,
    easing,
    path,
    pathParams,
    staggerDelay,
    transitionColors,
    isPlaying,
    onTransitionComplete,
    onTransitionUpdate,
    loop,
    pingPong,
    currentDirection,
  ]);

  // Control playback
  const startTransition = useCallback(() => {
    if (particleSystemRef.current && !isPlaying) {
      particleSystemRef.current.startTransition('main-transition');
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const pauseTransition = useCallback(() => {
    if (particleSystemRef.current && isPlaying) {
      particleSystemRef.current.stopTransition('main-transition');
      setIsPlaying(false);
    }
  }, [isPlaying]);

  const resetTransition = useCallback(() => {
    if (particleSystemRef.current) {
      const ps = particleSystemRef.current;
      ps.stopTransition('main-transition');

      // Re-setup the transition
      ps.setupTransition('main-transition', {
        id: 'main-transition',
        sourceData: initialData,
        targetData: targetData || initialData,
        duration,
        easing,
        path,
        pathParams,
        staggerDelay,
        transitionColors,
        onComplete: onTransitionComplete,
        onUpdate: onTransitionUpdate,
      });

      setIsPlaying(false);
      setTransitionProgress(0);
      setCurrentDirection('forward');
    }
  }, [
    initialData,
    targetData,
    duration,
    easing,
    path,
    pathParams,
    staggerDelay,
    transitionColors,
    onTransitionComplete,
    onTransitionUpdate,
  ]);

  // Start the render loop based on the selected method
  const startRenderLoop = useCallback(() => {
    stopRenderLoop();

    // Start animation loop
    const renderLoop = (timestamp: number) => {
      const _deltaTime = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;

      renderFrame();

      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    lastFrameTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(renderLoop);
  }, [renderMethod]);

  // Stop the render loop
  const stopRenderLoop = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Render a single frame
  const renderFrame = useCallback(() => {
    if (!particleSystemRef.current) return;

    const particles = particleSystemRef.current.getParticles();

    switch (renderMethod) {
      case RenderMethod.CANVAS:
        renderCanvasFrame(particles);
        break;
      case RenderMethod.SVG:
        renderSvgFrame(particles);
        break;
      case RenderMethod.DOM:
        renderDomFrame(particles);
        break;
    }
  }, [renderMethod, drawTrails, trailLength, blendMode]);

  // Canvas rendering
  const renderCanvasFrame = useCallback(
    (particles: Particle[]) => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Set blend mode
      switch (blendMode) {
        case ParticleBlendMode.ADD:
          ctx.globalCompositeOperation = 'lighter';
          break;
        case ParticleBlendMode.MULTIPLY:
          ctx.globalCompositeOperation = 'multiply';
          break;
        case ParticleBlendMode.SCREEN:
          ctx.globalCompositeOperation = 'screen';
          break;
        default:
          ctx.globalCompositeOperation = 'source-over';
      }

      // Draw particles
      particles.forEach(particle => {
        // Draw trail if enabled
        if (drawTrails && particle.prevPosition) {
          ctx.beginPath();
          ctx.moveTo(particle.prevPosition.x, particle.prevPosition.y);
          ctx.lineTo(particle.position.x, particle.position.y);
          ctx.strokeStyle = particle.color;
          ctx.globalAlpha = particle.opacity * 0.5;
          ctx.lineWidth = particle.size * 0.7;
          ctx.stroke();
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.position.x, particle.position.y, particle.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.opacity;
        ctx.fill();
      });

      // Reset composite operation
      ctx.globalCompositeOperation = 'source-over';
    },
    [drawTrails, blendMode]
  );

  // SVG rendering
  const renderSvgFrame = useCallback(
    (particles: Particle[]) => {
      const particleElements: JSX.Element[] = particles.map(particle => {
        // Prepare trail if enabled
        let trail: JSX.Element | null = null;
        if (drawTrails && particle.prevPosition) {
          trail = (
            <line
              key={`trail-${particle.id}`}
              x1={particle.prevPosition.x}
              y1={particle.prevPosition.y}
              x2={particle.position.x}
              y2={particle.position.y}
              stroke={particle.color}
              strokeWidth={particle.size * 0.7}
              strokeOpacity={particle.opacity * 0.5}
              style={{
                mixBlendMode: blendMode.toLowerCase() as React.CSSProperties['mixBlendMode'],
              }}
            />
          );
        }

        return (
          <React.Fragment key={particle.id}>
            {trail}
            <circle
              cx={particle.position.x}
              cy={particle.position.y}
              r={particle.size / 2}
              fill={particle.color}
              fillOpacity={particle.opacity}
              style={{
                mixBlendMode: blendMode.toLowerCase() as React.CSSProperties['mixBlendMode'],
              }}
            />
          </React.Fragment>
        );
      });

      setRenderedParticles(particleElements);
    },
    [drawTrails, blendMode]
  );

  // DOM rendering
  const renderDomFrame = useCallback(
    (particles: Particle[]) => {
      const particleElements: JSX.Element[] = particles.map(particle => (
        <div
          key={particle.id}
          style={{
            position: 'absolute',
            left: particle.position.x,
            top: particle.position.y,
            width: particle.size,
            height: particle.size,
            borderRadius: '50%',
            backgroundColor: particle.color,
            opacity: particle.opacity,
            transform: 'translate(-50%, -50%)',
            mixBlendMode: blendMode.toLowerCase() as React.CSSProperties['mixBlendMode'],
            transition: 'none',
            pointerEvents: 'none',
          }}
        />
      ));

      setRenderedParticles(particleElements);
    },
    [blendMode]
  );

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = width;
        canvasRef.current.height = height;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [width, height]);

  // Render the appropriate visualization based on the render method
  const renderVisualization = useMemo(() => {
    switch (renderMethod) {
      case RenderMethod.CANVAS:
        return (
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className={`particle-canvas ${className}`}
            style={{ backgroundColor }}
          />
        );
      case RenderMethod.SVG:
        return (
          <svg
            ref={svgRef}
            width={width}
            height={height}
            className={`particle-svg ${className}`}
            style={{ backgroundColor }}
          >
            {renderedParticles}
          </svg>
        );
      case RenderMethod.DOM:
        return (
          <div
            ref={domRef}
            className={`particle-dom ${className}`}
            style={{
              position: 'relative',
              width: `${width}px`,
              height: `${height}px`,
              overflow: 'hidden',
              backgroundColor,
            }}
          >
            {renderedParticles}
          </div>
        );
    }
  }, [renderMethod, width, height, className, backgroundColor, renderedParticles]);

  // Control buttons for the visualization
  const renderControls = useMemo(() => {
    return (
      <div className="absolute bottom-2 right-2 flex space-x-2">
        {!isPlaying ? (
          <button
            onClick={startTransition}
            className="rounded bg-blue-500 p-1 text-white"
            title="Play"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M8 5v14l11-7z" />
            </svg>
          </button>
        ) : (
          <button
            onClick={pauseTransition}
            className="rounded bg-blue-500 p-1 text-white"
            title="Pause"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          </button>
        )}
        <button
          onClick={resetTransition}
          className="rounded bg-gray-500 p-1 text-white"
          title="Reset"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <path
              fill="currentColor"
              d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"
            />
          </svg>
        </button>
      </div>
    );
  }, [isPlaying, startTransition, pauseTransition, resetTransition]);

  // Progress indicator
  const renderProgressIndicator = useMemo(() => {
    return (
      <div className="absolute bottom-2 left-2 h-4 w-32 overflow-hidden rounded bg-gray-200">
        <div
          className="h-full bg-blue-500 transition-all duration-100 ease-linear"
          style={{ width: `${transitionProgress * 100}%` }}
        />
      </div>
    );
  }, [transitionProgress]);

  return (
    <div className="relative">
      {renderVisualization}
      {renderControls}
      {renderProgressIndicator}
    </div>
  );
};

// Export presets for common transition effects
export const TransitionPresets = {
  /**
   * Bounce transition with staggered delays
   */
  bounce: (
    props: Omit<ParticleTransitionVisualizationProps, 'easing' | 'path'>
  ): ParticleTransitionVisualizationProps => ({
    ...props,
    easing: EasingType.BOUNCE,
    path: ParticlePath.CURVED,
    staggerDelay: 30,
    drawTrails: false,
    blendMode: ParticleBlendMode.ADD,
  }),

  /**
   * Spiral transition with elastic easing
   */
  spiral: (
    props: Omit<ParticleTransitionVisualizationProps, 'easing' | 'path'>
  ): ParticleTransitionVisualizationProps => ({
    ...props,
    easing: EasingType.ELASTIC,
    path: ParticlePath.SPIRAL,
    pathParams: { turns: 2 },
    staggerDelay: 10,
    drawTrails: true,
    trailLength: 0.5,
    blendMode: ParticleBlendMode.ADD,
  }),

  /**
   * Wave transition with smooth animation
   */
  wave: (
    props: Omit<ParticleTransitionVisualizationProps, 'easing' | 'path'>
  ): ParticleTransitionVisualizationProps => ({
    ...props,
    easing: EasingType.EASE_IN_OUT,
    path: ParticlePath.WAVE,
    pathParams: { amplitude: 50, frequency: 2 },
    staggerDelay: 15,
    drawTrails: true,
    trailLength: 0.2,
    blendMode: ParticleBlendMode.SCREEN,
  }),

  /**
   * Chaotic transition with random paths
   */
  chaos: (
    props: Omit<ParticleTransitionVisualizationProps, 'easing' | 'path'>
  ): ParticleTransitionVisualizationProps => ({
    ...props,
    easing: EasingType.BACK,
    path: ParticlePath.RANDOM,
    pathParams: { jitter: 0.3 },
    staggerDelay: 5,
    drawTrails: true,
    trailLength: 0.3,
    blendMode: ParticleBlendMode.ADD,
  }),

  /**
   * Smooth bezier transition
   */
  smooth: (
    props: Omit<ParticleTransitionVisualizationProps, 'easing' | 'path'>
  ): ParticleTransitionVisualizationProps => ({
    ...props,
    easing: EasingType.EASE_OUT,
    path: ParticlePath.BEZIER,
    staggerDelay: 20,
    drawTrails: false,
    blendMode: ParticleBlendMode.NORMAL,
  }),
};
