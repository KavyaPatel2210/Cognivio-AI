import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/apiClient';
import { geminiService, FlashcardData } from '../services/geminiService';

export interface Flashcard extends FlashcardData {
  isBookmarked: boolean;
  timesReviewed: number;
  lastReviewed?: string;
}

export interface FlashcardDeck {
  id: string;
  _id?: string;
  title: string;
  noteId?: string;
  cards: Flashcard[];
  createdAt: string;
  updatedAt: string;
}

interface FlashcardState {
  decks: FlashcardDeck[];
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;

  fetchDecks: () => Promise<void>;
  generateDeck: (text: string, title: string, count?: number) => Promise<FlashcardDeck>;
  toggleBookmark: (deckId: string, cardIndex: number) => Promise<void>;
  setDifficulty: (deckId: string, cardIndex: number, difficulty: Flashcard['difficulty']) => Promise<void>;
  markReviewed: (deckId: string, cardIndex: number) => Promise<void>;
  deleteDeck: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useFlashcardStore = create<FlashcardState>()(
  persist(
    (set, get) => ({
      decks: [],
      isLoading: false,
      isGenerating: false,
      error: null,

      fetchDecks: async () => {
        set({ isLoading: true });
        try {
          const data = await api.get<{ decks: any[] }>('/flashcards');
          const decks = data.decks.map((d) => ({ ...d, id: d._id || d.id }));
          set({ decks, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },

      generateDeck: async (text, title, count = 10) => {
        set({ isGenerating: true, error: null });
        try {
          const rawCards = await geminiService.generateFlashcards(text, count);
          const cards: Flashcard[] = rawCards.map((c) => ({
            ...c,
            isBookmarked: false,
            timesReviewed: 0,
          }));
          const deck: FlashcardDeck = {
            id: Date.now().toString(),
            title,
            cards,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          // Try to save to backend
          try {
            const data = await api.post<{ deck: any }>('/flashcards', { title, cards });
            deck.id = data.deck._id;
          } catch {
            // Offline mode — keep local ID
          }
          set((state) => ({ decks: [deck, ...state.decks], isGenerating: false }));
          return deck;
        } catch (err: any) {
          set({ error: 'Failed to generate flashcards', isGenerating: false });
          throw err;
        }
      },

      toggleBookmark: async (deckId, cardIndex) => {
        const { decks } = get();
        const deck = decks.find((d) => d.id === deckId);
        if (!deck) return;
        const updated = !deck.cards[cardIndex].isBookmarked;
        
        // Update local state optimistically first
        set((state) => ({
          decks: state.decks.map((d) =>
            d.id === deckId
              ? {
                  ...d,
                  cards: d.cards.map((c, i) =>
                    i === cardIndex ? { ...c, isBookmarked: updated } : c
                  ),
                }
              : d
          ),
        }));

        try {
          await api.patch(`/flashcards/${deckId}/cards/${cardIndex}`, { isBookmarked: updated });
        } catch {}
      },

      setDifficulty: async (deckId, cardIndex, difficulty) => {
        // Update local state optimistically first
        set((state) => ({
          decks: state.decks.map((d) =>
            d.id === deckId
              ? {
                  ...d,
                  cards: d.cards.map((c, i) => (i === cardIndex ? { ...c, difficulty } : c)),
                }
              : d
          ),
        }));

        try {
          await api.patch(`/flashcards/${deckId}/cards/${cardIndex}`, { difficulty });
        } catch {}
      },

      markReviewed: async (deckId, cardIndex) => {
        const { decks } = get();
        const deck = decks.find((d) => d.id === deckId);
        if (!deck) return;
        const newCount = (deck.cards[cardIndex].timesReviewed || 0) + 1;

        // Update local state optimistically first
        set((state) => ({
          decks: state.decks.map((d) =>
            d.id === deckId
              ? {
                  ...d,
                  cards: d.cards.map((c, i) =>
                    i === cardIndex
                      ? { ...c, timesReviewed: newCount, lastReviewed: new Date().toISOString() }
                      : c
                  ),
                }
              : d
          ),
        }));

        try {
          await api.patch(`/flashcards/${deckId}/cards/${cardIndex}`, { timesReviewed: newCount });
        } catch {}
      },

      deleteDeck: async (id) => {
        try {
          await api.delete(`/flashcards/${id}`);
        } catch {}
        set((state) => ({ decks: state.decks.filter((d) => d.id !== id) }));
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'flashcard-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ decks: state.decks }),
    }
  )
);
