import { Delivery, Driver, Location, User } from '../models';
import { DeliveryStatus, DriverStatus, NotificationType } from '../types/enums';
import {
  generateTrackingNumber,
  calculateDistance,
  calculateFare,
  estimateETA,
  paginate,
  buildPaginationMeta,
} from '../utils/helpers';
import { AppError } from '../utils/apiResponse';
import { createNotification } from './notification.service';
import { cacheGet, cacheSet, cacheDel } from '../configs/redis';
import { publishEvent } from '../configs/redis';

export const createDelivery = async (
  customerId: string,
  data: {
    pickupAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
      coordinates: [number, number];
    };
    deliveryAddress: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
      coordinates: [number, number];
    };
    packageDescription: string;
    packageWeight?: number;
    priority: string;
    notes?: string;
  }
) => {
  const [pickupLng, pickupLat] = data.pickupAddress.coordinates;
  const [deliveryLng, deliveryLat] = data.deliveryAddress.coordinates;
  const distance = calculateDistance(pickupLat, pickupLng, deliveryLat, deliveryLng);
  const fare = calculateFare(distance, data.priority);
  const etaMinutes = estimateETA(distance);

  const delivery = await Delivery.create({
    trackingNumber: generateTrackingNumber(),
    customer: customerId,
    ...data,
    distance,
    fare,
    estimatedDeliveryTime: new Date(Date.now() + etaMinutes * 60000),
    statusHistory: [{ status: DeliveryStatus.PENDING, timestamp: new Date() }],
  });

  await cacheDel('deliveries:*');
  await publishEvent('delivery:created', { deliveryId: delivery._id, trackingNumber: delivery.trackingNumber });

  return delivery.populate('customer', 'firstName lastName email phone');
};

export const getDeliveries = async (
  filters: {
    page: number;
    limit: number;
    status?: string;
    search?: string;
    customerId?: string;
    driverId?: string;
  }
) => {
  const { skip, limit, page } = paginate(filters.page, filters.limit);
  const query: Record<string, unknown> = {};

  if (filters.status) query.status = filters.status;
  if (filters.customerId) query.customer = filters.customerId;
  if (filters.driverId) query.driver = filters.driverId;
  if (filters.search) {
    query.$or = [
      { trackingNumber: { $regex: filters.search, $options: 'i' } },
      { packageDescription: { $regex: filters.search, $options: 'i' } },
    ];
  }

  const [deliveries, total] = await Promise.all([
    Delivery.find(query)
      .populate('customer', 'firstName lastName email phone')
      .populate({ path: 'driver', populate: { path: 'user', select: 'firstName lastName phone' } })
      .populate('vehicle')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Delivery.countDocuments(query),
  ]);

  return { deliveries, pagination: buildPaginationMeta(total, page, limit) };
};

export const getDeliveryById = async (id: string) => {
  const delivery = await Delivery.findById(id)
    .populate('customer', 'firstName lastName email phone')
    .populate({ path: 'driver', populate: { path: 'user', select: 'firstName lastName phone avatar' } })
    .populate('vehicle');

  if (!delivery) throw new AppError('Delivery not found', 404);
  return delivery;
};

