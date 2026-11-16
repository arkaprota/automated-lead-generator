/**
 * Mirrors backend LlmProvider enum.
 * No cross-import from /backend (Rule 1 — strict separation).
 */
export enum LlmProvider {
  GEMINI = 'gemini',
  CLAUDE = 'claude',
  OPENAI = 'openai',
}
