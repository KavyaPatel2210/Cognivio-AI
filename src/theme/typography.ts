import { TextStyle } from 'react-native';

export const FontFamily = {
  regular: 'System',
  medium: 'System',
  semiBold: 'System',
  bold: 'System',
  extraBold: 'System',
  mono: 'monospace',
};

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 19,
  xl: 22,
  '2xl': 26,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};

export const LineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
};

export const FontWeight = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semiBold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
  extraBold: '800' as TextStyle['fontWeight'],
};

export const Typography = {
  // Headings
  h1: {
    fontSize: FontSize['4xl'],
    fontWeight: FontWeight.extraBold,
    lineHeight: FontSize['4xl'] * LineHeight.tight,
  } as TextStyle,
  h2: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.bold,
    lineHeight: FontSize['3xl'] * LineHeight.tight,
  } as TextStyle,
  h3: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
    lineHeight: FontSize['2xl'] * LineHeight.normal,
  } as TextStyle,
  h4: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semiBold,
    lineHeight: FontSize.xl * LineHeight.normal,
  } as TextStyle,

  // Body
  bodyLarge: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.md * LineHeight.relaxed,
  } as TextStyle,
  body: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.base * LineHeight.relaxed,
  } as TextStyle,
  bodySmall: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.sm * LineHeight.relaxed,
  } as TextStyle,

  // Labels
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    letterSpacing: 0.5,
  } as TextStyle,
  labelSmall: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semiBold,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  } as TextStyle,

  // Special
  caption: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.regular,
  } as TextStyle,
  button: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semiBold,
    letterSpacing: 0.3,
  } as TextStyle,
  buttonLarge: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.3,
  } as TextStyle,
  mono: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.mono,
  } as TextStyle,
};
