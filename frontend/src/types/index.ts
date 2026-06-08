export type UserRole = 'admin' | 'driver' | 'customer';

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  isVerified: boolean;
  fullName?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Delivery {
  _id: string;
  trackingNumber: string;
  customer: User | string;
  driver?: Driver | string;
  vehicle?: Vehicle | string;
  status: string;
  pickupAddress: Address;
  deliveryAddress: Address;
  packageDescription: string;
  packageWeight?: number;
  priority: string;
  fare: number;
  distance?: number;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  rating?: number;
  notes?: string;
  createdAt: string;
  statusHistory?: Array<{ status: string; timestamp: string; note?: string }>;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates: [number, number];
}

export interface Driver {
  _id: string;
  user: User;
  licenseNumber: string;
  vehicle?: Vehicle;
  status: string;
  currentLocation?: { type: string; coordinates: [number, number] };
  heading?: number;
  speed?: number;
  rating: number;
  totalDeliveries: number;
  totalEarnings: number;
  isAvailable: boolean;
}

export interface Vehicle {
  _id: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  type: string;
  status: string;
  capacity: number;
  color?: string;
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface Analytics {
  overview: {
    totalDeliveries: number;
    completedDeliveries: number;
    cancelledDeliveries: number;
    totalRevenue: number;
    activeDrivers: number;
    newCustomers: number;
    completionRate: string | number;
  };
  statusBreakdown: Record<string, number>;
  dailyRevenue: Array<{ _id: string; revenue: number; count: number }>;
  recentDeliveries: Delivery[];
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: Pagination;
}
