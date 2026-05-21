import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { useAuthStore } from '../../src/store/authStore';
import { AnimatedInput } from '../../src/components/ui/AnimatedInput';
import { GradientButton } from '../../src/components/ui/GradientButton';
import { GlassCard } from '../../src/components/ui/GlassCard';

export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validate = () => {
    let valid = true;
    setEmailError('');
    setPasswordError('');

    if (!email.trim()) {
      setEmailError('Email is required');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Enter a valid email address');
      valid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      valid = false;
    }

    return valid;
  };

  const handleLogin = async () => {
    clearError();
    if (!validate()) return;
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)/dashboard');
    } catch {
      // error handled in store
    }
  };

  return (
    <LinearGradient
      colors={isDark ? ['#08080F', '#0F0F1E', '#08080F'] : ['#F0F0FF', '#E8E8FF', '#F0F0FF']}
      style={{ flex: 1 }}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Decorative glow */}
      <View
        style={{
          position: 'absolute',
          top: -100,
          left: -100,
          width: 300,
          height: 300,
          borderRadius: 150,
          backgroundColor: 'rgba(108,99,255,0.15)',
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: 'rgba(0,212,255,0.1)',
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginBottom: 32, width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          {/* Header */}
          <View style={{ marginBottom: 40 }}>
            <Text style={{ fontSize: 14, color: colors.primary, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
              Welcome Back
            </Text>
            <Text style={{ fontSize: 38, fontWeight: '800', color: colors.textPrimary, lineHeight: 44 }}>
              Sign into{'\n'}
              <Text style={{ color: colors.primary }}>Cognivio AI</Text>
            </Text>
            <Text style={{ fontSize: 16, color: colors.textSecondary, marginTop: 12 }}>
              Your AI learning companion awaits you
            </Text>
          </View>

          {/* Form card */}
          <GlassCard gradient>
            {error ? (
              <View style={{ backgroundColor: `${colors.error}20`, borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: `${colors.error}40` }}>
                <Text style={{ color: colors.error, fontSize: 14 }}>⚠️ {error}</Text>
              </View>
            ) : null}

            <AnimatedInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={emailError}
            />

            <AnimatedInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              error={passwordError}
              rightIcon={
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.textMuted}
                />
              }
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: 24 }}>
              <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>
                Forgot password?
              </Text>
            </TouchableOpacity>

            <GradientButton
              title="Sign In"
              onPress={handleLogin}
              loading={isLoading}
              size="lg"
            />
          </GlassCard>

          {/* Sign up link */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 28 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 15 }}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 15 }}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick note about demo */}
          <View style={{ marginTop: 20, backgroundColor: `${colors.secondary}15`, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: `${colors.secondary}30` }}>
            <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center' }}>
              💡 New here? Create an account to start your AI-powered learning journey
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
