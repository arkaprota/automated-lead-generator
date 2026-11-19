/**
 * AiService — multi-provider AI orchestration layer.
 *
 * Replaces the old GeminiService. Routes each of the four AI tasks
 * through the selected LLM provider (Gemini | Claude | OpenAI).
 *
 * Token-efficiency measures baked in (Rule 12):
 *  - Heuristic shortcuts run before any LLM call.
 *  - Query expansion results are Redis-cached 24h per workspace+provider+demographic.
 *  - Leads are scored in batches (up to BATCH_SIZE per request).
 *  - Per-task max output tokens are small and explicit.
 *  - Reply text is cleaned (stripped of quotes/signatures) before classification.
 *  - Max one retry on transient failure, then heuristic fallback.
 */

import { getLlmClient } from './llm/llm-client.factory.js';
import { LlmCacheService } from './llm/llm-cache.service.js';
import { cleanReplyText } from '../utils/clean-reply-text.util.js';
import { queryExpansionSchema } from '../schemas/ai/query-expansion.schema.js';
import { leadScoringSchema } from '../schemas/ai/lead-scoring.schema.js';
import { brochurePitchSchema } from '../schemas/ai/brochure-pitch.schema.js';
import { replyClassificationSchema } from '../schemas/ai/reply-classification.schema.js';
import type {
  QueryExpansionResponse,
  LeadScoringResponse,
  BrochurePitchResponse,
  ReplyClassificationResponse,
  RawScrapedLead,
} from '../types/index.js';
import { ReplyIntent } from '../enums/reply-intent.enum.js';
import { IntegrationNotConfiguredError } from '../errors/integration-not-configured.error.js';

/** Max leads to score in a single batch request */
const BATCH_SIZE = 10;

export class AiService {
  // ─────────────────────────────────────────────
  // Pipeline 1, Step A — Query Expansion
  // ─────────────────────────────────────────────
  static async expandTargetDemographic(
    demographic: string,
    provider?: string | null,
    workspaceId = 'default'
  ): Promise<string[]> {
    // Cache hit — zero tokens spent (Rule 12)
    const cached = await LlmCacheService.get<string[]>(
      workspaceId, provider || 'gemini', 'query-expansion', demographic
    );
    if (cached) return cached;

    const client = getLlmClient(provider);
    if (!client.isConfigured()) {
      return AiService._templateQueries(demographic);
    }

    const result = await client.generateJson({
      name: 'query-expansion',
      prompt: `You are a B2B Lead Generation specialist.
Translate the following target demographic into exactly 5 specific, high-intent Google Maps search queries for local business scraping.
Target demographic: "${demographic}".
Return JSON: { "queries": ["query 1", "query 2", "query 3", "query 4", "query 5"], "rationale": "short explanation" }`,
      zodSchema: queryExpansionSchema,
      maxOutputTokens: 300,
    });

    const queries = result?.queries?.slice(0, 5) ?? AiService._templateQueries(demographic);

    // Cache result for 24 h (Rule 12)
    await LlmCacheService.set(workspaceId, provider || 'gemini', 'query-expansion', demographic, queries);
    return queries;
  }

  // ─────────────────────────────────────────────
  // Pipeline 1, Step C — Lead Scoring (single)
  // ─────────────────────────────────────────────
  static async scoreAndQualifyLead(
    lead: RawScrapedLead,
    provider?: string | null
  ): Promise<LeadScoringResponse> {
    // Heuristic shortcut — no-website leads are always hot, no LLM needed (Rule 12)
    const hasWebsite = Boolean(lead.website?.trim());
    if (!hasWebsite) {
      return AiService._noWebsiteHotLead();
    }

    const client = getLlmClient(provider);
    if (!client.isConfigured()) {
      return AiService._unscored('AI provider not configured');
    }

    const result = await client.generateJson({
      name: 'lead-scoring',
      prompt: AiService._scoringPrompt(lead),
      zodSchema: leadScoringSchema,
      maxOutputTokens: 200,
    });

    return result ?? AiService._unscored('AI scoring failed');
  }

