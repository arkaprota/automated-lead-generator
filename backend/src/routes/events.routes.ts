import { Router } from 'express';
import { EventsController } from '../controllers/events.controller.js';
import { validateBody } from '../middleware/validator.middleware.js';
import { CreateSearchEventSchema } from '../schemas/search-event.schema.js';

const router = Router();

// CRUD Endpoints for Automated Search Events
router.post('/', validateBody(CreateSearchEventSchema), EventsController.createEvent);
router.get('/', EventsController.getEvents);
router.get('/:id', EventsController.getEventById);
router.patch('/:id/status', EventsController.toggleEventStatus);
router.delete('/:id', EventsController.deleteEvent);
router.post('/:id/trigger', EventsController.triggerScrape);

// Dedicated Leads view for specific Search Event
router.get('/:id/leads', EventsController.getEventLeads);

export default router;
