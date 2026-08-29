import { Platform } from 'react-native';

export const COLORS = {
  primary: '#2A1F16',      // near-black espresso brown
  primaryLight: '#4A3A28',
  primaryDark: '#1A120B',
  secondary: '#2A1F16',
  accent: '#AACC33',       // tennis-ball green
  success: '#06D6A0',
  warning: '#FFD60A',
  error: '#EF233C',
  background: '#D6D6D6',
  surface: '#F8F0DD',
  surfaceSecondary: '#ECE0C2',
  border: '#DCC9A0',
  textPrimary: '#2A1F16',
  textSecondary: '#8A7A61',
  textMuted: '#B4A688',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.5)',
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
};
