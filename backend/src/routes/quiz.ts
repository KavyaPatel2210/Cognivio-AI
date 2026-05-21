import { Router, Response } from 'express';
import mongoose from 'mongoose';
import Quiz from '../models/Quiz';
import User from '../models/User';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all quizzes
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const quizzes = await Quiz.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json({ quizzes });
  } catch (err) {
    console.error('Fetch quizzes error:', err);
    res.status(500).json({ message: 'Failed to fetch quizzes' });
  }
});

// Create quiz
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, questions, noteId } = req.body;
    const quiz = new Quiz({ user: req.userId, title, questions, noteId });
    await quiz.save();
    await User.findByIdAndUpdate(req.userId, { $inc: { xp: 15 } });
    res.status(201).json({ quiz });
  } catch (err) {
    console.error('Create quiz error:', err);
    res.status(500).json({ message: 'Failed to create quiz' });
  }
});

// Get single quiz
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(404).json({ message: 'Quiz not found' });
      return;
    }
    const quiz = await Quiz.findOne({ _id: req.params.id, user: req.userId });
    if (!quiz) {
      res.status(404).json({ message: 'Quiz not found' });
      return;
    }
    res.json({ quiz });
  } catch (err) {
    console.error('Fetch single quiz error:', err);
    res.status(500).json({ message: 'Failed to fetch quiz' });
  }
});

// Submit quiz results
router.post('/:id/submit', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { answers, totalTime } = req.body;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(404).json({ message: 'Quiz not found' });
      return;
    }
    const quiz = await Quiz.findOne({ _id: req.params.id, user: req.userId });
    if (!quiz) {
      res.status(404).json({ message: 'Quiz not found' });
      return;
    }

    let correct = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i]) {
        q.userAnswer = answers[i].answer;
        q.timeTaken = answers[i].timeTaken;
        q.isCorrect = q.correctAnswer.toLowerCase() === answers[i].answer.toLowerCase();
        if (q.isCorrect) correct++;
      }
    });

    quiz.score = correct;
    quiz.accuracy = Math.round((correct / quiz.questions.length) * 100);
    quiz.totalTime = totalTime;
    quiz.completedAt = new Date();
    await quiz.save();

    // Award XP based on score
    const xpEarned = correct * 5 + (quiz.accuracy === 100 ? 50 : 0);
    await User.findByIdAndUpdate(req.userId, { $inc: { xp: xpEarned } });

    res.json({ quiz, xpEarned });
  } catch (err) {
    console.error('Submit quiz error:', err);
    res.status(500).json({ message: 'Failed to submit quiz' });
  }
});

export default router;
