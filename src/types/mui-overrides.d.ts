/**
 * TypeScript declaration overrides to fix union type complexity issues
 * when using Material-UI with React Three Fiber
 */

declare module '@mui/system' {
  interface SystemProps {
    sx?: any;
  }
}

declare module '@mui/material/styles' {
  type Theme = Record<string, any>;
}

// Override the problematic SxProps type
declare module '@mui/system/styleFunctionSx' {
  type SxProps = Record<string, any>;
}

// Grid component compatibility handled by replacing with native CSS Grid 