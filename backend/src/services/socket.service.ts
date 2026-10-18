import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { env } from '../config/env.js';
import type { SocketEvents } from '../types/index.js';

let ioInstance: SocketIOServer | null = null;

export class SocketService {
  /**
   * Initialize Socket.io server with CORS configuration
   */
  static init(server: HttpServer): SocketIOServer {
    ioInstance = new SocketIOServer(server, {
      cors: {
        origin: [env.FRONTEND_URL, 'http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    ioInstance.on('connection', (socket: Socket) => {
      console.log(`[Socket.io] Client connected: ${socket.id}`);

      // Allow frontend client to join tenant room for real-time workspace updates
      socket.on('join:workspace', (workspaceId: string) => {
        if (workspaceId) {
          socket.join(`workspace:${workspaceId}`);
          console.log(`[Socket.io] Socket ${socket.id} joined room workspace:${workspaceId}`);
        }
      });

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
    payload: { eventId: string; status: string; totalLeadsFound: number; lastRunAt: string }
  ): void {
    if (ioInstance) {
      ioInstance.to(`workspace:${workspaceId}`).emit('event:updated', payload);
      console.log(`[Socket.io] Emitted event:updated to workspace:${workspaceId} for event ${payload.eventId}`);
    }
  }
}

