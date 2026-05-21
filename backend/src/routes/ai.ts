import { Router, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { authenticate, AuthRequest } from '../middleware/auth';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// Summarize text
router.post('/summarize', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { text, style = 'concise' } = req.body;
    if (!text || text.trim().length < 20) {
      res.status(400).json({ message: 'Please provide at least 20 characters of text' });
      return;
    }

    const prompt = `You are an expert study assistant. Summarize the following notes in a ${style} manner, highlighting key concepts, important dates, definitions, and main takeaways. Format with clear sections.

Notes:
${text}

Provide a well-structured summary with:
1. Key Points (bullet list)
2. Main Concepts (brief explanations)
3. Summary Paragraph`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();
    res.json({ summary });
  } catch (err) {
    console.error('Summarize error:', err);
    res.status(500).json({ message: 'Failed to generate summary' });
  }
});

// Generate flashcards
router.post('/flashcards', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { text, count = 10 } = req.body;
    if (!text || text.trim().length < 50) {
      res.status(400).json({ message: 'Please provide at least 50 characters of text' });
      return;
    }

    const prompt = `Generate exactly ${count} high-quality flashcards from the following study material. Each flashcard should test an important concept.

Study Material:
${text}

Return ONLY a valid JSON array with this exact format, no markdown, no extra text:
[
  {
    "question": "Clear, specific question",
    "answer": "Concise, accurate answer",
    "difficulty": "easy" | "medium" | "hard"
  }
]`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      res.status(500).json({ message: 'Failed to parse flashcards' });
      return;
    }
    
    const cards = JSON.parse(jsonMatch[0]);
    res.json({ cards });
  } catch (err) {
    console.error('Flashcard error:', err);
    res.status(500).json({ message: 'Failed to generate flashcards' });
  }
});

// Generate quiz
router.post('/quiz', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { text, types = ['mcq', 'true_false'], count = 10 } = req.body;
    if (!text || text.trim().length < 50) {
      res.status(400).json({ message: 'Please provide at least 50 characters of text' });
      return;
    }

    const typeInstructions = types.map((t: string) => {
      if (t === 'mcq') return 'Multiple choice questions with 4 options (A, B, C, D)';
      if (t === 'true_false') return 'True/False questions';
      if (t === 'short_answer') return 'Short answer questions';
      return t;
    }).join(', ');

    const prompt = `Generate exactly ${count} quiz questions from the following study material. Include: ${typeInstructions}.

Study Material:
${text}

Return ONLY a valid JSON array with this exact format, no markdown:
[
  {
    "question": "Question text",
    "type": "mcq" | "true_false" | "short_answer",
    "options": ["A. Option", "B. Option", "C. Option", "D. Option"] (only for mcq),
    "correctAnswer": "Full correct answer text",
    "explanation": "Brief explanation of why this is correct"
  }
]`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      res.status(500).json({ message: 'Failed to parse quiz' });
      return;
    }
    
    const questions = JSON.parse(jsonMatch[0]);
    
    // Normalize quiz questions
    const normalizedQuestions = Array.isArray(questions)
      ? questions.map((q: any) => {
          const type = q.type || 'mcq';
          const correctAnswer = q.correctAnswer || q.correct_answer || q.correct || q.answer || q.rightAnswer || '';
          let options = q.options;
          if (type === 'mcq' && !Array.isArray(options)) {
            options = [];
          }
          return {
            question: q.question || 'Untitled Question',
            type,
            options,
            correctAnswer: String(correctAnswer),
            explanation: q.explanation || '',
          };
        }).filter((q: any) => q.question && q.correctAnswer)
      : [];

    res.json({ questions: normalizedQuestions });
  } catch (err) {
    console.error('Quiz error:', err);
    res.status(500).json({ message: 'Failed to generate quiz' });
  }
});

// Extract text from image (OCR)
router.post('/ocr', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { image } = req.body;
    if (!image) {
      res.status(400).json({ message: 'Please provide a base64 image string' });
      return;
    }
    const imagePart = {
      inlineData: {
        data: image,
        mimeType: 'image/jpeg' as const,
      },
    };
    const result = await model.generateContent([
      'Extract all text from this image. Return only the extracted text, preserving structure as much as possible.',
      imagePart,
    ]);
    const text = result.response.text();
    res.json({ text });
  } catch (err) {
    console.error('OCR error:', err);
    res.status(500).json({ message: 'Failed to extract text from image' });
  }
});

export default router;
