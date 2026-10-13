import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { GeminiService } from '../services/gemini.service.js';
import { SocketService } from '../services/socket.service.js';
import { withTenantContext } from '../config/db.js';
import { emailEvents, leads } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();

const webhookPayloadSchema = z.object({
  workspaceId: z.string().min(1),
  campaignId: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),
  messageId: z.string().optional(),
  fromEmail: z.string().email().optional(),
  replyText: z.string().min(1, 'Reply content is required'),
  rawPayload: z.record(z.unknown()).optional(),
});

/**
 * Pipeline 3: Inbound Reply Webhook Loop
 * Listens for replies, classifies intent with Gemini, stores event in Postgres,
 * and emits real-time Socket.io notification if lead is INTERESTED.
 * POST /api/webhooks/email-replies
 */
router.post('/email-replies', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = webhookPayloadSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid webhook payload',
        details: parseResult.error.errors,
      });
      return;
    }

    const { workspaceId, campaignId, leadId, messageId, replyText, rawPayload } = parseResult.data;

    // 1. Send raw reply text to Gemini for Intent Classification
    const classification = await GeminiService.classifyReplyIntent(replyText);

    // 2. Fetch Lead business details for notification context
    let businessName = 'Valued Prospect';
    let resolvedCampaignId = campaignId;

    if (leadId) {
      const leadRecord = await withTenantContext(workspaceId, async (tenantDb) => {
        const [found] = await tenantDb
          .select()
          .from(leads)
          .where(eq(leads.id, leadId))
          .limit(1);
        return found;
      });

      if (leadRecord) {
        businessName = leadRecord.businessName;
        if (!resolvedCampaignId && leadRecord.campaignId) {
          resolvedCampaignId = leadRecord.campaignId;
        }
      }
    }

    // 3. Persist email event under workspace_id with RLS isolation
    if (leadId && resolvedCampaignId) {
      await withTenantContext(workspaceId, async (tenantDb) => {
        await tenantDb.insert(emailEvents).values({
          workspaceId,
          campaignId: resolvedCampaignId!,
          leadId,
          messageId: messageId || `msg_${Date.now()}`,
          eventType: 'REPLIED',
          replyIntent: classification.intent,
          replyBody: replyText,
          replySnippet: classification.summary,
          rawPayload: rawPayload || {},
        });
      });
    }

    // 4. Live UI Notification: If lead replies positively (INTERESTED), emit Socket.io event!
    let liveNotificationEmitted = false;
    if (classification.intent === 'INTERESTED') {
      SocketService.emitPositiveReply(workspaceId, {
        workspaceId,
        campaignId: resolvedCampaignId || '',
        leadId: leadId || '',
        businessName,
        intent: 'INTERESTED',
        replySnippet: replyText.slice(0, 150),
        receivedAt: new Date().toISOString(),
      });
      liveNotificationEmitted = true;
    }

    res.status(200).json({
      success: true,
      received: true,
      intent: classification.intent,
      confidence: classification.confidence,
      summary: classification.summary,
      suggestedAction: classification.suggestedAction,
      liveNotificationEmitted,
    });
  } catch (error) {
    console.error('[WebhooksRouter] Error handling inbound email reply:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process incoming webhook',
    });
  }
});

export default router;
