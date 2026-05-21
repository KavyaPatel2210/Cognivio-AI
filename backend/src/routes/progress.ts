import { Router, Response } from 'express';
import User, { getLevelFromXP, getXPInCurrentLevel, getXPToNextLevel } from '../models/User';
import Note from '../models/Note';
import Quiz from '../models/Quiz';
import FlashcardDeck from '../models/Flashcard';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Get full progress stats
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const [noteCount, deckCount, quizResults] = await Promise.all([
      Note.countDocuments({ user: userId }),
      FlashcardDeck.countDocuments({ user: userId }),
      Quiz.find({ user: userId, completedAt: { $ne: null } })
        .select('score accuracy totalTime completedAt questions')
        .sort({ completedAt: -1 })
        .limit(10),
    ]);

    const avgAccuracy =
      quizResults.length > 0
        ? Math.round(quizResults.reduce((sum, q) => sum + (q.accuracy || 0), 0) / quizResults.length)
        : 0;

    // Level calculation dynamically using new formulas
    const level = getLevelFromXP(user.xp);
    const xpInCurrentLevel = getXPInCurrentLevel(user.xp);
    const xpToNextLevel = getXPToNextLevel(user.xp);

    res.json({
      user: {
        name: user.name,
        xp: user.xp,
        level,
        xpInCurrentLevel,
        xpToNextLevel,
        streak: user.streak,
        achievements: user.achievements,
      },
      stats: {
        totalNotes: noteCount,
        totalDecks: deckCount,
        totalQuizzes: quizResults.length,
        avgAccuracy,
        recentQuizzes: quizResults,
      },
    });
  } catch {
    res.status(500).json({ message: 'Failed to fetch progress' });
  }
});

// Award achievement
router.post('/achievement', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { achievement } = req.body;
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    if (!user.achievements.includes(achievement)) {
      user.achievements.push(achievement);
      user.xp += 50;
      await user.save();
      res.json({ unlocked: true, xpEarned: 50, achievements: user.achievements });
    } else {
      res.json({ unlocked: false });
    }
  } catch {
    res.status(500).json({ message: 'Failed to award achievement' });
  }
});

export default router;
