import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { useTheme } from '../src/theme/ThemeContext';

export default function Index() {
  const { isAuthenticated, isLoading, loadSession } = useAuthStore();
  const { colors } = useTheme();

  useEffect(() => {
    const init = async () => {
      await loadSession();
    };
    init();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/(tabs)/dashboard');
      } else {
        router.replace('/(auth)/onboarding');
      }
    }
  }, [isAuthenticated, isLoading]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
