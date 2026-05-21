import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  unlockedAt?: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_note', title: 'Note Taker', description: 'Create your first note', icon: '📝', xpReward: 50 },
  { id: 'first_flashcard', title: 'Flash Learner', description: 'Generate your first flashcard deck', icon: '🃏', xpReward: 50 },
  { id: 'first_quiz', title: 'Quiz Master', description: 'Complete your first quiz', icon: '🎯', xpReward: 50 },
  { id: 'perfect_quiz', title: 'Perfect Score!', description: 'Get 100% on a quiz', icon: '🏆', xpReward: 100 },
  { id: 'streak_3', title: '3-Day Streak', description: 'Study 3 days in a row', icon: '🔥', xpReward: 75 },
  { id: 'streak_7', title: 'Week Warrior', description: 'Study 7 days in a row', icon: '⚡', xpReward: 150 },
  { id: 'streak_30', title: 'Monthly Master', description: 'Study 30 days in a row', icon: '💎', xpReward: 500 },
  { id: 'notes_10', title: 'Knowledge Builder', description: 'Create 10 notes', icon: '📚', xpReward: 100 },
  { id: 'cards_reviewed_50', title: 'Card Shark', description: 'Review 50 flashcards', icon: '🎴', xpReward: 75 },
  { id: 'xp_500', title: 'Rising Star', description: 'Earn 500 XP', icon: '⭐', xpReward: 25 },
  { id: 'xp_1000', title: 'Cognivio AI', description: 'Earn 1000 XP', icon: '🌟', xpReward: 50 },
  { id: 'level_5', title: 'Level 5 Scholar', description: 'Reach level 5', icon: '🎓', xpReward: 100 },
];

interface GamificationState {
  xp: number;
  level: number;
  streak: number;
  lastStudyDate: string | null;
  unlockedAchievements: string[];
  totalCardsReviewed: number;
  totalQuizzesDone: number;
  totalNotesCreated: number;
  newlyUnlocked: Achievement | null;

  addXP: (amount: number) => Achievement[];
  checkAndUpdateStreak: () => void;
  recordNoteCreated: () => Achievement[];
  recordFlashcardReview: () => Achievement[];
  recordQuizCompleted: (accuracy: number) => Achievement[];
  dismissNewAchievement: () => void;
  getXPForNextLevel: () => number;
  getXPInCurrentLevel: () => number;
}

export const getLevelFromXP = (xp: number): number => {
  const safeXP = Math.max(0, xp);
  return Math.floor((Math.sqrt(81 + 0.4 * safeXP) - 7) / 2);
};

export const getXPThresholdForLevel = (level: number): number => {
  const safeLevel = Math.max(1, level);
  return 10 * (safeLevel - 1) * (safeLevel + 8);
};

export const getXPRequiredForLevelIncrement = (level: number): number => {
  const safeLevel = Math.max(1, level);
  return 100 + (safeLevel - 1) * 20;
};

export const getXPInCurrentLevel = (xp: number): number => {
  const safeXP = Math.max(0, xp);
  const level = getLevelFromXP(safeXP);
  const threshold = getXPThresholdForLevel(level);
  return safeXP - threshold;
};

