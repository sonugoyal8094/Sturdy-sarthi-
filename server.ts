import express, { type Request, type Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import {
  validateSolveRequest,
  validateChatRequest,
  validatePracticeRequest,
  cleanBase64,
} from './src/utils/solver-logic.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Resilient generate helper that falls back gracefully if a model experiences 503 high demand
async function callGeminiWithFallback(params: {
  contents: any;
  config?: any;
}) {
  const models = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
  let lastError: any = null;

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });
      if (response && response.text) {
        return response;
      }
    } catch (err: any) {
      console.warn(`Model ${model} failed:`, err?.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error('All AI models failed to return a response.');
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // Body parser supporting up to 10MB base64 images
  app.use(express.json({ limit: '10mb' }));

  // API Health Check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'StudySaathi AI Student Solver Backend',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      model: 'gemini-3.1-flash-lite',
      timestamp: new Date().toISOString(),
    });
  });

  // POST /api/solve - Solves a question via text and/or image
  app.post('/api/solve', async (req: Request, res: Response) => {
    try {
      const validation = validateSolveRequest(req.body);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      const {
        question = '',
        imageBase64,
        mimeType = 'image/jpeg',
        subject = 'General Academic',
        difficulty = 'Medium',
        language = 'English',
      } = req.body;

      if (!apiKey) {
        return res.status(500).json({
          error: 'GEMINI_API_KEY is not configured on the server. Please check your environment settings.',
        });
      }

      // Educational system instruction for StudySaathi
      const systemInstruction = `You are "StudySaathi", an empathetic, highly encouraging, world-class academic mentor and tutor.
Your mission is to help school and college students genuinely understand concepts, not just copy answers.
Guidelines:
1. Always break down complex problems into clear, numbered, bite-sized steps.
2. Highlight formulas, theorems, and core concepts clearly.
3. Language preference: ${language}. If "Hinglish", use a friendly blend of Hindi and English like top Indian educators (e.g. "Pehle hum equation ko standard form mein likhte hain..."). If "Hindi", write in clear Hindi. If "English", write in clear academic English.
4. Difficulty Level: ${difficulty}. For Easy, explain every single arithmetic/logical move. For Hard, provide advanced rigor and alternate shortcut tips.
5. Identify common pitfalls or traps students often fall into.
6. Return purely valid JSON strictly matching the schema provided.`;

      const promptText = `
Student Question Details:
- Subject: ${subject}
- Target Difficulty: ${difficulty}
- Explaining Language: ${language}
- User Typed Query / Notes: ${question || '(See attached image question)'}

Tasks:
1. If an image is attached, accurately transcribe/extract the academic question into 'extracted_question'. If only text was provided, reflect the normalized question in 'extracted_question'.
2. Identify the specific academic subject and sub-topic.
3. Summarize the core rule, formula, or concept needed.
4. Provide step-by-step reasoning where each step has a clear title and understandable explanation.
5. State the direct final answer prominently.
6. Provide a pro tip or common pitfall to watch out for.
7. Provide 2-3 natural follow-up doubts a curious student might ask.
`;

      const contentsParts: any[] = [];

      if (imageBase64) {
        const cleanedData = cleanBase64(imageBase64);
        contentsParts.push({
          inlineData: {
            mimeType: mimeType,
            data: cleanedData,
          },
        });
      }

      contentsParts.push({ text: promptText });

      const response = await callGeminiWithFallback({
        contents: { parts: contentsParts },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              extracted_question: {
                type: Type.STRING,
                description: 'The exact question text extracted from the image or provided by student',
              },
              subject: {
                type: Type.STRING,
                description: 'Detected or verified subject',
              },
              topic: {
                type: Type.STRING,
                description: 'Specific topic name e.g. Linear Equations, Optics, Grammar',
              },
              difficulty: {
                type: Type.STRING,
                description: 'Target difficulty level',
              },
              concept_summary: {
                type: Type.STRING,
                description: 'The key formula, law, or core concept required to solve this',
              },
              steps: {
                type: Type.ARRAY,
                description: 'Step-by-Step explanation',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    step_number: { type: Type.INTEGER },
                    title: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    math_or_formula: { type: Type.STRING },
                  },
                  required: ['step_number', 'title', 'explanation'],
                },
              },
              final_answer: {
                type: Type.STRING,
                description: 'The highlighted final conclusion or solution',
              },
              pro_tip_or_common_pitfall: {
                type: Type.STRING,
                description: 'A helpful student tip, shortcut, or common mistake to avoid',
              },
              suggested_followups: {
                type: Type.ARRAY,
                description: 'Suggested follow-up questions',
                items: { type: Type.STRING },
              },
            },
            required: [
              'extracted_question',
              'subject',
              'topic',
              'concept_summary',
              'steps',
              'final_answer',
            ],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('AI solver did not return any response.');
      }

      const parsedData = JSON.parse(responseText.trim());
      return res.json({
        success: true,
        solution: parsedData,
      });
    } catch (err: any) {
      console.error('Error in /api/solve:', err);
      return res.status(500).json({
        error: err?.message || 'Failed to generate solution. Please try again or check your question image.',
      });
    }
  });

  // POST /api/practice - Generate similar practice questions
  app.post('/api/practice', async (req: Request, res: Response) => {
    try {
      const validation = validatePracticeRequest(req.body);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      const { topic, subject = 'General Academic', difficulty = 'Medium', count = 3 } = req.body;

      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
      }

      const response = await callGeminiWithFallback({
        contents: `Create ${count} high-quality multiple choice practice questions for students on the topic: "${topic}" (Subject: ${subject}, Difficulty: ${difficulty}).
Ensure 4 plausible options, a helpful hint, and a step-by-step explanation for the correct answer.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    question: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    correct_answer: { type: Type.STRING },
                    hint: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                  },
                  required: ['id', 'question', 'options', 'correct_answer', 'explanation'],
                },
              },
            },
            required: ['topic', 'questions'],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Failed to generate practice questions.');
      }

      return res.json({
        success: true,
        data: JSON.parse(responseText.trim()),
      });
    } catch (err: any) {
      console.error('Error in /api/practice:', err);
      return res.status(500).json({
        error: err?.message || 'Failed to generate practice questions.',
      });
    }
  });

  // POST /api/chat - Conversational follow-up doubts
  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const validation = validateChatRequest(req.body);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }

      const { message, problemContext = '', history = [], language = 'English' } = req.body;

      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
      }

      const systemInstruction = `You are StudySaathi, a friendly and encouraging academic tutor.
The student is asking a follow-up doubt about a problem you recently solved together.
Problem Context: ${problemContext}
Language preference: ${language}.
Provide a concise, direct, crystal-clear explanation that directly answers their doubt without repeating unnecessary background information. Be supportive and warm.`;

      // Build chat contents
      const conversationContents: any[] = [];
      if (Array.isArray(history)) {
        for (const item of history.slice(-6)) {
          if (item.role && item.text) {
            conversationContents.push({
              role: item.role === 'user' ? 'user' : 'model',
              parts: [{ text: item.text }],
            });
          }
        }
      }
      conversationContents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      const response = await callGeminiWithFallback({
        contents: conversationContents,
        config: {
          systemInstruction,
        },
      });

      const reply = response.text || 'I could not generate an answer to that doubt. Please try rephrasing.';
      return res.json({
        success: true,
        reply,
      });
    } catch (err: any) {
      console.error('Error in /api/chat:', err);
      return res.status(500).json({
        error: err?.message || 'Failed to answer follow-up question.',
      });
    }
  });

  // Mount Vite or serve static assets
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StudySaathi server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
