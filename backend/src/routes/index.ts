import { Router } from 'express';
import authRoutes from './auth.routes';
import * as controller from '../controllers/delivery.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../utils/apiResponse';
import { UserRole } from '../types/enums';
import {
  createDeliverySchema,
  updateDeliveryStatusSchema,
  assignDriverSchema,
  locationUpdateSchema,
  paginationSchema,
  nearbyDriversSchema,
  createVehicleSchema,
} from '../validators';

const router = Router();

router.use('/auth', authRoutes);
router.get('/health', controller.healthCheck);
router.get('/track/:trackingNumber', controller.trackDelivery);

router.use(authenticate);

router.get('/deliveries', validate(paginationSchema, 'query'), controller.getDeliveries);
router.post('/deliveries', authorize(UserRole.CUSTOMER, UserRole.ADMIN), validate(createDeliverySchema), controller.createDelivery);
router.get('/deliveries/:id', controller.getDelivery);
router.patch('/deliveries/:id/assign', authorize(UserRole.ADMIN), validate(assignDriverSchema), controller.assignDriver);
router.patch('/deliveries/:id/status', validate(updateDeliveryStatusSchema), controller.updateStatus);
router.post('/deliveries/:id/rate', authorize(UserRole.CUSTOMER), controller.rateDelivery);

router.post('/location', authorize(UserRole.DRIVER), validate(locationUpdateSchema), controller.updateLocation);
router.get('/drivers/nearby', validate(nearbyDriversSchema, 'query'), controller.nearbyDrivers);
router.get('/drivers', authorize(UserRole.ADMIN), controller.getDrivers);
router.patch('/drivers/status', authorize(UserRole.DRIVER), controller.updateDriverStatus);
router.get('/drivers/earnings', authorize(UserRole.DRIVER), controller.getDriverEarnings);

router.get('/fleet', authorize(UserRole.ADMIN), controller.getFleet);
router.get('/analytics', authorize(UserRole.ADMIN), controller.getAnalytics);

router.get('/vehicles', authorize(UserRole.ADMIN), controller.getVehicles);
router.post('/vehicles', authorize(UserRole.ADMIN), validate(createVehicleSchema), controller.createVehicle);

router.get('/notifications', controller.getNotifications);
router.patch('/notifications/:id/read', controller.markNotificationRead);
router.patch('/notifications/read-all', controller.markAllNotificationsRead);

export default router;
