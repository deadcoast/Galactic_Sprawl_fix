import { useState, useEffect } from 'react';

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

export function useScalingSystem() {
  const [scalingState, setScalingState] = useState<ScalingState>({
    systemCount: 0,
    activeTradeRoutes: 0,
    resourceNodes: 0,
    performance: {
      fps: 60,
      renderTime: 0,
      memoryUsage: 0
    }
  });

  // Performance monitoring
  useEffect(() => {
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
        
        setScalingState(prev => ({
          ...prev,
          performance: {
            fps,
            renderTime,
            memoryUsage: window.performance?.memory?.usedJSHeapSize || 0
          }
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