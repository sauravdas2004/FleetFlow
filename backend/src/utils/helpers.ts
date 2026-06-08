import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export const generateTrackingNumber = (): string => {
  const prefix = 'FF';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

export const generateToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const generateId = (): string => uuidv4();

export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const estimateETA = (distanceKm: number, avgSpeedKmh = 35): number => {
  return Math.ceil((distanceKm / avgSpeedKmh) * 60);
};

export const calculateFare = (distanceKm: number, priority: string): number => {
  const baseFare = 5;
  const perKm = 1.5;
  const multipliers: Record<string, number> = { low: 0.9, normal: 1, high: 1.25, urgent: 1.5 };
  return Math.round((baseFare + distanceKm * perKm) * (multipliers[priority] || 1) * 100) / 100;
};

export const paginate = (page: number, limit: number) => {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));
  return { skip: (safePage - 1) * safeLimit, limit: safeLimit, page: safePage };
};

export const buildPaginationMeta = (total: number, page: number, limit: number) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNext: page * limit < total,
  hasPrev: page > 1,
});
