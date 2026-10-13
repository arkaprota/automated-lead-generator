'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocketClient(): Socket {
  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    socket = io(socketUrl, {
      autoConnect: true,
      withCredentials: true,
    });
  }
  return socket;
}
