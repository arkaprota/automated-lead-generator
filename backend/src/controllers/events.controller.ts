import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import { withTenantContext } from '../config/db.js';
import { searchEvents, leads } from '../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { EventSchedulerService } from '../services/event-scheduler.service.js';
import { SocketService } from '../services/socket.service.js';
import { respondWithError } from '../utils/respond-with-error.util.js';

export class EventsController {
  /**
   * POST /api/events
   * Create a new automated search event
   */
  static async createEvent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const { name, category, location, scheduleCron = '0 9 * * *', status = 'active', queryPrompt } = req.body;

      const [createdEvent] = await withTenantContext(workspaceId, async (tenantDb) =>
        tenantDb
          .insert(searchEvents)
          .values({
            workspaceId,
            name,
            category,
            location,
            scheduleCron,
            status,
            queryPrompt: queryPrompt || null,
            totalLeadsFound: 0,
          })
          .returning()
      );

      if (createdEvent.status === 'active') {
        await EventSchedulerService.scheduleRecurringEvent(createdEvent.id, workspaceId, createdEvent.scheduleCron);
      }

      res.status(201).json({ success: true, event: createdEvent });
    } catch (error) {
      console.error('[EventsController] Error creating search event:', error);
      respondWithError(res, error, 'Failed to create search event');
    }
  }

  /**
   * GET /api/events
   * List all search events for the workspace
   */
  static async getEvents(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const { status } = req.query;

      const eventsList = await withTenantContext(workspaceId, async (tenantDb) =>
        tenantDb
          .select()
          .from(searchEvents)
          .where(
            status
              ? and(eq(searchEvents.workspaceId, workspaceId), eq(searchEvents.status, String(status)))
              : eq(searchEvents.workspaceId, workspaceId)
          )
          .orderBy(desc(searchEvents.createdAt))
      );

      res.json({ success: true, events: eventsList, total: eventsList.length });
    } catch (error) {
      console.error('[EventsController] Error listing search events:', error);
      respondWithError(res, error, 'Failed to retrieve search events');
    }
  }

  /**
   * GET /api/events/:id
   * Get single search event by ID
   */
  static async getEventById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const eventId = req.params.id as string;

      const [targetEvent] = await withTenantContext(workspaceId, async (tenantDb) =>
        tenantDb
          .select()
          .from(searchEvents)
          .where(and(eq(searchEvents.id, eventId), eq(searchEvents.workspaceId, workspaceId)))
          .limit(1)
      );

      if (!targetEvent) {
        res.status(404).json({ success: false, error: 'Search event not found' });
        return;
      }

      res.json({ success: true, event: targetEvent });
    } catch (error) {
      console.error('[EventsController] Error getting search event:', error);
      respondWithError(res, error, 'Failed to retrieve search event');
    }
  }

  /**
   * PATCH /api/events/:id/status
   * Toggle event status between 'active' and 'stopped'
   */
  static async toggleEventStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const eventId = req.params.id as string;
      const { status } = req.body;

      const [updatedEvent] = await withTenantContext(workspaceId, async (tenantDb) =>
        tenantDb
          .update(searchEvents)
          .set({ status: status === 'stopped' ? 'stopped' : 'active', updatedAt: new Date() })
          .where(and(eq(searchEvents.id, eventId), eq(searchEvents.workspaceId, workspaceId)))
          .returning()
      );

      if (!updatedEvent) {
        res.status(404).json({ success: false, error: 'Search event not found' });
        return;
      }

      if (updatedEvent.status === 'active') {
        await EventSchedulerService.scheduleRecurringEvent(eventId, workspaceId, updatedEvent.scheduleCron);
      } else {
        await EventSchedulerService.removeRecurringEvent(eventId);
      }

      SocketService.emitEventUpdated(workspaceId, {
        eventId: updatedEvent.id,
        status: updatedEvent.status,
        totalLeadsFound: updatedEvent.totalLeadsFound,
        lastRunAt: updatedEvent.lastRunAt ? updatedEvent.lastRunAt.toISOString() : null,
      });

      res.json({ success: true, event: updatedEvent });
    } catch (error) {
      console.error('[EventsController] Error toggling search event status:', error);
      respondWithError(res, error, 'Failed to toggle event status');
    }
  }

  /**
   * DELETE /api/events/:id
   * Delete an event and cancel its recurring BullMQ job
   */
  static async deleteEvent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const eventId = req.params.id as string;

      const deleted = await withTenantContext(workspaceId, async (tenantDb) =>
        tenantDb
          .delete(searchEvents)
          .where(and(eq(searchEvents.id, eventId), eq(searchEvents.workspaceId, workspaceId)))
          .returning({ id: searchEvents.id })
      );

      if (deleted.length === 0) {
        res.status(404).json({ success: false, error: 'Search event not found' });
        return;
      }

      await EventSchedulerService.removeRecurringEvent(eventId);
      res.json({ success: true, message: 'Search event deleted successfully' });
    } catch (error) {
      console.error('[EventsController] Error deleting search event:', error);
      respondWithError(res, error, 'Failed to delete search event');
    }
  }

  /**
   * POST /api/events/:id/trigger
   * Trigger an on-demand immediate execution of the search event
   */
  static async triggerScrape(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const eventId = req.params.id as string;

      const results = await EventSchedulerService.executeEventScrape(eventId, workspaceId);
      if (results.status === 'not_found') {
        res.status(404).json({ success: false, error: 'Search event not found' });
        return;
      }

      res.json({ success: true, message: 'Event scrape executed successfully', summary: results });
    } catch (error) {
      console.error('[EventsController] Error triggering event scrape:', error);
      respondWithError(res, error, 'Failed to trigger event scrape');
    }
  }

  /**
   * GET /api/events/:id/leads
   * Dedicated Leads view: Retrieve all leads captured by this specific search event
   */
  static async getEventLeads(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const workspaceId = req.workspaceId!;
      const eventId = req.params.id as string;

      const eventLeads = await withTenantContext(workspaceId, async (tenantDb) =>
        tenantDb
          .select()
          .from(leads)
          .where(and(eq(leads.workspaceId, workspaceId), eq(leads.eventId, eventId)))
          .orderBy(desc(leads.createdAt))
      );

      res.json({ success: true, eventId, total: eventLeads.length, leads: eventLeads });
    } catch (error) {
      console.error('[EventsController] Error retrieving event leads:', error);
      respondWithError(res, error, 'Failed to retrieve event leads');
    }
  }
}
