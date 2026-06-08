import mongoose, { Document, Schema, Types } from 'mongoose';
import { DriverStatus } from '../types/enums';

export interface IGeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

export interface IDriver extends Document {
  user: Types.ObjectId;
  licenseNumber: string;
  vehicle?: Types.ObjectId;
  status: DriverStatus;
  currentLocation?: IGeoPoint;
  heading?: number;
  speed?: number;
  rating: number;
  totalDeliveries: number;
  totalEarnings: number;
  isAvailable: boolean;
  lastLocationUpdate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const driverSchema = new Schema<IDriver>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    licenseNumber: { type: String, required: true, unique: true },
    vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle' },
    status: {
      type: String,
      enum: Object.values(DriverStatus),
      default: DriverStatus.OFFLINE,
      index: true,
    },
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: undefined,
      },
    },
    heading: { type: Number, min: 0, max: 360 },
    speed: { type: Number, min: 0 },
    rating: { type: Number, default: 5, min: 0, max: 5 },
    totalDeliveries: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: false, index: true },
    lastLocationUpdate: Date,
  },
  { timestamps: true }
);

driverSchema.index({ currentLocation: '2dsphere' });
driverSchema.index({ status: 1, isAvailable: 1 });

export const Driver = mongoose.model<IDriver>('Driver', driverSchema);
