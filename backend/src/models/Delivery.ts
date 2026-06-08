import mongoose, { Document, Schema, Types } from 'mongoose';
import { DeliveryStatus } from '../types/enums';

export interface IAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates: [number, number]; // [lng, lat]
}

export interface IDelivery extends Document {
  trackingNumber: string;
  customer: Types.ObjectId;
  driver?: Types.ObjectId;
  vehicle?: Types.ObjectId;
  status: DeliveryStatus;
  pickupAddress: IAddress;
  deliveryAddress: IAddress;
  packageDescription: string;
  packageWeight?: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  estimatedPickupTime?: Date;
  estimatedDeliveryTime?: Date;
  actualPickupTime?: Date;
  actualDeliveryTime?: Date;
  distance?: number;
  fare: number;
  notes?: string;
  route?: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  statusHistory: Array<{
    status: DeliveryStatus;
    timestamp: Date;
    note?: string;
  }>;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true, default: 'USA' },
    coordinates: { type: [Number], required: true },
  },
  { _id: false }
);

const deliverySchema = new Schema<IDelivery>(
  {
    trackingNumber: { type: String, required: true, unique: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    driver: { type: Schema.Types.ObjectId, ref: 'Driver', index: true },
    vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle' },
    status: {
      type: String,
      enum: Object.values(DeliveryStatus),
      default: DeliveryStatus.PENDING,
      index: true,
    },
    pickupAddress: { type: addressSchema, required: true },
    deliveryAddress: { type: addressSchema, required: true },
    packageDescription: { type: String, required: true },
    packageWeight: Number,
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    estimatedPickupTime: Date,
    estimatedDeliveryTime: Date,
    actualPickupTime: Date,
    actualDeliveryTime: Date,
    distance: Number,
    fare: { type: Number, required: true, min: 0 },
    notes: String,
    route: {
      type: { type: String, enum: ['LineString'] },
      coordinates: [[Number]],
    },
    statusHistory: [
      {
        status: { type: String, enum: Object.values(DeliveryStatus) },
        timestamp: { type: Date, default: Date.now },
        note: String,
      },
    ],
    rating: { type: Number, min: 1, max: 5 },
  },
  { timestamps: true }
);

deliverySchema.index({ 'pickupAddress.coordinates': '2dsphere' });
deliverySchema.index({ 'deliveryAddress.coordinates': '2dsphere' });
deliverySchema.index({ status: 1, createdAt: -1 });
deliverySchema.index({ customer: 1, status: 1 });

export const Delivery = mongoose.model<IDelivery>('Delivery', deliverySchema);
