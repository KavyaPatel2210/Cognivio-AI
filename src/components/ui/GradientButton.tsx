import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  loading?: boolean;
  disabled?: boolean;
  colors?: [string, string, ...string[]];
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  style,
  textStyle,
  loading = false,
  disabled = false,
  colors: customColors,
  size = 'md',
  variant = 'primary',
  icon,
  fullWidth = true,
}) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const sizeStyles = {
    sm: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, fontSize: 14 },
    md: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 16, fontSize: 16 },
    lg: { paddingVertical: 18, paddingHorizontal: 32, borderRadius: 18, fontSize: 18 },
  };

  const s = sizeStyles[size];
  const gradColors = customColors || colors.gradients.primary;

  if (variant === 'outline') {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }], width: fullWidth ? '100%' : undefined }}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          style={[
            {
              paddingVertical: s.paddingVertical,
              paddingHorizontal: s.paddingHorizontal,
              borderRadius: s.borderRadius,
              borderWidth: 1.5,
              borderColor: colors.primary,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
              opacity: disabled ? 0.5 : 1,
            },
            style,
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              {icon}
              <Text style={[{ color: colors.primary, fontSize: s.fontSize, fontWeight: '600' }, textStyle]}>
                {title}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if (variant === 'ghost') {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }], width: fullWidth ? '100%' : undefined }}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          style={[
            {
              paddingVertical: s.paddingVertical,
              paddingHorizontal: s.paddingHorizontal,
              borderRadius: s.borderRadius,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
              opacity: disabled ? 0.5 : 1,
            },
            style,
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              {icon}
              <Text style={[{ color: colors.textSecondary, fontSize: s.fontSize, fontWeight: '500' }, textStyle]}>
                {title}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        borderRadius: s.borderRadius,
        overflow: 'hidden',
        width: fullWidth ? '100%' : undefined,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: disabled ? 0 : 0.4,
        shadowRadius: 12,
        elevation: disabled ? 0 : 6,
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
      >
        <LinearGradient
          colors={gradColors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingVertical: s.paddingVertical,
            paddingHorizontal: s.paddingHorizontal,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              {icon}
              <Text style={[{ color: '#fff', fontSize: s.fontSize, fontWeight: '700', letterSpacing: 0.3 }, textStyle]}>
                {title}
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};
