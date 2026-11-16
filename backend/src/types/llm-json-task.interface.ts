import type { ZodSchema } from 'zod';

/**
 * Describes a single structured JSON generation task passed to any LLM adapter.
 * T is the TypeScript type the zodSchema validates against.
 */
export interface LlmJsonTask<T> {
  /** Human-readable task name used in logs */
  name: string;
  /** Full prompt text */
  prompt: string;
  /** Zod schema used to validate the parsed JSON response */
  zodSchema: ZodSchema<T>;
  /** Hard cap on output tokens. Keep small — adapters enforce this. */
  maxOutputTokens: number;
}
