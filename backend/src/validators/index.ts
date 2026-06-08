import { z } from 'zod';
import { UserRole, DeliveryStatus } from '../types/enums';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole).optional().default(UserRole.CUSTOMER),
  licenseNumber: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export const createDeliverySchema = z.object({
  pickupAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zipCode: z.string().min(1),
    country: z.string().default('USA'),
    coordinates: z.tuple([z.number(), z.number()]),
  }),
  deliveryAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zipCode: z.string().min(1),
    country: z.string().default('USA'),
    coordinates: z.tuple([z.number(), z.number()]),
  }),
  packageDescription: z.string().min(1),
  packageWeight: z.number().positive().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  notes: z.string().optional(),
});

export const updateDeliveryStatusSchema = z.object({
  status: z.nativeEnum(DeliveryStatus),
  note: z.string().optional(),
});

export const assignDriverSchema = z.object({
  driverId: z.string().min(1),
});

export const locationUpdateSchema = z.object({
  coordinates: z.tuple([z.number(), z.number()]),
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().min(0).optional(),
  accuracy: z.number().optional(),
  deliveryId: z.string().optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
});

export const createVehicleSchema = z.object({
  plateNumber: z.string().min(1),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1990).max(2030),
  type: z.enum(['van', 'truck', 'bike', 'car', 'scooter']),
  capacity: z.number().positive(),
  color: z.string().optional(),
  fuelType: z.enum(['petrol', 'diesel', 'electric', 'hybrid']).optional(),
});

export const nearbyDriversSchema = z.object({
  lng: z.coerce.number(),
  lat: z.coerce.number(),
  radiusKm: z.coerce.number().positive().default(10),
});
