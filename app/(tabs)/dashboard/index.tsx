import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../../src/theme/ThemeContext';
import { useAuthStore } from '../../../src/store/authStore';
import { useGamificationStore, getXPInCurrentLevel, getXPRequiredForLevelIncrement } from '../../../src/store/gamificationStore';
import { useNotesStore } from '../../../src/store/notesStore';
import { useFlashcardStore } from '../../../src/store/flashcardStore';
import { useQuizStore } from '../../../src/store/quizStore';
import { GlassCard } from '../../../src/components/ui/GlassCard';
import { Colors } from '../../../src/theme/colors';

const { width } = Dimensions.get('window');

function XPProgressBar({ xp, level }: { xp: number; level: number }) {
  const { colors } = useTheme();
  
  // Calculate dynamic XP values for current level and next level target
  const xpInLevel = getXPInCurrentLevel(xp);
  const xpRequiredForNext = getXPRequiredForLevelIncrement(level);
  
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: xpRequiredForNext > 0 ? xpInLevel / xpRequiredForNext : 0,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [xpInLevel, xpRequiredForNext]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Level {level}</Text>
        <Text style={{ color: Colors.xp, fontWeight: '700', fontSize: 13 }}>
          {xpInLevel}/{xpRequiredForNext} XP
        </Text>
      </View>
      <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' }}>
        <Animated.View style={{ width: progressWidth }}>
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: '100%', borderRadius: 4 }}
          />
        </Animated.View>
      </View>
      <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 4 }}>
        {xpRequiredForNext - xpInLevel} XP to Level {level + 1}
      </Text>
    </View>
  );
}

function StatCard({ icon, value, label, color, onPress }: any) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1, useNativeDriver: true, tension: 60, friction: 8, delay: 200
    }).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], flex: 1 }}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <LinearGradient
          colors={[`${color}20`, `${color}08`]}
          style={{
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: `${color}30`,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 28 }}>{icon}</Text>
          <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: '800', marginTop: 4 }}>
            {value}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 2 }}>
            {label}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

