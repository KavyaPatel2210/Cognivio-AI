import { api } from './apiClient';

export interface FlashcardData {
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuizQuestion {
  question: string;
  type: 'mcq' | 'true_false' | 'short_answer';
  options?: string[];
  correctAnswer: string;
  explanation?: string;
}

export const geminiService = {
  async summarize(text: string, style: string = 'concise'): Promise<string> {
    const data = await api.post<{ summary: string }>('/ai/summarize', { text, style });
    return data.summary;
  },

  async generateFlashcards(text: string, count: number = 10): Promise<FlashcardData[]> {
    const data = await api.post<{ cards: FlashcardData[] }>('/ai/flashcards', { text, count });
    return Array.isArray(data.cards) ? data.cards : [];
  },

  async generateQuiz(
    text: string,
    options: { count?: number; types?: string[] } = {}
  ): Promise<QuizQuestion[]> {
    const { count = 10, types = ['mcq', 'true_false'] } = options;
    const data = await api.post<{ questions: QuizQuestion[] }>('/ai/quiz', { text, count, types });
    return Array.isArray(data.questions) ? data.questions : [];
  },

  async extractTextFromImage(base64: string): Promise<string> {
    const data = await api.post<{ text: string }>('/ai/ocr', { image: base64 });
    return data.text;
  },
};
