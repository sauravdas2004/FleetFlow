import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../configs';
import { TokenPayload } from '../utils/jwt';
import { getRedis, isRedisAvailable } from '../configs/redis';
import { logger } from '../configs/logger';
import { Driver } from '../models';

interface AuthenticatedSocket extends Socket {
  user?: TokenPayload;
}

export const initializeSocket = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.clientUrl,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    if (!token) return next(new Error('Authentication required'));

    try {
      socket.user = jwt.verify(token, config.jwt.secret) as TokenPayload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const user = socket.user!;
    logger.debug(`Socket connected: ${user.email} (${user.role})`);

    socket.join(`user:${user.userId}`);
    socket.join(`role:${user.role}`);

    if (user.role === 'admin') {
      socket.join('fleet:tracking');
    }

    if (user.role === 'driver') {
      socket.join('drivers:live');
      Driver.findOne({ user: user.userId }).then((driver) => {
        if (driver) socket.join(`driver:${driver._id}`);
      });
    }

    socket.on('join:delivery', (deliveryId: string) => {
      socket.join(`delivery:${deliveryId}`);
    });

    socket.on('leave:delivery', (deliveryId: string) => {
      socket.leave(`delivery:${deliveryId}`);
    });

    socket.on('driver:location', async (data: {
      coordinates: [number, number];
      heading?: number;
      speed?: number;
      deliveryId?: string;
    }) => {
      if (user.role !== 'driver') return;

      const driver = await Driver.findOne({ user: user.userId });
      if (!driver) return;

      io.to('fleet:tracking').emit('location:update', {
        driverId: driver._id,
        coordinates: data.coordinates,
        heading: data.heading,
        speed: data.speed,
      });

      if (data.deliveryId) {
        io.to(`delivery:${data.deliveryId}`).emit('delivery:location', {
          driverId: driver._id,
          coordinates: data.coordinates,
          heading: data.heading,
          speed: data.speed,
        });
      }
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${user.email}`);
    });
  });

  setupRedisSubscriber(io);
  return io;
};

const setupRedisSubscriber = (io: Server) => {
  if (!isRedisAvailable()) return;
  const redis = getRedis();
  if (!redis) return;
  const subscriber = redis.duplicate();

  subscriber.subscribe(
    'location:update',
    'delivery:status',
    'delivery:assigned',
    'delivery:created',
    'notifications'
  );

  subscriber.on('message', (channel, message) => {
    try {
      const data = JSON.parse(message);

      switch (channel) {
        case 'location:update':
          io.to('fleet:tracking').emit('location:update', data);
          if (data.deliveryId) {
            io.to(`delivery:${data.deliveryId}`).emit('delivery:location', data);
          }
          break;
        case 'delivery:status':
          io.to('fleet:tracking').emit('delivery:status', data);
          io.to(`delivery:${data.deliveryId}`).emit('delivery:status', data);
          break;
        case 'delivery:assigned':
          io.to('fleet:tracking').emit('delivery:assigned', data);
          io.to(`driver:${data.driverId}`).emit('delivery:assigned', data);
          break;
        case 'delivery:created':
          io.to('role:admin').emit('delivery:created', data);
          break;
        case 'notifications':
          io.to(`user:${data.userId}`).emit('notification', data.notification);
          break;
      }
    } catch (err) {
      logger.error('Redis message parse error:', err);
    }
  });
};

export let io: Server;

export const setIO = (server: Server) => {
  io = server;
};
