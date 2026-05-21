import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, Switch, Platform, Animated, Modal, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../../src/theme/ThemeContext';
import { useAuthStore } from '../../../src/store/authStore';
import { useGamificationStore, ACHIEVEMENTS } from '../../../src/store/gamificationStore';
import { useNotesStore } from '../../../src/store/notesStore';
import { useFlashcardStore } from '../../../src/store/flashcardStore';
import { useQuizStore } from '../../../src/store/quizStore';
import { GlassCard } from '../../../src/components/ui/GlassCard';
import { GradientButton } from '../../../src/components/ui/GradientButton';
import { Colors } from '../../../src/theme/colors';
import { api } from '../../../src/services/apiClient';

function AchievementBadge({ achievement, unlocked }: { achievement: typeof ACHIEVEMENTS[0]; unlocked: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{
      width: 80, alignItems: 'center', opacity: unlocked ? 1 : 0.35,
    }}>
      <View style={{
        width: 60, height: 60, borderRadius: 30,
        backgroundColor: unlocked ? `${Colors.primary}20` : colors.border,
        borderWidth: 2, borderColor: unlocked ? Colors.primary : colors.border,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: unlocked ? Colors.primary : 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: unlocked ? 0.5 : 0,
        shadowRadius: 10,
        elevation: unlocked ? 5 : 0,
      }}>
        <Text style={{ fontSize: 26 }}>{achievement.icon}</Text>
      </View>
      <Text style={{ color: unlocked ? colors.textPrimary : colors.textMuted, fontSize: 10, textAlign: 'center', marginTop: 4, fontWeight: '600' }}>
        {achievement.title}
      </Text>
      {unlocked && (
        <Text style={{ color: Colors.xp, fontSize: 9, fontWeight: '700' }}>+{achievement.xpReward} XP</Text>
      )}
    </View>
  );
}

