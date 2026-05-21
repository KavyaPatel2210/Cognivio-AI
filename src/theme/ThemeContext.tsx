import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorSchemeName, useColorScheme } from 'react-native';
import { Colors, getColors, ColorScheme } from './colors';
import { Typography } from './typography';

interface ThemeContextType {
  scheme: ColorScheme;
  colors: ReturnType<typeof getColors>;
  typography: typeof Typography;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (scheme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemScheme = useColorScheme() as ColorScheme;
  const [scheme, setScheme] = useState<ColorScheme>('dark');

  useEffect(() => {
    AsyncStorage.getItem('theme').then((saved) => {
      if (saved === 'dark' || saved === 'light') {
        setScheme(saved);
      } else {
        setScheme(systemScheme || 'dark');
      }
    });
  }, []);

  const toggleTheme = () => {
    const next = scheme === 'dark' ? 'light' : 'dark';
    setScheme(next);
    AsyncStorage.setItem('theme', next);
  };

  const setTheme = (s: ColorScheme) => {
    setScheme(s);
    AsyncStorage.setItem('theme', s);
  };

  return (
    <ThemeContext.Provider
      value={{
        scheme,
        colors: getColors(scheme),
        typography: Typography,
        isDark: scheme === 'dark',
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
