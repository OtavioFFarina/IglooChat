import { io, Socket } from 'socket.io-client';

// Use same host or Vite proxy
const SOCKET_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001' 
  : window.location.origin;

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('[IglooChat Gateway] Conectado ao servidor via Socket.IO:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.warn('[IglooChat Gateway] Desconectado:', reason);
});
