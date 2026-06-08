import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase, disconnectDatabase } from './connection';
import { User, Driver, Vehicle, Delivery, Notification } from '../models';
import { UserRole, DeliveryStatus, DriverStatus, VehicleStatus, NotificationType } from '../types/enums';
import { logger } from '../configs/logger';

const NYC_LOCATIONS = [
  { name: 'Manhattan', coords: [-73.9857, 40.7484] as [number, number] },
  { name: 'Brooklyn', coords: [-73.9442, 40.6782] as [number, number] },
  { name: 'Queens', coords: [-73.7949, 40.7282] as [number, number] },
  { name: 'Bronx', coords: [-73.8648, 40.8448] as [number, number] },
  { name: 'Staten Island', coords: [-74.1502, 40.5795] as [number, number] },
];

const seed = async () => {
  await connectDatabase();

  logger.info('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Driver.deleteMany({}),
    Vehicle.deleteMany({}),
    Delivery.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  logger.info('Creating users...');
  const admin = await User.create({
    email: 'admin@fleetflow.io',
    password: 'Admin@12345',
    firstName: 'Alex',
    lastName: 'Morgan',
    role: UserRole.ADMIN,
    isVerified: true,
    phone: '+1-555-0100',
  });

  const customerData = [
    { email: 'john@example.com', password: 'Customer@123', firstName: 'John', lastName: 'Doe', role: UserRole.CUSTOMER, phone: '+1-555-0101' },
    { email: 'sarah@example.com', password: 'Customer@123', firstName: 'Sarah', lastName: 'Wilson', role: UserRole.CUSTOMER, phone: '+1-555-0102' },
    { email: 'mike@example.com', password: 'Customer@123', firstName: 'Mike', lastName: 'Chen', role: UserRole.CUSTOMER, phone: '+1-555-0103' },
  ];
  const customers = await Promise.all(customerData.map((u) => User.create({ ...u, isVerified: true })));

  const driverData = [
    { email: 'driver1@fleetflow.io', password: 'Driver@12345', firstName: 'Marcus', lastName: 'Johnson', phone: '+1-555-0201' },
    { email: 'driver2@fleetflow.io', password: 'Driver@12345', firstName: 'Elena', lastName: 'Rodriguez', phone: '+1-555-0202' },
    { email: 'driver3@fleetflow.io', password: 'Driver@12345', firstName: 'David', lastName: 'Kim', phone: '+1-555-0203' },
    { email: 'driver4@fleetflow.io', password: 'Driver@12345', firstName: 'Priya', lastName: 'Patel', phone: '+1-555-0204' },
    { email: 'driver5@fleetflow.io', password: 'Driver@12345', firstName: 'James', lastName: 'Wilson', phone: '+1-555-0205' },
  ];
  const driverUsers = await Promise.all(
    driverData.map((u) => User.create({ ...u, role: UserRole.DRIVER, isVerified: true }))
  );

  logger.info('Creating vehicles...');
  const vehicles = await Vehicle.insertMany([
    { plateNumber: 'FF-1001', make: 'Ford', model: 'Transit', year: 2023, type: 'van', capacity: 500, status: VehicleStatus.IN_USE, color: 'White', fuelType: 'diesel' },
    { plateNumber: 'FF-1002', make: 'Mercedes', model: 'Sprinter', year: 2024, type: 'van', capacity: 600, status: VehicleStatus.IN_USE, color: 'Silver', fuelType: 'diesel' },
    { plateNumber: 'FF-1003', make: 'Tesla', model: 'Model 3', year: 2024, type: 'car', capacity: 50, status: VehicleStatus.IN_USE, color: 'Blue', fuelType: 'electric' },
    { plateNumber: 'FF-1004', make: 'Honda', model: 'CB500', year: 2023, type: 'bike', capacity: 20, status: VehicleStatus.AVAILABLE, color: 'Red', fuelType: 'petrol' },
    { plateNumber: 'FF-1005', make: 'RAM', model: 'ProMaster', year: 2023, type: 'truck', capacity: 1200, status: VehicleStatus.IN_USE, color: 'Black', fuelType: 'diesel' },
  ]);

  logger.info('Creating drivers...');
  const drivers = await Driver.insertMany(
    driverUsers.map((user, i) => ({
      user: user._id,
      licenseNumber: `DL-NY-${10000 + i}`,
      vehicle: vehicles[i]._id,
      status: i < 3 ? DriverStatus.ONLINE : DriverStatus.BUSY,
      isAvailable: i >= 3,
      currentLocation: {
        type: 'Point' as const,
        coordinates: NYC_LOCATIONS[i % NYC_LOCATIONS.length].coords,
      },
      rating: 4.5 + Math.random() * 0.5,
      totalDeliveries: Math.floor(Math.random() * 200) + 50,
      totalEarnings: Math.floor(Math.random() * 15000) + 5000,
      heading: Math.floor(Math.random() * 360),
      speed: Math.floor(Math.random() * 60),
      lastLocationUpdate: new Date(),
    }))
  );

  logger.info('Creating deliveries...');
  const statuses = [
    DeliveryStatus.PENDING,
    DeliveryStatus.ASSIGNED,
    DeliveryStatus.PICKED_UP,
    DeliveryStatus.IN_TRANSIT,
    DeliveryStatus.DELIVERED,
    DeliveryStatus.DELIVERED,
    DeliveryStatus.IN_TRANSIT,
    DeliveryStatus.ASSIGNED,
  ];

  const deliveries = [];
  for (let i = 0; i < 20; i++) {
    const pickup = NYC_LOCATIONS[i % NYC_LOCATIONS.length];
    const delivery = NYC_LOCATIONS[(i + 2) % NYC_LOCATIONS.length];
    const status = statuses[i % statuses.length];
    const driver = status !== DeliveryStatus.PENDING ? drivers[i % drivers.length] : undefined;

    deliveries.push({
      trackingNumber: `FF${Date.now().toString(36).toUpperCase()}${i.toString().padStart(3, '0')}`,
      customer: customers[i % customers.length]._id,
      driver: driver?._id,
      vehicle: driver ? vehicles[i % vehicles.length]._id : undefined,
      status,
      pickupAddress: {
        street: `${100 + i} Main St`,
        city: pickup.name,
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
        coordinates: pickup.coords,
      },
      deliveryAddress: {
        street: `${200 + i} Broadway`,
        city: delivery.name,
        state: 'NY',
        zipCode: '10002',
        country: 'USA',
        coordinates: delivery.coords,
      },
      packageDescription: ['Electronics', 'Documents', 'Food Package', 'Furniture', 'Medical Supplies'][i % 5],
      packageWeight: Math.floor(Math.random() * 50) + 1,
      priority: ['low', 'normal', 'high', 'urgent'][i % 4] as 'low' | 'normal' | 'high' | 'urgent',
      fare: Math.round((5 + Math.random() * 45) * 100) / 100,
      distance: Math.round(Math.random() * 25 * 10) / 10,
      estimatedDeliveryTime: new Date(Date.now() + (30 + i * 15) * 60000),
      statusHistory: [{ status, timestamp: new Date(Date.now() - i * 3600000) }],
      ...(status === DeliveryStatus.DELIVERED && {
        actualDeliveryTime: new Date(Date.now() - i * 1800000),
        rating: Math.floor(Math.random() * 2) + 4,
      }),
    });
  }

  await Delivery.insertMany(deliveries);

  logger.info('Creating notifications...');
  await Notification.insertMany([
    { user: admin._id, type: NotificationType.SYSTEM, title: 'Welcome to FleetFlow', message: 'Your admin dashboard is ready.', isRead: false },
    { user: customers[0]._id, type: NotificationType.DELIVERY, title: 'Delivery Assigned', message: 'A driver has been assigned to your delivery.', isRead: false },
    { user: driverUsers[0]._id, type: NotificationType.DELIVERY, title: 'New Assignment', message: 'You have a new delivery assignment.', isRead: true },
  ]);

  logger.info('Seed completed successfully!');
  logger.info('--- Demo Accounts ---');
  logger.info('Admin:    admin@fleetflow.io / Admin@12345');
  logger.info('Customer: john@example.com / Customer@123');
  logger.info('Driver:   driver1@fleetflow.io / Driver@12345');

  await disconnectDatabase();
  process.exit(0);
};

seed().catch((err) => {
  logger.error('Seed failed:', err);
  process.exit(1);
});