  // ─────────────────────────────────────────────
  // Pipeline 1, Step C — Lead Scoring (batch)
  // Up to BATCH_SIZE leads per LLM call (Rule 12)
  // ─────────────────────────────────────────────
  static async scoreAndQualifyLeadsBatch(
    leads: RawScrapedLead[],
    provider?: string | null
  ): Promise<LeadScoringResponse[]> {
    if (leads.length === 0) return [];

    const results: LeadScoringResponse[] = new Array(leads.length);
    const needsAi: { idx: number; lead: RawScrapedLead }[] = [];

    // Shortcut no-website leads without LLM (Rule 12)
    for (let i = 0; i < leads.length; i++) {
      if (!leads[i].website?.trim()) {
        results[i] = AiService._noWebsiteHotLead();
      } else {
        needsAi.push({ idx: i, lead: leads[i] });
      }
    }

    if (needsAi.length === 0) return results;

    const client = getLlmClient(provider);
    if (!client.isConfigured()) {
      for (const { idx } of needsAi) results[idx] = AiService._unscored('AI provider not configured');
      return results;
    }

    // Process in chunks of BATCH_SIZE
    for (let start = 0; start < needsAi.length; start += BATCH_SIZE) {
      const chunk = needsAi.slice(start, start + BATCH_SIZE);
      const batchResult = await AiService._scoreBatch(chunk.map((c) => c.lead), client);
      for (let j = 0; j < chunk.length; j++) {
        results[chunk[j].idx] = batchResult[j];
      }
    }

    return results;
  }

  // ─────────────────────────────────────────────
  // Pipeline 2 — Brochure Pitch Generation
  // ─────────────────────────────────────────────
  static async generateBrochurePitch(
    lead: RawScrapedLead,
    senderCompanyName: string,
    senderPitchAngle?: string,
    provider?: string | null
  ): Promise<BrochurePitchResponse> {
    const client = getLlmClient(provider);
    if (!client.isConfigured()) {
      throw new IntegrationNotConfiguredError('ai');
    }

    const result = await client.generateJson({
      name: 'brochure-pitch',
      prompt: `Generate a personalized pitch brochure for cold outreach.
Prospect: ${lead.businessName}
Industry: ${(lead.categories || []).join(', ') || 'Local Business'}
Prospect Website: ${lead.website || 'None'}
Sender Agency: ${senderCompanyName}
Pitch Angle: ${senderPitchAngle || 'High-conversion web design and lead generation'}
Return JSON: { "headline": "...", "painPoints": ["...", "...", "..."], "tailoredSolution": "...", "estimatedRoi": "...", "callToAction": "..." }`,
      zodSchema: brochurePitchSchema,
      maxOutputTokens: 800,
    });

    if (!result) throw new IntegrationNotConfiguredError('ai', 'unavailable');
    return result;
  }

  // ─────────────────────────────────────────────
  // Pipeline 3 — Reply Intent Classification
  // ─────────────────────────────────────────────
  static async classifyReplyIntent(
    rawReplyText: string,
    provider?: string | null
  ): Promise<ReplyClassificationResponse> {
    // Strip quoted history / signatures before sending (Rule 12 — trim inputs)
    const cleanText = cleanReplyText(rawReplyText);

    // Heuristic fallback when no key
    const client = getLlmClient(provider);
    if (!client.isConfigured()) {
      return AiService._heuristicClassify(cleanText);
    }

    const result = await client.generateJson({
      name: 'reply-classification',
      prompt: `Classify the intent of this cold email prospect reply:
"""
${cleanText}
"""
Intent options: INTERESTED (wants demo/pricing/call), NOT_INTERESTED (says no / asks to unsubscribe), QUESTION (asks for clarification), NEUTRAL (OOO / ambiguous).
Return JSON: { "intent": "...", "confidence": 0.0-1.0, "summary": "one sentence", "suggestedAction": "next step" }`,
      zodSchema: replyClassificationSchema,
      maxOutputTokens: 150,
    });

    return result ?? AiService._heuristicClassify(cleanText);
  }

  // ─────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────

