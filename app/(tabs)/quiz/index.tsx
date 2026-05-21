import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert,
  Animated, Platform, Dimensions, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../src/theme/ThemeContext';
import { useQuizStore, Quiz } from '../../../src/store/quizStore';
import { useGamificationStore } from '../../../src/store/gamificationStore';
import { useNotesStore } from '../../../src/store/notesStore';
import { AnimatedInput } from '../../../src/components/ui/AnimatedInput';
import { GradientButton } from '../../../src/components/ui/GradientButton';
import { GlassCard } from '../../../src/components/ui/GlassCard';
import { CardSkeleton } from '../../../src/components/ui/Skeleton';
import { Colors } from '../../../src/theme/colors';

const { width } = Dimensions.get('window');

// Timer Ring
function TimerRing({ seconds, maxSeconds }: { seconds: number; maxSeconds: number }) {
  const { colors } = useTheme();
  const progress = seconds / maxSeconds;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const timerColor = progress > 0.5 ? Colors.success : progress > 0.25 ? Colors.warning : Colors.error;

  return (
    <View style={{ width: 88, height: 88, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: colors.border }} />
      <View
        style={{
          position: 'absolute',
          width: 88, height: 88,
          borderRadius: 44,
          borderWidth: 3,
          borderColor: timerColor,
          borderTopColor: 'transparent',
          borderRightColor: progress < 0.75 ? 'transparent' : timerColor,
          transform: [{ rotate: '-90deg' }],
          opacity: 0.8,
        }}
      />
      <Text style={{ color: timerColor, fontSize: 20, fontWeight: '800' }}>{seconds}</Text>
    </View>
  );
}

// MCQ Option
function QuizOption({ option, index, selected, correct, isAnswered, onSelect }: {
  option: string; index: number; selected: boolean; correct: boolean;
  isAnswered: boolean; onSelect: () => void;
}) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (isAnswered) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onSelect();
  };

  let bgColor = colors.card;
  let borderColor = colors.border;
  let textColor = colors.textPrimary;

  if (isAnswered) {
    if (correct) { bgColor = `${Colors.success}20`; borderColor = Colors.success; textColor = Colors.success; }
    else if (selected) { bgColor = `${Colors.error}20`; borderColor = Colors.error; textColor = Colors.error; }
  } else if (selected) {
    bgColor = `${colors.primary}20`;
    borderColor = colors.primary;
  }

  const letters = ['A', 'B', 'C', 'D'];

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: 10 }}>
      <TouchableOpacity
        onPress={handlePress}
        style={{ backgroundColor: bgColor, borderRadius: 14, borderWidth: 1.5, borderColor, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}
      >
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: borderColor + '30', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: borderColor || colors.textMuted, fontWeight: '700', fontSize: 14 }}>
            {letters[index]}
          </Text>
        </View>
        <Text style={{ flex: 1, color: textColor, fontSize: 15, fontWeight: '500', lineHeight: 22 }}>
          {option.replace(/^[A-D]\.\s*/i, '')}
        </Text>
        {isAnswered && correct && <Ionicons name="checkmark-circle" size={22} color={Colors.success} />}
        {isAnswered && selected && !correct && <Ionicons name="close-circle" size={22} color={Colors.error} />}
      </TouchableOpacity>
    </Animated.View>
  );
}

