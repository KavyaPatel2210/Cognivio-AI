# Cognivio AI 🧠⚡

A premium AI-powered learning platform built with **React Native + Expo + TypeScript**.

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 AI Notes Summarizer | Gemini-powered summaries from any text |
| 🃏 3D Flashcard Generator | Interactive flip cards with spaced repetition |
| 🎯 Smart Quiz Generator | MCQ, True/False, Short Answer quizzes |
| 📊 Progress Dashboard | XP system, streaks, analytics |
| 🏆 Gamification | Achievements, badges, XP rewards |
| 🌙 Dark/Light Mode | Persistent theme with system sync |
| 📱 Offline Mode | Full offline access via AsyncStorage |
| 🔔 Push Notifications | Study reminders and streak alerts |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI
- Expo Go app (iOS/Android) or emulator

### Mobile App

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start Expo development server
npm start

# Or run on specific platform
npm run android
npm run ios
```

### Backend API

```bash
cd backend

# Install dependencies
npm install

# Start development server
npm run dev
```

The backend runs on `http://localhost:5000`

## 🔑 Environment Variables

### Mobile App (`.env`)
```
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
EXPO_PUBLIC_GEMINI_PROJECT_ID=your_project_id
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```

### Backend (`backend/.env`)
```
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

## 🏗️ Architecture

```
Cognivio AI/
├── app/                     # Expo Router screens
│   ├── (auth)/             # Auth flow (onboarding, login, signup)
│   └── (tabs)/             # Main app (dashboard, notes, flashcards, quiz, profile)
├── src/
│   ├── components/         # Reusable components
│   │   ├── ui/             # GlassCard, GradientButton, AnimatedInput, Skeleton
│   │   └── gamification/   # Achievement toasts, XP badges
│   ├── store/              # Zustand state management
│   ├── services/           # API client, Gemini AI, Notifications
│   └── theme/              # Colors, typography, ThemeContext
└── backend/                # Node.js/Express/MongoDB API
    └── src/
        ├── models/         # User, Note, Flashcard, Quiz
        ├── routes/         # auth, notes, flashcards, quiz, progress, AI
        └── middleware/     # JWT authentication
```

## 🎨 Design System

- **Colors**: Deep space dark mode with electric blue/purple/cyan gradients
- **UI**: Glassmorphism cards with blur effects and glow shadows  
- **Animations**: Spring animations, 3D card flips, shimmer skeletons
- **Typography**: System fonts with carefully tuned size/weight hierarchy

## 🔌 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native + Expo SDK 54 |
| Language | TypeScript |
| Navigation | Expo Router (file-based) |
| State | Zustand + persist middleware |
| AI | Google Gemini 1.5 Flash |
| Storage | AsyncStorage + Expo SecureStore |
| Animations | React Native Reanimated |
| Backend | Node.js + Express + MongoDB |
| Auth | JWT + bcrypt |
