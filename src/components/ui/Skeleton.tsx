import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}) => {
  const { isDark } = useTheme();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: isDark ? '#252542' : '#E0E0F0',
          opacity,
        },
        style,
      ]}
    />
  );
};

export const CardSkeleton: React.FC = () => {
  const { colors } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Skeleton width="60%" height={20} style={{ marginBottom: 12 }} />
      <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
      <Skeleton width="85%" height={14} style={{ marginBottom: 8 }} />
      <Skeleton width="70%" height={14} />
    </View>
  );
};

export const NoteCardSkeleton: React.FC = () => (
  <CardSkeleton />
);

export const FlashcardSkeleton: React.FC = () => {
  const { colors } = useTheme();
  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 24, padding: 32, height: 240, alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
      <Skeleton width="80%" height={22} style={{ marginBottom: 16 }} />
      <Skeleton width="60%" height={18} style={{ marginBottom: 8 }} />
      <Skeleton width="40%" height={14} />
    </View>
  );
};
