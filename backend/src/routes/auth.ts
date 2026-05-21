import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET as string,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
  );
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '30d') as any }
  );
  return { accessToken, refreshToken };
};

// Register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { name, email, password } = req.body;
      const existing = await User.findOne({ email });
      if (existing) {
        res.status(409).json({ message: 'Email already registered' });
        return;
      }

      const user = new User({ name, email, password });
      await user.save();

      const { accessToken, refreshToken } = generateTokens(user._id.toString());
      res.status(201).json({
        message: 'Account created successfully',
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          xp: user.xp,
          level: user.level,
          streak: user.streak,
          achievements: user.achievements,
          preferences: user.preferences,
          rating: user.rating,
        },
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ message: 'Registration failed' });
    }
  }
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user || !(await user.comparePassword(password))) {
        res.status(401).json({ message: 'Invalid email or password' });
        return;
      }

      // Update streak
      const now = new Date();
      const lastStudy = user.lastStudyDate;
      if (lastStudy) {
        const diffDays = Math.floor((now.getTime() - lastStudy.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          user.streak += 1;
        } else if (diffDays > 1) {
          user.streak = 1;
        }
      } else {
        user.streak = 1;
      }
      user.lastStudyDate = now;
      await user.save();

      const { accessToken, refreshToken } = generateTokens(user._id.toString());
      res.json({
        message: 'Login successful',
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          xp: user.xp,
          level: user.level,
          streak: user.streak,
          achievements: user.achievements,
          preferences: user.preferences,
          rating: user.rating,
        },
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ message: 'Login failed' });
    }
  }
);

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({ user: req.user });
});

// Refresh token
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(401).json({ message: 'Refresh token required' });
      return;
    }
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string };
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);
    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

// Update preferences
router.patch('/preferences', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { theme, notifications, studyReminder } = req.body;
    if (theme) user.preferences.theme = theme;
    if (typeof notifications !== 'undefined') user.preferences.notifications = notifications;
    if (studyReminder) user.preferences.studyReminder = studyReminder;
    await user.save();
    res.json({ preferences: user.preferences });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update preferences' });
  }
});

// Rate the app
router.post('/rate', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { rating } = req.body;
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      res.status(400).json({ message: 'Rating must be a number between 1 and 5' });
      return;
    }
    user.rating = rating;
    await user.save();
    res.json({ message: 'Rating saved successfully', rating });
  } catch (err) {
    console.error('Rate app error:', err);
    res.status(500).json({ message: 'Failed to save rating' });
  }
});

export default router;
