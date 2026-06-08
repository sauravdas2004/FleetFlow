export enum UserRole {
  ADMIN = 'admin',
  DRIVER = 'driver',
  CUSTOMER = 'customer',
}

export enum DeliveryStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum VehicleStatus {
  AVAILABLE = 'available',
  IN_USE = 'in_use',
  MAINTENANCE = 'maintenance',
  OFFLINE = 'offline',
}

export enum DriverStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  BUSY = 'busy',
}

export enum NotificationType {
  DELIVERY = 'delivery',
  SYSTEM = 'system',
  ALERT = 'alert',
}