export const getXPToNextLevel = (xp: number): number => {
  const safeXP = Math.max(0, xp);
  const level = getLevelFromXP(safeXP);
  const increment = getXPRequiredForLevelIncrement(level);
  const xpInLevel = getXPInCurrentLevel(safeXP);
  return increment - xpInLevel;
};

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      xp: 0,
      level: 1,
      streak: 0,
      lastStudyDate: null,
      unlockedAchievements: [],
      totalCardsReviewed: 0,
      totalQuizzesDone: 0,
      totalNotesCreated: 0,
      newlyUnlocked: null,

      addXP: (amount) => {
        const xp = get().xp || 0;
        const unlockedAchievements = get().unlockedAchievements || [];
        let newXP = xp + amount;
        let newLevel = getLevelFromXP(newXP);
        const newlyUnlocked: Achievement[] = [];

        // Check XP-based achievements
        const xpAchievements = [
          { threshold: 500, id: 'xp_500' },
          { threshold: 1000, id: 'xp_1000' },
        ];
        xpAchievements.forEach(({ threshold, id }) => {
          if (newXP >= threshold && !unlockedAchievements.includes(id)) {
            const ach = ACHIEVEMENTS.find((a) => a.id === id);
            if (ach) newlyUnlocked.push(ach);
          }
        });

        // Level achievements
        if (newLevel >= 5 && !unlockedAchievements.includes('level_5')) {
          const ach = ACHIEVEMENTS.find((a) => a.id === 'level_5');
          if (ach) newlyUnlocked.push(ach);
        }

        // Award achievement XP rewards to final XP
        if (newlyUnlocked.length > 0) {
          const rewardTotal = newlyUnlocked.reduce((sum, ach) => sum + ach.xpReward, 0);
          newXP += rewardTotal;
          newLevel = getLevelFromXP(newXP);
        }

        const newUnlockedIds = newlyUnlocked.map((a) => a.id);
        set({
          xp: newXP,
          level: newLevel,
          unlockedAchievements: [...unlockedAchievements, ...newUnlockedIds],
          newlyUnlocked: newlyUnlocked[0] || get().newlyUnlocked,
        });
        return newlyUnlocked;
      },

      checkAndUpdateStreak: () => {
        const lastStudyDate = get().lastStudyDate;
        const streak = get().streak || 0;
        const now = new Date();
        const today = now.toDateString();
        if (lastStudyDate === today) return;

        let newStreak = 1;
        if (lastStudyDate) {
          const last = new Date(lastStudyDate);
          const diffMs = now.getTime() - last.getTime();
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          if (diffDays === 1) newStreak = streak + 1;
        }

        const unlockedAchievements = get().unlockedAchievements || [];
        const newUnlocked: string[] = [];

        const streakAchs = [
          { days: 3, id: 'streak_3' },
          { days: 7, id: 'streak_7' },
          { days: 30, id: 'streak_30' },
        ];
        streakAchs.forEach(({ days, id }) => {
          if (newStreak >= days && !unlockedAchievements.includes(id)) {
            newUnlocked.push(id);
          }
        });

        const newlyUnlockedStreakAchs = newUnlocked
          .map((id) => ACHIEVEMENTS.find((a) => a.id === id))
          .filter((a): a is Achievement => !!a);
        const rewardTotal = newlyUnlockedStreakAchs.reduce((sum, a) => sum + a.xpReward, 0);

        set({
          streak: newStreak,
          lastStudyDate: today,
          unlockedAchievements: [...unlockedAchievements, ...newUnlocked],
        });

        if (newlyUnlockedStreakAchs.length) {
          set({ newlyUnlocked: newlyUnlockedStreakAchs[0] });
          if (rewardTotal > 0) {
            get().addXP(rewardTotal);
          }
        }
      },

      recordNoteCreated: () => {
        const totalNotesCreated = get().totalNotesCreated || 0;
        const unlockedAchievements = get().unlockedAchievements || [];
        const newCount = totalNotesCreated + 1;
        const newlyUnlocked: Achievement[] = [];

        if (!unlockedAchievements.includes('first_note')) {
          const ach = ACHIEVEMENTS.find((a) => a.id === 'first_note');
          if (ach) newlyUnlocked.push(ach);
        }
        if (newCount >= 10 && !unlockedAchievements.includes('notes_10')) {
          const ach = ACHIEVEMENTS.find((a) => a.id === 'notes_10');
          if (ach) newlyUnlocked.push(ach);
        }

        const newIds = newlyUnlocked.map((a) => a.id);
        set({
          totalNotesCreated: newCount,
          unlockedAchievements: [...unlockedAchievements, ...newIds],
          newlyUnlocked: newlyUnlocked[0] || null,
        });

        const rewardTotal = newlyUnlocked.reduce((sum, ach) => sum + ach.xpReward, 0);
        get().addXP(10 + rewardTotal);
        return newlyUnlocked;
      },

      recordFlashcardReview: () => {
        const totalCardsReviewed = get().totalCardsReviewed || 0;
        const unlockedAchievements = get().unlockedAchievements || [];
        const newCount = totalCardsReviewed + 1;
        const newlyUnlocked: Achievement[] = [];

        if (!unlockedAchievements.includes('first_flashcard')) {
          const ach = ACHIEVEMENTS.find((a) => a.id === 'first_flashcard');
          if (ach) newlyUnlocked.push(ach);
        }
        if (newCount >= 50 && !unlockedAchievements.includes('cards_reviewed_50')) {
          const ach = ACHIEVEMENTS.find((a) => a.id === 'cards_reviewed_50');
          if (ach) newlyUnlocked.push(ach);
        }

        const newIds = newlyUnlocked.map((a) => a.id);
        set({
          totalCardsReviewed: newCount,
          unlockedAchievements: [...unlockedAchievements, ...newIds],
          newlyUnlocked: newlyUnlocked[0] || null,
        });

        const rewardTotal = newlyUnlocked.reduce((sum, ach) => sum + ach.xpReward, 0);
        get().addXP(2 + rewardTotal);
        return newlyUnlocked;
      },

      recordQuizCompleted: (accuracy) => {
        const totalQuizzesDone = get().totalQuizzesDone || 0;
        const unlockedAchievements = get().unlockedAchievements || [];
        const newCount = totalQuizzesDone + 1;
        const newlyUnlocked: Achievement[] = [];

        if (!unlockedAchievements.includes('first_quiz')) {
          const ach = ACHIEVEMENTS.find((a) => a.id === 'first_quiz');
          if (ach) newlyUnlocked.push(ach);
        }
        if (accuracy === 100 && !unlockedAchievements.includes('perfect_quiz')) {
          const ach = ACHIEVEMENTS.find((a) => a.id === 'perfect_quiz');
          if (ach) newlyUnlocked.push(ach);
        }

        const newIds = newlyUnlocked.map((a) => a.id);
        const xpEarned = Math.round((accuracy / 100) * 50) + (accuracy === 100 ? 50 : 0);
        set({
          totalQuizzesDone: newCount,
          unlockedAchievements: [...unlockedAchievements, ...newIds],
          newlyUnlocked: newlyUnlocked[0] || null,
        });

        const rewardTotal = newlyUnlocked.reduce((sum, ach) => sum + ach.xpReward, 0);
        get().addXP(xpEarned + rewardTotal);
        return newlyUnlocked;
      },

      dismissNewAchievement: () => set({ newlyUnlocked: null }),

      getXPForNextLevel: () => {
        const { level = 1 } = get();
        return getXPRequiredForLevelIncrement(level);
      },

      getXPInCurrentLevel: () => {
        const { xp = 0 } = get();
        return getXPInCurrentLevel(xp);
      },
    }),
    {
      name: 'gamification-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Recalculate level dynamically based on hydrated XP using the new formula
          state.level = getLevelFromXP(state.xp || 0);
        }
      },
    }
  )
);
