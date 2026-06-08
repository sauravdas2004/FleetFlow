import { Request, Response } from 'express';
import * as deliveryService from '../services/delivery.service';
import * as notificationService from '../services/notification.service';
import { Driver, Vehicle } from '../models';
import { DriverStatus } from '../types/enums';
import { asyncHandler, sendSuccess, sendPaginated, AppError } from '../utils/apiResponse';
import { paginate, buildPaginationMeta } from '../utils/helpers';

export const createDelivery = asyncHandler(async (req: Request, res: Response) => {
  const delivery = await deliveryService.createDelivery(req.user!.id, req.body);
  sendSuccess(res, delivery, 'Delivery created', 201);
});

export const getDeliveries = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, status, search } = req.query as Record<string, string>;
  const filters: Parameters<typeof deliveryService.getDeliveries>[0] = {
    page: parseInt(page || '1', 10),
    limit: parseInt(limit || '20', 10),
    status,
    search,
  };

  if (req.user!.role === 'customer') filters.customerId = req.user!.id;
  if (req.user!.role === 'driver') {
    const driver = await Driver.findOne({ user: req.user!.id });
    if (driver) filters.driverId = driver._id.toString();
  }

  const { deliveries, pagination } = await deliveryService.getDeliveries(filters);
  sendPaginated(res, deliveries, pagination);
});

export const getDelivery = asyncHandler(async (req: Request, res: Response) => {
  const delivery = await deliveryService.getDeliveryById(req.params.id);
  sendSuccess(res, delivery);
});

export const trackDelivery = asyncHandler(async (req: Request, res: Response) => {
  const delivery = await deliveryService.getDeliveryByTracking(req.params.trackingNumber);
  sendSuccess(res, delivery);
});

export const assignDriver = asyncHandler(async (req: Request, res: Response) => {
  const delivery = await deliveryService.assignDriver(req.params.id, req.body.driverId);
  sendSuccess(res, delivery, 'Driver assigned');
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  let driverId: string | undefined;
  if (req.user!.role === 'driver') {
    const driver = await Driver.findOne({ user: req.user!.id });
    driverId = driver?._id.toString();
  }
  const delivery = await deliveryService.updateDeliveryStatus(
    req.params.id,
    req.body.status,
    req.body.note,
    driverId
  );
  sendSuccess(res, delivery, 'Status updated');
});

export const updateLocation = asyncHandler(async (req: Request, res: Response) => {
  const driver = await Driver.findOne({ user: req.user!.id });
  if (!driver) throw new AppError('Driver profile not found', 404);
  const result = await deliveryService.updateDriverLocation(driver._id.toString(), req.body);
  sendSuccess(res, result, 'Location updated');
});

export const nearbyDrivers = asyncHandler(async (req: Request, res: Response) => {
  const { lng, lat, radiusKm } = req.query as Record<string, string>;
  const drivers = await deliveryService.findNearbyDrivers(
    parseFloat(lng),
    parseFloat(lat),
    parseFloat(radiusKm || '10')
  );
  sendSuccess(res, drivers);
});

export const getAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const days = parseInt(req.query.days as string || '30', 10);
  const analytics = await deliveryService.getAnalytics(days);
  sendSuccess(res, analytics);
});

export const getFleet = asyncHandler(async (_req: Request, res: Response) => {
  const fleet = await deliveryService.getFleetLocations();
  sendSuccess(res, fleet);
});

export const rateDelivery = asyncHandler(async (req: Request, res: Response) => {
  const delivery = await deliveryService.rateDelivery(
    req.params.id,
    req.user!.id,
    req.body.rating
  );
  sendSuccess(res, delivery, 'Rating submitted');
});

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = parseInt(req.query.limit as string || '20', 10);
  const result = await notificationService.getUserNotifications(req.user!.id, page, limit);
  sendSuccess(res, result);
});

export const markNotificationRead = asyncHandler(async (req: Request, res: Response) => {
  const notification = await notificationService.markAsRead(req.params.id, req.user!.id);
  sendSuccess(res, notification);
});

export const markAllNotificationsRead = asyncHandler(async (req: Request, res: Response) => {
  await notificationService.markAllAsRead(req.user!.id);
  sendSuccess(res, null, 'All notifications marked as read');
});

export const getDrivers = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = paginate(
    parseInt(req.query.page as string || '1', 10),
    parseInt(req.query.limit as string || '20', 10)
  );
  const [drivers, total] = await Promise.all([
    Driver.find()
      .populate('user', 'firstName lastName email phone avatar isActive')
      .populate('vehicle')
      .skip(page - 1)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Driver.countDocuments(),
  ]);
  sendPaginated(res, drivers, buildPaginationMeta(total, page, limit));
});

export const updateDriverStatus = asyncHandler(async (req: Request, res: Response) => {
  const driver = await Driver.findOne({ user: req.user!.id });
  if (!driver) throw new AppError('Driver profile not found', 404);

  const { status, isAvailable } = req.body;
  if (status) driver.status = status;
  if (typeof isAvailable === 'boolean') driver.isAvailable = isAvailable;
  await driver.save();

  sendSuccess(res, driver, 'Driver status updated');
});

export const getDriverEarnings = asyncHandler(async (req: Request, res: Response) => {
  const driver = await Driver.findOne({ user: req.user!.id });
  if (!driver) throw new AppError('Driver profile not found', 404);

  const deliveries = await deliveryService.getDriverDeliveries(driver._id.toString(), 'delivered');
  const totalEarnings = deliveries.reduce((sum, d) => sum + d.fare * 0.7, 0);

  sendSuccess(res, {
    totalEarnings: driver.totalEarnings,
    totalDeliveries: driver.totalDeliveries,
    rating: driver.rating,
    recentDeliveries: deliveries.slice(0, 10),
    calculatedEarnings: Math.round(totalEarnings * 100) / 100,
  });
});

export const getVehicles = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = paginate(
    parseInt(req.query.page as string || '1', 10),
    parseInt(req.query.limit as string || '20', 10)
  );
  const [vehicles, total] = await Promise.all([
    Vehicle.find().skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 }),
    Vehicle.countDocuments(),
  ]);
  sendPaginated(res, vehicles, buildPaginationMeta(total, page, limit));
});

export const createVehicle = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await Vehicle.create(req.body);
  sendSuccess(res, vehicle, 'Vehicle created', 201);
});

export const healthCheck = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
