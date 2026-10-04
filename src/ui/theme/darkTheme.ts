import { alpha, createTheme } from '@mui/material';

// Define the color palette based on provided HEX codes
const palette = {
  mode: 'dark' as const,
  primary: {
    main: '#8395F8', // Blue/Purple
    light: alpha('#8395F8', 0.8), // Lighter version for hover/focus
    dark: '#45265B', // Dark Purple
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#AAF9F8', // Cyan
    light: alpha('#AAF9F8', 0.8),
    dark: alpha('#AAF9F8', 0.6), // Darker cyan
    contrastText: '#212122', // Contrast well with cyan
  },
  error: {
    main: '#EB4C67', // Pinkish Red
    contrastText: '#FFFFFF',
  },
  warning: {
    main: '#F3C15F', // Orange/Yellow
    contrastText: '#212122', // Dark text for contrast
  },
  info: {
    main: '#AAF9F8', // Reusing secondary Cyan for Info
    contrastText: '#212122',
  },
  success: {
    main: '#C8E756', // Lime Green
    contrastText: '#212122', // Dark text for contrast
  },
  background: {
    default: '#212122', // Very Dark Grey
    paper: '#333333', // Dark Grey
  },
  text: {
    primary: '#FFFFFF', // White
    secondary: alpha('#FFFFFF', 0.7), // Light Grey
    disabled: alpha('#FFFFFF', 0.5), // Dimmed White
  },
  divider: alpha('#FFFFFF', 0.12), // Subtle divider
};

// Create the dark theme instance
export const darkTheme = createTheme({
  palette: palette,
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif', // Default MUI font stack
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: {
      textTransform: 'none', // Common practice
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8, // Slightly more rounded corners
  },
  components: {
    // Example Overrides for common components
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: palette.background.paper, // Use paper background for AppBar
          color: palette.text.primary,
          boxShadow: 'none', // Cleaner look
          borderBottom: `1px solid ${palette.divider}`,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // Ensure no background image bleed
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)', // Subtle shadow
        },
        elevation3: {
          boxShadow: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6, // Match shape borderRadius or customize
        },
        containedPrimary: {
          // Example: Slightly darken on hover for primary buttons
          '&:hover': {
            backgroundColor: palette.primary.dark,
          },
        },
        containedSecondary: {
          // Example: Slightly darken on hover for secondary buttons
          '&:hover': {
            backgroundColor: palette.secondary.dark,
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: palette.background.default, // Match default background
          borderRight: `1px solid ${palette.divider}`,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: palette.background.paper,
          backgroundImage: 'none', // Ensure no background image bleed
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
  },
});
