import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Modal, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { Achievement } from '../../store/gamificationStore';
import { useGamificationStore } from '../../store/gamificationStore';

interface AchievementToastProps {
  achievement: Achievement | null;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({ achievement }) => {
  const { colors } = useTheme();
  const { dismissNewAchievement } = useGamificationStore();
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (achievement) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 8 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideAnim, { toValue: -200, duration: 400, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]).start(() => dismissNewAchievement());
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [achievement]);

  if (!achievement) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        zIndex: 9999,
        opacity: opacityAnim,
        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
      }}
    >
      <LinearGradient
        colors={['rgba(108,99,255,0.98)', 'rgba(0,212,255,0.98)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          borderRadius: 18,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.5,
          shadowRadius: 16,
          elevation: 12,
        }}
      >
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: 'rgba(255,255,255,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Text style={{ fontSize: 28 }}>{achievement.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>
            🏆 Achievement Unlocked!
          </Text>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 2 }}>
            {achievement.title}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 }}>
            {achievement.description}
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: '#FFD700', fontSize: 11, fontWeight: '700' }}>+{achievement.xpReward}</Text>
          <Text style={{ color: '#FFD700', fontSize: 11, fontWeight: '700' }}>XP</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

interface XPBadgeProps {
  amount: number;
  visible: boolean;
  onHide: () => void;
}

export const XPBadge: React.FC<XPBadgeProps> = ({ amount, visible, onHide }) => {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: -60, duration: 1200, useNativeDriver: true }),
      ]).start(() => {
        Animated.timing(opacityAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(onHide);
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        right: 20,
        opacity: opacityAnim,
        transform: [{ translateY: floatAnim }],
        zIndex: 1000,
      }}
    >
      <View style={{ backgroundColor: '#FFD700', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
        <Text style={{ color: '#000', fontWeight: '800', fontSize: 16 }}>+{amount} XP ⚡</Text>
      </View>
    </Animated.View>
  );
};
