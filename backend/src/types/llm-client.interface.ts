import type { LlmJsonTask } from './llm-json-task.interface.js';

/**
 * Common interface every LLM provider adapter must implement.
 */
export interface LlmClient {
  /** Returns true when the provider's API key is present and the client is usable. */
  isConfigured(): boolean;

  /**
   * Generates a structured JSON response for the given task.
   * Returns the validated T on success, or null if the call fails
   * (caller should then use its heuristic fallback).
   */
  generateJson<T>(task: LlmJsonTask<T>): Promise<T | null>;
}
