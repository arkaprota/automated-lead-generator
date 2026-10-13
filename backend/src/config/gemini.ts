import { GoogleGenAI } from '@google/genai';
import { env } from './env.js';

let geminiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: env.GEMINI_API_KEY || 'dummy-dev-key',
    });
  }
  return geminiClient;
}
