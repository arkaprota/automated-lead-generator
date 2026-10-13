import { Router, type Response } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../types/index.js';
import { validateBody } from '../middleware/validator.middleware.js';
import { GeminiService } from '../services/gemini.service.js';
import { BrochureService } from '../services/brochure.service.js';
import { withTenantContext } from '../config/db.js';
import { leads, senderProfiles } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();

const expandDemographicSchema = z.object({
  demographic: z.string().min(3),
});

const generateBrochureSchema = z.object({
  leadId: z.string().uuid(),
  senderProfileId: z.string().uuid().optional(),
});

const classifyIntentSchema = z.object({
  replyText: z.string().min(1, 'Reply text is required'),
});

/**
 * Step A: Translates intent into 5 specific search queries
 * POST /api/ai/expand-demographic
 */
router.post(
  '/expand-demographic',
  validateBody(expandDemographicSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { demographic } = req.body;
      const queries = await GeminiService.expandTargetDemographic(demographic);
      res.json({
        success: true,
        demographic,
        queries,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to expand demographic queries',
      });
    }
  }
);

/**
 * Pipeline 2: Dynamic PDF Brochure Generation
 * POST /api/ai/pitch-brochure
 */
router.post(
  '/pitch-brochure',
  validateBody(generateBrochureSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const workspaceId = req.workspaceId!;
      const { leadId, senderProfileId } = req.body;

      // 1. Fetch Lead & Sender Profile from database within tenant isolation
      const { leadData, senderData } = await withTenantContext(workspaceId, async (tenantDb) => {
        const [lead] = await tenantDb
          .select()
          .from(leads)
          .where(eq(leads.id, leadId))
          .limit(1);

        let sender;
        if (senderProfileId) {
          [sender] = await tenantDb
            .select()
            .from(senderProfiles)
            .where(eq(senderProfiles.id, senderProfileId))
            .limit(1);
        } else {
          // Default sender profile
          [sender] = await tenantDb
            .select()
            .from(senderProfiles)
            .where(eq(senderProfiles.workspaceId, workspaceId))
            .limit(1);
        }

        return { leadData: lead, senderData: sender };
      });

      if (!leadData) {
        res.status(404).json({ success: false, error: 'Lead not found in this workspace' });
        return;
      }

      const sender = senderData || {
        companyName: 'Apex Growth Labs',
        senderName: 'Alex Carter',
        senderEmail: 'alex@apexgrowthlabs.com',
        websiteUrl: 'https://apexgrowthlabs.com',
        phone: '+1 (555) 902-1200',
        logoUrl: null,
      };

      // 2. Call Gemini for personalized pitch content returning strict JSON schema
      const pitchJson = await GeminiService.generateBrochurePitch(
        {
          businessName: leadData.businessName,
          website: leadData.website,
          phone: leadData.phone,
          address: leadData.address,
        },
        sender.companyName,
        sender.pitchAngle || undefined
      );

      // 3. Render HTML template and generate PDF buffer via Puppeteer
      const pdfBuffer = await BrochureService.renderBrochurePdf(
        {
          businessName: leadData.businessName,
          website: leadData.website,
        },
        sender,
        pitchJson
      );

      // 4. Upload PDF and save public URL to database
      const pdfUrl = await BrochureService.uploadBrochure(leadId, pdfBuffer);

      await withTenantContext(workspaceId, async (tenantDb) => {
        await tenantDb
          .update(leads)
          .set({
            pdfBrochureUrl: pdfUrl,
            brochurePitchData: pitchJson,
            brochureGeneratedAt: new Date(),
          })
          .where(eq(leads.id, leadId));
      });

      res.json({
        success: true,
        leadId,
        pdfUrl,
        pitch: pitchJson,
      });
    } catch (error) {
      console.error('[AIRouter] Error generating brochure:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate PDF brochure',
        details: (error as Error).message,
      });
    }
  }
);

/**
 * Pipeline 3: Reply Classification
 * POST /api/ai/classify-intent
 */
router.post(
  '/classify-intent',
  validateBody(classifyIntentSchema),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { replyText } = req.body;
      const classification = await GeminiService.classifyReplyIntent(replyText);
      res.json({
        success: true,
        classification,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to classify reply intent',
      });
    }
  }
);

export default router;
