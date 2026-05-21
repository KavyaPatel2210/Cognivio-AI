import React from 'react';
import { Tabs } from 'expo-router';
import { View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { BlurView } from 'expo-blur';

function TabBarIcon({ name, color, focused }: { name: any; color: string; focused: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      width: 48,
      height: 36,
      borderRadius: 12,
      backgroundColor: focused ? `${colors.primary}20` : 'transparent',
    }}>
      <Ionicons name={name} size={24} color={color} />
    </View>
  );
}

export default function TabsLayout() {
  const { colors, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 4,
        },
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: isDark ? 'rgba(15,15,30,0.95)' : 'rgba(255,255,255,0.95)',
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          elevation: 0,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 16,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard/index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="notes/index"
        options={{
          title: 'Notes',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name={focused ? 'document-text' : 'document-text-outline'} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="flashcards/index"
        options={{
          title: 'Flashcards',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name={focused ? 'layers' : 'layers-outline'} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="quiz/index"
        options={{
          title: 'Quiz',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name={focused ? 'help-circle' : 'help-circle-outline'} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name={focused ? 'person' : 'person-outline'} color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
