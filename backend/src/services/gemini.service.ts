import { getGeminiClient } from '../config/gemini.js';
import { env } from '../config/env.js';
import type {
  QueryExpansionResponse,
  LeadScoringResponse,
  BrochurePitchResponse,
  ReplyClassificationResponse,
  RawScrapedLead,
} from '../types/index.js';

export class GeminiService {
  /**
   * Pipeline 1, Step A:
   * Translates user target demographic intent into 5 specific search queries.
   */
  static async expandTargetDemographic(demographic: string): Promise<string[]> {
    if (!env.GEMINI_API_KEY) {
      // Development fallback queries
      return [
        `${demographic} agencies`,
        `Top rated ${demographic}`,
        `Local businesses in ${demographic}`,
        `${demographic} corporate offices`,
        `${demographic} commercial services`,
      ];
    }

    try {
      const client = getGeminiClient();
      const prompt = `You are a B2B Lead Generation specialist.
Translate the following target demographic into exactly 5 specific, high-intent Google Maps search queries for local business scraping.
Target demographic: "${demographic}".

Return ONLY a valid JSON object matching this schema:
{
  "queries": ["query 1", "query 2", "query 3", "query 4", "query 5"],
  "rationale": "short explanation"
}`;

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text || '{}';
      const parsed = JSON.parse(responseText) as QueryExpansionResponse;
      if (Array.isArray(parsed.queries) && parsed.queries.length > 0) {
        return parsed.queries.slice(0, 5);
      }
    } catch (error) {
      console.warn('[GeminiService] Failed to expand queries, using heuristic fallback:', error);
    }

    return [
      `${demographic} near me`,
      `Best ${demographic}`,
      `${demographic} services`,
      `Top ${demographic}`,
      `${demographic} companies`,
    ];
  }

  /**
   * Pipeline 1, Step C:
   * Qualifies and scores a raw scraped lead based on business attributes.
   * If website is null, flag as "Hot Lead" for web design/digital transformation outreach.
   */
  static async scoreAndQualifyLead(lead: RawScrapedLead): Promise<LeadScoringResponse> {
    const hasWebsite = Boolean(lead.website && lead.website.trim() !== '');

    if (!env.GEMINI_API_KEY) {
      // Heuristic qualification when offline or testing
      if (!hasWebsite) {
        return {
          leadScore: 92,
          qualificationStatus: 'hot',
          reasons: ['No existing website detected - prime prospect for web design & online presence'],
          keyStrengths: ['Established location', 'Direct phone contact available'],
          recommendedPitchAngle: 'High-converting mobile-friendly website and Google Maps local SEO',
        };
      }

      return {
        leadScore: 70,
        qualificationStatus: 'warm',
        reasons: ['Active online presence but potential for conversion optimization'],
        keyStrengths: ['Established business domain'],
        recommendedPitchAngle: 'Website revamp and automated lead generation pipeline',
      };
    }

    try {
      const client = getGeminiClient();
      const prompt = `Analyze this B2B Google Maps lead and evaluate their suitability for cold outreach services:
Business Name: ${lead.businessName}
Website: ${lead.website || 'NONE'}
Phone: ${lead.phone || 'NONE'}
Address: ${lead.address || 'NONE'}
Rating: ${lead.rating ?? 'N/A'} (${lead.reviewsCount ?? 0} reviews)
Categories: ${(lead.categories || []).join(', ')}

Rule: If website is NONE or missing, mark qualificationStatus as 'hot' and leadScore >= 85, noting urgent need for online presence.

Return ONLY a valid JSON object matching this schema:
{
  "leadScore": <number 0-100>,
  "qualificationStatus": <"hot" | "warm" | "cold" | "disqualified">,
  "reasons": ["string"],
  "keyStrengths": ["string"],
  "recommendedPitchAngle": "string"
}`;

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      return JSON.parse(response.text || '{}') as LeadScoringResponse;
    } catch (error) {
      console.warn('[GeminiService] Scoring error, using heuristic fallback:', error);
      return {
        leadScore: hasWebsite ? 65 : 90,
        qualificationStatus: hasWebsite ? 'warm' : 'hot',
        reasons: [hasWebsite ? 'Standard qualification' : 'No website detected'],
        keyStrengths: ['Local business entry'],
        recommendedPitchAngle: 'Digital presence upgrade',
      };
    }
  }

