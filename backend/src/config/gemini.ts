import { GoogleGenAI } from '@google/genai';
import { env } from './env.js';
import { IntegrationNotConfiguredError } from '../errors/integration-not-configured.error.js';

let geminiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!env.GEMINI_API_KEY) throw new IntegrationNotConfiguredError('ai');
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: env.GEMINI_API_KEY,
    });
  }
  return geminiClient;
}