  private static async _scoreBatch(
    leads: RawScrapedLead[],
    client: Awaited<ReturnType<typeof getLlmClient>>
  ): Promise<LeadScoringResponse[]> {
    // Build a single prompt for the whole batch (Rule 12 — batch)
    const leadsJson = leads.map((l, i) => ({
      index: i,
      name: l.businessName,
      website: l.website || null,
      phone: l.phone || null,
      rating: l.rating ?? null,
      categories: l.categories || [],
    }));

    const batchSchema = leadScoringSchema
      .array()
      .min(leads.length)
      .max(leads.length);

    const result = await client.generateJson({
      name: 'lead-scoring-batch',
      prompt: `Score and qualify each of these ${leads.length} B2B leads for cold outreach. For any lead with website=null, set qualificationStatus="hot" and leadScore>=85.
Leads: ${JSON.stringify(leadsJson)}
Return a JSON array of exactly ${leads.length} objects, one per lead in the same order:
[{ "leadScore": 0-100, "qualificationStatus": "hot|warm|cold|disqualified", "reasons": ["..."], "keyStrengths": ["..."], "recommendedPitchAngle": "..." }, ...]`,
      zodSchema: batchSchema,
      maxOutputTokens: leads.length * 200,
    });

    if (!result || result.length !== leads.length) {
      return leads.map(() => AiService._unscored('AI scoring failed'));
    }
    return result;
  }

  private static _templateQueries(demographic: string): string[] {
    return [
      `${demographic} agencies`,
      `Top rated ${demographic}`,
      `Local businesses in ${demographic}`,
      `${demographic} corporate offices`,
      `${demographic} commercial services`,
    ];
  }

  /** Rule 12 deterministic shortcut: a missing website is a fact, scored hot without AI. */
  private static _noWebsiteHotLead(): LeadScoringResponse {
    return {
      leadScore: 92,
      qualificationStatus: 'hot',
      reasons: ['No website listed'],
      keyStrengths: [],
      recommendedPitchAngle: 'Website and local search presence',
    };
  }

  /** Honest "not scored" state — no invented score when AI is unavailable. */
  private static _unscored(reason: string): LeadScoringResponse {
    return {
      leadScore: 0,
      qualificationStatus: 'unqualified',
      reasons: [`Not scored — ${reason}`],
      keyStrengths: [],
      recommendedPitchAngle: '',
    };
  }

  private static _heuristicClassify(text: string): ReplyClassificationResponse {
    const lower = text.toLowerCase();
    if (lower.includes('interested') || lower.includes('yes') || lower.includes('call') || lower.includes('demo') || lower.includes('quote')) {
      return { intent: ReplyIntent.INTERESTED, confidence: 0.95, summary: 'Prospect expressed positive interest.', suggestedAction: 'Schedule follow-up call immediately.' };
    }
    if (lower.includes('unsubscribe') || lower.includes('not interested') || lower.includes('remove') || lower.includes('stop')) {
      return { intent: ReplyIntent.NOT_INTERESTED, confidence: 0.98, summary: 'Prospect requested removal.', suggestedAction: 'Unsubscribe lead from future campaigns.' };
    }
    if (lower.includes('?') || lower.includes('how much') || lower.includes('pricing') || lower.includes('what')) {
      return { intent: ReplyIntent.QUESTION, confidence: 0.88, summary: 'Prospect has a clarifying question.', suggestedAction: 'Answer question and provide scheduling link.' };
    }
    return { intent: ReplyIntent.NEUTRAL, confidence: 0.7, summary: 'General or unclassified response.', suggestedAction: 'Review email manually.' };
  }

  private static _scoringPrompt(lead: RawScrapedLead): string {
    return `Score this B2B lead for cold outreach services:
Name: ${lead.businessName}
Website: ${lead.website || 'NONE'}
Phone: ${lead.phone || 'NONE'}
Rating: ${lead.rating ?? 'N/A'} (${lead.reviewsCount ?? 0} reviews)
Categories: ${(lead.categories || []).join(', ')}
If website is NONE, set qualificationStatus="hot" and leadScore>=85.
Return JSON: { "leadScore": 0-100, "qualificationStatus": "hot|warm|cold|disqualified", "reasons": ["..."], "keyStrengths": ["..."], "recommendedPitchAngle": "..." }`;
  }
}