// Active Quiz View
function ActiveQuizView({ quiz, onFinish }: { quiz: Quiz; onFinish: (score: number, accuracy: number, xp: number) => void }) {
  const { colors, isDark } = useTheme();
  const { currentQuestionIndex, submitAnswer, finishQuiz } = useQuizStore();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [startTime, setStartTime] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shortAnswer, setShortAnswer] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const questions = quiz.questions || [];
  const question = questions[currentQuestionIndex];
  const isLast = currentQuestionIndex === questions.length - 1;
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  if (!question) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  useEffect(() => {
    setSelectedAnswer(null);
    setIsAnswered(false);
    setTimeLeft(30);
    setStartTime(Date.now());
    setShortAnswer('');
    slideAnim.setValue(40);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 8 }).start();

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleTimeOut();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current!);
  }, [currentQuestionIndex]);

  const handleTimeOut = () => {
    if (!isAnswered) {
      setIsAnswered(true);
      submitAnswer('', Date.now() - startTime);
    }
  };

  const handleSelect = (answer: string) => {
    if (isAnswered) return;
    clearInterval(timerRef.current!);
    setSelectedAnswer(answer);
    setIsAnswered(true);
    const timeTaken = Date.now() - startTime;
    submitAnswer(answer, timeTaken);
    Haptics.impactAsync(answer === question.correctAnswer ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light);
  };

  const handleNext = async () => {
    if (isLast) {
      setIsSubmitting(true);
      try {
        const result = await finishQuiz();
        onFinish(result.score, result.accuracy, result.xpEarned);
      } catch (err) {
        console.error('Failed to finish quiz in handleNext:', err);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      useQuizStore.setState((s) => ({ currentQuestionIndex: s.currentQuestionIndex + 1 }));
    }
  };

  const isCorrect = selectedAnswer === question.correctAnswer;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <LinearGradient
        colors={isDark ? ['#0A0A1F', '#08080F'] : ['#F0F0FF', '#F8F8FF']}
        style={{ paddingTop: Platform.OS === 'ios' ? 60 : 44, paddingBottom: 20, paddingHorizontal: 24 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>{quiz.title}</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '700' }}>
              Question {currentQuestionIndex + 1} / {questions.length}
            </Text>
          </View>
          <TimerRing seconds={timeLeft} maxSeconds={30} />
        </View>
        <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' }}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ width: `${progress}%`, height: '100%', borderRadius: 3 }}
          />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        {/* Question */}
        <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
          <GlassCard gradient style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ backgroundColor: `${colors.primary}20`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
                  {question.type === 'mcq' ? 'Multiple Choice' : question.type === 'true_false' ? 'True / False' : 'Short Answer'}
                </Text>
              </View>
            </View>
            <Text style={{ color: colors.textPrimary, fontSize: 19, fontWeight: '700', lineHeight: 28 }}>
              {question.question}
            </Text>
          </GlassCard>
        </Animated.View>

        {/* MCQ Options */}
        {question.type === 'mcq' && question.options?.map((opt, i) => (
          <QuizOption
            key={i}
            option={opt}
            index={i}
            selected={selectedAnswer === opt}
            correct={opt === question.correctAnswer}
            isAnswered={isAnswered}
            onSelect={() => handleSelect(opt)}
          />
        ))}

        {/* True/False */}
        {question.type === 'true_false' && (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {['True', 'False'].map((opt) => {
              let bgColor = colors.card;
              let borderColor = colors.border;
              if (isAnswered) {
                if (opt === question.correctAnswer) { bgColor = `${Colors.success}20`; borderColor = Colors.success; }
                else if (selectedAnswer === opt) { bgColor = `${Colors.error}20`; borderColor = Colors.error; }
              } else if (selectedAnswer === opt) {
                bgColor = `${colors.primary}20`; borderColor = colors.primary;
              }
              return (
                <TouchableOpacity
                  key={opt}
                  onPress={() => handleSelect(opt)}
                  style={{ flex: 1, backgroundColor: bgColor, borderRadius: 16, borderWidth: 2, borderColor, padding: 20, alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 28 }}>{opt === 'True' ? '✅' : '❌'}</Text>
                  <Text style={{ color: borderColor || colors.textPrimary, fontSize: 18, fontWeight: '700', marginTop: 8 }}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Short Answer */}
        {question.type === 'short_answer' && (
          <View>
            <AnimatedInput
              label="Your Answer"
              value={shortAnswer}
              onChangeText={setShortAnswer}
              placeholder="Type your answer here..."
              multiline
              numberOfLines={3}
              editable={!isAnswered}
            />
            {!isAnswered && (
              <GradientButton title="Submit Answer" onPress={() => handleSelect(shortAnswer)} disabled={!shortAnswer.trim()} />
            )}
            {isAnswered && (
              <GlassCard style={{ marginTop: 12 }}>
                <Text style={{ color: colors.success, fontSize: 14, fontWeight: '700', marginBottom: 4 }}>✅ Correct Answer:</Text>
                <Text style={{ color: colors.textPrimary, fontSize: 15 }}>{question.correctAnswer}</Text>
              </GlassCard>
            )}
          </View>
        )}

        {/* Explanation */}
        {isAnswered && question.explanation && (
          <GlassCard style={{ marginTop: 16 }} glowColor={isCorrect ? `${Colors.success}30` : `${Colors.error}30`}>
            <Text style={{ color: isCorrect ? Colors.success : Colors.error, fontSize: 14, fontWeight: '700', marginBottom: 6 }}>
              {isCorrect ? '🎉 Correct!' : '❌ Not quite...'}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22 }}>
              💡 {question.explanation}
            </Text>
          </GlassCard>
        )}

        {isAnswered && (
          <GradientButton
            title={isLast ? '🏆 See Results' : 'Next Question →'}
            onPress={handleNext}
            style={{ marginTop: 16 }}
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        )}
      </ScrollView>
    </View>
  );
}

// Result Screen
function ResultScreen({ quiz, score, accuracy, xpEarned, onRetry, onClose }: {
  quiz: Quiz; score: number; accuracy: number; xpEarned: number;
  onRetry: () => void; onClose: () => void;
}) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }).start();
  }, []);

  const emoji = accuracy === 100 ? '🏆' : accuracy >= 80 ? '🎉' : accuracy >= 60 ? '👍' : '📚';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 120 }}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
          <Text style={{ fontSize: 80, marginBottom: 16 }}>{emoji}</Text>
          <Text style={{ color: colors.textPrimary, fontSize: 32, fontWeight: '800', textAlign: 'center' }}>
            {accuracy === 100 ? 'Perfect Score!' : accuracy >= 80 ? 'Excellent!' : accuracy >= 60 ? 'Good Job!' : 'Keep Practicing!'}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 16, marginTop: 8, textAlign: 'center' }}>{quiz.title}</Text>
        </Animated.View>

        <GlassCard gradient style={{ marginTop: 32, marginBottom: 24 }} glowColor={`${colors.primary}30`}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: colors.primary, fontSize: 42, fontWeight: '800' }}>{accuracy}%</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>Accuracy</Text>
            </View>
            <View style={{ width: 1, backgroundColor: colors.border }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: Colors.success, fontSize: 42, fontWeight: '800' }}>{score}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>Correct</Text>
            </View>
            <View style={{ width: 1, backgroundColor: colors.border }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: Colors.xp, fontSize: 42, fontWeight: '800' }}>+{xpEarned}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>XP Earned</Text>
            </View>
          </View>
        </GlassCard>

        <GradientButton title="Done ✓" onPress={onClose} style={{ marginBottom: 12 }} />
        <GradientButton title="Try Again" onPress={onRetry} variant="outline" />
      </ScrollView>
    </View>
  );
}

