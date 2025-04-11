import { Typography, useTheme } from '@mui/material';
import { debounce } from 'lodash';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  errorLoggingService,
  ErrorSeverity,
  ErrorType,
} from '../../../../services/ErrorLoggingService';
import { ChartDataRecord } from '../../../../types/exploration/AnalysisComponentTypes';
import { BaseChartProps } from './BaseChart';

// Define color scale creator (simplified version of d3 scales)
function createColorScale(domain: [number, number], range: string[]): (value: number) => string {
  return (value: number) => {
    // Normalize value to 0-1 range
    const normalizedValue = Math.max(0, Math.min(1, (value - domain[0]) / (domain[1] - domain[0])));
    // Map to color index
    const index = Math.min(range.length - 1, Math.floor(normalizedValue * range.length));
    return range[index];
  };
}

export interface CanvasScatterPlotProps extends BaseChartProps {
  /** Key for X-axis values */
  xAxisKey: string;

  /** Key for Y-axis values */
  yAxisKey: string;

  /** Optional key for point size */
  sizeKey?: string;

  /** Optional key for point color */
  colorKey?: string;

  /** Min/max values for X-axis (if not provided, calculated from data) */
  xDomain?: [number, number];

  /** Min/max values for Y-axis (if not provided, calculated from data) */
  yDomain?: [number, number];

  /** Min/max range for point sizes (in pixels) */
  sizeRange?: [number, number];

  /** Colors for points (or color range if colorKey provided) */
  colorRange?: string[];

  /** Whether to show axes */
  showAxes?: boolean;

  /** Whether to show grid lines */
  showGrid?: boolean;

  /** X-axis label */
  xAxisLabel?: string;

  /** Y-axis label */
  yAxisLabel?: string;

  /** Whether to allow zooming and panning */
  interactive?: boolean;

  /** High performance mode renders less details but handles more points */
  highPerformanceMode?: boolean;

  /** Maximum number of points to render before switching to high performance mode */
  performanceThreshold?: number;

  /** Use WebGL for rendering if available */
  useWebGL?: boolean;

  /** Whether to show axis labels and ticks */
  showAxisLabels?: boolean;
}

/**
 * CanvasScatterPlot is a high-performance scatter plot using Canvas rendering
 * instead of SVG for handling very large datasets efficiently.
 */
