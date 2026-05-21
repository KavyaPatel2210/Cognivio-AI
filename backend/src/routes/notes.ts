import { Router, Response } from 'express';
import Note from '../models/Note';
import User from '../models/User';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all notes
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notes = await Note.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json({ notes });
  } catch {
    res.status(500).json({ message: 'Failed to fetch notes' });
  }
});

// Create note
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, originalContent, summary, tags, source } = req.body;
    const note = new Note({
      user: req.userId,
      title,
      originalContent,
      summary,
      tags: tags || [],
      source: source || 'paste',
    });
    await note.save();

    // Award XP for creating a note
    await User.findByIdAndUpdate(req.userId, { $inc: { xp: 10 } });

    res.status(201).json({ note });
  } catch {
    res.status(500).json({ message: 'Failed to create note' });
  }
});

// Get single note
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.userId });
    if (!note) {
      res.status(404).json({ message: 'Note not found' });
      return;
    }
    res.json({ note });
  } catch {
    res.status(500).json({ message: 'Failed to fetch note' });
  }
});

// Update note
router.put('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { $set: req.body },
      { new: true }
    );
    if (!note) {
      res.status(404).json({ message: 'Note not found' });
      return;
    }
    res.json({ note });
  } catch {
    res.status(500).json({ message: 'Failed to update note' });
  }
});

// Delete note
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!note) {
      res.status(404).json({ message: 'Note not found' });
      return;
    }
    res.json({ message: 'Note deleted' });
  } catch {
    res.status(500).json({ message: 'Failed to delete note' });
  }
});

export default router;
