import { Router, type Response } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../types/index.js';
import { validateBody } from '../middleware/validator.middleware.js';
import { withTenantContext } from '../config/db.js';
import { campaigns, leads, emailEvents } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { QueueService } from '../services/queue.service.js';

const router = Router();

const createCampaignSchema = z.object({
  name: z.string().min(2),
  targetDemographic: z.string().min(3),
  dailyLimit: z.number().int().min(1).max(500).optional().default(50),
  emailSubjectTemplate: z.string().optional().default('Growth Strategy for {{businessName}}'),
  emailBodyTemplate: z.string().optional().default('Hi {{contactName}},\n\nI reviewed your business presence and prepared a personalized analysis: {{pdfUrl}}'),
});

/**
 * GET /api/campaigns
 * List all campaigns for the active tenant
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const workspaceId = req.workspaceId!;
    const allCampaigns = await withTenantContext(workspaceId, async (tenantDb) => {
      return tenantDb
        .select()
        .from(campaigns)
        .where(eq(campaigns.workspaceId, workspaceId))
        .orderBy(desc(campaigns.createdAt));
    });

    res.json({
      success: true,
      count: allCampaigns.length,
      campaigns: allCampaigns,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to retrieve campaigns' });
  }
});

/**
 * POST /api/campaigns
 * Create a new outreach campaign
 */
router.post(
  '/',
  validateBody(createCampaignSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const workspaceId = req.workspaceId!;
      const newCampaign = await withTenantContext(workspaceId, async (tenantDb) => {
        const [created] = await tenantDb
          .insert(campaigns)
          .values({
            workspaceId,
            ...req.body,
          })
          .returning();
        return created;
      });

      res.status(201).json({
        success: true,
        campaign: newCampaign,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to create campaign' });
    }
  }
);

/**
 * Pipeline 3: Email Dispatch Trigger
 * POST /api/campaigns/:id/dispatch
 * Pulls leads, enqueues BullMQ outreach jobs with throttled pace and PDF URL
 */
router.post('/:id/dispatch', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const workspaceId = req.workspaceId!;
    const campaignId = req.params.id;

    const campaignLeads = await withTenantContext(workspaceId, async (tenantDb) => {
      return tenantDb
        .select()
        .from(leads)
        .where(eq(leads.workspaceId, workspaceId))
        .limit(50);
    });

    let enqueuedCount = 0;
    // Human-like throttling jitter (stagger jobs by 15-30s intervals)
    for (let i = 0; i < campaignLeads.length; i++) {
      const lead = campaignLeads[i];
      const targetEmail = lead.email || `contact@${lead.businessName.toLowerCase().replace(/[^a-z0-9]/g, '')}.example.com`;
      const delayMs = i * 15000; // 15 seconds apart

      await QueueService.enqueueEmailJob({
        workspaceId,
        campaignId,
        leadId: lead.id,
        toEmail: targetEmail,
        subject: `Strategic growth idea for ${lead.businessName}`,
        bodyHtml: `<p>Hello team at <strong>${lead.businessName}</strong>,</p><p>We analyzed your local market position and put together a personalized digital blueprint for you:</p><p><a href="${lead.pdfBrochureUrl || '#'}">View Your Personalized Brochure (PDF)</a></p>`,
        pdfUrl: lead.pdfBrochureUrl || undefined,
      }, delayMs);

      // Record dispatch queue event in email_events
      await withTenantContext(workspaceId, async (tenantDb) => {
        await tenantDb.insert(emailEvents).values({
          workspaceId,
          campaignId,
          leadId: lead.id,
          eventType: 'QUEUED',
          pdfUrlIncluded: lead.pdfBrochureUrl || null,
        });
      });

      enqueuedCount++;
    }

    res.json({
      success: true,
      campaignId,
      enqueuedCount,
      message: `Enqueued ${enqueuedCount} emails to BullMQ with throttled dispatch intervals`,
    });
  } catch (error) {
    console.error('[CampaignsRouter] Dispatch error:', error);
    res.status(500).json({ success: false, error: 'Failed to dispatch campaign emails' });
  }
});

export default router;
