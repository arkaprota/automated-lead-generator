import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { env, isAuthBypassed } from '../config/env.js';
import type { SocketEvents } from '../types/index.js';
import { verifyClerkToken } from '../utils/verify-clerk-token.util.js';
import { DEV_WORKSPACE_ID } from '../middleware/tenant.middleware.js';

let ioInstance: SocketIOServer | null = null;

export class SocketService {
  /**
   * Initialize Socket.io server with CORS configuration
   */
  static init(server: HttpServer): SocketIOServer {
    ioInstance = new SocketIOServer(server, {
      cors: {
        origin: env.FRONTEND_URL,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    // Tenant room is derived from the verified token — clients cannot pick a room
    ioInstance.use(async (socket, next) => {
      if (isAuthBypassed) {
        socket.data.workspaceId = DEV_WORKSPACE_ID;
        return next();
      }
      const token = socket.handshake.auth?.token;
      const identity = typeof token === 'string' ? await verifyClerkToken(token) : null;
      if (!identity?.workspaceId) return next(new Error('Unauthorized'));
      socket.data.workspaceId = identity.workspaceId;
      next();
    });

    ioInstance.on('connection', (socket: Socket) => {
      socket.join(`workspace:${socket.data.workspaceId}`);
      console.log(`[Socket.io] Client ${socket.id} joined its workspace room`);

      socket.on('disconnect', () => {
        console.log(`[Socket.io] Client disconnected: ${socket.id}`);
      });
    });

    return ioInstance;
  }

  /**
   * Get singleton Socket.io instance
   */
  static getIO(): SocketIOServer | null {
    return ioInstance;
  }

  /**
   * Notify workspace when an inbound email reply is classified as INTERESTED
   */
  static emitPositiveReply(
    workspaceId: string,
    payload: SocketEvents['lead:positive_reply']
  ): void {
    if (ioInstance) {
      ioInstance.to(`workspace:${workspaceId}`).emit('lead:positive_reply', payload);
      console.log(`[Socket.io] Emitted lead:positive_reply to workspace:${workspaceId}`);
    }
  }

  /**
   * Emit lead generation pipeline progress
   */
  static emitLeadGenerationProgress(
    workspaceId: string,
    payload: SocketEvents['lead:generation_progress']
  ): void {
    if (ioInstance) {
      ioInstance.to(`workspace:${workspaceId}`).emit('lead:generation_progress', payload);
    }
  }

  /**
   * Emit search event update or scrape completion to workspace
   */
  static emitEventUpdated(
    workspaceId: string,
    payload: { eventId: string; status: string; totalLeadsFound: number; lastRunAt: string | null }
  ): void {
    if (ioInstance) {
      ioInstance.to(`workspace:${workspaceId}`).emit('event:updated', payload);
      console.log(`[Socket.io] Emitted event:updated to workspace:${workspaceId} for event ${payload.eventId}`);
    }
  }
}

