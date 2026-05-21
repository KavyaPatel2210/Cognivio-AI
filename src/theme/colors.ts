// Design system tokens for Cognivio AI

export const Colors = {
  // Primary palette — electric indigo/violet
  primary: '#6C63FF',
  primaryLight: '#8B84FF',
  primaryDark: '#4A42D6',
  primaryGlow: 'rgba(108, 99, 255, 0.4)',

  // Secondary — cyan accent
  secondary: '#00D4FF',
  secondaryLight: '#4DE0FF',
  secondaryDark: '#00A8CC',
  secondaryGlow: 'rgba(0, 212, 255, 0.3)',

  // Accent — hot pink
  accent: '#FF6584',
  accentLight: '#FF8FA3',
  accentGlow: 'rgba(255, 101, 132, 0.3)',

  // Success / XP green
  success: '#00D87F',
  successGlow: 'rgba(0, 216, 127, 0.3)',

  // Warning / Medium difficulty
  warning: '#FFB700',
  warningGlow: 'rgba(255, 183, 0, 0.3)',

  // Error / Hard difficulty
  error: '#FF4757',
  errorGlow: 'rgba(255, 71, 87, 0.3)',

  // Dark backgrounds
  dark: {
    bg: '#08080F',
    surface: '#0F0F1E',
    card: '#13132A',
    cardHover: '#1A1A35',
    border: '#252542',
    borderLight: '#2F2F55',
    overlay: 'rgba(8, 8, 15, 0.85)',
  },

  // Light backgrounds
  light: {
    bg: '#F0F0FF',
    surface: '#FFFFFF',
    card: '#F8F8FF',
    cardHover: '#EBEBFF',
    border: '#E0E0F0',
    borderLight: '#CCCCEE',
    overlay: 'rgba(240, 240, 255, 0.85)',
  },

  // Text
  text: {
    primary: '#FFFFFF',
    secondary: '#B0B0D0',
    muted: '#6060A0',
    inverse: '#08080F',
    inverseSecondary: '#404060',
  },

  // Gradients (arrays for LinearGradient)
  gradients: {
    primary: ['#6C63FF', '#4A42D6'] as [string, string],
    primaryGlow: ['rgba(108, 99, 255, 0.8)', 'rgba(74, 66, 214, 0.8)'] as [string, string],
    hero: ['#0A0A1F', '#0F0F2E', '#0A0A1F'] as [string, string, string],
    card: ['rgba(108, 99, 255, 0.15)', 'rgba(0, 212, 255, 0.05)'] as [string, string],
    cardLight: ['rgba(108, 99, 255, 0.08)', 'rgba(0, 212, 255, 0.03)'] as [string, string],
    success: ['#00D87F', '#00A86B'] as [string, string],
    warning: ['#FFB700', '#FF9500'] as [string, string],
    error: ['#FF4757', '#CC3344'] as [string, string],
    cyber: ['#6C63FF', '#00D4FF'] as [string, string],
    sunset: ['#FF6584', '#FFB700'] as [string, string],
    dark: ['#13132A', '#0F0F1E'] as [string, string],
  },

  // Gamification
  xp: '#FFD700',
  xpGlow: 'rgba(255, 215, 0, 0.4)',
  badge: {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#00D4FF',
  },

  // Difficulty
  difficulty: {
    easy: '#00D87F',
    medium: '#FFB700',
    hard: '#FF4757',
  },

  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
};

export type ColorScheme = 'dark' | 'light';

export const getColors = (scheme: ColorScheme) => ({
  ...Colors,
  bg: scheme === 'dark' ? Colors.dark.bg : Colors.light.bg,
  surface: scheme === 'dark' ? Colors.dark.surface : Colors.light.surface,
  card: scheme === 'dark' ? Colors.dark.card : Colors.light.card,
  cardHover: scheme === 'dark' ? Colors.dark.cardHover : Colors.light.cardHover,
  border: scheme === 'dark' ? Colors.dark.border : Colors.light.border,
  borderLight: scheme === 'dark' ? Colors.dark.borderLight : Colors.light.borderLight,
  overlay: scheme === 'dark' ? Colors.dark.overlay : Colors.light.overlay,
  textPrimary: scheme === 'dark' ? Colors.text.primary : Colors.text.inverse,
  textSecondary: scheme === 'dark' ? Colors.text.secondary : Colors.text.inverseSecondary,
  textMuted: scheme === 'dark' ? Colors.text.muted : '#8080A0',
});
