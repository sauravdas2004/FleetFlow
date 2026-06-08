import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const connectSocket = (token: string): Socket => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => console.log('[Socket] Connected'));
  socket.on('disconnect', () => console.log('[Socket] Disconnected'));

  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};

export const getSocket = () => socket;

export const joinDelivery = (deliveryId: string) => {
  socket?.emit('join:delivery', deliveryId);
};

export const leaveDelivery = (deliveryId: string) => {
  socket?.emit('leave:delivery', deliveryId);
};

export const emitDriverLocation = (data: {
  coordinates: [number, number];
  heading?: number;
  speed?: number;
  deliveryId?: string;
}) => {
  socket?.emit('driver:location', data);
};
