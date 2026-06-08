import { Queue, Worker, Job } from 'bullmq';
import type Redis from 'ioredis';
import { getRedis, isRedisAvailable } from '../configs/redis';
import { logger } from '../configs/logger';
import { Analytics, Delivery } from '../models';
import { DeliveryStatus, NotificationType } from '../types/enums';
import { createNotification } from '../services/notification.service';

let emailQueue: Queue | null = null;
let analyticsQueue: Queue | null = null;
let deliveryQueue: Queue | null = null;

const getConnection = (): Redis => {
  const conn = getRedis();
  if (!conn) throw new Error('Redis not available');
  return conn;
};

export const initQueues = () => {
  if (!isRedisAvailable()) return;
  const connection = getConnection();
  emailQueue = new Queue('email', { connection });
  analyticsQueue = new Queue('analytics', { connection });
  deliveryQueue = new Queue('delivery', { connection });
};

export const addEmailJob = (data: { to: string; subject: string; html: string }) =>
  emailQueue?.add('send-email', data, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } });

export const addAnalyticsJob = (date: string) =>
  analyticsQueue?.add('aggregate-daily', { date }, { attempts: 2 });

export const addDeliveryReminderJob = (deliveryId: string, delay: number) =>
  deliveryQueue?.add('delivery-reminder', { deliveryId }, { delay, attempts: 2 });

export const startWorkers = () => {
  if (!isRedisAvailable()) {
    logger.warn('Queue workers skipped (Redis unavailable)');
    return;
  }

  const connection = getConnection();
  initQueues();

  new Worker(
    'analytics',
    async (job: Job) => {
      const { date } = job.data;
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const deliveries = await Delivery.find({
        createdAt: { $gte: targetDate, $lt: nextDay },
      });

      const completed = deliveries.filter((d) => d.status === DeliveryStatus.DELIVERED);
      const cancelled = deliveries.filter((d) => d.status === DeliveryStatus.CANCELLED);
      const revenue = completed.reduce((sum, d) => sum + d.fare, 0);

      await Analytics.findOneAndUpdate(
        { date: targetDate },
        {
          totalDeliveries: deliveries.length,
          completedDeliveries: completed.length,
          cancelledDeliveries: cancelled.length,
          totalRevenue: revenue,
        },
        { upsert: true }
      );

      logger.info(`Analytics aggregated for ${date}`);
    },
    { connection }
  );

  new Worker(
    'delivery',
    async (job: Job) => {
      const { deliveryId } = job.data;
      const delivery = await Delivery.findById(deliveryId).populate('customer');
      if (!delivery || delivery.status === DeliveryStatus.DELIVERED) return;

      await createNotification(
        delivery.customer._id.toString(),
        'Delivery Reminder',
        `Your delivery ${delivery.trackingNumber} is still in progress`,
        NotificationType.DELIVERY,
        { deliveryId }
      );
    },
    { connection }
  );

  logger.info('Queue workers started');
};
