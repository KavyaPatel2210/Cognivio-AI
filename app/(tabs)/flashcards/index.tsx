import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Alert, Platform, Animated, Dimensions,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../src/theme/ThemeContext';
import { useFlashcardStore, FlashcardDeck, Flashcard } from '../../../src/store/flashcardStore';
import { useNotesStore } from '../../../src/store/notesStore';
import { useGamificationStore } from '../../../src/store/gamificationStore';
import { AnimatedInput } from '../../../src/components/ui/AnimatedInput';
import { GradientButton } from '../../../src/components/ui/GradientButton';
import { GlassCard } from '../../../src/components/ui/GlassCard';
import { FlashcardSkeleton } from '../../../src/components/ui/Skeleton';
import { Colors } from '../../../src/theme/colors';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width - 48;

// 3D Flip Card Component
function FlipCard({
  front,
  back,
  difficulty,
  isBookmarked,
  onBookmark,
  onDifficultyChange,
  onReviewed,
}: {
  front: string;
  back: string;
  difficulty: Flashcard['difficulty'];
  isBookmarked: boolean;
  onBookmark: () => void;
  onDifficultyChange: (d: Flashcard['difficulty']) => void;
  onReviewed: () => void;
}) {
  const { colors } = useTheme();
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  const diffColors: Record<Flashcard['difficulty'], string> = {
    easy: Colors.success,
    medium: Colors.warning,
    hard: Colors.error,
  };

  const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const frontOpacity = flipAnim.interpolate({ inputRange: [0.4, 0.5], outputRange: [1, 0] });
  const backOpacity = flipAnim.interpolate({ inputRange: [0.4, 0.5], outputRange: [0, 1] });

  const flip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const toValue = isFlipped ? 0 : 1;
    Animated.spring(flipAnim, { toValue, useNativeDriver: true, tension: 60, friction: 8 }).start();
    setIsFlipped(!isFlipped);
    if (!isFlipped) onReviewed();
  };

  return (
    <View style={{ alignItems: 'center' }}>
      <TouchableOpacity onPress={flip} activeOpacity={0.9} style={{ width: CARD_WIDTH, height: 260 }}>
        {/* Front */}
        <Animated.View
          style={[{
            position: 'absolute', width: '100%', height: '100%',
            opacity: frontOpacity,
            transform: [{ perspective: 1200 }, { rotateY: frontRotate }],
            backfaceVisibility: 'hidden',
          }]}
        >
          <LinearGradient
            colors={[colors.primary, `${colors.primary}CC`]}
            style={{ flex: 1, borderRadius: 24, padding: 28, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10 }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>
              QUESTION
            </Text>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700', textAlign: 'center', lineHeight: 30 }}>
              {front}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 20 }}>
              Tap to reveal answer
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Back */}
        <Animated.View
          style={[{
            position: 'absolute', width: '100%', height: '100%',
            opacity: backOpacity,
            transform: [{ perspective: 1200 }, { rotateY: backRotate }],
            backfaceVisibility: 'hidden',
          }]}
        >
          <LinearGradient
            colors={[colors.card, `${colors.surface}EE`]}
            style={{ flex: 1, borderRadius: 24, padding: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: `${colors.primary}40` }}
          >
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>
              ANSWER
            </Text>
            <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '600', textAlign: 'center', lineHeight: 28 }}>
              {back}
            </Text>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>

      {/* Controls */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: CARD_WIDTH, marginTop: 16, gap: 8 }}>
        {/* Difficulty */}
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {(['easy', 'medium', 'hard'] as Flashcard['difficulty'][]).map((d) => (
            <TouchableOpacity
              key={d}
              onPress={() => onDifficultyChange(d)}
              style={{
                paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
                backgroundColor: difficulty === d ? `${diffColors[d]}30` : colors.card,
                borderWidth: 1,
                borderColor: difficulty === d ? diffColors[d] : colors.border,
              }}
            >
              <Text style={{ color: difficulty === d ? diffColors[d] : colors.textMuted, fontSize: 12, fontWeight: '600' }}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bookmark */}
        <TouchableOpacity
          onPress={onBookmark}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isBookmarked ? `${Colors.xp}20` : colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isBookmarked ? Colors.xp : colors.border }}
        >
          <Ionicons name={isBookmarked ? 'bookmark' : 'bookmark-outline'} size={18} color={isBookmarked ? Colors.xp : colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Deck Card
function DeckCard({ deck, onStudy, onDelete }: { deck: FlashcardDeck; onStudy: () => void; onDelete: () => void }) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bookmarked = deck.cards.filter((c) => c.isBookmarked).length;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: 16 }}>
      <TouchableOpacity
        onPress={onStudy}
        onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start()}
        onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50 }).start()}
        activeOpacity={1}
      >
        <GlassCard gradient>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 4 }}>
                {deck.title}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                {deck.cards.length} cards · {bookmarked} bookmarked
              </Text>
            </View>
            <TouchableOpacity onPress={() => Alert.alert('Delete Deck', 'This will delete all cards.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: onDelete },
            ])}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            {['easy', 'medium', 'hard'].map((d) => {
              const count = deck.cards.filter((c) => c.difficulty === d).length;
              const diffColors = { easy: Colors.success, medium: Colors.warning, hard: Colors.error };
              return count > 0 ? (
                <View key={d} style={{ backgroundColor: `${diffColors[d as keyof typeof diffColors]}20`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ color: diffColors[d as keyof typeof diffColors], fontSize: 11, fontWeight: '700' }}>
                    {count} {d}
                  </Text>
                </View>
              ) : null;
            })}
          </View>

          <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ flex: 1, borderRadius: 10, padding: 1 }}
            >
              <View style={{ backgroundColor: 'transparent', borderRadius: 9, paddingVertical: 8, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Study Now →</Text>
              </View>
            </LinearGradient>
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function FlashcardsScreen() {
  const { colors, isDark } = useTheme();
  const { decks, isLoading, isGenerating, generateDeck, toggleBookmark, setDifficulty, markReviewed, deleteDeck, fetchDecks } = useFlashcardStore();
  const { notes, fetchNotes } = useNotesStore();
  const { recordFlashcardReview } = useGamificationStore();

  const [showCreate, setShowCreate] = useState(false);
  const [studyDeckId, setStudyDeckId] = useState<string | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [inputText, setInputText] = useState('');
  const [deckTitle, setDeckTitle] = useState('');
  const [cardCount, setCardCount] = useState('10');

  // Derive studyDeck dynamically from Zustand decks store using studyDeckId
  const studyDeck = decks.find((d) => d.id === studyDeckId) || null;

  useEffect(() => {
    fetchDecks();
    fetchNotes();
  }, []);

  const handleGenerate = async () => {
    if (!deckTitle.trim()) { Alert.alert('Missing title', 'Enter a deck title'); return; }
    if (!inputText.trim() || inputText.length < 50) { Alert.alert('Too short', 'Enter at least 50 characters'); return; }
    try {
      const deck = await generateDeck(inputText, deckTitle, parseInt(cardCount) || 10);
      setShowCreate(false);
      setInputText('');
      setDeckTitle('');
      setStudyDeckId(deck.id);
      setCardIndex(0);
    } catch {
      Alert.alert('Error', 'Failed to generate flashcards');
    }
  };

  const handleNext = () => {
    if (studyDeck && cardIndex < studyDeck.cards.length - 1) setCardIndex(cardIndex + 1);
    else Alert.alert('🎉 Done!', 'You finished all cards!', [{ text: 'OK', onPress: () => { setStudyDeckId(null); setCardIndex(0); } }]);
  };

  const handlePrev = () => {
    if (cardIndex > 0) setCardIndex(cardIndex - 1);
  };

  // Study Mode View
  if (studyDeck) {
    const card = studyDeck.cards[cardIndex];
    const progress = ((cardIndex + 1) / studyDeck.cards.length) * 100;

    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <LinearGradient
          colors={isDark ? ['#0A0A1F', '#08080F'] : ['#F0F0FF', '#F8F8FF']}
          style={{ paddingTop: Platform.OS === 'ios' ? 60 : 44, paddingBottom: 20, paddingHorizontal: 24 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <TouchableOpacity
              onPress={() => { setStudyDeckId(null); setCardIndex(0); }}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '700' }} numberOfLines={1}>
                {studyDeck.title}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                {cardIndex + 1} / {studyDeck.cards.length}
              </Text>
            </View>
          </View>
          <View style={{ height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' }}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ width: `${progress}%`, height: '100%', borderRadius: 2 }}
            />
          </View>
        </LinearGradient>

        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
          <FlipCard
            front={card.question}
            back={card.answer}
            difficulty={card.difficulty}
            isBookmarked={card.isBookmarked}
            onBookmark={() => toggleBookmark(studyDeck.id, cardIndex)}
            onDifficultyChange={(d) => setDifficulty(studyDeck.id, cardIndex, d)}
            onReviewed={() => { markReviewed(studyDeck.id, cardIndex); recordFlashcardReview(); }}
          />

          {/* Navigation */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
            <GradientButton
              title="← Previous"
              onPress={handlePrev}
              variant={cardIndex === 0 ? 'ghost' : 'outline'}
              disabled={cardIndex === 0}
              style={{ flex: 1 }}
              fullWidth={false}
            />
            <GradientButton
              title={cardIndex === studyDeck.cards.length - 1 ? '🎉 Finish' : 'Next →'}
              onPress={handleNext}
              style={{ flex: 1 }}
              fullWidth={false}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  // Deck List View
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <LinearGradient
        colors={isDark ? ['#0A0A1F', '#08080F'] : ['#F0F0FF', '#F8F8FF']}
        style={{ paddingTop: Platform.OS === 'ios' ? 60 : 44, paddingBottom: 20, paddingHorizontal: 24 }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ color: colors.textMuted, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '600' }}>
              Study Mode
            </Text>
            <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: '800' }}>
              Flashcards
            </Text>
          </View>
          <TouchableOpacity onPress={() => setShowCreate(!showCreate)}>
            <LinearGradient
              colors={[colors.secondary, colors.primary]}
              style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name={showCreate ? 'close' : 'add'} size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {showCreate && (
          <GlassCard gradient style={{ marginBottom: 24 }} glowColor={`${colors.secondary}30`}>
            <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 16 }}>
              🃏 Generate Flashcards
            </Text>
            {notes && notes.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' }}>
                  Select from Your Notes 📝
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                  {notes.map((note) => {
                    const isSelected = deckTitle === note.title && inputText === note.originalContent;
                    return (
                      <TouchableOpacity
                        key={note.id}
                        onPress={() => {
                          setDeckTitle(note.title);
                          setInputText(note.originalContent);
                        }}
                        activeOpacity={0.7}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 10,
                          backgroundColor: isSelected ? `${colors.primary}30` : `${colors.border}20`,
                          borderWidth: 1,
                          borderColor: isSelected ? colors.primary : colors.border,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ color: isSelected ? colors.textPrimary : colors.textSecondary, fontSize: 13, fontWeight: '600' }}>
                          📝 {note.title}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
            <AnimatedInput label="Deck Name" value={deckTitle} onChangeText={setDeckTitle} placeholder="e.g., Biology Chapter 3" />
            <AnimatedInput label="Number of Cards" value={cardCount} onChangeText={setCardCount} keyboardType="number-pad" />
            <AnimatedInput label="Study Material" value={inputText} onChangeText={setInputText} placeholder="Paste your notes here (min 50 characters)" multiline numberOfLines={5} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <GradientButton title="Generate ✨" onPress={handleGenerate} loading={isGenerating} style={{ flex: 1 }} fullWidth={false} colors={[colors.secondary, colors.primary] as [string, string]} />
              <GradientButton title="Cancel" onPress={() => setShowCreate(false)} variant="outline" style={{ flex: 0 }} fullWidth={false} />
            </View>
          </GlassCard>
        )}

        {isGenerating && (
          <GlassCard style={{ marginBottom: 16, alignItems: 'center', padding: 24 }} glowColor={`${colors.secondary}40`}>
            <Text style={{ fontSize: 48 }}>✨</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginTop: 12 }}>Generating Flashcards...</Text>
            <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>Gemini AI is creating your cards</Text>
          </GlassCard>
        )}

        {isLoading ? (
          [1, 2].map((i) => <FlashcardSkeleton key={i} />)
        ) : decks.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontSize: 64, marginBottom: 16 }}>🃏</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 8 }}>No decks yet</Text>
            <Text style={{ color: colors.textMuted, fontSize: 15, textAlign: 'center', maxWidth: 260 }}>
              Generate your first AI-powered flashcard deck!
            </Text>
            <GradientButton title="Create Deck" onPress={() => setShowCreate(true)} style={{ marginTop: 24 }} fullWidth={false} colors={[colors.secondary, colors.primary] as [string, string]} />
          </View>
        ) : (
          decks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              onStudy={() => { setStudyDeckId(deck.id); setCardIndex(0); }}
              onDelete={() => deleteDeck(deck.id)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
