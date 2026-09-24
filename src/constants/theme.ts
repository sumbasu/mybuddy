export const COLORS = {
  primary: '#6C5CA6',      // mid violet — accent tints, chips, general CTAs
  primaryLight: '#8779C2',
  primaryDark: '#241B4D',
  secondary: '#6C5CA6',
  accent: '#C8DB2E',        // Go Pro / highlight lime (Sweatbud)
  // Brand palette — headers, main buttons, links, active tab
  brandPurple: '#3F2F86',
  brandPurplePressed: '#2A1F5E',
  brandPurpleLight: '#52449A', // bell button on the Home header
  locationGreen: '#4CAF72', // location text on dark screens
  success: '#06D6A0',
  warning: '#FFD60A',
  error: '#EF233C',
  background: 'transparent', // GradientBackground (radial, from Figma) shows through
  surface: 'rgba(255,255,255,0.09)',
  surfaceSecondary: 'rgba(255,255,255,0.16)',
  border: 'rgba(255,255,255,0.22)',
  textPrimary: '#F0EDE4',
  textSecondary: 'rgba(240,237,228,0.72)',
  textMuted: 'rgba(240,237,228,0.5)',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.55)',
  // Cream CTA pill — Sign Up / Log In / Continue buttons on the gradient
  ctaBg: '#F0EDE4',
  ctaText: '#3F2F86',
};

// Poppins, loaded via @expo-google-fonts/poppins in App.tsx.
export const FONTS = {
  light: 'Poppins_300Light',
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  extraBold: 'Poppins_800ExtraBold',
  // Display face used for screen-title eyebrows (e.g. "PROFILE")
  display: 'Poppins_800ExtraBold',
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
