import { Platform } from 'react-native';

export const COLORS = {
  primary: '#6C5CA6',      // mid violet — accent tints, chips, general CTAs
  primaryLight: '#8779C2',
  primaryDark: '#241B4D',
  secondary: '#6C5CA6',
  accent: '#9ACB3B',        // tennis-ball green
  success: '#06D6A0',
  warning: '#FFD60A',
  error: '#EF233C',
  background: 'transparent', // the purple gradient (GRADIENT below) shows through
  surface: 'rgba(255,255,255,0.09)',
  surfaceSecondary: 'rgba(255,255,255,0.16)',
  border: 'rgba(255,255,255,0.22)',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.72)',
  textMuted: 'rgba(255,255,255,0.5)',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.55)',
  // Cream CTA pill — Sign Up / Log In / Continue buttons on the gradient
  ctaBg: '#F4EEDF',
  ctaText: '#2E2158',
};

export const GRADIENT = {
  top: '#59498F',
  bottom: '#221A47',
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
