import * as React from 'react';

interface ScalingState {
  systemCount: number;
  activeTradeRoutes: number;
  resourceNodes: number;
  performance: {
    fps: number;
    renderTime: number;
    memoryUsage: number;
  };
}

// Add a type declaration for the Performance interface with memory property
interface ExtendedPerformance extends Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

export function useScalingSystem() {
  const [scalingState, setScalingState] = React.useState<ScalingState>({
    systemCount: 0,
    activeTradeRoutes: 0,
    resourceNodes: 0,
    performance: {
      fps: 60,
      renderTime: 0,
      memoryUsage: 0,
    },
  });

  // Performance monitoring
  React.useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let frameTime = 0;

    const measurePerformance = () => {
      const now = performance.now();
      const delta = now - lastTime;
      frameTime += delta;
      frameCount++;

      if (frameTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / frameTime);
        const renderTime = frameTime / frameCount;

        // Cast performance to ExtendedPerformance to access memory property
        const extendedPerformance = window.performance as ExtendedPerformance;
        const memoryUsage = extendedPerformance.memory?.usedJSHeapSize ?? 0;

        setScalingState(prev => ({
          ...prev,
          performance: {
            fps,
            renderTime,
            memoryUsage,
          },
        }));

        frameCount = 0;
        frameTime = 0;
      }

      lastTime = now;
      requestAnimationFrame(measurePerformance);
    };

    requestAnimationFrame(measurePerformance);
  }, []);

  return scalingState;
}
