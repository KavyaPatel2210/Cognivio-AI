import { Router, Response } from 'express';
import FlashcardDeck from '../models/Flashcard';
import User from '../models/User';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all decks
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const decks = await FlashcardDeck.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json({ decks });
  } catch {
    res.status(500).json({ message: 'Failed to fetch decks' });
  }
});

// Create deck
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, cards, noteId } = req.body;
    const deck = new FlashcardDeck({ user: req.userId, title, cards, noteId });
    await deck.save();
    await User.findByIdAndUpdate(req.userId, { $inc: { xp: 20 } });
    res.status(201).json({ deck });
  } catch {
    res.status(500).json({ message: 'Failed to create deck' });
  }
});

// Get single deck
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const deck = await FlashcardDeck.findOne({ _id: req.params.id, user: req.userId });
    if (!deck) {
      res.status(404).json({ message: 'Deck not found' });
      return;
    }
    res.json({ deck });
  } catch {
    res.status(500).json({ message: 'Failed to fetch deck' });
  }
});

// Update card (bookmark, difficulty, review)
router.patch('/:deckId/cards/:cardIndex', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const deck = await FlashcardDeck.findOne({ _id: req.params.deckId, user: req.userId });
    if (!deck) {
      res.status(404).json({ message: 'Deck not found' });
      return;
    }
    const cardIndex = parseInt(req.params.cardIndex);
    if (cardIndex < 0 || cardIndex >= deck.cards.length) {
      res.status(400).json({ message: 'Invalid card index' });
      return;
    }
    const { isBookmarked, difficulty, timesReviewed } = req.body;
    if (typeof isBookmarked !== 'undefined') deck.cards[cardIndex].isBookmarked = isBookmarked;
    if (difficulty) deck.cards[cardIndex].difficulty = difficulty;
    if (typeof timesReviewed !== 'undefined') {
      deck.cards[cardIndex].timesReviewed = timesReviewed;
      deck.cards[cardIndex].lastReviewed = new Date();
      await User.findByIdAndUpdate(req.userId, { $inc: { xp: 2 } });
    }
    await deck.save();
    res.json({ deck });
  } catch {
    res.status(500).json({ message: 'Failed to update card' });
  }
});

// Delete deck
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await FlashcardDeck.findOneAndDelete({ _id: req.params.id, user: req.userId });
    res.json({ message: 'Deck deleted' });
  } catch {
    res.status(500).json({ message: 'Failed to delete deck' });
  }
});

export default router;