export const getDeliveryByTracking = async (trackingNumber: string) => {
  const cacheKey = `delivery:track:${trackingNumber}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const delivery = await Delivery.findOne({ trackingNumber })
    .populate('customer', 'firstName lastName')
    .populate({ path: 'driver', populate: { path: 'user', select: 'firstName lastName phone' } });

  if (!delivery) throw new AppError('Delivery not found', 404);

  await cacheSet(cacheKey, delivery, 60);
  return delivery;
};

export const assignDriver = async (deliveryId: string, driverId: string) => {
  const delivery = await Delivery.findById(deliveryId);
  if (!delivery) throw new AppError('Delivery not found', 404);
  if (delivery.status !== DeliveryStatus.PENDING) {
    throw new AppError('Delivery cannot be assigned in current status', 400);
  }

  const driver = await Driver.findById(driverId).populate('user');
  if (!driver) throw new AppError('Driver not found', 404);
  if (!driver.isAvailable) throw new AppError('Driver is not available', 400);

  delivery.driver = driver._id;
  delivery.vehicle = driver.vehicle;
  delivery.status = DeliveryStatus.ASSIGNED;
  delivery.statusHistory.push({ status: DeliveryStatus.ASSIGNED, timestamp: new Date() });
  await delivery.save();

  driver.status = DriverStatus.BUSY;
  driver.isAvailable = false;
  await driver.save();

  const driverUser = driver.user as unknown as { _id: string };
  await createNotification(
    driverUser._id.toString(),
    'New Delivery Assigned',
    `You have been assigned delivery ${delivery.trackingNumber}`,
    NotificationType.DELIVERY,
    { deliveryId: delivery._id }
  );

  await createNotification(
    delivery.customer.toString(),
    'Driver Assigned',
    `A driver has been assigned to your delivery ${delivery.trackingNumber}`,
    NotificationType.DELIVERY,
    { deliveryId: delivery._id }
  );

  await cacheDel('deliveries:*');
  await publishEvent('delivery:assigned', { deliveryId, driverId });

  return delivery.populate([
    { path: 'customer', select: 'firstName lastName email' },
    { path: 'driver', populate: { path: 'user', select: 'firstName lastName phone' } },
  ]);
};

export const updateDeliveryStatus = async (
  deliveryId: string,
  status: DeliveryStatus,
  note?: string,
  driverId?: string
) => {
  const delivery = await Delivery.findById(deliveryId);
  if (!delivery) throw new AppError('Delivery not found', 404);

  if (driverId && delivery.driver?.toString() !== driverId) {
    throw new AppError('Not authorized for this delivery', 403);
  }

  delivery.status = status;
  delivery.statusHistory.push({ status, timestamp: new Date(), note });

  if (status === DeliveryStatus.PICKED_UP) delivery.actualPickupTime = new Date();
  if (status === DeliveryStatus.DELIVERED) {
    delivery.actualDeliveryTime = new Date();
    if (delivery.driver) {
      const driver = await Driver.findById(delivery.driver);
      if (driver) {
        driver.totalDeliveries += 1;
        driver.totalEarnings += delivery.fare * 0.7;
        driver.status = DriverStatus.ONLINE;
        driver.isAvailable = true;
        await driver.save();
      }
    }
  }

  await delivery.save();

  await createNotification(
    delivery.customer.toString(),
    'Delivery Update',
    `Your delivery ${delivery.trackingNumber} is now ${status.replace('_', ' ')}`,
    NotificationType.DELIVERY,
    { deliveryId, status }
  );

  await cacheDel('deliveries:*');
  await publishEvent('delivery:status', { deliveryId, status, trackingNumber: delivery.trackingNumber });

  return delivery;
};

export const updateDriverLocation = async (
  driverId: string,
  data: {
    coordinates: [number, number];
    heading?: number;
    speed?: number;
    accuracy?: number;
    deliveryId?: string;
  }
) => {
  const driver = await Driver.findById(driverId);
  if (!driver) throw new AppError('Driver not found', 404);

  driver.currentLocation = { type: 'Point', coordinates: data.coordinates };
  driver.heading = data.heading;
  driver.speed = data.speed;
  driver.lastLocationUpdate = new Date();
  await driver.save();

  await Location.create({
    driver: driverId,
    delivery: data.deliveryId,
    coordinates: data.coordinates,
    heading: data.heading,
    speed: data.speed,
    accuracy: data.accuracy,
  });

  await publishEvent('location:update', {
    driverId,
    coordinates: data.coordinates,
    heading: data.heading,
    speed: data.speed,
    deliveryId: data.deliveryId,
  });

  return driver;
};

export const findNearbyDrivers = async (lng: number, lat: number, radiusKm: number) => {
  const radiusMeters = radiusKm * 1000;
  return Driver.find({
    isAvailable: true,
    status: DriverStatus.ONLINE,
    currentLocation: {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: radiusMeters,
      },
    },
  })
    .populate('user', 'firstName lastName phone avatar')
    .populate('vehicle')
    .limit(20);
};

export const getDriverDeliveries = async (driverId: string, status?: string) => {
  const query: Record<string, unknown> = { driver: driverId };
  if (status) query.status = status;

  return Delivery.find(query)
    .populate('customer', 'firstName lastName phone')
    .sort({ createdAt: -1 });
};

export const getAnalytics = async (days = 30) => {
  const cacheKey = `analytics:${days}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [
    totalDeliveries,
    completedDeliveries,
    cancelledDeliveries,
    revenueAgg,
    activeDrivers,
    totalCustomers,
    statusBreakdown,
    recentDeliveries,
  ] = await Promise.all([
    Delivery.countDocuments({ createdAt: { $gte: startDate } }),
    Delivery.countDocuments({ status: DeliveryStatus.DELIVERED, createdAt: { $gte: startDate } }),
    Delivery.countDocuments({ status: DeliveryStatus.CANCELLED, createdAt: { $gte: startDate } }),
    Delivery.aggregate([
      { $match: { status: DeliveryStatus.DELIVERED, createdAt: { $gte: startDate } } },
      { $group: { _id: null, total: { $sum: '$fare' } } },
    ]),
    Driver.countDocuments({ status: { $in: [DriverStatus.ONLINE, DriverStatus.BUSY] } }),
    User.countDocuments({ role: 'customer', createdAt: { $gte: startDate } }),
    Delivery.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Delivery.find({ createdAt: { $gte: startDate } })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('customer', 'firstName lastName')
      .populate({ path: 'driver', populate: { path: 'user', select: 'firstName lastName' } }),
  ]);

  const dailyRevenue = await Delivery.aggregate([
    {
      $match: { status: DeliveryStatus.DELIVERED, createdAt: { $gte: startDate } },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$fare' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const analytics = {
    overview: {
      totalDeliveries,
      completedDeliveries,
      cancelledDeliveries,
      totalRevenue: revenueAgg[0]?.total || 0,
      activeDrivers,
      newCustomers: totalCustomers,
      completionRate: totalDeliveries ? ((completedDeliveries / totalDeliveries) * 100).toFixed(1) : 0,
    },
    statusBreakdown: statusBreakdown.reduce(
      (acc: Record<string, number>, item: { _id: string; count: number }) => {
        acc[item._id] = item.count;
        return acc;
      },
      {}
    ),
    dailyRevenue,
    recentDeliveries,
  };

  await cacheSet(cacheKey, analytics, 300);
  return analytics;
};

export const getFleetLocations = async () => {
  return Driver.find({
    status: { $in: [DriverStatus.ONLINE, DriverStatus.BUSY] },
    currentLocation: { $exists: true },
  })
    .populate('user', 'firstName lastName phone avatar')
    .populate('vehicle');
};

export const rateDelivery = async (deliveryId: string, customerId: string, rating: number) => {
  const delivery = await Delivery.findOne({ _id: deliveryId, customer: customerId });
  if (!delivery) throw new AppError('Delivery not found', 404);
  if (delivery.status !== DeliveryStatus.DELIVERED) {
    throw new AppError('Can only rate delivered orders', 400);
  }

  delivery.rating = rating;
  await delivery.save();

  if (delivery.driver) {
    const driver = await Driver.findById(delivery.driver);
    if (driver) {
      const newRating = (driver.rating * driver.totalDeliveries + rating) / (driver.totalDeliveries + 1);
      driver.rating = Math.round(newRating * 10) / 10;
      await driver.save();
    }
  }

  return delivery;
};
