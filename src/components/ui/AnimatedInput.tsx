import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  Animated,
  TouchableOpacity,
  ViewStyle,
  KeyboardTypeOptions,
  NativeSyntheticEvent,
  TextInputFocusEventData,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface AnimatedInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  error?: string;
  style?: ViewStyle;
  multiline?: boolean;
  numberOfLines?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  editable?: boolean;
  maxLength?: number;
}

export const AnimatedInput: React.FC<AnimatedInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType,
  error,
  style,
  multiline = false,
  numberOfLines,
  autoCapitalize = 'sentences',
  rightIcon,
  onRightIconPress,
  editable = true,
  maxLength,
}) => {
  const { colors, isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    Animated.timing(borderAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const labelTop = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [14, -8] });
  const labelSize = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 12] });
  const labelColor = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.textMuted, error ? colors.error : colors.primary],
  });
  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? colors.error : colors.border, error ? colors.error : colors.primary],
  });

  return (
    <View style={[{ marginBottom: 20 }, style]}>
      <Animated.View
        style={{
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor,
          backgroundColor: isDark ? 'rgba(19,19,42,0.8)' : 'rgba(255,255,255,0.9)',
          paddingHorizontal: 16,
          paddingTop: 18,
          paddingBottom: multiline ? 12 : 0,
          minHeight: multiline ? 100 : 56,
          justifyContent: multiline ? 'flex-start' : 'center',
          ...(isFocused && {
            shadowColor: error ? colors.error : colors.primary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }),
        }}
      >
        <Animated.Text
          style={{
            position: 'absolute',
            left: 16,
            top: labelTop,
            fontSize: labelSize,
            color: labelColor,
            fontWeight: '500',
            backgroundColor: isDark ? 'rgba(15,15,30,0.9)' : 'rgba(255,255,255,0.9)',
            paddingHorizontal: 4,
          }}
        >
          {label}
        </Animated.Text>
        <View style={{ flexDirection: 'row', alignItems: multiline ? 'flex-start' : 'center' }}>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={isFocused ? placeholder : ''}
            placeholderTextColor={colors.textMuted}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            multiline={multiline}
            numberOfLines={numberOfLines}
            editable={editable}
            maxLength={maxLength}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={{
              flex: 1,
              color: colors.textPrimary,
              fontSize: 15,
              paddingTop: multiline ? 4 : 0,
              paddingBottom: multiline ? 4 : 10,
              textAlignVertical: multiline ? 'top' : 'center',
              minHeight: multiline ? 80 : undefined,
            }}
          />
          {rightIcon && (
            <TouchableOpacity onPress={onRightIconPress} style={{ padding: 4, marginBottom: 10 }}>
              {rightIcon}
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
      {error ? (
        <Text style={{ color: colors.error, fontSize: 12, marginTop: 4, marginLeft: 4 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
};