// Quiz History Card
function QuizCard({ quiz, onStart }: { quiz: Quiz; onStart: () => void }) {
  const { colors } = useTheme();
  const isCompleted = !!quiz.completedAt;
  const questions = quiz.questions || [];

  return (
    <TouchableOpacity onPress={onStart} activeOpacity={0.9} style={{ marginBottom: 16 }}>
      <GlassCard gradient>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 4 }}>{quiz.title}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>{questions.length} questions</Text>
          </View>
          {isCompleted && (
            <View style={{ backgroundColor: `${Colors.success}20`, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ color: Colors.success, fontSize: 14, fontWeight: '700' }}>{quiz.accuracy}%</Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          <View style={{ backgroundColor: `${colors.primary}15`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>
              {questions.filter((q) => q.type === 'mcq').length} MCQ
            </Text>
          </View>
          <View style={{ backgroundColor: `${colors.secondary}15`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ color: colors.secondary, fontSize: 11, fontWeight: '700' }}>
              {questions.filter((q) => q.type === 'true_false').length} T/F
            </Text>
          </View>
          {!isCompleted && (
            <View style={{ backgroundColor: `${Colors.warning}15`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ color: Colors.warning, fontSize: 11, fontWeight: '700' }}>Not attempted</Text>
            </View>
          )}
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

export default function QuizScreen() {
  const { colors, isDark } = useTheme();
  const { quizzes, isLoading, isGenerating, activeQuiz, generateQuiz, startQuiz, fetchQuizzes, deleteQuiz, resetActive } = useQuizStore();
  const { recordQuizCompleted } = useGamificationStore();
  const { notes, fetchNotes } = useNotesStore();

  const [showCreate, setShowCreate] = useState(false);
  const [inputText, setInputText] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [questionCount, setQuestionCount] = useState('10');
  const [quizMode, setQuizMode] = useState<'idle' | 'active' | 'result'>('idle');
  const [resultData, setResultData] = useState<{ score: number; accuracy: number; xpEarned: number } | null>(null);

  useEffect(() => {
    fetchQuizzes();
    fetchNotes();
  }, []);

  const handleGenerate = async () => {
    if (!quizTitle.trim()) { Alert.alert('Missing title', 'Enter a quiz title'); return; }
    if (!inputText.trim() || inputText.length < 50) { Alert.alert('Too short', 'Enter at least 50 characters'); return; }
    try {
      const quiz = await generateQuiz(inputText, quizTitle, { count: parseInt(questionCount) || 10, types: ['mcq', 'true_false'] });
      setShowCreate(false);
      setInputText('');
      setQuizTitle('');
      startQuiz(quiz);
      setQuizMode('active');
    } catch {
      Alert.alert('Error', 'Failed to generate quiz');
    }
  };

  const handleFinish = (score: number, accuracy: number, xpEarned: number) => {
    setResultData({ score, accuracy, xpEarned });
    setQuizMode('result');
    recordQuizCompleted(accuracy);
  };

  if (quizMode === 'active' && activeQuiz) {
    return <ActiveQuizView quiz={activeQuiz} onFinish={handleFinish} />;
  }

  if (quizMode === 'result' && activeQuiz && resultData) {
    return (
      <ResultScreen
        quiz={activeQuiz}
        score={resultData.score}
        accuracy={resultData.accuracy}
        xpEarned={resultData.xpEarned}
        onRetry={() => { startQuiz(activeQuiz); setQuizMode('active'); }}
        onClose={() => { setQuizMode('idle'); resetActive(); }}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <LinearGradient
        colors={isDark ? ['#0A0A1F', '#08080F'] : ['#F0F0FF', '#F8F8FF']}
        style={{ paddingTop: Platform.OS === 'ios' ? 60 : 44, paddingBottom: 20, paddingHorizontal: 24 }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ color: colors.textMuted, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '600' }}>AI Powered</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: '800' }}>Quiz Center</Text>
          </View>
          <TouchableOpacity onPress={() => setShowCreate(!showCreate)}>
            <LinearGradient colors={[colors.accent, colors.primary]} style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={showCreate ? 'close' : 'add'} size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {showCreate && (
          <GlassCard gradient style={{ marginBottom: 24 }} glowColor={`${colors.accent}30`}>
            <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 16 }}>🎯 Generate Quiz</Text>
            {notes && notes.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' }}>
                  Select from Your Notes 📝
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                  {notes.map((note) => {
                    const isSelected = quizTitle === note.title && inputText === note.originalContent;
                    return (
                      <TouchableOpacity
                        key={note.id}
                        onPress={() => {
                          setQuizTitle(note.title);
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
            <AnimatedInput label="Quiz Title" value={quizTitle} onChangeText={setQuizTitle} placeholder="e.g., Chapter 4 Review" />
            <AnimatedInput label="Number of Questions" value={questionCount} onChangeText={setQuestionCount} keyboardType="number-pad" />
            <AnimatedInput label="Study Material" value={inputText} onChangeText={setInputText} placeholder="Paste your notes (min 50 characters)" multiline numberOfLines={5} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <GradientButton title="Generate Quiz ✨" onPress={handleGenerate} loading={isGenerating} style={{ flex: 1 }} fullWidth={false} colors={[colors.accent, colors.primary] as [string, string]} />
              <GradientButton title="Cancel" onPress={() => setShowCreate(false)} variant="outline" style={{ flex: 0 }} fullWidth={false} />
            </View>
          </GlassCard>
        )}

        {isGenerating && (
          <GlassCard style={{ marginBottom: 16, alignItems: 'center', padding: 24 }} glowColor={`${colors.accent}40`}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginTop: 12 }}>Creating Quiz...</Text>
            <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>AI is crafting your questions</Text>
          </GlassCard>
        )}

        {isLoading ? (
          [1, 2].map((i) => <CardSkeleton key={i} />)
        ) : quizzes.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontSize: 64, marginBottom: 16 }}>🎯</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 8 }}>No quizzes yet</Text>
            <Text style={{ color: colors.textMuted, fontSize: 15, textAlign: 'center', maxWidth: 260 }}>
              Generate an AI quiz from your study material!
            </Text>
            <GradientButton title="Create Quiz" onPress={() => setShowCreate(true)} style={{ marginTop: 24 }} fullWidth={false} colors={[colors.accent, colors.primary] as [string, string]} />
          </View>
        ) : (
          quizzes.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              onStart={() => { startQuiz(quiz); setQuizMode('active'); }}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
