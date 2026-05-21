import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  Animated,
  FlatList,
  StyleSheet,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../src/theme/ThemeContext';
import { GradientButton } from '../../src/components/ui/GradientButton';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'AI-Powered\nLearning',
    subtitle: 'Transform your notes into summaries, flashcards, and quizzes using Google Gemini AI',
    icon: '🧠',
    gradient: ['#0A0A1F', '#0F0F35', '#1A0A3F'] as [string, string, string],
    accentColor: '#6C63FF',
    glowColor: 'rgba(108,99,255,0.6)',
  },
  {
    id: '2',
    title: 'Smart\nFlashcards',
    subtitle: 'Generate interactive 3D flashcards from any study material. Swipe, flip, and master concepts',
    icon: '🃏',
    gradient: ['#0A1F0A', '#0A1F2F', '#0A0A2F'] as [string, string, string],
    accentColor: '#00D4FF',
    glowColor: 'rgba(0,212,255,0.5)',
  },
  {
    id: '3',
    title: 'Gamified\nProgress',
    subtitle: 'Earn XP, unlock achievements, maintain streaks. Make studying addictively fun',
    icon: '🏆',
    gradient: ['#1F0A0A', '#2F0A1F', '#1F0A2F'] as [string, string, string],
    accentColor: '#FFB700',
    glowColor: 'rgba(255,183,0,0.5)',
  },
];

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const iconScaleAnim = useRef(new Animated.Value(1)).current;

  const pulseIcon = () => {
    Animated.sequence([
      Animated.spring(iconScaleAnim, { toValue: 1.1, useNativeDriver: true, tension: 100 }),
      Animated.spring(iconScaleAnim, { toValue: 1, useNativeDriver: true, tension: 100 }),
    ]).start();
  };

  React.useEffect(() => {
    const pulse = setInterval(pulseIcon, 2500);
    return () => clearInterval(pulse);
  }, []);

  const goNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      router.push('/(auth)/login');
    }
  };

  const renderSlide = ({ item }: { item: typeof slides[0] }) => (
    <LinearGradient
      colors={item.gradient}
      style={{ width, height, alignItems: 'center', justifyContent: 'center', padding: 32 }}
    >
      {/* Decorative circles */}
      <View style={[StyleSheet.absoluteFillObject, { overflow: 'hidden' }]}>
        <View style={{
          position: 'absolute', top: height * 0.1, right: -width * 0.2,
          width: width * 0.7, height: width * 0.7,
          borderRadius: width * 0.35,
          backgroundColor: item.glowColor,
          opacity: 0.15,
        }} />
        <View style={{
          position: 'absolute', bottom: height * 0.15, left: -width * 0.15,
          width: width * 0.5, height: width * 0.5,
          borderRadius: width * 0.25,
          backgroundColor: item.glowColor,
          opacity: 0.1,
        }} />
      </View>

      {/* Icon */}
      <Animated.View
        style={{
          width: 160,
          height: 160,
          borderRadius: 80,
          backgroundColor: `${item.accentColor}20`,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: `${item.accentColor}40`,
          marginBottom: 48,
          transform: [{ scale: iconScaleAnim }],
          shadowColor: item.accentColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 30,
          elevation: 10,
        }}
      >
        <Text style={{ fontSize: 72 }}>{item.icon}</Text>
      </Animated.View>

      {/* Text */}
      <Text
        style={{
          fontSize: 42,
          fontWeight: '800',
          color: '#fff',
          textAlign: 'center',
          lineHeight: 50,
          marginBottom: 20,
          textShadowColor: item.glowColor,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 20,
        }}
      >
        {item.title}
      </Text>
      <Text
        style={{
          fontSize: 17,
          color: 'rgba(255,255,255,0.7)',
          textAlign: 'center',
          lineHeight: 26,
          maxWidth: 300,
        }}
      >
        {item.subtitle}
      </Text>
    </LinearGradient>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#08080F' }}>
      <StatusBar style="light" />

      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
      />

      {/* Bottom overlay */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: 32,
          paddingBottom: Platform.OS === 'ios' ? 48 : 32,
        }}
      >
        {/* Dots */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 32, gap: 8 }}>
          {slides.map((_, i) => {
            const opacity = scrollX.interpolate({
              inputRange: [(i - 1) * width, i * width, (i + 1) * width],
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            const width2 = scrollX.interpolate({
              inputRange: [(i - 1) * width, i * width, (i + 1) * width],
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={{
                  height: 8,
                  width: width2,
                  borderRadius: 4,
                  backgroundColor: slides[currentIndex].accentColor,
                  opacity,
                }}
              />
            );
          })}
        </View>

        <GradientButton
          title={currentIndex === slides.length - 1 ? '🚀 Get Started' : 'Continue →'}
          onPress={goNext}
          colors={[slides[currentIndex].accentColor, slides[currentIndex].accentColor + 'AA'] as [string, string]}
          size="lg"
        />

        <TouchableOpacity
          onPress={() => router.push('/(auth)/login')}
          style={{ alignItems: 'center', marginTop: 16 }}
        >
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>
            Already have an account? <Text style={{ color: '#fff' }}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
