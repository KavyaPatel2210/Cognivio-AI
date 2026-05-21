import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert,
  Animated, Platform, Share, ActivityIndicator, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useTheme } from '../../../src/theme/ThemeContext';
import { useNotesStore, Note } from '../../../src/store/notesStore';
import { useGamificationStore } from '../../../src/store/gamificationStore';
import { AnimatedInput } from '../../../src/components/ui/AnimatedInput';
import { GradientButton } from '../../../src/components/ui/GradientButton';
import { GlassCard } from '../../../src/components/ui/GlassCard';
import { CardSkeleton } from '../../../src/components/ui/Skeleton';
import { Colors } from '../../../src/theme/colors';

const { width } = Dimensions.get('window');

function parseInlineFormatting(text: string, colors: any) {
  const boldParts = text.split('**');
  
  return boldParts.map((boldPart, boldIndex) => {
    const isBold = boldIndex % 2 === 1;
    const baseStyle = isBold ? { fontWeight: '700' as const, color: colors.textPrimary } : { color: colors.textSecondary };
    
    const codeParts = boldPart.split('`');
    if (codeParts.length === 1) {
      return (
        <Text key={boldIndex} style={baseStyle}>
          {boldPart}
        </Text>
      );
    }
    
    return (
      <Text key={boldIndex} style={baseStyle}>
        {codeParts.map((codePart, codeIndex) => {
          const isCode = codeIndex % 2 === 1;
          if (isCode) {
            return (
              <Text
                key={codeIndex}
                style={{
                  fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
                  backgroundColor: colors.border,
                  color: colors.accent,
                  fontSize: 13,
                  fontWeight: '600',
                }}
              >
                {` ${codePart} `}
              </Text>
            );
          }
          return codePart;
        })}
      </Text>
    );
  });
}

function renderMarkdown(text: string, colors: any) {
  if (!text) return null;
  const lines = text.split('\n');

  return lines.map((line, index) => {
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      
      let fontSize = 16;
      let marginTop = 10;
      let marginBottom = 4;
      if (level === 1) { fontSize = 20; marginTop = 14; }
      else if (level === 2) { fontSize = 18; marginTop = 12; }
      else if (level === 3) { fontSize = 16; marginTop = 10; }

      return (
        <Text
          key={index}
          style={{
            color: colors.primary,
            fontSize,
            fontWeight: '800',
            marginTop,
            marginBottom,
            lineHeight: fontSize + 6,
          }}
        >
          {parseInlineFormatting(content, colors)}
        </Text>
      );
    }

    const bulletMatch = line.match(/^[\*\-]\s+(.*)$/);
    if (bulletMatch) {
      const content = bulletMatch[1];
      return (
        <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginLeft: 8, marginVertical: 3, paddingRight: 16 }}>
          <Text style={{ color: colors.primary, fontSize: 14, marginRight: 6, lineHeight: 22 }}>•</Text>
          <Text style={{ flex: 1, color: colors.textSecondary, fontSize: 14, lineHeight: 22 }}>
            {parseInlineFormatting(content, colors)}
          </Text>
        </View>
      );
    }

    if (line.trim() === '') {
      return <View key={index} style={{ height: 6 }} />;
    }

    return (
      <Text key={index} style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22, marginVertical: 2 }}>
        {parseInlineFormatting(line, colors)}
      </Text>
    );
  });
}