export const CanvasScatterPlot: React.FC<CanvasScatterPlotProps> = ({
  data,
  xAxisKey,
  yAxisKey,
  sizeKey,
  colorKey,
  width = '100%',
  height = 400,
  title,
  subtitle,
  xDomain,
  yDomain,
  sizeRange = [4, 12],
  colorRange = [
    '#4361ee', // Blue
    '#3a86ff', // Light blue
    '#4cc9f0', // Cyan
    '#4895ef', // Sky blue
    '#560bad', // Purple
    '#7209b7', // Dark purple
    '#f72585', // Pink
    '#b5179e', // Magenta
  ],
  showAxes = true,
  showGrid = true,
  xAxisLabel,
  yAxisLabel,
  showAxisLabels = true,
  interactive = true,
  highPerformanceMode: forcedHighPerformanceMode = false,
  performanceThreshold = 5000,
  useWebGL = true,
  className = '',
  errorMessage,
  onElementClick,
}) => {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const webglCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredPoint, setHoveredPoint] = useState<ChartDataRecord | null>(null);
  const [mouseDataPosition, setMouseDataPosition] = useState<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [canUseWebGL, setCanUseWebGL] = useState(false);

  // WebGL context reference
  const glRef = useRef<WebGLRenderingContext | null>(null);

  // Calculate domains from data if not provided
  const calculatedDomains = useMemo(() => {
    if (!data || data?.length === 0) {
      return {
        x: [0, 1] as [number, number],
        y: [0, 1] as [number, number],
        size: [1, 1] as [number, number],
        color: [0, 1] as [number, number],
      };
    }

    let xMin = Infinity;
    let xMax = -Infinity;
    let yMin = Infinity;
    let yMax = -Infinity;
    let sizeMin = Infinity;
    let sizeMax = -Infinity;
    let colorMin = Infinity;
    let colorMax = -Infinity;

    // Find min/max values
    data?.forEach(item => {
      // X values
      const x = Number(item[xAxisKey] ?? 0);
      xMin = Math.min(xMin, x);
      xMax = Math.max(xMax, x);

      // Y values
      const y = Number(item[yAxisKey] ?? 0);
      yMin = Math.min(yMin, y);
      yMax = Math.max(yMax, y);

      // Size values (if provided)
      if (sizeKey && item[sizeKey] !== undefined) {
        const size = Number(item[sizeKey] ?? 0);
        sizeMin = Math.min(sizeMin, size);
        sizeMax = Math.max(sizeMax, size);
      }

      // Color values (if provided)
      if (colorKey && item[colorKey] !== undefined) {
        const color = Number(item[colorKey] ?? 0);
        colorMin = Math.min(colorMin, color);
        colorMax = Math.max(colorMax, color);
      }
    });

    // Add a small buffer to domains (5%)
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;

    return {
      x: [xMin - xRange * 0.05, xMax + xRange * 0.05] as [number, number],
      y: [yMin - yRange * 0.05, yMax + yRange * 0.05] as [number, number],
      size:
        sizeMin !== Infinity
          ? ([sizeMin, sizeMax] as [number, number])
          : ([1, 1] as [number, number]),
      color:
        colorMin !== Infinity
          ? ([colorMin, colorMax] as [number, number])
          : ([0, 1] as [number, number]),
    };
  }, [data, xAxisKey, yAxisKey, sizeKey, colorKey]);

  // Use provided domains or fall back to calculated ones
  const domains = {
    x: xDomain || calculatedDomains.x,
    y: yDomain || calculatedDomains.y,
    size: calculatedDomains.size,
    color: calculatedDomains.color,
  };

  // Determine if we should use high performance mode
  const highPerformanceMode =
    forcedHighPerformanceMode || (data && data?.length > performanceThreshold);

  // Check WebGL support
  useEffect(() => {
    if (!useWebGL) {
      return;
    }

    const canvas = webglCanvasRef.current;
    if (!canvas) {
      return;
    }

    try {
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        glRef.current = gl as WebGLRenderingContext;
        setCanUseWebGL(true);
      } else {
        console.warn('WebGL not supported, falling back to Canvas 2D rendering');
        setCanUseWebGL(false);
      }
    } catch (e) {
      errorLoggingService.logError(
        e instanceof Error ? e : new Error('Error initializing WebGL'),
        ErrorType.RUNTIME,
        ErrorSeverity.HIGH,
        { componentName: 'CanvasScatterPlot', action: 'useEffect (webgl init)' }
      );
      setCanUseWebGL(false);
    }
  }, [useWebGL]);

  // Create scales for mapping data values to pixel coordinates
  const scales = useMemo(() => {
    const padding = { left: 50, right: 20, top: 20, bottom: 40 };

    return {
      x: (value: number) => {
        const canvasWidth = dimensions.width - padding.left - padding.right;
        const normalizedValue = (value - domains.x[0]) / (domains.x[1] - domains.x[0]);
        return padding.left + normalizedValue * canvasWidth * zoom + pan.x;
      },
      y: (value: number) => {
        const canvasHeight = dimensions.height - padding.top - padding.bottom;
        // Note: Y is inverted in canvas coordinates (0 is top)
        const normalizedValue = 1 - (value - domains.y[0]) / (domains.y[1] - domains.y[0]);
        return padding.top + normalizedValue * canvasHeight * zoom + pan.y;
      },
      size: (value: number) => {
        if (!sizeKey) {
          return sizeRange[0];
        }
        const normalizedValue = (value - domains.size[0]) / (domains.size[1] - domains.size[0]);
        return sizeRange[0] + normalizedValue * (sizeRange[1] - sizeRange[0]);
      },
      color: createColorScale(domains.color, colorRange),
    };
  }, [dimensions, domains, sizeRange, colorRange, sizeKey, zoom, pan]);

  // Inverse scales for converting canvas coordinates to data values
  const inverseScales = useMemo(() => {
    const padding = { left: 50, right: 20, top: 20, bottom: 40 };

    return {
      x: (pixelX: number) => {
        const canvasWidth = dimensions.width - padding.left - padding.right;
        const normalizedValue = (pixelX - padding.left - pan.x) / (canvasWidth * zoom);
        return domains.x[0] + normalizedValue * (domains.x[1] - domains.x[0]);
      },
      y: (pixelY: number) => {
        const canvasHeight = dimensions.height - padding.top - padding.bottom;
        // Note: Y is inverted in canvas coordinates (0 is top)
        const normalizedValue = 1 - (pixelY - padding.top - pan.y) / (canvasHeight * zoom);
        return domains.y[0] + normalizedValue * (domains.y[1] - domains.y[0]);
      },
    };
  }, [dimensions, domains, zoom, pan]);

  // Initialize WebGL
  const initWebGL = useCallback(() => {
    const gl = glRef.current;
    if (!gl) {
      return false;
    }

    // Clear to black
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Basic vertex shader (converts 2D points to clip space)
    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute float a_size;
      attribute vec3 a_color;
      
      uniform mat3 u_matrix;
      
      varying vec3 v_color;
      
      void main() {
        // Apply transformation matrix
        vec3 position = u_matrix * vec3(a_position, 1.0);
        
        // Convert from pixel space to clip space
        gl_Position = vec4(position.xy, 0.0, 1.0);
        gl_PointSize = a_size;
        
        // Pass color to fragment shader
        v_color = a_color;
      }
    `;

    // Fragment shader (colors the points)
    const fragmentShaderSource = `
      precision mediump float;
      
      varying vec3 v_color;
      
      void main() {
        // Draw circle instead of square
        float dist = distance(gl_PointCoord, vec2(0.5, 0.5));
        if (dist > 0.5) {
          discard;
        }
        
        gl_FragColor = vec4(v_color, 1.0);
      }
    `;

    // Create shaders
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) {
      return false;
    }

    // Set shader source
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.shaderSource(fragmentShader, fragmentShaderSource);

    // Compile shaders
    gl.compileShader(vertexShader);
    gl.compileShader(fragmentShader);

    // Check if shaders compiled successfully
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      errorLoggingService.logError(
        new Error(`Vertex shader compilation failed: ${gl.getShaderInfoLog(vertexShader)}`),
        ErrorType.RUNTIME,
        ErrorSeverity.HIGH,
        { componentName: 'CanvasScatterPlot', action: 'initWebGL', shaderType: 'vertex' }
      );
      return false;
    }

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      errorLoggingService.logError(
        new Error(`Fragment shader compilation failed: ${gl.getShaderInfoLog(fragmentShader)}`),
        ErrorType.RUNTIME,
        ErrorSeverity.HIGH,
        { componentName: 'CanvasScatterPlot', action: 'initWebGL', shaderType: 'fragment' }
      );
      return false;
    }

    // Create program
    const program = gl.createProgram();
    if (!program) {
      return false;
    }

    // Attach shaders
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    // Link program
    gl.linkProgram(program);

    // Check if program linked successfully
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      errorLoggingService.logError(
        new Error(`WebGL program linking failed: ${gl.getProgramInfoLog(program)}`),
        ErrorType.RUNTIME,
        ErrorSeverity.HIGH,
        { componentName: 'CanvasScatterPlot', action: 'initWebGL', operation: 'linkProgram' }
      );
      return false;
    }

    // Use program
    gl.useProgram(program);

    return true;
  }, []);

  // Update canvas dimensions when container size changes
  const updateDimensions = useCallback(() => {
    if (!containerRef.current) {
      return;
    }

    const { width, height } = containerRef.current.getBoundingClientRect();
    setDimensions({ width, height });

    if (canvasRef.current) {
      canvasRef.current.width = width;
      canvasRef.current.height = height;
    }

    if (webglCanvasRef.current) {
      webglCanvasRef.current.width = width;
      webglCanvasRef.current.height = height;
    }
  }, []);

  // Debounced version of updateDimensions
  const debouncedUpdateDimensions = useMemo(
    () => debounce(updateDimensions, 100),
    [updateDimensions]
  );

  // Set up ResizeObserver
  useEffect(() => {
    updateDimensions();

    const observer = new ResizeObserver(debouncedUpdateDimensions);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    window.addEventListener('resize', debouncedUpdateDimensions);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', debouncedUpdateDimensions);
      debouncedUpdateDimensions.cancel();
    };
  }, [debouncedUpdateDimensions]);

  // Render with 2D Canvas context
  const renderCanvas2D = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 1;

      // Draw X grid lines
      for (let i = 0; i <= 10; i++) {
        const x = domains.x[0] + (i / 10) * (domains.x[1] - domains.x[0]);
        const xPixel = scales.x(x);

        ctx.beginPath();
        ctx.moveTo(xPixel, scales.y(domains.y[0]));
        ctx.lineTo(xPixel, scales.y(domains.y[1]));
        ctx.stroke();
      }

      // Draw Y grid lines
      for (let i = 0; i <= 10; i++) {
        const y = domains.y[0] + (i / 10) * (domains.y[1] - domains.y[0]);
        const yPixel = scales.y(y);

        ctx.beginPath();
        ctx.moveTo(scales.x(domains.x[0]), yPixel);
        ctx.lineTo(scales.x(domains.x[1]), yPixel);
        ctx.stroke();
      }
    }

    // Draw axes
    if (showAxes) {
      ctx.strokeStyle = theme.palette.mode === 'dark' ? '#fff' : '#000';
      ctx.lineWidth = 2;

      // X-axis
      ctx.beginPath();
      ctx.moveTo(scales.x(domains.x[0]), scales.y(0));
      ctx.lineTo(scales.x(domains.x[1]), scales.y(0));
      ctx.stroke();

      // Y-axis
      ctx.beginPath();
      ctx.moveTo(scales.x(0), scales.y(domains.y[0]));
      ctx.lineTo(scales.x(0), scales.y(domains.y[1]));
      ctx.stroke();
    }

    // Draw axis labels if enabled
    if (showAxisLabels) {
      ctx.fillStyle = theme.palette.mode === 'dark' ? '#fff' : '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';

      // X-axis labels
      for (let i = 0; i <= 10; i++) {
        const x = domains.x[0] + (i / 10) * (domains.x[1] - domains.x[0]);
        const xPixel = scales.x(x);

        ctx.fillText(x.toFixed(1), xPixel, scales.y(domains.y[0]) + 20);
      }

      // Y-axis labels
      ctx.textAlign = 'right';
      for (let i = 0; i <= 10; i++) {
        const y = domains.y[0] + (i / 10) * (domains.y[1] - domains.y[0]);
        const yPixel = scales.y(y);

        ctx.fillText(y.toFixed(1), scales.x(domains.x[0]) - 10, yPixel + 4);
      }

      // Axis titles
      if (xAxisLabel) {
        ctx.textAlign = 'center';
        ctx.fillText(
          xAxisLabel,
          scales.x(domains.x[0] + (domains.x[1] - domains.x[0]) / 2),
          canvas.height - 10
        );
      }

      if (yAxisLabel) {
        ctx.save();
        ctx.translate(15, scales.y(domains.y[0] + (domains.y[1] - domains.y[0]) / 2));
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText(yAxisLabel, 0, 0);
        ctx.restore();
      }
    }

    // Draw data points
    data?.forEach(item => {
      const x = Number(item[xAxisKey] ?? 0);
      const y = Number(item[yAxisKey] ?? 0);

      // Skip points outside the visible range
      if (x < domains.x[0] || x > domains.x[1] || y < domains.y[0] || y > domains.y[1]) {
        return;
      }

      const xPixel = scales.x(x);
      const yPixel = scales.y(y);

      // Determine point size
      let pointSize = sizeRange[0];
      if (sizeKey && item[sizeKey] !== undefined) {
        pointSize = scales.size(Number(item[sizeKey] ?? 0));
      }

      // Determine point color
      let pointColor = colorRange[0];
      if (colorKey && item[colorKey] !== undefined) {
        pointColor = scales.color(Number(item[colorKey] ?? 0));
      }

      // Draw point
      ctx.beginPath();
      ctx.arc(xPixel, yPixel, pointSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = pointColor;
      ctx.fill();

      // Highlight hovered point
      if (hoveredPoint === item) {
        ctx.strokeStyle = theme.palette.mode === 'dark' ? '#fff' : '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  }, [
    data,
    domains,
    scales,
    sizeRange,
    colorRange,
    sizeKey,
    colorKey,
    hoveredPoint,
    showGrid,
    showAxes,
    showAxisLabels,
    xAxisLabel,
    yAxisLabel,
    theme.palette.mode,
  ]);

  // Render with WebGL
  const renderWebGL = useCallback(() => {
    const gl = glRef.current;
    const canvas = webglCanvasRef.current;
    if (!gl || !canvas || !data || data?.length === 0) {
      return;
    }

    // Clear canvas
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Create points buffer
    const points: number[] = [];
    const sizes: number[] = [];
    const colors: number[] = [];

    // Prepare data for WebGL
    data?.forEach(item => {
      const x = Number(item[xAxisKey] ?? 0);
      const y = Number(item[yAxisKey] ?? 0);

      // Skip points outside the visible range
      if (x < domains.x[0] || x > domains.x[1] || y < domains.y[0] || y > domains.y[1]) {
        return;
      }

      // Convert to normalized device coordinates (WebGL space: -1 to 1)
      const normalizedX = (scales.x(x) / canvas.width) * 2 - 1;
      const normalizedY = -(scales.y(y) / canvas.height) * 2 + 1; // Flip Y

      points.push(normalizedX, normalizedY);

      // Determine point size
      let pointSize = sizeRange[0];
      if (sizeKey && item[sizeKey] !== undefined) {
        pointSize = scales.size(Number(item[sizeKey] ?? 0));
      }
      sizes.push(pointSize);

      // Determine point color
      let pointColor = colorRange[0];
      if (colorKey && item[colorKey] !== undefined) {
        pointColor = scales.color(Number(item[colorKey] ?? 0));
      }

      // Convert hex color to RGB
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
          ? [
              parseInt(result[1], 16) / 255,
              parseInt(result[2], 16) / 255,
              parseInt(result[3], 16) / 255,
            ]
          : [0, 0, 0];
      };

      const rgb = hexToRgb(pointColor);
      colors.push(rgb[0], rgb[1], rgb[2]);
    });

    // Get shader locations
    const program = gl.getParameter(gl.CURRENT_PROGRAM);
    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    const sizeAttributeLocation = gl.getAttribLocation(program, 'a_size');
    const colorAttributeLocation = gl.getAttribLocation(program, 'a_color');
    const matrixLocation = gl.getUniformLocation(program, 'u_matrix');

    // Create position buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    // Create size buffer
    const sizeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizes), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(sizeAttributeLocation);
    gl.vertexAttribPointer(sizeAttributeLocation, 1, gl.FLOAT, false, 0, 0);

    // Create color buffer
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(colorAttributeLocation);
    gl.vertexAttribPointer(colorAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    // Set transformation matrix (identity for now)
    const matrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    gl.uniformMatrix3fv(matrixLocation, false, matrix);

    // Draw points
    gl.drawArrays(gl.POINTS, 0, points.length / 2);

    // Clean up
    gl.deleteBuffer(positionBuffer);
    gl.deleteBuffer(sizeBuffer);
    gl.deleteBuffer(colorBuffer);
  }, [data, domains, scales, sizeRange, colorRange, sizeKey, colorKey, xAxisKey, yAxisKey]);

  // Handle canvas click for point selection
  const handleClick = useCallback(
    (_e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!onElementClick || !hoveredPoint) {
        return;
      }
      onElementClick(hoveredPoint, 0);
    },
    [onElementClick, hoveredPoint]
  );

  // Handle mouse down for panning
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!interactive) {
        return;
      }

      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    },
    [interactive]
  );

  // Handle mouse up for panning
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle mouse move for panning
  const handleMouseMoveForPan = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) {
        return;
      }

      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Convert canvas coordinates to data values using inverseScales
      const dataX = inverseScales.x(mouseX);
      const dataY = inverseScales.y(mouseY);

      // Store the current mouse position in data coordinates
      setMouseDataPosition({ x: dataX, y: dataY });

      // If dragging, handle panning
      if (isDragging && interactive) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;

        setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        setDragStart({ x: e.clientX, y: e.clientY });
        return;
      }

      // If not dragging, find the closest point for hover effects
      if (!isDragging && data) {
        let closestPoint: Record<string, unknown> | null = null;
        let closestDistance = Infinity;

        // Only check points within a certain radius in high performance mode
        const checkRadius = highPerformanceMode ? 10 : 50;

        data?.forEach(item => {
          const itemX = Number(item[xAxisKey] ?? 0);
          const itemY = Number(item[yAxisKey] ?? 0);

          // Calculate distance in pixel space
          const pixelX = scales.x(itemX);
          const pixelY = scales.y(itemY);

          const distance = Math.sqrt(Math.pow(pixelX - mouseX, 2) + Math.pow(pixelY - mouseY, 2));

          if (distance < closestDistance && distance < checkRadius) {
            closestDistance = distance;
            closestPoint = item;
          }
        });

        setHoveredPoint(closestPoint);

        // Update cursor style
        if (canvasRef.current) {
          canvasRef.current.style.cursor = closestPoint ? 'pointer' : 'default';
        }
      }
    },
    [
      isDragging,
      dragStart,
      interactive,
      data,
      scales,
      xAxisKey,
      yAxisKey,
      highPerformanceMode,
      inverseScales,
    ]
  );

  // Handle wheel for zooming
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      if (!interactive) return;

      e.preventDefault();

      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      setZoom(prev => Math.max(0.1, Math.min(10, prev * zoomFactor)));
    },
    [interactive]
  );

  // Render the visualization
  useEffect(() => {
    if (canUseWebGL && useWebGL) {
      if (!glRef.current) {
        const success = initWebGL();
        if (!success) {
          setCanUseWebGL(false);
        }
      }

      renderWebGL();
    } else {
      renderCanvas2D();
    }
  }, [canUseWebGL, useWebGL, initWebGL, renderWebGL, renderCanvas2D, dimensions, data]);

  // If no data, show error
  if (!data || data?.length === 0) {
    return (
      <div
        className={`${className} border-opacity-10 flex flex-col items-center justify-center rounded border border-solid`}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
        }}
      >
        <Typography variant="body1" color="text.secondary">
          {errorMessage || 'No data available'}
        </Typography>
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Chart title and subtitle */}
      {(title || subtitle) && (
        <div className="mb-2 text-center">
          {title && <Typography variant="h6">{title}</Typography>}
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </div>
      )}

      {/* Performance mode notification */}
      {highPerformanceMode && (
        <Typography variant="caption" color="text.secondary" className="mb-1">
          High performance mode: {data?.length.toLocaleString()} data points
        </Typography>
      )}

      {/* Canvas container */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden rounded"
        style={{
          border: '1px solid rgba(0,0,0,0.1)',
        }}
      >
        {/* Main canvas (2D rendering) */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            display: canUseWebGL && useWebGL ? 'none' : 'block',
          }}
          onMouseMove={handleMouseMoveForPan}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseOut={handleMouseUp}
          onWheel={handleWheel}
        />

        {/* WebGL canvas */}
        <canvas
          ref={webglCanvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            display: canUseWebGL && useWebGL ? 'block' : 'none',
          }}
          onMouseMove={handleMouseMoveForPan}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseOut={handleMouseUp}
          onWheel={handleWheel}
        />

        {/* Tooltip for hovered point */}
        {hoveredPoint && (
          <div
            style={{
              position: 'absolute',
              top: scales.y(Number(hoveredPoint[yAxisKey] ?? 0)) - 10,
              left: scales.x(Number(hoveredPoint[xAxisKey] ?? 0)) + 10,
              backgroundColor:
                theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
              border: '1px solid rgba(0,0,0,0.2)',
              borderRadius: 4,
              padding: 8,
              pointerEvents: 'none',
              zIndex: 1000,
              maxWidth: 200,
              fontSize: 12,
            }}
          >
            <div>
              <strong>{xAxisKey}:</strong> {Number(hoveredPoint[xAxisKey] ?? 0).toFixed(2)}
            </div>
            <div>
              <strong>{yAxisKey}:</strong> {Number(hoveredPoint[yAxisKey] ?? 0).toFixed(2)}
            </div>
            {sizeKey && hoveredPoint[sizeKey] !== undefined && (
              <div>
                <strong>{sizeKey}:</strong> {Number(hoveredPoint[sizeKey] ?? 0).toFixed(2)}
              </div>
            )}
            {colorKey && hoveredPoint[colorKey] !== undefined && (
              <div>
                <strong>{colorKey}:</strong> {Number(hoveredPoint[colorKey] ?? 0).toFixed(2)}
              </div>
            )}
            {mouseDataPosition && (
              <div className="mt-2 border-t border-gray-300 pt-1 text-xs">
                <div>Mouse position:</div>
                <div>x: {mouseDataPosition.x.toFixed(2)}</div>
                <div>y: {mouseDataPosition.y.toFixed(2)}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls for interactive mode */}
      {interactive && (
        <div className="mt-1 flex justify-center">
          <Typography variant="caption" color="text.secondary">
            Scroll to zoom, drag to pan, click to select
          </Typography>
        </div>
      )}
    </div>
  );
};

export default CanvasScatterPlot;
