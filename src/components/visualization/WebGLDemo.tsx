import * as React from "react";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Paper, Slider, Stack, Typography } from '@mui/material';
import { useWebGL } from '../../hooks/useWebGL';

interface Point {
  x: number;
  y: number;
  value: number;
}

interface WebGLDemoProps {
  width?: number;
  height?: number;
  data?: Point[];
}

export function WebGLDemo({ width = 800, height = 600, data: initialData }: WebGLDemoProps) {
  const [intensity, setIntensity] = useState(0.5);
  const [colorScale, setColorScale] = useState<[number, number, number]>([1, 0, 0]);

  // Generate sample data if not provided
  const data = useMemo(() => {
    if (initialData) return initialData;

    const points: Point[] = [];
    for (let i = 0; i < 1000; i++) {
      points.push({
        x: Math.random() * 2 - 1, // -1 to 1
        y: Math.random() * 2 - 1, // -1 to 1
        value: Math.random(),
      });
    }
    return points;
  }, [initialData]);

  // Create vertex data
  const vertexData = useMemo(() => {
    const vertices = new Float32Array(data.length * 3); // x, y, value
    for (let i = 0; i < data.length; i++) {
      vertices[i * 3] = data[i].x;
      vertices[i * 3 + 1] = data[i].y;
      vertices[i * 3 + 2] = data[i].value;
    }
    return vertices;
  }, [data]);

  // Initialize WebGL
  const { canvasRef, gl, useShader, createBuffer, setUniform, clear } = useWebGL({
    width,
    height,
  });

  // Render function
  const render = useCallback(() => {
    if (!gl) return;

    clear();

    // Use heatmap shader
    const shader = useShader('heatmap');

    // Set uniforms
    setUniform(shader.uniforms.u_matrix, new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]));
    setUniform(shader.uniforms.u_colorLow, [0, 0, 0.5]);
    setUniform(shader.uniforms.u_colorHigh, colorScale);
    setUniform(shader.uniforms.u_minValue, 0);
    setUniform(shader.uniforms.u_maxValue, 1);

    // Set attributes
    const buffer = createBuffer(vertexData);
    gl.enableVertexAttribArray(shader.attributes.a_position);
    gl.vertexAttribPointer(
      shader.attributes.a_position,
      2,
      gl.FLOAT,
      false,
      12, // 3 floats * 4 bytes
      0
    );

    gl.enableVertexAttribArray(shader.attributes.a_value);
    gl.vertexAttribPointer(
      shader.attributes.a_value,
      1,
      gl.FLOAT,
      false,
      12, // 3 floats * 4 bytes
      8 // Skip x,y (2 floats * 4 bytes)
    );

    // Draw points
    gl.drawArrays(gl.POINTS, 0, data.length);

    // Apply highlight effect
    const highlightShader = useShader('highlight');
    setUniform(highlightShader.uniforms.u_matrix, new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]));
    setUniform(highlightShader.uniforms.u_highlightColor, [1, 1, 1, 1]);
    setUniform(highlightShader.uniforms.u_intensity, intensity);

    // Cleanup
    gl.deleteBuffer(buffer);
  }, [
    gl,
    useShader,
    createBuffer,
    setUniform,
    clear,
    vertexData,
    intensity,
    colorScale,
    data.length,
  ]);

  // Render on changes
  useEffect(() => {
    render();
  }, [render]);

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        WebGL Visualization Demo
      </Typography>
      <Box mb={2}>
        <canvas
          ref={canvasRef}
          style={{
            border: '1px solid #ccc',
            borderRadius: 4,
          }}
        />
      </Box>
      <Stack spacing={2}>
        <Box>
          <Typography gutterBottom>Highlight Intensity</Typography>
          <Slider
            value={intensity}
            onChange={(_, value) => setIntensity(value as number)}
            min={0}
            max={1}
            step={0.01}
          />
        </Box>
        <Box>
          <Typography gutterBottom>Color Scale</Typography>
          <Stack direction="row" spacing={2}>
            <Slider
              value={colorScale[0]}
              onChange={(_, value) =>
                setColorScale([value as number, colorScale[1], colorScale[2]])
              }
              min={0}
              max={1}
              step={0.01}
              sx={{ color: 'red' }}
            />
            <Slider
              value={colorScale[1]}
              onChange={(_, value) =>
                setColorScale([colorScale[0], value as number, colorScale[2]])
              }
              min={0}
              max={1}
              step={0.01}
              sx={{ color: 'green' }}
            />
            <Slider
              value={colorScale[2]}
              onChange={(_, value) =>
                setColorScale([colorScale[0], colorScale[1], value as number])
              }
              min={0}
              max={1}
              step={0.01}
              sx={{ color: 'blue' }}
            />
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}