function StreakCalendar({ streak }: { streak: number }) {
  const { colors } = useTheme();
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const today = new Date().getDay();
  const adjustedToday = today === 0 ? 6 : today - 1;

  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {days.map((day, i) => {
          const isActive = i <= adjustedToday && streak > (adjustedToday - i);
          const isToday = i === adjustedToday;
          return (
            <View key={i} style={{ alignItems: 'center', gap: 4 }}>
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>{day}</Text>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isActive ? `${Colors.primary}30` : colors.border,
                  borderWidth: isToday ? 2 : 0,
                  borderColor: Colors.primary,
                }}
              >
                <Text style={{ fontSize: 14 }}>{isActive ? '🔥' : ''}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuthStore();
  const { xp, level, streak } = useGamificationStore();
  const { notes } = useNotesStore();
  const { decks } = useFlashcardStore();
  const { quizzes } = useQuizStore();

  const headerAnim = useRef(new Animated.Value(-50)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      Animated.timing(headerOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const completedQuizzes = quizzes.filter((q) => q.completedAt);
  const avgAccuracy = completedQuizzes.length
    ? Math.round(completedQuizzes.reduce((s, q) => s + (q.accuracy || 0), 0) / completedQuizzes.length)
    : 0;

  const quickActions = [
    { icon: '📝', label: 'New Note', color: colors.primary, onPress: () => router.push('/(tabs)/notes') },
    { icon: '🃏', label: 'Flashcards', color: colors.secondary, onPress: () => router.push('/(tabs)/flashcards') },
    { icon: '🎯', label: 'Take Quiz', color: colors.accent, onPress: () => router.push('/(tabs)/quiz') },
    { icon: '👤', label: 'Profile', color: Colors.xp, onPress: () => router.push('/(tabs)/profile') },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Hero Header */}
        <LinearGradient
          colors={isDark ? ['#0A0A1F', '#0F0F2E', '#08080F'] : ['#E8E8FF', '#F0F0FF', '#F8F8FF']}
          style={{ paddingTop: Platform.OS === 'ios' ? 60 : 44, paddingBottom: 40, paddingHorizontal: 24 }}
        >
          {/* Top row */}
          <Animated.View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 32,
              opacity: headerOpacity,
              transform: [{ translateY: headerAnim }],
            }}
          >
            <View>
              <Text style={{ color: colors.textMuted, fontSize: 14 }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
              <Text style={{ color: colors.textPrimary, fontSize: 26, fontWeight: '800', marginTop: 2 }}>
                Hey, {user?.name?.split(' ')[0] || 'Learner'}! 👋
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>
                  {(user?.name || 'U')[0].toUpperCase()}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Hero XP Card */}
          <GlassCard gradient glowColor={`${colors.primary}60`}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View>
                <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Total XP
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                  <Text style={{ color: Colors.xp, fontSize: 36, fontWeight: '800' }}>{xp}</Text>
                  <Text style={{ color: Colors.xp, fontSize: 16 }}>⚡</Text>
                </View>
              </View>

              <View style={{ alignItems: 'center' }}>
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.5,
                    shadowRadius: 12,
                    elevation: 8,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>L{level}</Text>
                </LinearGradient>
                <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 4 }}>Level</Text>
              </View>
            </View>

            <XPProgressBar xp={xp} level={level} />

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 8 }}>
              <View style={{ backgroundColor: `${Colors.primary}20`, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: Colors.primary, fontSize: 13, fontWeight: '700' }}>
                  🔥 {streak} day streak
                </Text>
              </View>
              {streak >= 3 && (
                <View style={{ backgroundColor: `${Colors.success}20`, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ color: Colors.success, fontSize: 13, fontWeight: '700' }}>
                    🏆 On Fire!
                  </Text>
                </View>
              )}
            </View>
          </GlassCard>
        </LinearGradient>

        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          {/* Stats Grid */}
          <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '700', marginBottom: 16 }}>
            Your Progress
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
            <StatCard icon="📝" value={notes.length} label="Notes" color={colors.primary} onPress={() => router.push('/(tabs)/notes')} />
            <StatCard icon="🃏" value={decks.length} label="Decks" color={colors.secondary} onPress={() => router.push('/(tabs)/flashcards')} />
            <StatCard icon="🎯" value={completedQuizzes.length} label="Quizzes" color={colors.accent} onPress={() => router.push('/(tabs)/quiz')} />
          </View>

          {/* Streak Calendar */}
          <GlassCard gradient style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>
                🔥 Study Streak
              </Text>
              <Text style={{ color: Colors.primary, fontSize: 22, fontWeight: '800' }}>
                {streak} days
              </Text>
            </View>
            <StreakCalendar streak={streak} />
          </GlassCard>

          {/* Accuracy Card */}
          {completedQuizzes.length > 0 && (
            <GlassCard gradient style={{ marginBottom: 24 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 16 }}>
                📊 Quiz Performance
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: colors.primary, fontSize: 32, fontWeight: '800' }}>
                    {avgAccuracy}%
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>Avg Accuracy</Text>
                </View>
                <View style={{ width: 1, backgroundColor: colors.border }} />
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: colors.secondary, fontSize: 32, fontWeight: '800' }}>
                    {completedQuizzes.length}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>Quizzes Done</Text>
                </View>
                <View style={{ width: 1, backgroundColor: colors.border }} />
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: Colors.xp, fontSize: 32, fontWeight: '800' }}>
                    {xp}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>Total XP</Text>
                </View>
              </View>
            </GlassCard>
          )}

          {/* Quick Actions */}
          <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '700', marginBottom: 16 }}>
            Quick Actions
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {quickActions.map((action, i) => (
              <TouchableOpacity
                key={i}
                onPress={action.onPress}
                style={{
                  width: (width - 52) / 2,
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${action.color}20`, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 22 }}>{action.icon}</Text>
                </View>
                <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '600' }}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
