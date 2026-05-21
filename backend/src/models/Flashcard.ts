import mongoose, { Document, Schema } from 'mongoose';

export interface IFlashcard {
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  isBookmarked: boolean;
  timesReviewed: number;
  lastReviewed?: Date;
}

export interface IFlashcardDeck extends Document {
  user: mongoose.Types.ObjectId;
  noteId?: mongoose.Types.ObjectId;
  title: string;
  cards: IFlashcard[];
  createdAt: Date;
  updatedAt: Date;
}

const FlashcardSchema = new Schema<IFlashcard>({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  isBookmarked: { type: Boolean, default: false },
  timesReviewed: { type: Number, default: 0 },
  lastReviewed: { type: Date, default: null },
});

const FlashcardDeckSchema = new Schema<IFlashcardDeck>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    noteId: { type: Schema.Types.ObjectId, ref: 'Note', default: null },
    title: { type: String, required: true, trim: true },
    cards: [FlashcardSchema],
  },
  { timestamps: true }
);

FlashcardDeckSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model<IFlashcardDeck>('FlashcardDeck', FlashcardDeckSchema);
