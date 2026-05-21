import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  xp: number;
  level: number;
  streak: number;
  lastStudyDate?: Date;
  achievements: string[];
  preferences: {
    theme: 'dark' | 'light';
    notifications: boolean;
    studyReminder?: string;
  };
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Dynamic XP Level Calculation Helpers
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

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    avatar: { type: String, default: null },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    streak: { type: Number, default: 0 },
    lastStudyDate: { type: Date, default: null },
    achievements: [{ type: String }],
    preferences: {
      theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
      notifications: { type: Boolean, default: true },
      studyReminder: { type: String, default: '09:00' },
    },
    rating: { type: Number, default: null },
  },
  { timestamps: true }
);

// Recalculate level dynamically on serialization
UserSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.level = getLevelFromXP(ret.xp);
    return ret;
  }
});

// Hash password and calculate level before save
UserSchema.pre('save', async function (next) {
  this.level = getLevelFromXP(this.xp);
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
