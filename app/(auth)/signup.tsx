import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
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

export default function SignupScreen() {
  const { colors, isDark } = useTheme();
  const { signup, isLoading, error, clearError } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const validate = () => {
    let valid = true;
    setNameError(''); setEmailError(''); setPasswordError(''); setConfirmError('');

    if (!name.trim()) { setNameError('Name is required'); valid = false; }
    else if (name.trim().length < 2) { setNameError('Name must be at least 2 characters'); valid = false; }

    if (!email.trim()) { setEmailError('Email is required'); valid = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError('Enter a valid email address'); valid = false; }

    if (!password) { setPasswordError('Password is required'); valid = false; }
    else if (password.length < 6) { setPasswordError('Password must be at least 6 characters'); valid = false; }

    if (!confirmPassword) { setConfirmError('Please confirm your password'); valid = false; }
    else if (password !== confirmPassword) { setConfirmError('Passwords do not match'); valid = false; }

    return valid;
  };

  const handleSignup = async () => {
    clearError();
    if (!validate()) return;
    try {
      await signup(name.trim(), email.trim(), password);
      router.replace('/(tabs)/dashboard');
    } catch {}
  };

  return (
    <LinearGradient
      colors={isDark ? ['#08080F', '#0F0F1E', '#08080F'] : ['#F0F0FF', '#E8E8FF', '#F0F0FF']}
      style={{ flex: 1 }}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={{ position: 'absolute', top: -80, right: -80, width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(0,212,255,0.1)' }} />
      <View style={{ position: 'absolute', bottom: -60, left: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(108,99,255,0.12)' }} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginBottom: 32, width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={{ marginBottom: 36 }}>
            <Text style={{ fontSize: 14, color: colors.secondary, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
              Create Account
            </Text>
            <Text style={{ fontSize: 36, fontWeight: '800', color: colors.textPrimary, lineHeight: 42 }}>
              Start Your{'\n'}
              <Text style={{ color: colors.secondary }}>AI Learning</Text> Journey
            </Text>
          </View>

          <GlassCard gradient>
            {error ? (
              <View style={{ backgroundColor: `${colors.error}20`, borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: `${colors.error}40` }}>
                <Text style={{ color: colors.error, fontSize: 14 }}>⚠️ {error}</Text>
              </View>
            ) : null}

            <AnimatedInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="Your display name"
              autoCapitalize="words"
              error={nameError}
            />

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
              rightIcon={<Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.textMuted} />}
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            <AnimatedInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              error={confirmError}
            />

            {/* Password strength indicator */}
            {password.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', gap: 4, marginBottom: 4 }}>
                  {[1, 2, 3, 4].map((i) => (
                    <View
                      key={i}
                      style={{
                        flex: 1, height: 4, borderRadius: 2,
                        backgroundColor:
                          i <= (password.length < 6 ? 1 : password.length < 8 ? 2 : password.length < 10 ? 3 : 4)
                            ? (password.length < 6 ? colors.error : password.length < 8 ? colors.warning : password.length < 10 ? colors.secondary : colors.success)
                            : colors.border,
                      }}
                    />
                  ))}
                </View>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>
                  {password.length < 6 ? 'Weak' : password.length < 8 ? 'Fair' : password.length < 10 ? 'Good' : 'Strong'} password
                </Text>
              </View>
            )}

            <GradientButton
              title="Create Account"
              onPress={handleSignup}
              loading={isLoading}
              size="lg"
              colors={[colors.secondary, colors.primary] as [string, string]}
            />
          </GlassCard>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 15 }}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 15 }}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
