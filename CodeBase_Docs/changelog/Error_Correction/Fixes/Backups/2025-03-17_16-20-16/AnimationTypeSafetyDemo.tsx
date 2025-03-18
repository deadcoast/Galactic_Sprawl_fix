import * as d3 from 'd3';
import * as React from "react";
import { useEffect, useRef } from 'react';
import {
  AnimationConfig,
  createTypedTimer,
  TypedAnimationSequence,
  typedInterpolators,
} from '../../../types/visualizations/D3AnimationTypes';
import { selectSvg } from '../../../types/visualizations/D3SelectionTypes';

interface Point {
  x: number;
  y: number;
  radius: number;
  color: string;
}

interface AnimationTypeSafetyDemoProps {
  width?: number;
  height?: number;
  animationConfig?: Partial<AnimationConfig>;
}

/**
 * Demo component showcasing the type-safe animation utilities
 *
 * This component demonstrates:
 * 1. Type-safe interpolation
 * 2. Type-safe transition configuration
 * 3. Type-safe timer usage
 * 4. Animation sequences with proper typing
 */
const AnimationTypeSafetyDemo: React.FC<AnimationTypeSafetyDemoProps> = ({
  width = 600,
  height = 400,
  animationConfig = {},
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const config: AnimationConfig = {
    duration: 1500,
    easing: d3.easeCubicInOut,
    loop: true,
    loopDelay: 500,
    ...animationConfig,
  };

  // Setup point data for animation
  const pointsData: Point[] = [
    { x: 100, y: 100, radius: 20, color: '#E63946' },
    { x: 300, y: 150, radius: 30, color: '#457B9D' },
    { x: 500, y: 200, radius: 25, color: '#2A9D8F' },
    { x: 200, y: 250, radius: 35, color: '#F4A261' },
    { x: 400, y: 300, radius: 15, color: '#6D597A' },
  ];

  // Animation point data targets (for interpolation)
  const targetData: Point[] = [
    { x: 150, y: 200, radius: 35, color: '#E76F51' },
    { x: 250, y: 100, radius: 15, color: '#264653' },
    { x: 350, y: 300, radius: 40, color: '#1D3557' },
    { x: 450, y: 200, radius: 20, color: '#F1FAEE' },
    { x: 200, y: 150, radius: 30, color: '#E9C46A' },
  ];

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear any existing elements
    d3.select(svgRef.current).selectAll('*').remove();

    // Create SVG container with proper typing
    const svg = selectSvg(`#animation-demo-svg`);

    // Add circles for each data point
    const circles = svg
      .selectAll<SVGCircleElement, Point>('circle')
      .data(pointsData)
      .enter()
      .append('circle')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', d => d.radius)
      .attr('fill', d => d.color);

    // Setup animation sequence using type-safe utilities
    const animationSequence = new TypedAnimationSequence({
      transitions: [
        {
          selection: circles,
          duration: config.duration,
          easing: config.easing,
          delay: (_, i) => i * 100, // Staggered delay based on index
        },
        {
          selection: circles,
          duration: config.duration,
          easing: d3.easeElasticOut,
        },
      ],
      sequenceDelay: 500,
      loop: config.loop,
    });

    // Create object interpolators for each data point
    const interpolators = pointsData.map((startPoint, index) => {
      return {
        position: typedInterpolators.object<Pick<Point, 'x' | 'y'>>(
          { x: startPoint.x, y: startPoint.y },
          { x: targetData[index].x, y: targetData[index].y }
        ),
        radius: typedInterpolators.number(startPoint.radius, targetData[index].radius),
        color: typedInterpolators.color(startPoint.color, targetData[index].color),
      };
    });

    // Create a type-safe timer for smooth animation
    const timer = createTypedTimer({
      callback: elapsed => {
        // Calculate progress based on elapsed time (ping-pong effect)
        const totalDuration = config.duration * 2;
        const normalizedTime = (elapsed % totalDuration) / config.duration;
        const t = normalizedTime <= 1 ? normalizedTime : 2 - normalizedTime;

        // Update each circle with interpolated values
        circles.each(function (d, i) {
          const point = interpolators[i];
          const interpolatedPosition = point.position(t);
          const interpolatedRadius = point.radius(t);
          const interpolatedColor = point.color(t);

          d3.select(this)
            .attr('cx', interpolatedPosition.x)
            .attr('cy', interpolatedPosition.y)
            .attr('r', interpolatedRadius)
            .attr('fill', interpolatedColor);
        });

        // Continue animation if we're looping
        return !config.loop && elapsed >= totalDuration;
      },
      duration: config.loop ? undefined : config.duration * 2,
    });

    // Add labels to show interpolation t value
    const label = svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('fill', '#333');

    // Update label with current interpolation value
    createTypedTimer({
      callback: elapsed => {
        const totalDuration = config.duration * 2;
        const normalizedTime = (elapsed % totalDuration) / config.duration;
        const t = normalizedTime <= 1 ? normalizedTime : 2 - normalizedTime;

        label.text(`Interpolation t: ${t.toFixed(2)}`);
        return false;
      },
    });

    // Cleanup function
    return () => {
      timer.stop();
    };
  }, [width, height, config]);

  return (
    <div className="animation-type-safety-demo">
      <h3>Animation Type Safety Demo</h3>
      <svg
        id="animation-demo-svg"
        ref={svgRef}
        width={width}
        height={height}
        style={{
          border: '1px solid #ccc',
          borderRadius: '4px',
          background: '#f7f7f7',
        }}
      />
      <div className="demo-description">
        <p>This demo showcases the type-safe animation utilities:</p>
        <ul>
          <li>Strong typing for interpolators (position, radius, color)</li>
          <li>Type-safe timer configuration and transitions</li>
          <li>Animation sequences with proper event handling</li>
        </ul>
      </div>
    </div>
  );
};

export default AnimationTypeSafetyDemo;
