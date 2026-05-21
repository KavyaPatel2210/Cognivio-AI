import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';
import { useAuthStore } from '../src/store/authStore';
import { useGamificationStore } from '../src/store/gamificationStore';
import { AchievementToast } from '../src/components/gamification/AchievementToast';
import { View } from 'react-native';

function AppContent() {
  const { isDark, colors } = useTheme();
  const { newlyUnlocked, checkAndUpdateStreak } = useGamificationStore();

  useEffect(() => {
    checkAndUpdateStreak();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="(tabs)" />
        </Stack>
        <AchievementToast achievement={newlyUnlocked} />
      </View>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
