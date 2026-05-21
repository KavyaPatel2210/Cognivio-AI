import mongoose, { Document, Schema } from 'mongoose';

export interface IQuizQuestion {
  question: string;
  type: 'mcq' | 'true_false' | 'short_answer';
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  userAnswer?: string;
  isCorrect?: boolean;
  timeTaken?: number;
}

export interface IQuiz extends Document {
  user: mongoose.Types.ObjectId;
  noteId?: mongoose.Types.ObjectId;
  title: string;
  questions: IQuizQuestion[];
  score?: number;
  totalTime?: number;
  completedAt?: Date;
  accuracy?: number;
  createdAt: Date;
  updatedAt: Date;
}

const QuizQuestionSchema = new Schema<IQuizQuestion>({
  question: { type: String, required: true },
  type: { type: String, enum: ['mcq', 'true_false', 'short_answer'], required: true },
  options: [{ type: String }],
  correctAnswer: { type: String, required: true },
  explanation: { type: String },
  userAnswer: { type: String },
  isCorrect: { type: Boolean },
  timeTaken: { type: Number },
});

const QuizSchema = new Schema<IQuiz>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    noteId: { type: Schema.Types.ObjectId, ref: 'Note', default: null },
    title: { type: String, required: true, trim: true },
    questions: [QuizQuestionSchema],
    score: { type: Number, default: null },
    totalTime: { type: Number, default: null },
    completedAt: { type: Date, default: null },
    accuracy: { type: Number, default: null },
  },
  { timestamps: true }
);

QuizSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model<IQuiz>('Quiz', QuizSchema);
