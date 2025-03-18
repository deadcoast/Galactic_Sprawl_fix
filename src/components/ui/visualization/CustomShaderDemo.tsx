import * as React from "react";
import { useState } from 'react';
import { ShaderUniform } from '../../../lib/optimization/WebGLShaderManager';
import { CustomShaderVisualization } from './CustomShaderVisualization';

interface CustomShaderDemoProps {
  width?: number;
  height?: number;
  className?: string;
}

/**
 * CustomShaderDemo
 *
 * A demo component that shows how to use custom shaders for data visualization.
 * Includes examples of different shader effects and how to define custom uniforms.
 */
export const CustomShaderDemo: React.FC<CustomShaderDemoProps> = ({
  width = 800,
  height = 600,
  className = '',
}) => {
  // Generate sample data
  const sampleData = React.useMemo(() => {
    const data = [];
    const gridSize = 30;
    const stepX = width / gridSize;
    const stepY = height / gridSize;

    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        const posX = x * stepX + stepX / 2;
        const posY = y * stepY + stepY / 2;

        // Create various patterns
        const centerX = width / 2;
        const centerY = height / 2;
        const distToCenter = Math.sqrt(Math.pow(posX - centerX, 2) + Math.pow(posY - centerY, 2));
        const value = 1 - Math.min(1, distToCenter / (Math.min(width, height) / 2));

        data?.push({
          x: posX,
          y: posY,
          value,
        });
      }
    }

    return data;
  }, [width, height]);

  // Custom shader definitions
  const shaderDefinitions = React.useMemo(
    () => ({
      ripple: {
        vertexShader: `
        attribute vec2 a_position;
        attribute float a_data;
        
        uniform vec2 u_resolution;
        uniform float u_time;
        uniform float u_speed;
        uniform vec2 u_dataRange;
        uniform float u_waveFrequency;
        uniform float u_waveAmplitude;
        
        varying float v_data;
        varying vec2 v_position;
        varying float v_time;
        
        void main() {
          // Normalize data
          v_data = (a_data - u_dataRange.x) / (u_dataRange.y - u_dataRange.x);
          v_position = a_position;
          v_time = u_time * u_speed;
          
          // Calculate ripple effect
          float dist = length(a_position - u_resolution * 0.5);
          float wave = sin(dist * u_waveFrequency - v_time) * u_waveAmplitude;
          
          // Position with ripple
          vec2 pos = a_position + normalize(a_position - u_resolution * 0.5) * wave;
          vec2 clipSpace = (pos / u_resolution) * 2.0 - 1.0;
          gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
          
          // Point size based on data
          gl_PointSize = mix(4.0, 12.0, v_data);
        }
      `,
        fragmentShader: `
        precision mediump float;
        
        uniform vec3 u_colors[5];
        uniform int u_colorCount;
        uniform float u_intensity;
        uniform float u_time;
        
        varying float v_data;
        varying vec2 v_position;
        varying float v_time;
        
        void main() {
          // Circular point shape
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          // Get color based on data value
          vec3 color = u_colors[0];
          if (u_colorCount > 1) {
            float t = v_data;
            int index = int(t * float(u_colorCount - 1));
            float frac = fract(t * float(u_colorCount - 1));
            
            if (index >= u_colorCount - 1) {
              color = u_colors[u_colorCount - 1];
            } else {
              color = mix(u_colors[index], u_colors[index + 1], frac);
            }
          }
          
          // Add glow effect
          float glow = smoothstep(0.5, 0.0, dist);
          color += glow * 0.5 * vec3(1.0, 0.8, 0.2);
          
          // Pulse effect
          float pulse = 0.5 + 0.5 * sin(v_time * 3.0 + v_data * 10.0);
          color = mix(color, vec3(1.0), pulse * 0.2);
          
          gl_FragColor = vec4(color, u_intensity * (0.7 + 0.3 * glow));
        }
      `,
        uniforms: {
          u_waveFrequency: {
            type: 'float' as const,
            value: 0.05,
          } satisfies ShaderUniform,
          u_waveAmplitude: {
            type: 'float' as const,
            value: 20.0,
          } satisfies ShaderUniform,
        },
      },
    }),
    []
  );

  // State for current shader
  const [currentShader, setCurrentShader] = useState('ripple');

  return (
    <div className={`custom-shader-demo ${className}`}>
      <div className="controls mb-4">
        <h3 className="mb-2 text-lg font-bold">Custom Shader Demo</h3>
        <div className="flex gap-2">
          <button
            className={`rounded px-4 py-2 ${
              currentShader === 'ripple' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
            onClick={() => setCurrentShader('ripple')}
          >
            Ripple Effect
          </button>
          {/* Add more shader options here */}
        </div>
      </div>

      <CustomShaderVisualization
        width={width}
        height={height}
        data={sampleData}
        shaderDefinition={shaderDefinitions[currentShader as keyof typeof shaderDefinitions]}
        animate={true}
        animationSpeed={1.0}
        intensity={0.8}
      />

      <div className="description mt-4">
        <h4 className="font-bold">About this visualization</h4>
        <p className="text-sm text-gray-600">
          This demo shows how to create custom shader effects for data visualization. The ripple
          effect uses a vertex shader to create animated waves that emanate from the center, while
          the fragment shader adds color transitions and glow effects.
        </p>
      </div>
    </div>
  );
};

export default CustomShaderDemo;
