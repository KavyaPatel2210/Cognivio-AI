import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/apiClient';
import { geminiService, QuizQuestion } from '../services/geminiService';

export interface QuizAnswer {
  answer: string;
  timeTaken: number;
  isCorrect?: boolean;
}

export interface Quiz {
  id: string;
  _id?: string;
  title: string;
  noteId?: string;
  questions: QuizQuestion[];
  answers?: QuizAnswer[];
  score?: number;
  accuracy?: number;
  totalTime?: number;
  completedAt?: string;
  createdAt: string;
}

interface QuizState {
  quizzes: Quiz[];
  activeQuiz: Quiz | null;
  currentQuestionIndex: number;
  answers: QuizAnswer[];
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;

  generateQuiz: (text: string, title: string, options?: { count?: number; types?: string[] }) => Promise<Quiz>;
  startQuiz: (quiz: Quiz) => Promise<void>;
  submitAnswer: (answer: string, timeTaken: number) => void;
  finishQuiz: () => Promise<{ score: number; accuracy: number; xpEarned: number }>;
  fetchQuizzes: () => Promise<void>;
  deleteQuiz: (id: string) => Promise<void>;
  resetActive: () => void;
  clearError: () => void;
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      quizzes: [],
      activeQuiz: null,
      currentQuestionIndex: 0,
      answers: [],
      isLoading: false,
      isGenerating: false,
      error: null,

      generateQuiz: async (text, title, options = {}) => {
        set({ isGenerating: true, error: null });
        try {
          const questions = await geminiService.generateQuiz(text, options);
          const quiz: Quiz = {
            id: Date.now().toString(),
            title,
            questions,
            createdAt: new Date().toISOString(),
          };
          try {
            const data = await api.post<{ quiz: any }>('/quiz', { title, questions });
            quiz.id = data.quiz._id;
          } catch {}
          set((state) => ({ quizzes: [quiz, ...state.quizzes], isGenerating: false }));
          return quiz;
        } catch (err: any) {
          set({ error: 'Failed to generate quiz', isGenerating: false });
          throw err;
        }
      },

      startQuiz: async (quiz) => {
        set({ activeQuiz: quiz, currentQuestionIndex: 0, answers: [] });
        if (!quiz.questions || quiz.questions.length === 0) {
          set({ isLoading: true });
          try {
            const data = await api.get<{ quiz: Quiz }>(`/quiz/${quiz.id}`);
            const fullQuiz = { ...data.quiz, id: data.quiz._id || data.quiz.id };
            set((state) => ({
              activeQuiz: fullQuiz,
              quizzes: state.quizzes.map((q) => (q.id === quiz.id ? fullQuiz : q)),
              isLoading: false,
            }));
          } catch (err) {
            console.error('Failed to load quiz details:', err);
            set({ isLoading: false });
          }
        }
      },

      submitAnswer: (answer, timeTaken) => {
        const { activeQuiz, currentQuestionIndex, answers } = get();
        if (!activeQuiz) return;
        const question = activeQuiz.questions[currentQuestionIndex];
        const isCorrect = question.correctAnswer.toLowerCase() === answer.toLowerCase();
        const newAnswer: QuizAnswer = { answer, timeTaken, isCorrect };
        set({
          answers: [...answers, newAnswer],
        });
      },

      finishQuiz: async () => {
        const { activeQuiz, answers } = get();
        if (!activeQuiz) throw new Error('No active quiz');

        const correct = answers.filter((a) => a.isCorrect).length;
        const total = activeQuiz.questions.length;
        const accuracy = Math.round((correct / total) * 100);
        const totalTime = answers.reduce((sum, a) => sum + (a.timeTaken || 0), 0);
        const xpEarned = correct * 5 + (accuracy === 100 ? 50 : 0);

        const completedQuiz: Quiz = {
          ...activeQuiz,
          answers,
          score: correct,
          accuracy,
          totalTime,
          completedAt: new Date().toISOString(),
        };

        try {
          await api.post(`/quiz/${activeQuiz.id}/submit`, { answers, totalTime });
        } catch (apiErr) {
          console.error('Quiz submit API request failed:', apiErr);
        }

        set((state) => ({
          quizzes: state.quizzes.map((q) => (q.id === activeQuiz.id ? completedQuiz : q)),
          activeQuiz: completedQuiz,
        }));

        return { score: correct, accuracy, xpEarned };
      },

      fetchQuizzes: async () => {
        set({ isLoading: true });
        try {
          const data = await api.get<{ quizzes: any[] }>('/quiz');
          const quizzes = data.quizzes.map((q) => ({ ...q, id: q._id || q.id }));
          set({ quizzes, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },

      deleteQuiz: async (id) => {
        try {
          await api.delete(`/quiz/${id}`);
        } catch {}
        set((state) => ({ quizzes: state.quizzes.filter((q) => q.id !== id) }));
      },

      resetActive: () => set({ activeQuiz: null, currentQuestionIndex: 0, answers: [] }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'quiz-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ quizzes: state.quizzes }),
    }
  )
);
