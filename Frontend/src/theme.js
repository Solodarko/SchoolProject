import { createTheme } from '@mui/material/styles';

// Create a theme function that accepts mode parameter
const createAppTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main: mode === 'light' ? '#2563eb' : '#3b82f6',
      light: mode === 'light' ? '#60a5fa' : '#93c5fd',
      dark: mode === 'light' ? '#1d4ed8' : '#1e40af',
      contrastText: '#ffffff',
    },
    secondary: {
      main: mode === 'light' ? '#7c3aed' : '#8b5cf6',
      light: mode === 'light' ? '#a78bfa' : '#c4b5fd',
      dark: mode === 'light' ? '#5b21b6' : '#6d28d9',
      contrastText: '#ffffff',
    },
    accent: {
      main: mode === 'light' ? '#f59e0b' : '#fbbf24',
      light: mode === 'light' ? '#fcd34d' : '#fde68a',
      dark: mode === 'light' ? '#d97706' : '#f59e0b',
      contrastText: mode === 'light' ? '#92400e' : '#451a03',
    },
    scan: {
      main: mode === 'light' ? '#10b981' : '#34d399',
      light: mode === 'light' ? '#6ee7b7' : '#a7f3d0',
      dark: mode === 'light' ? '#059669' : '#10b981',
      contrastText: mode === 'light' ? '#065f46' : '#022c22',
      glow: mode === 'light' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(52, 211, 153, 0.3)',
    },
    success: {
      main: mode === 'light' ? '#059669' : '#10b981',
      light: mode === 'light' ? '#34d399' : '#6ee7b7',
      dark: mode === 'light' ? '#047857' : '#059669',
    },
    warning: {
      main: mode === 'light' ? '#d97706' : '#f59e0b',
      light: mode === 'light' ? '#fbbf24' : '#fcd34d',
      dark: mode === 'light' ? '#b45309' : '#d97706',
    },
    error: {
      main: mode === 'light' ? '#dc2626' : '#ef4444',
      light: mode === 'light' ? '#f87171' : '#fca5a5',
      dark: mode === 'light' ? '#b91c1c' : '#dc2626',
    },
    background: {
      default: mode === 'light' ? '#f1f5f9' : '#0f172a',
      paper: mode === 'light' ? '#fefefe' : '#1e293b',
      neutral: mode === 'light' ? '#e2e8f0' : '#334155',
      elevated: mode === 'light' ? '#fefefe' : '#1e293b',
      surface: mode === 'light' ? '#f8fafc' : '#334155',
    },
    text: {
      primary: mode === 'light' ? '#111827' : '#f9fafb',
      secondary: mode === 'light' ? '#4b5563' : '#9ca3af',
      disabled: mode === 'light' ? '#9ca3af' : '#6b7280',
      hint: mode === 'light' ? '#6b7280' : '#9ca3af',
    },
    divider: mode === 'light' ? '#e5e7eb' : '#374151',
    action: {
      hover: mode === 'light' ? 'rgba(107, 114, 128, 0.08)' : 'rgba(249, 250, 251, 0.08)',
      selected: mode === 'light' ? 'rgba(37, 99, 235, 0.08)' : 'rgba(59, 130, 246, 0.16)',
      disabled: mode === 'light' ? 'rgba(156, 163, 175, 0.32)' : 'rgba(156, 163, 175, 0.24)',
      focus: mode === 'light' ? 'rgba(37, 99, 235, 0.12)' : 'rgba(59, 130, 246, 0.24)',
    },
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: { 
      fontWeight: 800, 
      fontSize: '2.75rem', 
      lineHeight: 1.2,
      letterSpacing: '-0.025em',
      '@media (max-width:600px)': {
        fontSize: '2.25rem',
      },
    },
    h2: { 
      fontWeight: 700, 
      fontSize: '2.25rem', 
      lineHeight: 1.3,
      letterSpacing: '-0.02em',
      '@media (max-width:600px)': {
        fontSize: '1.875rem',
      },
    },
    h3: { 
      fontWeight: 600, 
      fontSize: '1.875rem', 
      lineHeight: 1.4,
      letterSpacing: '-0.015em',
    },
    h4: { 
      fontWeight: 600, 
      fontSize: '1.5rem', 
      lineHeight: 1.4,
      letterSpacing: '-0.01em',
    },
    h5: { 
      fontWeight: 600, 
      fontSize: '1.25rem', 
      lineHeight: 1.5,
      letterSpacing: '-0.005em',
    },
    h6: { 
      fontWeight: 600, 
      fontSize: '1.125rem', 
      lineHeight: 1.5,
    },
    subtitle1: {
      fontWeight: 500,
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    subtitle2: {
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: 1.57,
    },
    body1: { 
      fontSize: '1rem', 
      lineHeight: 1.6,
      fontWeight: 400,
    },
    body2: { 
      fontSize: '0.875rem', 
      lineHeight: 1.57,
      fontWeight: 400,
    },
    button: {
      fontWeight: 600,
      fontSize: '0.875rem',
      textTransform: 'none',
      letterSpacing: '0.025em',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
      fontWeight: 400,
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  spacing: 8,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
          fontWeight: 600,
          padding: '10px 24px',
          fontSize: '0.875rem',
          boxShadow: 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: mode === 'light' 
              ? '0 4px 12px rgba(37, 99, 235, 0.15)' 
              : '0 4px 12px rgba(59, 130, 246, 0.25)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        contained: {
          background: mode === 'light' 
            ? 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)'
            : 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
          '&:hover': {
            background: mode === 'light'
              ? 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)'
              : 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          borderColor: mode === 'light' ? '#e2e8f0' : '#374151',
          '&:hover': {
            borderWidth: '1.5px',
            backgroundColor: mode === 'light' ? 'rgba(37, 99, 235, 0.04)' : 'rgba(59, 130, 246, 0.08)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: mode === 'light'
            ? '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)'
            : '0 4px 6px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.4)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          ...(mode === 'dark' && {
            backgroundImage: 'none',
          }),
        },
        elevation1: {
          boxShadow: mode === 'light'
            ? '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)'
            : '0 4px 6px rgba(0, 0, 0, 0.2), 0 1px 3px rgba(0, 0, 0, 0.3)',
        },
        elevation2: {
          boxShadow: mode === 'light'
            ? '0 4px 6px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.08)'
            : '0 8px 12px rgba(0, 0, 0, 0.25), 0 4px 6px rgba(0, 0, 0, 0.3)',
        },
        elevation3: {
          boxShadow: mode === 'light'
            ? '0 10px 15px rgba(0, 0, 0, 0.08), 0 4px 6px rgba(0, 0, 0, 0.1)'
            : '0 12px 20px rgba(0, 0, 0, 0.3), 0 6px 10px rgba(0, 0, 0, 0.35)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: mode === 'light' ? '1px solid #f1f5f9' : '1px solid #334155',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: mode === 'light'
              ? '0 20px 25px rgba(0, 0, 0, 0.08), 0 8px 10px rgba(0, 0, 0, 0.04)'
              : '0 20px 25px rgba(0, 0, 0, 0.4), 0 8px 10px rgba(0, 0, 0, 0.3)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${mode === 'light' ? '#e2e8f0' : '#334155'}`,
          backgroundColor: mode === 'light' ? 'rgba(248, 250, 252, 0.9)' : 'rgba(30, 41, 59, 0.8)',
          backdropFilter: 'blur(12px)',
          boxShadow: mode === 'light'
            ? '0 1px 3px rgba(0, 0, 0, 0.05)'
            : '0 1px 3px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: mode === 'light' ? '#fefefe' : '#1e293b',
          borderRight: `1px solid ${mode === 'light' ? '#e2e8f0' : '#334155'}`,
          boxShadow: mode === 'light'
            ? '2px 0 8px rgba(0, 0, 0, 0.04)'
            : '2px 0 8px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: '4px 8px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: mode === 'light' 
              ? 'rgba(37, 99, 235, 0.06)' 
              : 'rgba(59, 130, 246, 0.08)',
            transform: 'translateX(4px)',
          },
          '&.Mui-selected': {
            backgroundColor: mode === 'light' 
              ? 'rgba(37, 99, 235, 0.08)' 
              : 'rgba(59, 130, 246, 0.12)',
            borderLeft: `3px solid ${mode === 'light' ? '#2563eb' : '#3b82f6'}`,
            '&:hover': {
              backgroundColor: mode === 'light' 
                ? 'rgba(37, 99, 235, 0.12)' 
                : 'rgba(59, 130, 246, 0.16)',
            },
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '& input': {
              color: mode === 'light' ? '#111827' : '#f9fafb',
              '&::placeholder': {
                color: mode === 'light' ? '#6b7280' : '#9ca3af',
                opacity: 1,
              },
              '&:-webkit-autofill': {
                WebkitBoxShadow: mode === 'light' 
                  ? '0 0 0 1000px rgba(255, 255, 255, 0.9) inset'
                  : '0 0 0 1000px rgba(30, 41, 59, 0.9) inset',
                WebkitTextFillColor: mode === 'light' ? '#111827' : '#f9fafb',
                transition: 'background-color 5000s ease-in-out 0s',
              },
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: mode === 'light' ? '#94a3b8' : '#64748b',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderWidth: '2px',
              borderColor: mode === 'light' ? '#2563eb' : '#3b82f6',
            },
          },
          '& .MuiInputLabel-root': {
            color: mode === 'light' ? '#6b7280' : '#9ca3af',
            '&.Mui-focused': {
              color: mode === 'light' ? '#2563eb' : '#3b82f6',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          fontSize: '0.75rem',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'scale(1.05)',
            backgroundColor: mode === 'light' 
              ? 'rgba(148, 163, 184, 0.08)' 
              : 'rgba(241, 245, 249, 0.08)',
          },
        },
      },
    },
    // Custom component overrides for enhanced accessibility
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: mode === 'light' ? '#374151' : '#f9fafb',
          color: mode === 'light' ? '#f9fafb' : '#374151',
          fontSize: '0.75rem',
          fontWeight: 500,
          borderRadius: 8,
          boxShadow: mode === 'light'
            ? '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)'
            : '0 4px 6px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)',
        },
      },
    },
  },
});

// Default light theme for backwards compatibility
const theme = createAppTheme('light');

export default theme;
export { createAppTheme };
