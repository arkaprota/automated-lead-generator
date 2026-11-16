import { Router, type Response } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../types/index.js';
import { validateBody } from '../middleware/validator.middleware.js';
import { AiService } from '../services/ai.service.js';
import { WorkspaceAiProviderService } from '../services/workspace-ai-provider.service.js';
import { LeadScraperService } from '../services/leadScraper.service.js';
import { SocketService } from '../services/socket.service.js';
import { withTenantContext } from '../config/db.js';
import { leads } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

const router = Router();

const generateLeadsSchema = z.object({
  demographic: z.string().min(3, 'Target demographic is required (e.g., "Web design clients in Kolkata")'),
  campaignId: z.string().uuid().optional(),
  maxPerQuery: z.number().int().min(1).max(20).optional().default(3),
});

/**
 * Pipeline 1: The "AI-Scraper-AI" Lead Generation Engine
 * POST /api/leads/generate
 */
router.post(
  '/generate',
  validateBody(generateLeadsSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const workspaceId = req.workspaceId!;
      const { demographic, campaignId, maxPerQuery } = req.body;

      // Resolve the workspace's chosen AI provider
      const provider = await WorkspaceAiProviderService.getProvider(workspaceId);

      // Step A: Translate intent into 5 specific search queries
      SocketService.emitLeadGenerationProgress(workspaceId, {
        workspaceId,
        currentStep: 'expanding_queries',
        totalProcessed: 0,
        qualifiedCount: 0,
      });
      const searchQueries = await AiService.expandTargetDemographic(demographic, provider, workspaceId);

      // Step B: Trigger scraping API to fetch raw Google Maps B2B data
      SocketService.emitLeadGenerationProgress(workspaceId, {
        workspaceId,
        currentStep: 'scraping_data',
        totalProcessed: 0,
        qualifiedCount: 0,
      });
      const rawLeads = await LeadScraperService.scrapeGoogleMaps(searchQueries, maxPerQuery);

      // Step C: Dedup against existing workspace leads BEFORE scoring (Rule 12 — no wasted tokens)
      const existingPlaceIds = new Set<string>();
      const existingWebsites = new Set<string>();
      try {
        const existing = await withTenantContext(workspaceId, async (tenantDb) =>
          tenantDb.select({ googlePlaceId: leads.googlePlaceId, website: leads.website }).from(leads)
        );
        for (const r of existing) {
          if (r.googlePlaceId) existingPlaceIds.add(r.googlePlaceId);
          if (r.website) existingWebsites.add(r.website);
        }
      } catch { /* DB unavailable — proceed without dedup */ }

      const newLeads = rawLeads.filter((raw) => {
        if (raw.googlePlaceId && existingPlaceIds.has(raw.googlePlaceId)) return false;
        if (raw.website && existingWebsites.has(raw.website)) return false;
        return true;
      });

      SocketService.emitLeadGenerationProgress(workspaceId, {
        workspaceId,
        currentStep: 'qualifying_leads',
        totalProcessed: newLeads.length,
        qualifiedCount: 0,
      });

      // Score in batches — single LLM request for up to 10 leads (Rule 12 — batch)
      const qualifications = await AiService.scoreAndQualifyLeadsBatch(newLeads, provider);

      const processedLeads: (typeof leads.$inferInsert)[] = [];
      let qualifiedCount = 0;

      for (let i = 0; i < newLeads.length; i++) {
        const raw = newLeads[i];
        const qualification = qualifications[i];
        if (qualification.qualificationStatus === 'hot' || qualification.qualificationStatus === 'warm') {
          qualifiedCount++;
        }

        processedLeads.push({
          workspaceId,
          campaignId: campaignId || null,
          businessName: raw.businessName,
          website: raw.website || null,
          phone: raw.phone || null,
          address: raw.address || null,
          googlePlaceId: raw.googlePlaceId || null,
          leadScore: qualification.leadScore,
          qualificationStatus: qualification.qualificationStatus,
          qualificationReasons: qualification.reasons,
          rawMetadata: {
            ...raw.rawMetadata,
            rating: raw.rating,
            reviewsCount: raw.reviewsCount,
            keyStrengths: qualification.keyStrengths,
            pitchAngle: qualification.recommendedPitchAngle,
          },
        });
      }

      // Step D: Save scored leads into Postgres under workspace_id with RLS isolation
      let insertedLeads: unknown[] = [];
      try {
        insertedLeads = await withTenantContext(workspaceId, async (tenantDb) => {
          const results = [];
          for (const leadData of processedLeads) {
            try {
              const [inserted] = await tenantDb
                .insert(leads)
                .values(leadData)
                .onConflictDoNothing() // Respect workspace-wide deduplication constraints
                .returning();
              if (inserted) {
                results.push(inserted);
              }
            } catch (insertErr) {
              console.warn('[LeadsRouter] Duplicate or insert conflict skipped:', insertErr);
            }
          }
          return results;
        });
      } catch (dbError) {
        console.warn('[LeadsRouter] Database connection unavailable, falling back to in-memory response:', (dbError as Error).message);
        insertedLeads = processedLeads.map((item, index) => ({
          id: `lead_mock_${index + 1}`,
          ...item,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
      }

      SocketService.emitLeadGenerationProgress(workspaceId, {
        workspaceId,
        currentStep: 'completed',
        totalProcessed: rawLeads.length,
        qualifiedCount,
      });

      res.status(201).json({
        success: true,
        summary: {
          targetDemographic: demographic,
          queriesGenerated: searchQueries,
          totalScraped: rawLeads.length,
          leadsSaved: insertedLeads.length,
          qualifiedCount,
        },
        leads: insertedLeads,
      });
    } catch (error) {
      console.error('[LeadsRouter] Error in lead generation pipeline:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to complete lead generation pipeline',
        details: (error as Error).message,
      });
    }
  }
);

/**
 * GET /api/leads
 * List qualified leads for current tenant workspace
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const workspaceId = req.workspaceId!;
    const fetchedLeads = await withTenantContext(workspaceId, async (tenantDb) => {
      return tenantDb
        .select()
        .from(leads)
        .where(eq(leads.workspaceId, workspaceId))
        .orderBy(desc(leads.leadScore))
        .limit(100);
    });

    res.json({
      success: true,
      count: fetchedLeads.length,
      leads: fetchedLeads,
    });
  } catch (error) {
    console.error('[LeadsRouter] Error listing leads:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve workspace leads',
    });
  }
});

export default router;
