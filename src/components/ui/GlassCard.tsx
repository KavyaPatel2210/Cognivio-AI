import React from 'react';
import {
  View,
  ViewStyle,
  StyleSheet,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  gradient?: boolean;
  intensity?: number;
  borderColor?: string;
  padding?: number;
  glowColor?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  gradient = false,
  intensity = 20,
  borderColor,
  padding = 20,
  glowColor,
}) => {
  const { colors, isDark } = useTheme();

  const containerStyle: ViewStyle = {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: borderColor || colors.border,
    ...(glowColor && {
      shadowColor: glowColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 12,
      elevation: 10,
    }),
    ...style,
  };

  if (Platform.OS === 'ios') {
    return (
      <View style={containerStyle}>
        <BlurView intensity={intensity} style={StyleSheet.absoluteFillObject} tint={isDark ? 'dark' : 'light'} />
        {gradient ? (
          <LinearGradient
            colors={isDark ? colors.gradients.card : colors.gradients.cardLight}
            style={{ padding }}
          >
            {children}
          </LinearGradient>
        ) : (
          <View style={{ padding, backgroundColor: isDark ? 'rgba(19, 19, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)' }}>
            {children}
          </View>
        )}
      </View>
    );
  }

  // Android — use gradient overlay
  return (
    <View style={containerStyle}>
      {gradient ? (
        <LinearGradient
          colors={isDark ? ['rgba(19,19,42,0.95)', 'rgba(15,15,30,0.95)'] : ['rgba(255,255,255,0.95)', 'rgba(248,248,255,0.95)']}
          style={{ padding }}
        >
          {children}
        </LinearGradient>
      ) : (
        <View
          style={{
            padding,
            backgroundColor: isDark ? 'rgba(19, 19, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          }}
        >
          {children}
        </View>
      )}
    </View>
  );
};
