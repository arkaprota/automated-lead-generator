---
name: claude-api
description: Minimal Claude/Anthropic API reference for this TypeScript/Node.js project.
model: haiku-5-5
tools: []
---

This project uses @anthropic-ai/sdk (TypeScript). Key facts only:

- Client: `new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })`
- Model: `claude-opus-5-5` (quality) or `claude-haiku-5-5` (cost)
- Messages: `client.messages.create({ model, max_tokens, messages })`
- Structured output: use `tools` + `tool_choice: { type: "tool" }` for JSON
- Streaming: `client.messages.stream({...}).finalMessage()`
- Thinking: `thinking: { type: "adaptive" }` on Opus 5.5+ only

For migration guides, pricing, or advanced patterns fetch the live docs
rather than loading a heavier skill.

SKIP: This repo already implements multi-LLM (Gemini / Claude / OpenAI)
via `backend/src/services/llm/`. Do not trigger for edits to those files.
