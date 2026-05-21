import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/apiClient';
import { geminiService } from '../services/geminiService';

export interface Note {
  id: string;
  _id?: string;
  title: string;
  originalContent: string;
  summary?: string;
  tags: string[];
  source: 'paste' | 'upload' | 'ocr';
  createdAt: string;
  updatedAt: string;
}

interface NotesState {
  notes: Note[];
  isLoading: boolean;
  isSummarizing: boolean;
  error: string | null;

  fetchNotes: () => Promise<void>;
  createNote: (title: string, content: string, source?: Note['source']) => Promise<Note>;
  summarizeNote: (noteId: string) => Promise<string>;
  summarizeText: (text: string) => Promise<string>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: [],
      isLoading: false,
      isSummarizing: false,
      error: null,

      fetchNotes: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await api.get<{ notes: any[] }>('/notes');
          const notes = data.notes.map((n) => ({
            ...n,
            id: n._id || n.id,
          }));
          set({ notes, isLoading: false });
        } catch (err: any) {
          set({ error: err?.message || 'Failed to fetch notes', isLoading: false });
        }
      },

      createNote: async (title, originalContent, source = 'paste') => {
        set({ isLoading: true, error: null });
        try {
          const data = await api.post<{ note: any }>('/notes', {
            title,
            originalContent,
            source,
          });
          const note = { ...data.note, id: data.note._id };
          set((state) => ({ notes: [note, ...state.notes], isLoading: false }));
          return note;
        } catch {
          // Offline fallback
          const note: Note = {
            id: Date.now().toString(),
            title,
            originalContent,
            tags: [],
            source,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          set((state) => ({ notes: [note, ...state.notes], isLoading: false }));
          return note;
        }
      },

      summarizeNote: async (noteId) => {
        const { notes } = get();
        const note = notes.find((n) => n.id === noteId);
        if (!note) throw new Error('Note not found');
        return get().summarizeText(note.originalContent);
      },

      summarizeText: async (text) => {
        set({ isSummarizing: true, error: null });
        try {
          const summary = await geminiService.summarize(text);
          set({ isSummarizing: false });
          return summary;
        } catch (err: any) {
          set({ error: 'Failed to generate summary', isSummarizing: false });
          throw err;
        }
      },

      updateNote: async (id, updates) => {
        try {
          await api.put(`/notes/${id}`, updates);
        } catch {
          // Offline update
        }
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
          ),
        }));
      },

      deleteNote: async (id) => {
        try {
          await api.delete(`/notes/${id}`);
        } catch {
          // Offline delete
        }
        set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'notes-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ notes: state.notes }),
    }
  )
);
