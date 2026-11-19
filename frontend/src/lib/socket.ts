'use client';

import { io, Socket } from 'socket.io-client';
import { getSessionToken } from './auth-headers';

let socket: Socket | null = null;

export function getSocketClient(): Socket {
  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
    socket = io(socketUrl, {
      autoConnect: true,
      withCredentials: true,
      // Re-evaluated on every (re)connect so a refreshed token is always sent
      auth: (cb) => {
        getSessionToken().then((token) => cb({ token }));
      },
    });
  }
  return socket;
}

export const getSocket = getSocketClient;