function NoteCard({ note, onDelete, onSummarize }: { note: Note; onDelete: () => void; onSummarize: () => void }) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'summary' | 'original'>('summary');
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    setExpanded(!expanded);
  };

  const handleCopy = async () => {
    const textToCopy = (note.summary && viewMode === 'summary') ? note.summary : note.originalContent;
    await Clipboard.setStringAsync(textToCopy);
    Alert.alert('Copied!', 'Content copied to clipboard');
  };

  const handleShare = async () => {
    const textToShare = (note.summary && viewMode === 'summary') ? note.summary : note.originalContent;
    await Share.share({ message: textToShare, title: note.title });
  };

  const sourceColors: Record<Note['source'], string> = {
    paste: colors.primary,
    upload: colors.secondary,
    ocr: colors.accent,
  };

  const sourceIcons: Record<Note['source'], string> = {
    paste: '📝',
    upload: '📄',
    ocr: '📷',
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: 16 }}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
        <GlassCard gradient>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <View style={{ backgroundColor: `${sourceColors[note.source]}20`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Text style={{ color: sourceColors[note.source], fontSize: 11, fontWeight: '700' }}>
                    {sourceIcons[note.source]} {note.source.toUpperCase()}
                  </Text>
                </View>
                {note.summary && (
                  <View style={{ backgroundColor: `${Colors.success}20`, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ color: Colors.success, fontSize: 11, fontWeight: '700' }}>✨ AI Summary</Text>
                  </View>
                )}
              </View>
              <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '700' }} numberOfLines={1}>
                {note.title}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                {new Date(note.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => Alert.alert('Delete Note', 'Are you sure?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: onDelete },
              ])}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>

          {expanded && (
            <View style={{ marginTop: 12 }}>
              {note.summary && (
                <View style={{
                  flexDirection: 'row',
                  backgroundColor: colors.border,
                  borderRadius: 10,
                  padding: 3,
                  marginBottom: 14,
                  alignItems: 'center',
                }}>
                  <TouchableOpacity
                    onPress={() => setViewMode('summary')}
                    style={{
                      flex: 1,
                      backgroundColor: viewMode === 'summary' ? colors.card : 'transparent',
                      borderRadius: 8,
                      paddingVertical: 7,
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 4,
                      ...(viewMode === 'summary' ? {
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.12,
                        shadowRadius: 2,
                        elevation: 1,
                      } : {}),
                    }}
                  >
                    <Text style={{
                      color: viewMode === 'summary' ? colors.primary : colors.textMuted,
                      fontSize: 13,
                      fontWeight: '700',
                    }}>
                      ✨ AI Summary
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setViewMode('original')}
                    style={{
                      flex: 1,
                      backgroundColor: viewMode === 'original' ? colors.card : 'transparent',
                      borderRadius: 8,
                      paddingVertical: 7,
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 4,
                      ...(viewMode === 'original' ? {
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.12,
                        shadowRadius: 2,
                        elevation: 1,
                      } : {}),
                    }}
                  >
                    <Text style={{
                      color: viewMode === 'original' ? colors.primary : colors.textMuted,
                      fontSize: 13,
                      fontWeight: '700',
                    }}>
                      Original Notes
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {note.summary && viewMode === 'summary' ? (
                <View>
                  {renderMarkdown(note.summary, colors)}
                </View>
              ) : (
                <View>
                  {renderMarkdown(note.originalContent, colors)}
                </View>
              )}

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
                {!note.summary && (
                  <TouchableOpacity
                    onPress={onSummarize}
                    style={{ flex: 1, backgroundColor: `${colors.primary}20`, borderRadius: 10, padding: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: `${colors.primary}30` }}
                  >
                    <Text style={{ fontSize: 14 }}>✨</Text>
                    <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>Summarize</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={handleCopy}
                  style={{ flex: 1, backgroundColor: colors.border, borderRadius: 10, padding: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
                >
                  <Ionicons name="copy-outline" size={14} color={colors.textSecondary} />
                  <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>Copy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleShare}
                  style={{ flex: 1, backgroundColor: colors.border, borderRadius: 10, padding: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
                >
                  <Ionicons name="share-outline" size={14} color={colors.textSecondary} />
                  <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function NotesScreen() {
  const { colors, isDark } = useTheme();
  const { notes, isLoading, isSummarizing, createNote, deleteNote, updateNote, summarizeText, fetchNotes } = useNotesStore();
  const { recordNoteCreated } = useGamificationStore();

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [titleError, setTitleError] = useState('');
  const [contentError, setContentError] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState<string | null>(null);

  useEffect(() => { fetchNotes(); }, []);

  const handleCreate = async () => {
    setTitleError(''); setContentError('');
    if (!title.trim()) { setTitleError('Please enter a title'); return; }
    if (!content.trim() || content.trim().length < 20) { setContentError('Please enter at least 20 characters of content'); return; }

    try {
      const note = await createNote(title.trim(), content.trim(), 'paste');
      recordNoteCreated();
      setTitle('');
      setContent('');
      setShowCreate(false);
      
      if (note && note.originalContent.trim().length >= 20) {
        handleSummarize(note);
      }
    } catch {
      Alert.alert('Error', 'Failed to create note');
    }
  };

  const handleSummarize = async (note: Note) => {
    setIsSummaryLoading(note.id);
    try {
      const summary = await summarizeText(note.originalContent);
      await updateNote(note.id, { summary });
    } catch {
      Alert.alert('Error', 'Failed to generate summary. Check your connection.');
    }
    setIsSummaryLoading(null);
  };

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['text/plain'] });
      if (result.canceled) return;
      const file = result.assets[0];
      const response = await fetch(file.uri);
      const text = await response.text();
      setContent(text);
      setTitle(file.name.replace('.txt', ''));
      setShowCreate(true);
    } catch {
      Alert.alert('Error', 'Failed to read file');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <LinearGradient
        colors={isDark ? ['#0A0A1F', '#08080F'] : ['#F0F0FF', '#F8F8FF']}
        style={{ paddingTop: Platform.OS === 'ios' ? 60 : 44, paddingBottom: 20, paddingHorizontal: 24 }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <View>
            <Text style={{ color: colors.textMuted, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '600' }}>
              Study Hub
            </Text>
            <Text style={{ color: colors.textPrimary, fontSize: 28, fontWeight: '800' }}>
              My Notes
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={handleUpload}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}
            >
              <Ionicons name="document-attach-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowCreate(!showCreate)}
              style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}
            >
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name={showCreate ? 'close' : 'add'} size={24} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
      >
        {/* Create note card */}
        {showCreate && (
          <GlassCard gradient style={{ marginBottom: 24 }} glowColor={`${colors.primary}30`}>
            <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 16 }}>
              ✨ Create New Note
            </Text>
            <AnimatedInput
              label="Note Title"
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Chapter 5: Cell Division"
              error={titleError}
            />
            <AnimatedInput
              label="Your Notes"
              value={content}
              onChangeText={setContent}
              placeholder="Paste your notes here... (minimum 20 characters)"
              multiline
              numberOfLines={6}
              error={contentError}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <GradientButton
                title="Save & Summarize"
                onPress={handleCreate}
                loading={isLoading}
                style={{ flex: 1 }}
                fullWidth={false}
              />
              <GradientButton
                title="Cancel"
                onPress={() => { setShowCreate(false); setTitle(''); setContent(''); }}
                variant="outline"
                style={{ flex: 0 }}
                fullWidth={false}
              />
            </View>
          </GlassCard>
        )}

        {/* Summarizing overlay */}
        {isSummarizing && (
          <GlassCard style={{ marginBottom: 16, alignItems: 'center', padding: 24 }} glowColor={`${colors.primary}40`}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginTop: 12 }}>
              ✨ Generating AI Summary...
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 4, textAlign: 'center' }}>
              Gemini AI is analyzing your notes
            </Text>
          </GlassCard>
        )}

        {/* Notes list */}
        {isLoading ? (
          [1, 2, 3].map((i) => <CardSkeleton key={i} />)
        ) : notes.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontSize: 64, marginBottom: 16 }}>📝</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 8 }}>
              No notes yet
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 15, textAlign: 'center', maxWidth: 260 }}>
              Create your first note and let AI summarize it for you!
            </Text>
            <GradientButton
              title="Create First Note"
              onPress={() => setShowCreate(true)}
              style={{ marginTop: 24 }}
              fullWidth={false}
            />
          </View>
        ) : (
          notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onDelete={() => deleteNote(note.id)}
              onSummarize={() => handleSummarize(note)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
