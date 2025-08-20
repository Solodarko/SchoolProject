import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createAppTheme } from '../theme';

const ThemeModeContext = createContext();

export function useThemeMode() {
  return useContext(ThemeModeContext);
}

export function ThemeModeProvider({ children }) {
  // Get initial mode from localStorage or system preference
  const getInitialMode = () => {
    const stored = localStorage.getItem('dashboardMode');
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const [mode, setMode] = useState(getInitialMode);

  useEffect(() => {
    localStorage.setItem('dashboardMode', mode);
  }, [mode]);

  const theme = useMemo(() => {
    const baseTheme = createAppTheme(mode);
    return {
      ...baseTheme,
      components: {
        ...baseTheme.components,
        MuiCssBaseline: {
          styleOverrides: {
            ...((baseTheme.components && baseTheme.components.MuiCssBaseline && baseTheme.components.MuiCssBaseline.styleOverrides) || {}),
            'html': {
              transition: 'background 0.3s, color 0.3s',
            },
            'body': {
              transition: 'background 0.3s, color 0.3s',
            },
          },
        },
      },
    };
  }, [mode]);

  const toggleMode = () => setMode((prev) => (prev === 'light' ? 'dark' : 'light'));

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
} 