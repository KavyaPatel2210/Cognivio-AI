import mongoose, { Document, Schema } from 'mongoose';

export interface INote extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  originalContent: string;
  summary?: string;
  tags: string[];
  source: 'paste' | 'upload' | 'ocr';
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    originalContent: { type: String, required: true },
    summary: { type: String, default: null },
    tags: [{ type: String }],
    source: { type: String, enum: ['paste', 'upload', 'ocr'], default: 'paste' },
  },
  { timestamps: true }
);

NoteSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model<INote>('Note', NoteSchema);