export default function ProfileScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, logout, updateUser } = useAuthStore();
  const { xp, level, streak, unlockedAchievements: rawUnlockedAchievements } = useGamificationStore();
  const unlockedAchievements = rawUnlockedAchievements || [];
  const { notes } = useNotesStore();
  const { decks } = useFlashcardStore();
  const { quizzes } = useQuizStore();

  const [showAbout, setShowAbout] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(user?.rating || 5);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  useEffect(() => {
    if (user?.rating !== undefined && user?.rating !== null) {
      setRating(user.rating);
    }
  }, [user?.rating]);

  const handleRatingSubmit = async () => {
    setIsSubmittingRating(true);
    try {
      await api.post('/auth/rate', { rating });
      updateUser({ rating });
      Alert.alert('Thank you!', 'Your rating has been submitted successfully.');
      setShowRating(false);
    } catch (err: any) {
      console.error('Failed to submit rating:', err);
      Alert.alert('Error', 'Failed to submit rating. Please try again.');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/onboarding');
        },
      },
    ]);
  };

  const completedQuizzes = quizzes.filter((q) => q.completedAt);
  const avgAccuracy = completedQuizzes.length
    ? Math.round(completedQuizzes.reduce((s, q) => s + (q.accuracy || 0), 0) / completedQuizzes.length)
    : 0;

  const unlockedCount = unlockedAchievements.length;
  const totalAchievements = ACHIEVEMENTS.length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <LinearGradient
          colors={isDark ? ['#0A0A1F', '#0F0F2E', '#08080F'] : ['#E8E8FF', '#F0F0FF', '#F8F8FF']}
          style={{ paddingTop: Platform.OS === 'ios' ? 60 : 44, paddingBottom: 40, paddingHorizontal: 24, alignItems: 'center' }}
        >
          {/* Avatar */}
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={{
              width: 90, height: 90, borderRadius: 45,
              alignItems: 'center', justifyContent: 'center',
              shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.5, shadowRadius: 16, elevation: 10,
              marginBottom: 16,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 36, fontWeight: '800' }}>
              {(user?.name || 'U')[0].toUpperCase()}
            </Text>
          </LinearGradient>

          <Text style={{ color: colors.textPrimary, fontSize: 26, fontWeight: '800' }}>
            {user?.name || 'Learner'}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 4 }}>
            {user?.email}
          </Text>

          {/* Level badge */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={{ borderRadius: 12, paddingHorizontal: 16, paddingVertical: 6 }}
            >
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Level {level} 🎓</Text>
            </LinearGradient>
            <View style={{ backgroundColor: `${Colors.xp}20`, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1, borderColor: `${Colors.xp}40` }}>
              <Text style={{ color: Colors.xp, fontWeight: '800', fontSize: 15 }}>{xp} XP ⚡</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={{ padding: 20 }}>
          {/* Stats */}
          <GlassCard gradient style={{ marginBottom: 20 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 16 }}>
              📊 Learning Stats
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              {[
                { value: notes.length, label: 'Notes', color: colors.primary, icon: '📝' },
                { value: decks.length, label: 'Decks', color: colors.secondary, icon: '🃏' },
                { value: completedQuizzes.length, label: 'Quizzes', color: colors.accent, icon: '🎯' },
                { value: `${streak}🔥`, label: 'Streak', color: Colors.xp, icon: '' },
              ].map((stat, i) => (
                <View key={i} style={{ alignItems: 'center' }}>
                  <Text style={{ color: stat.color, fontSize: 24, fontWeight: '800' }}>{stat.value}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>{stat.label}</Text>
                </View>
              ))}
            </View>
            {completedQuizzes.length > 0 && (
              <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Quiz Accuracy</Text>
                  <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '700' }}>{avgAccuracy}%</Text>
                </View>
              </View>
            )}
          </GlassCard>

          {/* Achievements */}
          <GlassCard gradient style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '700' }}>🏆 Achievements</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>{unlockedCount}/{totalAchievements}</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-start' }}>
              {ACHIEVEMENTS.map((ach) => (
                <AchievementBadge
                  key={ach.id}
                  achievement={ach}
                  unlocked={unlockedAchievements.includes(ach.id)}
                />
              ))}
            </View>
          </GlassCard>

          {/* Settings */}
          <GlassCard gradient style={{ marginBottom: 20 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 16 }}>
              ⚙️ Settings
            </Text>

            {/* Dark mode toggle */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${colors.primary}20`, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={colors.primary} />
                </View>
                <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '500' }}>
                  {isDark ? 'Dark Mode' : 'Light Mode'}
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: `${colors.primary}60` }}
                thumbColor={isDark ? colors.primary : '#fff'}
              />
            </View>

            {/* App info */}
            {[
              { icon: 'information-circle-outline', label: 'About Cognivio AI', color: colors.secondary, onPress: () => setShowAbout(true) },
              { icon: 'shield-checkmark-outline', label: 'Privacy Policy', color: colors.secondary, onPress: () => setShowPolicy(true) },
              { icon: 'star-outline', label: 'Rate the App', color: Colors.xp, onPress: () => setShowRating(true) },
            ].map((item, i) => (
              <TouchableOpacity
                key={i}
                onPress={item.onPress}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: colors.border }}
              >
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${item.color}20`, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={item.icon as any} size={18} color={item.color} />
                </View>
                <Text style={{ flex: 1, color: colors.textPrimary, fontSize: 15, fontWeight: '500' }}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </GlassCard>

          {/* Logout */}
          <GradientButton
            title="Sign Out"
            onPress={handleLogout}
            variant="outline"
            colors={[colors.error, colors.error] as [string, string]}
          />

          <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 20 }}>
            Cognivio AI v1.0.0 · Made with ❤️
          </Text>
        </View>
      </ScrollView>

      {/* About Modal */}
      <Modal
        visible={showAbout}
        transparent={true}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowAbout(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.overlay,
          padding: 20,
        }}>
          <View style={{
            width: '100%',
            maxWidth: 340,
            backgroundColor: colors.surface,
            borderRadius: 24,
            padding: 24,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.25,
            shadowRadius: 16,
            elevation: 10,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: colors.textPrimary }}>
                About Cognivio AI 🎓
              </Text>
              <TouchableOpacity onPress={() => setShowAbout(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginBottom: 12 }}>
                Cognivio AI is your ultimate study companion, designed to simplify complex subjects using cutting-edge AI.
              </Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginBottom: 12 }}>
                Whether you need to summarize long notes, practice with smart flashcards, or test yourself with interactive quizzes, Cognivio AI adapts to your learning pace.
              </Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 22 }}>
                Stay motivated by earning daily streak multipliers and leveling up as you accumulate XP!
              </Text>
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowAbout(false)}
              style={{
                marginTop: 24,
                backgroundColor: colors.primary,
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        visible={showPolicy}
        transparent={true}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowPolicy(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.overlay,
          padding: 20,
        }}>
          <View style={{
            width: '100%',
            maxWidth: 340,
            backgroundColor: colors.surface,
            borderRadius: 24,
            padding: 24,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.25,
            shadowRadius: 16,
            elevation: 10,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: colors.textPrimary }}>
                Privacy Policy 🛡️
              </Text>
              <TouchableOpacity onPress={() => setShowPolicy(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginBottom: 12 }}>
                We are committed to protecting your personal data. Cognivio AI collects registration data (name and email) to secure your account.
              </Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginBottom: 12 }}>
                Your study progress, generated notes, quiz logs, and achievement stats are kept strictly confidential and used solely to personalize your dashboard.
              </Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 22 }}>
                We store your data securely in MongoDB and do not sell or share it with third parties.
              </Text>
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowPolicy(false)}
              style={{
                marginTop: 24,
                backgroundColor: colors.primary,
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Rate the App Modal */}
      <Modal
        visible={showRating}
        transparent={true}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          if (!isSubmittingRating) setShowRating(false);
        }}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.overlay,
          padding: 20,
        }}>
          <View style={{
            width: '100%',
            maxWidth: 340,
            backgroundColor: colors.surface,
            borderRadius: 24,
            padding: 24,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.25,
            shadowRadius: 16,
            elevation: 10,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: colors.textPrimary }}>
                Rate the App ⭐
              </Text>
              <TouchableOpacity
                onPress={() => setShowRating(false)}
                disabled={isSubmittingRating}
              >
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            
            <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 20, lineHeight: 22 }}>
              How do you like Cognivio AI? Please give us a rating:
            </Text>

            {/* Stars */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
              {[1, 2, 3, 4, 5].map((starVal) => (
                <TouchableOpacity
                  key={starVal}
                  onPress={() => setRating(starVal)}
                  disabled={isSubmittingRating}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={starVal <= rating ? 'star' : 'star-outline'}
                    size={38}
                    color={starVal <= rating ? Colors.xp : colors.textMuted}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowRating(false)}
                disabled={isSubmittingRating}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600', fontSize: 15 }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleRatingSubmit}
                disabled={isSubmittingRating}
                style={{
                  flex: 1,
                  backgroundColor: colors.primary,
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {isSubmittingRating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