  /**
   * Pipeline 2:
   * Dynamic personalized brochure pitch generation returning strict JSON schema.
   */
  static async generateBrochurePitch(
    lead: RawScrapedLead,
    senderCompanyName: string,
    senderPitchAngle?: string
  ): Promise<BrochurePitchResponse> {
    if (!env.GEMINI_API_KEY) {
      return {
        headline: `Modern Growth Blueprint for ${lead.businessName}`,
        painPoints: [
          'Missing out on 40%+ of local customer inquiries searching on mobile',
          'Lack of an automated 24/7 client booking or acquisition funnel',
          'Competitors capturing top Google search rankings in the immediate area',
        ],
        tailoredSolution: `${senderCompanyName} designs high-converting digital assets and automated outreach funnels specifically tailored for businesses like ${lead.businessName}.`,
        estimatedRoi: '3x to 5x increase in qualified monthly inbound consultations within 90 days.',
        callToAction: 'Book a free 15-minute digital growth strategy session with our team.',
      };
    }

    try {
      const client = getGeminiClient();
      const prompt = `Generate a personalized pitch brochure JSON for cold outreach:
Target Prospect: ${lead.businessName}
Target Industry: ${(lead.categories || []).join(', ') || 'Local Business'}
Prospect Website: ${lead.website || 'None (no website)'}
Sender Agency: ${senderCompanyName}
Pitch Angle: ${senderPitchAngle || 'High-conversion web design and lead generation'}

Return ONLY a valid JSON object matching this schema:
{
  "headline": "string",
  "painPoints": ["point 1", "point 2", "point 3"],
  "tailoredSolution": "string",
  "estimatedRoi": "string",
  "callToAction": "string"
}`;

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      return JSON.parse(response.text || '{}') as BrochurePitchResponse;
    } catch (error) {
      console.warn('[GeminiService] Brochure pitch generation error:', error);
      return {
        headline: `Customized Growth Strategy for ${lead.businessName}`,
        painPoints: ['Untapped local search market', 'Need for modern customer conversion touchpoints'],
        tailoredSolution: `${senderCompanyName} delivers tailored digital outreach and web systems.`,
        estimatedRoi: 'Significant increase in customer pipeline',
        callToAction: 'Reply to this email or visit our website to get started.',
      };
    }
  }

  /**
   * Pipeline 3:
   * Incoming reply classification (Enum: INTERESTED, NOT_INTERESTED, QUESTION, NEUTRAL)
   */
  static async classifyReplyIntent(emailReplyText: string): Promise<ReplyClassificationResponse> {
    if (!env.GEMINI_API_KEY) {
      const lower = emailReplyText.toLowerCase();
      if (lower.includes('interested') || lower.includes('yes') || lower.includes('call') || lower.includes('demo') || lower.includes('quote')) {
        return {
          intent: 'INTERESTED',
          confidence: 0.95,
          summary: 'Prospect expressed positive interest or requested a meeting/pricing.',
          suggestedAction: 'Schedule follow-up call immediately.',
        };
      }
      if (lower.includes('unsubscribe') || lower.includes('not interested') || lower.includes('remove') || lower.includes('stop')) {
        return {
          intent: 'NOT_INTERESTED',
          confidence: 0.98,
          summary: 'Prospect requested removal or declined services.',
          suggestedAction: 'Unsubscribe lead from future campaigns.',
        };
      }
      if (lower.includes('?') || lower.includes('how much') || lower.includes('pricing') || lower.includes('what')) {
        return {
          intent: 'QUESTION',
          confidence: 0.88,
          summary: 'Prospect has a clarifying question.',
          suggestedAction: 'Answer question and provide direct scheduling link.',
        };
      }
      return {
        intent: 'NEUTRAL',
        confidence: 0.7,
        summary: 'General or unclassified response.',
        suggestedAction: 'Review email manually.',
      };
    }

    try {
      const client = getGeminiClient();
      const prompt = `Classify the intent of the following cold email prospect reply:
Reply Content:
"""
${emailReplyText}
"""

Available intent Enums:
- INTERESTED: Prospect wants to discuss, see a demo, asks for pricing, or schedules a call.
- NOT_INTERESTED: Prospect says no, asks to be removed, or expresses disinterest.
- QUESTION: Prospect asks for more details, clarification, or credentials without a hard commitment.
- NEUTRAL: Out of office, auto-reply, or ambiguous message.

Return ONLY a valid JSON object matching this schema:
{
  "intent": <"INTERESTED" | "NOT_INTERESTED" | "QUESTION" | "NEUTRAL">,
  "confidence": <number between 0 and 1>,
  "summary": "one sentence summary",
  "suggestedAction": "recommended sales next step"
}`;

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      return JSON.parse(response.text || '{}') as ReplyClassificationResponse;
    } catch (error) {
      console.warn('[GeminiService] Reply classification error:', error);
      return {
        intent: 'NEUTRAL',
        confidence: 0.5,
        summary: 'Failed to classify automatically.',
        suggestedAction: 'Review reply manually.',
      };
    }
  }
}
